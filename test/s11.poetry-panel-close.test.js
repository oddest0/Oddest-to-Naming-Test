/**
 * S11 诗词取名页：结果面板可关闭（默认常驻，关闭后可恢复）
 * 用户需求：手机 PWA 诗词页，提炼的名字面板在不使用时可以关闭显示；不关闭则保持常驻。
 * 验收：
 * 1. 默认渲染出常驻面板 + 关闭按钮；恢复按钮默认隐藏
 * 2. 点击关闭 → 面板隐藏（.poetry-side/.poetry-main 加 panel-hidden），恢复按钮出现
 * 3. 点击恢复 → 面板恢复常驻，恢复按钮隐藏
 * 4. CSS 含面板隐藏与恢复按钮规则
 */
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
const { readProject, SCRIPTS, ROOT } = require('./helpers');

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
  const main = w.document.getElementById('main');
  await AppW.Pages.poetry.render(main, {});
  return { dom, w, AppW, main };
}

test('S11-1 默认常驻：面板存在、有关闭按钮、恢复按钮默认隐藏', async () => {
  const { main } = await setup();
  assert.ok(main.querySelector('.poetry-side'), '应有结果面板 .poetry-side');
  assert.ok(main.querySelector('#poPanelClose'), '应有关闭按钮 #poPanelClose');
  const restore = main.querySelector('#poRestore');
  assert.ok(restore, '应有恢复按钮 #poRestore');
  assert.strictEqual(restore.style.display, 'none', '恢复按钮默认隐藏');
  assert.ok(!main.querySelector('.poetry-side').classList.contains('panel-hidden'), '默认不隐藏（保持常驻）');
});

test('S11-2 点击关闭：面板隐藏并释放列表空间，恢复按钮出现', async () => {
  const { main, w } = await setup();
  w.document.getElementById('poPanelClose').click();
  assert.ok(main.querySelector('.poetry-side').classList.contains('panel-hidden'), '面板应加 panel-hidden');
  assert.ok(main.querySelector('.poetry-main').classList.contains('panel-hidden'), '列表应加 panel-hidden 释放底部空间');
  assert.notStrictEqual(main.querySelector('#poRestore').style.display, 'none', '恢复按钮应显示');
});

test('S11-3 点击恢复：面板恢复常驻，恢复按钮隐藏', async () => {
  const { main, w } = await setup();
  w.document.getElementById('poPanelClose').click();
  w.document.getElementById('poRestore').click();
  assert.ok(!main.querySelector('.poetry-side').classList.contains('panel-hidden'), '面板应移除 panel-hidden');
  assert.ok(!main.querySelector('.poetry-main').classList.contains('panel-hidden'), '列表应移除 panel-hidden');
  assert.strictEqual(main.querySelector('#poRestore').style.display, 'none', '恢复按钮应重新隐藏');
});

test('S11-4 CSS 含面板隐藏/恢复按钮/头部布局规则', () => {
  const css = readProject('css/style.css');
  assert.ok(/\.poetry-side\.panel-hidden\s*\{\s*display\s*:\s*none\s*;?\s*\}/.test(css), '应有 .poetry-side.panel-hidden{display:none}');
  assert.ok(/\.poetry-main\.panel-hidden\s*\{\s*padding-bottom\s*:\s*0\s*;?\s*\}/.test(css), '应有 .poetry-main.panel-hidden{padding-bottom:0}');
  assert.ok(css.includes('.poetry-restore'), '应有 .poetry-restore 恢复按钮样式');
  assert.ok(css.includes('.poetry-side-head'), '应有 .poetry-side-head 头部布局');
  assert.ok(css.includes('.poetry-panel-close'), '应有 .poetry-panel-close 关闭按钮样式');
});

test('S11-5 关闭后面板选句时自动恢复弹出结果', async () => {
  const { main, w } = await setup();
  // 关闭面板
  w.document.getElementById('poPanelClose').click();
  assert.ok(main.querySelector('.poetry-side').classList.contains('panel-hidden'), '前置：面板应已隐藏');
  // 选择任意一句诗
  const items = main.querySelectorAll('.poem-item');
  assert.ok(items.length > 0, '应有名句列表');
  items[0].click();
  assert.ok(!main.querySelector('.poetry-side').classList.contains('panel-hidden'), '选句后面板应自动恢复显示');
  assert.ok(!main.querySelector('.poetry-main').classList.contains('panel-hidden'), '列表应释放空间恢复');
  assert.strictEqual(main.querySelector('#poRestore').style.display, 'none', '恢复按钮应隐藏');
  const pr = main.querySelector('#poResult');
  assert.ok(pr && pr.textContent.length > 5, '应展示提炼结果');
});
