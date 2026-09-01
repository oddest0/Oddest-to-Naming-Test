/**
 * 阶段 7 测试：诗词取名 —— 全篇提取 + 确保每首都能提炼取名
 * 1. 数据完整性：每首都有 full 且 full 包含 line
 * 2. 引擎级：遍历全部诗词 generate 均能出结果（消除"该句没有可提炼的字"）
 * 3. 全篇检索：命中只在 full 中出现的词
 * 4. 页面级：选字少/虚词多的句子也能出名字，结果区无空态提示
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

test('S7-1 数据完整性：每首诗词都有 full 全篇且包含名句 line', async () => {
  const env = await loadApp();
  const A = env.window.App;
  assert.ok(A.Data.poetry.length >= 50, '诗词库应 50+ 首');
  for (const p of A.Data.poetry) {
    assert.ok(p.full && p.full.length > 0, `《${p.title}》应有全篇正文`);
    // 全篇应包含该名句（标点可能被规范化，去掉标点后比对）
    const strip = (s) => String(s).replace(/[，。；：！？、\s]/g, '');
    assert.ok(strip(p.full).includes(strip(p.line.slice(0, 6))), `《${p.title}》全篇应包含名句`);
  }
});

test('S7-2 引擎级：遍历全部诗词 generate 均能提炼出名字', async () => {
  const env = await loadApp();
  const A = env.window.App;
  for (const p of A.Data.poetry) {
    const names = A.Engine.poetry.generate({ line: p.line, full: p.full, poem: p, surname: '李', count: 4 });
    assert.ok(names.length > 0, `《${p.title}》【${p.line}】应能提炼出名字，实际 0 个`);
    for (const n of names) {
      assert.ok(n.fullName.startsWith('李'), '应以姓开头');
      assert.ok(n.py && n.meaning, '字段应完整');
    }
  }
});

test('S7-3 全篇检索：命中只在 full 中出现的关键词', async () => {
  const env = await loadApp();
  const A = env.window.App;
  // "淑女" 只出现在《关雎》全篇中（名句"关关雎鸠，在河之洲"不含）
  const res = A.Engine.poetry.search('淑女');
  assert.ok(res.length > 0, '检索"淑女"应命中全篇内容');
  assert.ok(res.some(p => p.title.indexOf('关雎') >= 0), '应命中《关雎》');
  assert.ok(res.every(p => p.line.indexOf('淑女') < 0), '命中的名句本身不含该词，说明确实匹配到全篇');
  // "金樽" 只在《将进酒》全篇出现（名句"天生我材必有用"不含）
  const res2 = A.Engine.poetry.search('金樽');
  assert.ok(res2.some(p => p.title.indexOf('将进酒') >= 0), '检索"金樽"应命中《将进酒》全篇');
});

test('S7-4 页面级：虚词多的句子也能出名字且无空态提示', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.poetry.render(main, {});

  // 直接检索"岳阳楼记"（其名句"先天下之忧而忧"虚词多，容易提炼不足）
  const searchInput = w.document.getElementById('poSearch');
  searchInput.value = '岳阳楼记';
  searchInput.dispatchEvent(new w.Event('input'));
  await new Promise((r) => setTimeout(r, 20));
  const item = main.querySelector('.poem-item');
  assert.ok(item, '应检索到岳阳楼记');
  item.click();
  await new Promise((r) => setTimeout(r, 60));
  const resultBox = main.querySelector('#poResult');
  assert.ok(resultBox, '应有结果区');
  assert.ok(!resultBox.textContent.includes('没有可提炼的字'), '不应再出现"没有可提炼的字"');
  assert.ok(resultBox.querySelectorAll('.name-card').length > 0, '应能提炼出名字卡片');

  await AppW.DB.clear('records');
});

test('S7-5 引擎级：全部诗词取出的名字都来自诗句相邻位置', async () => {
  const env = await loadApp();
  const A = env.window.App;
  const strip = (s) => String(s).replace(/[，。；：！？、\s\n]/g, '');
  for (const p of A.Data.poetry) {
    const names = A.Engine.poetry.generate({ line: p.line, full: p.full, poem: p, surname: '李', count: 4 });
    assert.strictEqual(names.length, 4, `《${p.title}》应出 4 个名字`);
    const canon = strip(p.line) + '|' + strip(p.full);
    for (const n of names) {
      assert.ok(canon.includes(n.name), `《${p.title}》名字"${n.name}"应来自诗句相邻位置`);
    }
  }
});
