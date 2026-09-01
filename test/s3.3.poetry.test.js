/**
 * 阶段 3.3 测试：诗词取名引擎 + 页面
 * 1. poetry.extract：提炼关键字、去虚词
 * 2. poetry.search：关键词检索、出处过滤
 * 3. poetry.generate：组合候选名、带出处
 * 4. 页面：浏览、检索、选句提炼、收藏
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

test('S3.3-1 extract：提炼诗句关键字并去虚词', () => {
  const out = App.Engine.poetry.extract('关关雎鸠，在河之洲');
  assert.ok(out.length > 0, '应提炼出关键字');
  // 虚词"之""在""河"等不应出现（"之"是停止词）
  assert.ok(!out.some(x => x.char === '之'), '不应含虚词"之"');
  for (const e of out) {
    assert.ok(e.char && typeof e.meaning === 'string', '每条应有字与寓意');
  }
});

test('S3.3-2 extract：只取内置库中可查询的字', () => {
  const out = App.Engine.poetry.extract('望舒使先驱');
  for (const e of out) {
    assert.ok(App.Data.hanziMap[e.char], `字 ${e.char} 应在内置库`);
  }
});

test('S3.3-3 search：按关键词检索', () => {
  const res = App.Engine.poetry.search('云帆');
  assert.ok(res.length > 0, '搜索"云帆"应有结果');
  assert.ok(res.some(p => p.line.includes('云帆')), '结果应包含该诗句');
  // 空关键词返回全部
  const all = App.Engine.poetry.search('');
  assert.strictEqual(all.length, App.Data.poetry.length, '空关键词应返回全部');
});

test('S3.3-4 search：按出处过滤', () => {
  const res = App.Engine.poetry.search('', '诗经');
  assert.ok(res.length > 0, '诗经应有结果');
  assert.ok(res.every(p => p.book === '诗经'), '结果都应来自诗经');
  const none = App.Engine.poetry.search('', '不存在的出处');
  assert.strictEqual(none.length, 0, '不存在出处应返回空');
});

test('S3.3-5 generate：组合候选名并带出处', () => {
  const poem = App.Data.poetry[0];
  const list = App.Engine.poetry.generate({ line: poem.line, poem: poem, surname: '李', count: 6 });
  assert.ok(list.length > 0, '应有结果');
  for (const n of list) {
    assert.ok(n.fullName.startsWith('李'), '应以姓开头');
    assert.ok(n.poem && n.poem.line === poem.line, '应带原句出处');
    assert.ok(n.py && n.meaning, '字段应完整');
  }
});

// ============ 页面测试 ============

test('S3.3-6 诗词页面：浏览、检索、选句取名', async () => {
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
  await AppW.Pages.poetry.render(main, {});
  assert.ok(main.innerHTML.includes('诗词取名'), '应有标题');
  assert.ok(main.querySelectorAll('.poem-item').length > 0, '应列出诗句');

  // 检索
  const searchInput = w.document.getElementById('poSearch');
  searchInput.value = '云帆';
  searchInput.dispatchEvent(new w.Event('input'));
  await new Promise((r) => setTimeout(r, 20));
  const poemItems = main.querySelectorAll('.poem-item');
  assert.ok(poemItems.length > 0, '检索"云帆"应有结果');

  // 点选第一句
  poemItems[0].click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.querySelectorAll('#poResult .name-card').length > 0, '选句后应有名字卡片');
  assert.ok(main.innerHTML.includes('提炼的名字'), '应显示提炼结果标题');

  // 历史保存
  const recs = await AppW.DB.getAll('records');
  assert.ok(recs.some(r => r.module === 'poetry'), '应保存诗词历史');
  await AppW.DB.clear('records');
});

test('S3.3-7 extractPairs：提炼相邻二字对（明月/清泉）', () => {
  const pairs = App.Engine.poetry.extractPairs('明月松间照，清泉石上流', { inLine: true });
  const names = pairs.map(p => p.name);
  assert.ok(names.includes('明月'), '应包含"明月"');
  assert.ok(names.includes('清泉'), '应包含"清泉"');
  const qq = pairs.find(p => p.name === '清泉');
  assert.ok(qq.ctx && qq.ctx.includes('清泉'), '应有上下文');
  assert.strictEqual(qq.inLine, true, '应标记来自名句');
  assert.ok(pairs.every(p => p.score > 0), '每条应有评分');
  assert.ok(pairs.every(p => p.name.length === 2 && p.c1 && p.c2), '应为相邻两字');
});

test('S3.3-8 generate：名字来自诗句相邻位置（强关联）', () => {
  const poem = App.Data.poetry.find(x => x.title.indexOf('山居秋暝') >= 0);
  assert.ok(poem, '应找到《山居秋暝》');
  const list = App.Engine.poetry.generate({ line: poem.line, full: poem.full, poem: poem, surname: '李', count: 6 });
  assert.strictEqual(list.length, 6, '应出 6 个名字');
  const strip = (s) => String(s).replace(/[，。；：！？、\s\n]/g, '');
  const canon = strip(poem.line) + '|' + strip(poem.full);
  for (const n of list) {
    assert.ok(canon.includes(n.name), `名字"${n.name}"应是原诗相邻位置的字（强关联）`);
    assert.ok(n.fromLine === true || n.fromLine === false, '应有 fromLine 标记');
    assert.ok(n.ctx && n.ctx.length > 0, '应有上下文');
  }
});
