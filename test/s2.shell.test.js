/**
 * 阶段 2 测试：应用外壳 + 全局功能
 * 使用 index.html 真实结构，验证：
 * 1. 导航路由切换与高亮
 * 2. Toast
 * 3. 收藏夹（收藏/取消收藏/空状态）
 * 4. 历史记录（记录展示/空状态）
 * 5. 设置偏好保存
 * 6. 导出/导入备份
 */
'use strict';

const { test, before } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
const { loadApp, readProject, SCRIPTS, ROOT } = require('./helpers');

let dom, window, App;

function buildRealDom() {
  // 提取 index.html 中 body 部分，作为 jsdom 初始 HTML
  const html = readProject('index.html');
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  const body = bodyMatch ? bodyMatch[1] : '<div id="app"></div>';
  const head = '<meta charset="UTF-8"><link rel="stylesheet" href="css/style.css">';
  return new JSDOM('<!DOCTYPE html><html><head>' + head + '</head><body>' + body + '</body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
}

before(async () => {
  dom = buildRealDom();
  window = dom.window;
  window.indexedDB = indexedDB;
  window.IDBKeyRange = IDBKeyRange;
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  // 先删除旧库，确保由 db.js 按正确结构建库
  await new Promise((resolve) => {
    const del = indexedDB.deleteDatabase('nameApp');
    del.onsuccess = () => resolve();
    del.onerror = () => resolve();
    del.onblocked = () => resolve();
  });
  for (const rel of SCRIPTS) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    window.eval(code);
  }
  App = window.App;
  // 触发 db.js 建库（settings 等结构由 db.js 定义）
  await App.DB.getAll('records');
  // 等待初始导航完成
  await new Promise((r) => setTimeout(r, 30));
});

test('S2-1 导航：初始为首页，切换页面并高亮', async () => {
  assert.strictEqual(App.App.getCurrent(), 'home', '初始应导航到首页');
  // 切换到侧边栏页面：高亮验证
  await App.App.navigate('newborn');
  assert.strictEqual(App.App.getCurrent(), 'newborn');
  const activeBtn = window.document.querySelector('.nav-item.active');
  assert.ok(activeBtn, '应有高亮导航项');
  assert.strictEqual(activeBtn.getAttribute('data-page'), 'newborn', 'newborn 应高亮');
  // 回到首页
  await App.App.navigate('home');
  assert.strictEqual(App.App.getCurrent(), 'home');
  // 切换到顶栏入口设置页：内容验证（无侧边栏高亮，属于正常设计）
  await App.App.navigate('settings');
  assert.strictEqual(App.App.getCurrent(), 'settings');
  const main = window.document.getElementById('main');
  assert.ok(main.innerHTML.includes('默认偏好'), 'settings 页面应有内容');
});

test('S2-2 导航：不存在的页面应 Toast 报错', () => {
  App.App.navigate('not_exist');
  const toast = window.document.querySelector('.toast');
  assert.ok(toast, '应出现 toast');
  assert.ok(toast.textContent.includes('不存在'), 'toast 内容应提示页面不存在');
});

test('S2-3 收藏夹：空状态', async () => {
  await App.App.openFavorites();
  const body = window.document.querySelector('#globalDrawer .drawer-body');
  assert.ok(body.innerHTML.includes('还没有收藏'), '空收藏应显示空状态');
  assert.ok(window.document.getElementById('globalDrawer').classList.contains('open'), '抽屉应打开');
});

test('S2-4 收藏夹：收藏后展示并可取消', async () => {
  const fav = { id: 'fav_test1', module: 'poetry', name: '云帆', meta: { py: 'yún fān', meaning: '直挂云帆', moduleLabel: '诗词取名' }, createdAt: Date.now() };
  await App.DB.add('favorites', fav);
  await App.App.openFavorites();
  const body = window.document.querySelector('#globalDrawer .drawer-body');
  assert.ok(body.innerHTML.includes('云帆'), '收藏夹应显示收藏的名字');
  // 取消收藏
  const delBtn = body.querySelector('.fav-btn');
  assert.ok(delBtn, '应有取消收藏按钮');
  delBtn.click();
  await new Promise((r) => setTimeout(r, 30));
  const favs = await App.DB.getAll('favorites');
  assert.strictEqual(favs.length, 0, '取消收藏后应删除');
});

test('S2-5 历史记录：添加后展示、空状态', async () => {
  await App.App.openHistory();
  let body = window.document.querySelector('#globalDrawer .drawer-body');
  assert.ok(body.innerHTML.includes('还没有操作记录'), '空历史应显示空状态');
  // 添加一条记录
  await App.DB.add('records', { id: 'rec_t1', module: 'newborn', title: '李·新生儿取名', input: {}, result: { names: [{ fullName: '李宇轩' }] }, createdAt: Date.now() });
  await App.App.openHistory();
  body = window.document.querySelector('#globalDrawer .drawer-body');
  assert.ok(body.innerHTML.includes('李宇轩'), '历史应显示记录名字');
  // 清理
  await App.DB.clear('records');
});

test('S2-6 设置：偏好保存与读取', async () => {
  await App.App.navigate('settings');
  const main = window.document.getElementById('main');
  assert.ok(main.innerHTML.includes('默认偏好'), '设置页应有默认偏好');
  const input = window.document.getElementById('setSurname');
  input.value = '王';
  const saveBtn = window.document.getElementById('btnSavePrefs');
  saveBtn.click();
  await new Promise((r) => setTimeout(r, 30));
  const s = await App.DB.get('settings', 'defaultSurname');
  assert.strictEqual(s.value, '王', '偏好应保存');
  await App.DB.delete('settings', 'defaultSurname');
});

test('S2-7 导出：exportAll 返回完整 JSON 结构', async () => {
  await App.DB.put('settings', { key: 'defaultSurname', value: '李' });
  const data = await App.DB.exportAll();
  assert.strictEqual(data.version, 1);
  assert.ok(Array.isArray(data.stores.settings), 'settings store 应为数组');
  const s = data.stores.settings.find(x => x.key === 'defaultSurname');
  assert.strictEqual(s.value, '李');
  await App.DB.delete('settings', 'defaultSurname');
});

test('S2-8 导入：importBackup 恢复数据并刷新', async () => {
  // 准备备份
  const backup = {
    version: 1,
    exportedAt: Date.now(),
    stores: {
      records: [{ id: 'rec_imp1', module: 'pet', title: '猫·宠物取名', input: {}, result: { names: [{ fullName: '团团' }] }, createdAt: Date.now() }],
      favorites: [],
      materials: [],
      settings: [{ key: 'defaultPetType', value: '猫' }]
    }
  };
  await App.App.importBackup({ text: () => Promise.resolve(JSON.stringify(backup)) });
  await new Promise((r) => setTimeout(r, 50));
  const recs = await App.DB.getAll('records');
  assert.strictEqual(recs.length, 1, '记录应导入');
  const st = await App.DB.get('settings', 'defaultPetType');
  assert.strictEqual(st.value, '猫', '设置应导入');
  await App.DB.clear('records');
  await App.DB.clear('settings');
});

test('S2-9 抽屉：关闭按钮工作', async () => {
  await App.App.openFavorites();
  const drawer = window.document.getElementById('globalDrawer');
  assert.ok(drawer.classList.contains('open'));
  const closeBtn = drawer.querySelector('.drawer-close');
  closeBtn.click();
  assert.ok(!drawer.classList.contains('open'), '关闭后不应再是 open');
});
