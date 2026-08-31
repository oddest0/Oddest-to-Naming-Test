/**
 * 阶段 3.2 测试：生辰八字引擎 + 页面
 * 1. bazi.compute：四柱、五行、缺失、喜用、时辰可选
 * 2. bazi.recommend：补益五行、字段完整
 * 3. 页面：三步向导、排盘展示、推荐、历史保存
 */
'use strict';

const { test, before } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
const { loadApp, readProject, SCRIPTS, ROOT } = require('./helpers');

let App;

function buildDom() {
  const html = readProject('index.html');
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  const body = bodyMatch ? bodyMatch[1] : '<div id="app"></div>';
  return new JSDOM('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>' + body + '</body></html>', {
    url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only',
  });
}

before(async () => {
  const env = await loadApp();
  App = env.window.App;
});

test('S3.2-1 排盘：四柱完整且时柱按小时', () => {
  const r = App.Engine.bazi.compute({ solarYear: 2024, solarMonth: 3, solarDay: 15, hour: 10, gender: '男' });
  assert.ok(r.pillars.year.length === 2, '年柱应为2字');
  assert.strictEqual(r.pillars.year[0], '甲', '2024 年柱天干应为甲');
  assert.ok(r.pillars.month.length === 2, '月柱应为2字');
  assert.ok(r.pillars.day.length === 2, '日柱应为2字');
  assert.ok(r.pillars.hour && r.pillars.hour.length === 2, '有时柱');
  assert.strictEqual(r.hourKnown, true);
  assert.strictEqual(App.ZHI.indexOf(r.pillars.hour[1]), App.hourZhiIndex(10), '10点应属巳时');
});

test('S3.2-2 排盘：五行统计合法且缺失识别', () => {
  const r = App.Engine.bazi.compute({ solarYear: 2024, solarMonth: 3, solarDay: 15, hour: 10, gender: '女' });
  const sum = Object.values(r.wuxingCount).reduce(function (a, b) { return a + b; }, 0);
  assert.strictEqual(sum, 8, '四柱 4 组干支 × 各 2 个 = 8 个五行计数');
  assert.ok(Array.isArray(r.missing), '缺失应为数组');
  assert.ok(r.favor.length >= 1, '喜用应非空');
  // favor 应为缺失优先
  if (r.missing.length > 0) {
    assert.deepStrictEqual(r.favor.slice().sort(), r.missing.slice().sort(), '缺失存在时 favor 应为缺失五行');
  }
});

test('S3.2-3 排盘：不填时辰可出结果且提示粗略', () => {
  const r = App.Engine.bazi.compute({ solarYear: 2024, solarMonth: 3, solarDay: 15, gender: '男' });
  assert.strictEqual(r.hourKnown, false, '未填时辰 hourKnown 应为 false');
  assert.strictEqual(r.pillars.hour, null, '时柱应为空');
  // 无时辰时五行计数为 6（三柱）
  const sum = Object.values(r.wuxingCount).reduce(function (a, b) { return a + b; }, 0);
  assert.strictEqual(sum, 6, '无时柱应为 6 个计数');
});

test('S3.2-4 排盘：非法日期抛错', () => {
  assert.throws(function () {
    App.Engine.bazi.compute({ solarYear: 2024, solarMonth: 13, solarDay: 40, hour: 0, gender: '男' });
  }, '非法日期应抛错');
});

test('S3.2-5 推荐：补益五行匹配且字段完整', () => {
  const bazi = App.Engine.bazi.compute({ solarYear: 2024, solarMonth: 1, solarDay: 1, hour: 0, gender: '男' });
  const list = App.Engine.bazi.recommend({ surname: '李', baziResult: bazi, gender: '男', count: 10 });
  assert.ok(list.length > 0, '应有推荐');
  for (const n of list) {
    assert.ok(n.fullName.startsWith('李'), '应以姓开头');
    assert.ok(n.py && n.wuxing && n.matchNote, '字段应完整');
    // 至少一个字命中补益五行
    const favorSet = new Set(bazi.favor);
    const hit = n.chars.some(function (c) { return favorSet.has(App.Data.hanziMap[c].wuxing); });
    assert.ok(hit, `名字 ${n.fullName} 应至少有一个字命中补益五行`);
  }
});

test('S3.2-6 推荐：无排盘结果返回空', () => {
  const list = App.Engine.bazi.recommend({ surname: '李', baziResult: null, count: 5 });
  assert.strictEqual(list.length, 0, '无排盘结果应返回空');
});

// ============ 页面测试 ============

test('S3.2-7 八字页面：三步向导完整流程', async () => {
  const dom = buildDom();
  const w = dom.window;
  w.indexedDB = indexedDB;
  w.IDBKeyRange = IDBKeyRange;
  w.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  w.__NAMEAPP_NO_AUTO_INIT__ = true;
  await new Promise((resolve) => {
    const del = indexedDB.deleteDatabase('nameApp');
    del.onsuccess = () => resolve(); del.onerror = () => resolve(); del.onblocked = () => resolve();
  });
  for (const rel of SCRIPTS) { w.eval(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
  const AppW = w.App;
  await AppW.DB.getAll('records');

  const main = w.document.getElementById('main');
  await AppW.Pages.bazi.render(main, {});
  assert.ok(main.innerHTML.includes('生辰八字取名'), '应有标题');
  assert.ok(main.querySelector('.steps'), '应有步骤条');

  // 填姓氏，点排盘
  w.document.getElementById('bzSurname').value = '李';
  w.document.getElementById('bzDate').value = '2024-03-15';
  w.document.getElementById('bzHour').value = '10:30';
  w.document.getElementById('bzCalc').click();
  await new Promise((r) => setTimeout(r, 40));

  // Step2 显示排盘
  assert.ok(main.querySelector('#bzStep2').style.display !== 'none', '排盘步骤应显示');
  assert.ok(main.innerHTML.includes('年柱'), '应显示年柱');
  assert.ok(main.innerHTML.includes('五行分布'), '应显示五行分布');
  // 点击进入 Step3
  const nextBtn = main.querySelector('#bzNext3');
  assert.ok(nextBtn, '应有下一步按钮');
  nextBtn.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(main.querySelector('#bzStep3').style.display !== 'none', '推荐步骤应显示');
  assert.ok(main.innerHTML.includes('五行补益推荐'), '应有推荐标题');

  // 历史保存
  const recs = await AppW.DB.getAll('records');
  assert.ok(recs.some(r => r.module === 'bazi'), '应保存八字历史');
  await AppW.DB.clear('records');
});

test('S3.2-8 八字页面：未填时辰可排盘', async () => {
  const dom = buildDom();
  const w = dom.window;
  w.indexedDB = indexedDB;
  w.IDBKeyRange = IDBKeyRange;
  w.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  w.__NAMEAPP_NO_AUTO_INIT__ = true;
  await new Promise((resolve) => {
    const del = indexedDB.deleteDatabase('nameApp');
    del.onsuccess = () => resolve(); del.onerror = () => resolve(); del.onblocked = () => resolve();
  });
  for (const rel of SCRIPTS) { w.eval(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
  const AppW = w.App;
  await AppW.DB.getAll('records');

  const main = w.document.getElementById('main');
  await AppW.Pages.bazi.render(main, {});
  w.document.getElementById('bzSurname').value = '王';
  w.document.getElementById('bzDate').value = '2024-03-15';
  // 不填时辰
  w.document.getElementById('bzCalc').click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.innerHTML.includes('未填时辰'), '应提示未填时辰');
  assert.ok(main.innerHTML.includes('时柱'), '应显示时柱（空）');
  await AppW.DB.clear('records');
});
