/**
 * 阶段 3.5 测试：名字解析及评分引擎 + 页面
 * 1. analyze：拆解姓氏与名、逐字信息
 * 2. rate：评分区间、维度完整
 * 3. 页面：输入解析、逐字表、收藏历史
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

test('S3.5-1 analyze：解析姓与名', () => {
  const a = App.Engine.score.analyze('李承宇');
  assert.ok(a, '应解析成功');
  assert.strictEqual(a.surname, '李', '姓氏应为李');
  assert.strictEqual(a.given, '承宇', '名应为承宇');
  assert.strictEqual(a.chars.length, 3, '应有 3 个字');
  assert.ok(a.chars.every(c => typeof c.strokes === 'number'), '每字应有笔画');
});

test('S3.5-2 analyze：复姓与无效输入', () => {
  const a = App.Engine.score.analyze('欧阳修远');
  assert.strictEqual(a.surname, '欧阳', '应识别复姓欧阳');
  assert.strictEqual(a.given, '修远', '名应为修远');
  assert.strictEqual(App.Engine.score.analyze(''), null, '空输入返回 null');
  assert.strictEqual(App.Engine.score.analyze('李'), null, '单字名返回 null');
});

test('S3.5-3 rate：评分在合理区间且维度完整', () => {
  const r = App.Engine.score.rate('李承宇');
  assert.ok(r, '应评分成功');
  assert.ok(r.total >= 40 && r.total <= 100, '总分应在 40-100，实际 ' + r.total);
  for (const k of ['shape', 'tone', 'meaning', 'harmony', 'wuxing', 'gender']) {
    assert.ok(typeof r.scores[k] === 'number' && r.scores[k] >= 0 && r.scores[k] <= 100, `维度 ${k} 应在 0-100`);
  }
  assert.ok(r.notes.length > 0, '应有点评');
});

test('S3.5-4 rate：输入名字字符串可直接评分', () => {
  const r = App.Engine.score.rate('王安然');
  assert.ok(r && r.detail.full === '王安然', '应能直接对字符串评分');
});

test('S3.5-4b 谐音提示：含不吉字的名字应降低谐音分并提示', () => {
  const r = App.Engine.score.rate('王殡');
  assert.ok(r, '应评分成功');
  assert.ok(r.scores.harmony < 80, '谐音分应低于基线 80，实际 ' + r.scores.harmony);
  assert.ok(r.notes.some(n => n.includes('谐音')), '点评应包含谐音提示');
  assert.ok(App.checkHomophone('王殡').length > 0, '谐音检查应命中');
});

// ============ 页面测试 ============

test('S3.5-5 评分页面：输入解析展示逐字表', async () => {
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
  await AppW.Pages.score.render(main, {});
  assert.ok(main.innerHTML.includes('名字解析及评分'), '应有标题');

  // 输入并解析
  w.document.getElementById('scName').value = '李承宇';
  w.document.getElementById('scRate').click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.querySelector('.detail-table'), '应显示逐字解析表');
  assert.ok(main.innerHTML.includes('综合评分'), '应显示综合评分');
  assert.ok(main.querySelectorAll('.wuxing-bar').length >= 6, '应显示 6 个维度评分');

  // 历史保存
  const recs = await AppW.DB.getAll('records');
  assert.ok(recs.some(r => r.module === 'score'), '应保存评分历史');
  await AppW.DB.clear('records');
});
