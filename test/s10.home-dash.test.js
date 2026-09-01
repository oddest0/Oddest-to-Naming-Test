/**
 * 阶段 10 测试：首页 Dashboard 两栏布局（视觉重排，功能不变量）
 * 1. home.js 渲染出 home-dash 两栏结构，且保留全部功能元素
 * 2. CSS 含桌面两栏 grid 规则
 * 3. CSS 含 900px 以下单列媒体查询
 * 4. 快速AI主卡带 quick-card 渐变样式，模块摘要仍为 5 个
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
  return { dom, w, AppW };
}

test('S10-1 home 渲染出 home-dash 两栏结构并保留全部功能元素', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});
  assert.ok(main.querySelector('.home-dash'), '应有两栏容器 .home-dash');
  const cols = main.querySelectorAll('.home-col');
  assert.ok(cols.length === 2, '应有左右两栏 .home-col（实际 ' + cols.length + '）');
  assert.ok(main.querySelector('.home-col-main'), '应有左栏 .home-col-main');
  assert.ok(main.querySelector('.home-col-side'), '应有右栏 .home-col-side');
  // 功能元素全部保留
  for (const id of ['hmGo', 'hmSurname', 'hmType', 'hmSurname2', 'hmFile', 'hmGenMaterial', 'hmResult', 'hmMaterialResult', 'hmMaterials', 'hmRecent']) {
    assert.ok(main.querySelector('#' + id), '应保留 #' + id);
  }
});

test('S10-2 快速AI主卡带 quick-card 渐变类，模块摘要仍为 5 个', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});
  assert.ok(main.querySelector('.quick-card'), '快速AI卡应有 .quick-card 类（渐变主卡）');
  assert.ok(main.querySelectorAll('.module-card').length === 5, '模块摘要应仍为 5 个');
  assert.ok(main.querySelector('.module-card[data-page="newborn"]'), '模块卡应保留 data-page 跳转');
});

test('S10-3 CSS 含桌面两栏 grid 规则与 900px 以下单列规则', () => {
  const css = readProject('css/style.css');
  assert.ok(css.includes('.home-dash {'), 'CSS 应有 .home-dash 规则');
  assert.ok(css.includes('grid-template-columns: minmax(0, 1.62fr) minmax(0, 1fr)'), '桌面应为两栏 grid（1.62fr / 1fr）');
  assert.ok(css.includes('@media (max-width: 900px)'), '应存在 900px 媒体查询');
  assert.ok(css.includes('.home-dash { grid-template-columns: 1fr; }'), '900px 以下 .home-dash 应单列');
  assert.ok(css.includes('.quick-card'), 'CSS 应有 .quick-card 渐变主卡样式');
  assert.ok(css.includes('.module-icon'), 'CSS 应有 .module-icon 图标样式');
});
