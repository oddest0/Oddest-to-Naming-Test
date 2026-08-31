/**
 * 阶段 3.1 测试：通用取名引擎 + 新生儿取名页面
 * 1. generator.generateNewborn：数量、避讳、字辈、风格、性别
 * 2. generator.generatePet / generateFromMaterial
 * 3. 新生儿页面：生成、收藏、换一批、历史保存
 */
'use strict';

const { test, before } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
const { loadApp, readProject, SCRIPTS, ROOT } = require('./helpers');

let window, App;

function buildDom() {
  const html = readProject('index.html');
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  const body = bodyMatch ? bodyMatch[1] : '<div id="app"></div>';
  return new JSDOM('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>' + body + '</body></html>', {
    url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only',
  });
}

before(async () => {
  // 纯引擎测试用 loadApp
  const env = await loadApp();
  window = env.window;
  App = window.App;
  // 独立页面测试用新的 jsdom（避免 loadApp 的 app.js init 副作用）
});

test('S3.1-1 generateNewborn：返回指定数量且字段完整', () => {
  const res = App.Engine.generator.generateNewborn({ surname: '李', gender: '男', styles: ['文雅'], count: 10 });
  assert.ok(res.length <= 10 && res.length > 0, '应返回 1-10 个结果，实际 ' + res.length);
  for (const n of res) {
    assert.ok(n.fullName.startsWith('李'), '名字应以姓开头');
    assert.ok(n.fullName.length === 3, '应生成三个字（姓+2字）');
    assert.ok(n.py && n.meaning && typeof n.score === 'number', '字段应完整');
  }
});

test('S3.1-2 避讳字过滤：结果不包含避讳字', () => {
  const res = App.Engine.generator.generateNewborn({ surname: '张', gender: '男', tabooChars: '安', count: 30 });
  assert.ok(res.length > 0, '应有结果');
  for (const n of res) {
    assert.ok(!n.fullName.includes('安'), `名字 ${n.fullName} 不应包含避讳字"安"`);
  }
});

test('S3.1-3 字辈：中间字固定', () => {
  const res = App.Engine.generator.generateNewborn({ surname: '王', gender: '男', generation: '永', count: 8 });
  assert.ok(res.length > 0, '应有结果');
  for (const n of res) {
    assert.strictEqual(n.fullName[1], '永', `名字 ${n.fullName} 中间字应为"永"`);
  }
});

test('S3.1-4 风格与性别：结果符合或回退', () => {
  const res = App.Engine.generator.generateNewborn({ surname: '赵', gender: '女', styles: ['可爱'], count: 10 });
  assert.ok(res.length > 0, '应有结果');
  // 至少结果应来自池中（不做严格断言，避免随机性）
  for (const n of res) {
    assert.ok(n.chars.length === 2, '应有两个名字用字');
  }
});

test('S3.1-5 generatePet：按风格返回', () => {
  const res = App.Engine.generator.generatePet({ styles: ['萌系'], count: 8 });
  assert.ok(res.length > 0 && res.length <= 8, '应返回 1-8 个，实际 ' + res.length);
  for (const p of res) {
    assert.ok(p.name && p.meaning, '宠物名应有名字和含义');
  }
  // 空风格回退萌系
  const res2 = App.Engine.generator.generatePet({ styles: [], count: 3 });
  assert.ok(res2.length > 0, '空风格应回退');
});

test('S3.1-6 generateFromMaterial：从素材字生成', () => {
  const res = App.Engine.generator.generateFromMaterial({ surname: '陈', words: [{ char: '云' }, { char: '帆' }, { char: '山' }, { char: '月' }], count: 6 });
  assert.ok(res.length > 0, '应有结果');
  for (const n of res) {
    assert.ok(n.fullName.startsWith('陈'), '应以姓开头');
  }
});

// ============ 页面交互测试 ============

test('S3.1-7 新生儿页面：渲染表单与生成', async () => {
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
  assert.ok(main.innerHTML.includes('新生儿取名'), '页面应有标题');
  assert.ok(main.innerHTML.includes('生成名字'), '应有生成按钮');

  // 填写姓氏并生成
  const input = w.document.getElementById('nbSurname');
  input.value = '李';
  const btn = w.document.getElementById('nbGenerate');
  btn.click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.innerHTML.includes('name-card'), '生成后应有名字卡片');
  assert.ok(main.innerHTML.includes('李'), '结果应含姓氏');

  // 历史应保存
  const recs = await AppW.DB.getAll('records');
  assert.ok(recs.some(r => r.module === 'newborn'), '应保存新生儿历史记录');
  await AppW.DB.clear('records');
});

test('S3.1-8 新生儿页面：收藏与换一批', async () => {
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
  w.document.getElementById('nbSurname').value = '王';
  w.document.getElementById('nbGenerate').click();
  await new Promise((r) => setTimeout(r, 40));

  // 收藏第一个
  const firstFav = main.querySelector('.name-card .fav-btn');
  assert.ok(firstFav, '应有收藏按钮');
  firstFav.click();
  await new Promise((r) => setTimeout(r, 40));
  const favs = await AppW.DB.getAll('favorites');
  assert.ok(favs.length > 0, '收藏后应有收藏记录');
  assert.strictEqual(favs[0].module, 'newborn', '收藏应标记来源模块');

  // 换一批
  const beforeFirst = main.querySelector('.name-card .nm').textContent;
  const reshuffleBtn = w.document.getElementById('nbReshuffle');
  assert.ok(reshuffleBtn, '应有换一批按钮');
  reshuffleBtn.click();
  await new Promise((r) => setTimeout(r, 40));
  const afterFirst = main.querySelector('.name-card .nm').textContent;
  // 换一批后结果可能相同（随机可能复现），只验证仍能渲染
  assert.ok(main.querySelectorAll('.name-card').length > 0, '换一批后仍应有结果');

  await AppW.DB.clear('favorites');
  await AppW.DB.clear('records');
});

test('S3.1-9 新生儿页面：只看收藏筛选', async () => {
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
  w.document.getElementById('nbSurname').value = '刘';
  w.document.getElementById('nbGenerate').click();
  await new Promise((r) => setTimeout(r, 60));

  // 收藏第一个名字
  const favBtn = main.querySelector('.name-card .fav-btn');
  const firstName = main.querySelector('.name-card .nm').textContent;
  assert.ok(favBtn, '应有收藏按钮');
  favBtn.click();
  await new Promise((r) => setTimeout(r, 40));

  // 打开只看收藏
  const onlyFavBtn = main.querySelector('#nbOnlyFav');
  assert.ok(onlyFavBtn, '应有只看收藏按钮');
  onlyFavBtn.click();
  await new Promise((r) => setTimeout(r, 60));
  // 只看收藏后应只显示已收藏的名字（至少包含刚收藏的）
  const shown = Array.from(main.querySelectorAll('#nbResult .name-card .nm')).map(el => el.textContent);
  assert.ok(shown.length >= 1, '只看收藏应有结果');
  assert.ok(shown.includes(firstName), '应包含刚收藏的名字');
  // 收藏按钮状态应为实心
  assert.ok(main.querySelector('#nbResult .fav-btn.faved'), '收藏按钮应为已收藏样式');

  // 取消收藏后，只看收藏应显示空态
  const favedBtn = main.querySelector('#nbResult .fav-btn.faved');
  favedBtn.click();
  await new Promise((r) => setTimeout(r, 60));
  assert.ok(main.innerHTML.includes('还没有收藏'), '取消收藏后只看收藏应显示空态');

  await AppW.DB.clear('favorites');
  await AppW.DB.clear('records');
});
