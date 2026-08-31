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

// ================= Q2：八字换一批（后续阶段补充） =================

test('Q2-placeholder 待八字换一批实现后启用', async () => {
  // 占位，避免空文件报错；Q2 测试在对应问题解决时追加
  assert.ok(true);
});
