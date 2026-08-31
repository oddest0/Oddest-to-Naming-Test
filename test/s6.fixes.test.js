/**
 * 阶段 6 修复测试：三个问题的回归测试
 * Q1: createdAt 类型不一致导致 (x||'').localeCompare 报错
 * Q2: 生辰八字最终结果支持「换一批」
 * Q3: 诗词取名结果改为右侧固定展示
 * 测试均使用真实 index.html DOM + 完整脚本 + fake-indexeddb
 */
'use strict';

const { test } = require('node:test');
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

async function setup() {
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
  return { dom, w, AppW };
}

// ================= Q1：createdAt 类型兼容 =================

test('Q1-1 App.timeOf：兼容数字/ISO字符串/空值', async () => {
  const env = await loadApp();
  const A = env.window.App;
  const t1 = Date.now();
  assert.strictEqual(A.timeOf(t1), t1, '数字应原样返回');
  assert.strictEqual(A.timeOf(new Date(t1).toISOString()), t1, 'ISO 字符串应解析为同一时间戳');
  assert.strictEqual(A.timeOf(null), 0, 'null 应为 0');
  assert.strictEqual(A.timeOf(undefined), 0, 'undefined 应为 0');
  assert.strictEqual(A.timeOf('not-a-date'), 0, '无法解析应为 0');
});

test('Q1-2 App.sortNewestFirst：混合 createdAt 正常排序', async () => {
  const env = await loadApp();
  const A = env.window.App;
  const now = Date.now();
  const arr = [
    { id: 'old', createdAt: now - 5000 },
    { id: 'iso', createdAt: new Date(now - 3000).toISOString() },
    { id: 'none', createdAt: null },
    { id: 'new', createdAt: now }
  ];
  const sorted = A.sortNewestFirst(arr);
  assert.deepStrictEqual(sorted.map(x => x.id), ['new', 'iso', 'old', 'none'], '应按最新在前排序且不报错');
});

test('Q1-3 首页：含数字 createdAt 的多条记录/文献不报错且正常渲染', async () => {
  const { w, AppW } = await setup();
  const now = Date.now();
  // 数字 createdAt 多条记录（此前会触发 localeCompare 报错）
  await AppW.DB.add('records', { id: 'r1', module: 'newborn', title: '旧记录', input: {}, result: { names: ['李甲'] }, createdAt: now - 60000 });
  await AppW.DB.add('records', { id: 'r2', module: 'score', title: '新记录', input: {}, result: { names: ['李乙'] }, createdAt: now });
  // 数字 createdAt 的文献
  await AppW.DB.add('materials', { id: 'm1', name: '材料.txt', words: [{ char: '云' }], createdAt: now - 10000 });
  await AppW.DB.add('materials', { id: 'm2', name: '新材料.txt', words: [{ char: '帆' }], createdAt: now });

  const main = w.document.getElementById('main');
  // 不应抛错
  await AppW.Pages.home.render(main, {});
  assert.ok(main.innerHTML.includes('新记录'), '首页应渲染最近记录');
  assert.ok(main.innerHTML.includes('李乙'), '应展示新记录名字');

  // 收藏夹/历史抽屉也应能渲染（同一排序函数）
  await AppW.App.openHistory();
  const hb = w.document.querySelector('#globalDrawer .drawer-body');
  assert.ok(hb.innerHTML.includes('李乙'), '历史抽屉应正常渲染');
  await AppW.DB.clear('records');
  await AppW.DB.clear('materials');
});

// ================= Q2：八字换一批 =================

test('Q2-1 八字最终结果有换一批按钮且可重新生成、不重复写历史', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.bazi.render(main, {});

  // 走完整流程：排盘 → 下一步 → Step3
  w.document.getElementById('bzSurname').value = '李';
  w.document.getElementById('bzDate').value = '2024-03-15';
  w.document.getElementById('bzHour').value = '10:30';
  w.document.getElementById('bzCalc').click();
  await new Promise((r) => setTimeout(r, 60));
  const nextBtn = main.querySelector('#bzNext3');
  assert.ok(nextBtn, '应有进入推荐的按钮');
  nextBtn.click();
  await new Promise((r) => setTimeout(r, 40));

  // Step3 应有换一批按钮和名字卡片
  const reshuffleBtn = main.querySelector('#bzReshuffle');
  assert.ok(reshuffleBtn, '八字最终结果应有换一批按钮');
  assert.ok(main.querySelectorAll('#bzStep3 .name-card').length > 0, '应有名字卡片');

  // 记录当前历史条数（首次生成已写 1 条）
  const recsBefore = (await AppW.DB.getAll('records')).filter(r => r.module === 'bazi').length;
  assert.ok(recsBefore >= 1, '首次生成应写历史');

  // 点换一批：仍能渲染
  reshuffleBtn.click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.querySelectorAll('#bzStep3 .name-card').length > 0, '换一批后仍应有名字卡片');

  // 换一批不重复写历史
  const recsAfter = (await AppW.DB.getAll('records')).filter(r => r.module === 'bazi').length;
  assert.strictEqual(recsAfter, recsBefore, '换一批不应重复写历史');

  await AppW.DB.clear('records');
});

// ================= Q3：诗词结果右侧常驻栏 =================

test('Q3-1 诗词页面：结果为右侧 sticky 栏，选句后结果出现在右侧', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.poetry.render(main, {});

  // 布局结构：存在两栏容器，且结果面板位于 .poetry-side 内（在左侧列表之后）
  const layout = main.querySelector('.poetry-layout');
  assert.ok(layout, '应有两栏布局容器');
  const side = main.querySelector('.poetry-side');
  assert.ok(side, '应有右侧结果栏');
  const resultBox = side.querySelector('#poResult');
  assert.ok(resultBox, '结果容器应在右侧栏内');
  // 右侧栏在文档顺序上位于左侧列表之后
  const mainCol = main.querySelector('.poetry-main');
  const mainIdx = Array.prototype.indexOf.call(layout.children, mainCol);
  const sideIdx = Array.prototype.indexOf.call(layout.children, side);
  assert.ok(mainIdx >= 0 && sideIdx > mainIdx, '右侧栏应位于左侧列表之后');

  // CSS 文件包含 sticky 常驻规则
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  assert.ok(css.includes('.poetry-side'), 'CSS 应含右侧栏样式');
  assert.ok(css.includes('position: sticky'), 'CSS 应含 sticky 常驻定位');

  // 检索并选句 → 结果应出现在右侧 #poResult 内
  w.document.getElementById('poSurname').value = '李';
  const searchInput = w.document.getElementById('poSearch');
  searchInput.value = '云帆';
  searchInput.dispatchEvent(new w.Event('input'));
  await new Promise((r) => setTimeout(r, 20));
  const item = main.querySelector('.poem-item');
  assert.ok(item, '应有诗句条目');
  item.click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(resultBox.querySelectorAll('.name-card').length > 0, '右侧栏应显示提炼的名字');

  await AppW.DB.clear('records');
});
