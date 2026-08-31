/**
 * 阶段 3.4 测试：宠物取名页面
 * 1. 页面渲染表单与风格选择
 * 2. 生成宠物名、换一批
 * 3. 中英文切换
 * 4. 收藏、历史存档
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

test('S3.4-1 宠物页面：渲染表单与风格按钮', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.pet.render(main, {});
  assert.ok(main.innerHTML.includes('宠物取名'), '应有标题');
  assert.ok(main.querySelector('#petType'), '应有类型选择');
  const styleBtns = main.querySelectorAll('.style-btn');
  assert.ok(styleBtns.length >= 4, '应有至少 4 种风格按钮，实际 ' + styleBtns.length);
  assert.ok(main.querySelector('#petGenerate'), '应有生成按钮');
});

test('S3.4-2 宠物页面：生成名字、换一批、中英文切换', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.pet.render(main, {});

  // 生成
  w.document.getElementById('petGenerate').click();
  await new Promise((r) => setTimeout(r, 40));
  const cards = main.querySelectorAll('#petResult .name-card');
  assert.ok(cards.length > 0, '生成后应有名字卡片');
  assert.ok(main.querySelector('#petResult .nm'), '应显示宠物名');

  // 换一批
  const beforeFirst = main.querySelector('#petResult .nm').textContent;
  w.document.getElementById('petReshuffle').click();
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(main.querySelectorAll('#petResult .name-card').length > 0, '换一批后仍有结果');

  // 中英文切换
  const langBtn = w.document.getElementById('petToggleLang');
  langBtn.click();
  await new Promise((r) => setTimeout(r, 20));
  // 英文名切换后按钮文案变化
  assert.ok(langBtn.textContent.includes('中文名') || langBtn.textContent.includes('英文名'), '切换按钮应更新文案');

  // 历史保存
  const recs = await AppW.DB.getAll('records');
  assert.ok(recs.some(r => r.module === 'pet'), '应保存宠物历史');
  await AppW.DB.clear('records');
});

test('S3.4-3 宠物页面：收藏', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.pet.render(main, {});
  w.document.getElementById('petGenerate').click();
  await new Promise((r) => setTimeout(r, 40));
  const favBtn = main.querySelector('#petResult .fav-btn');
  assert.ok(favBtn, '应有收藏按钮');
  favBtn.click();
  await new Promise((r) => setTimeout(r, 40));
  const favs = await AppW.DB.getAll('favorites');
  assert.ok(favs.some(f => f.module === 'pet'), '应收藏宠物名');
  await AppW.DB.clear('favorites');
  await AppW.DB.clear('records');
});
