/**
 * 阶段 5 测试：内置数据库扩充 + 精选名字接入
 * 1. 汉字库：数量、无重复、五行覆盖、字段完整
 * 2. 诗词库：扩充数量、出处分类
 * 3. 精选名字库：字段完整、性别分布
 * 4. 新生儿页面：精选名字参考联动
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

test('S5-1 汉字库：数量达标且字段完整', () => {
  const hz = App.Data.hanzi;
  assert.ok(hz.length >= 320, '汉字库应扩充到 320+（阶段5前约247），实际 ' + hz.length);
  for (const h of hz) {
    assert.ok(h.c && h.py && typeof h.strokes === 'number' && h.wuxing && h.meaning, `字 ${h.c} 字段应完整`);
  }
});

test('S5-2 汉字库：无重复且五行覆盖均衡', () => {
  const chars = new Set(App.Data.hanzi.map(h => h.c));
  assert.strictEqual(chars.size, App.Data.hanzi.length, '不应有重复字');
  const count = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  App.Data.hanzi.forEach(h => { if (count[h.wuxing] !== undefined) count[h.wuxing]++; });
  for (const k of ['金', '木', '水', '火', '土']) {
    assert.ok(count[k] >= 50, `五行 ${k} 应至少 50 字，实际 ${count[k]}`);
  }
});

test('S5-3 汉字库：hanziMap 覆盖每个字', () => {
  for (const h of App.Data.hanzi) {
    assert.strictEqual(App.Data.hanziMap[h.c], h, `hanziMap 应含 ${h.c}`);
  }
});

test('S5-4 诗词库：扩充且出处完整', () => {
  const p = App.Data.poetry;
  assert.ok(p.length >= 45, '诗词库应扩充到 45+ 句，实际 ' + p.length);
  for (const item of p) {
    assert.ok(item.book && item.title && item.line && item.meaning, '诗句字段应完整');
    assert.ok(Array.isArray(item.keywords) && item.keywords.length > 0, '应有可检索关键字');
  }
  assert.ok(App.Data.poetryBooks.includes('诗经'), '应有诗经分类');
  assert.ok(App.Data.poetryBooks.includes('楚辞'), '应有楚辞分类');
});

test('S5-5 精选名字库：字段完整且性别分布合理', () => {
  const ns = App.Data.names;
  assert.ok(ns.length >= 50, '精选库应 50+，实际 ' + ns.length);
  const genders = { 男: 0, 女: 0, 中性: 0 };
  for (const n of ns) {
    assert.ok(n.name && n.py && n.meaning && Array.isArray(n.tags), `名字 ${n.name} 字段应完整`);
    genders[n.gender] = (genders[n.gender] || 0) + 1;
  }
  assert.ok(genders['男'] >= 15 && genders['女'] >= 15, '男女精选都应充足');
});

// ============ 页面联动 ============

test('S5-6 新生儿页面：精选名字参考随性别/风格联动', async () => {
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
  await AppW.Pages.newborn.render(main, {});
  // 默认有精选参考
  assert.ok(main.innerHTML.includes('精选名字参考'), '应有精选名字参考区');

  // 切换性别为女 → 精选区应更新（至少仍渲染）
  const genderSel = w.document.getElementById('nbGender');
  genderSel.value = '女';
  genderSel.dispatchEvent(new w.Event('change'));
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(main.querySelector('#nbCurated .name-card'), '女宝宝应展示精选参考');

  // 点风格按钮联动
  const styleBtn = main.querySelector('.style-btn[data-style="大气"]');
  if (styleBtn) {
    styleBtn.click();
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(main.querySelector('#nbCurated .name-card'), '点风格后仍应展示精选参考');
  }
});
