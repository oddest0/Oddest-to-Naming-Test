/**
 * 阶段 4 测试：首页工作台
 * 1. 首页渲染：欢迎区、快速取名、模块摘要、最近记录
 * 2. 快速 AI 取名：各类型生成结果
 * 3. 模块摘要跳转
 * 4. 文献上传：解析文本、保存文献、生成名字、删除文献
 * 5. 最近记录展示
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

test('S4-1 首页渲染：欢迎区、快速取名、模块摘要、最近记录', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});
  assert.ok(main.innerHTML.includes('专属取名工作台'), '应有欢迎区');
  assert.ok(main.innerHTML.includes('快速 AI 取名'), '应有快速取名卡片');
  assert.ok(main.querySelector('#hmGo'), '应有快速生成按钮');
  assert.ok(main.querySelectorAll('.module-card').length === 5, '应有 5 个模块摘要');
  assert.ok(main.innerHTML.includes('最近记录'), '应有最近记录区域');
});

test('S4-2 快速 AI 取名：新生儿与诗词类型生成', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});
  w.document.getElementById('hmSurname').value = '李';

  // 新生儿
  w.document.getElementById('hmType').value = 'newborn';
  w.document.getElementById('hmGo').click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.querySelectorAll('#hmResult .name-card').length > 0, '新生儿快速取名应有结果');

  // 诗词
  w.document.getElementById('hmType').value = 'poetry';
  w.document.getElementById('hmGo').click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.querySelectorAll('#hmResult .name-card').length > 0, '诗词快速取名应有结果');
  assert.ok(main.querySelector('#hmResult [data-jump]'), '应有跳转按钮');

  // 历史保存 quick
  const recs = await AppW.DB.getAll('records');
  assert.ok(recs.some(r => r.module === 'quick'), '应保存快速取名历史');
  await AppW.DB.clear('records');
});

test('S4-3 快速 AI 取名：宠物与八字类型生成', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});

  w.document.getElementById('hmType').value = 'pet';
  w.document.getElementById('hmGo').click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.querySelectorAll('#hmResult .name-card').length > 0, '宠物快速取名应有结果');

  w.document.getElementById('hmType').value = 'bazi';
  w.document.getElementById('hmGo').click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.querySelectorAll('#hmResult .name-card').length > 0, '八字快速取名应有结果');
  await AppW.DB.clear('records');
});

test('S4-4 模块摘要点击跳转', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});
  const card = main.querySelector('.module-card[data-page="newborn"]');
  assert.ok(card, '应有新生儿模块卡片');
  card.click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.innerHTML.includes('新生儿取名'), '点击后应跳到新生儿模块');
});

test('S4-5 文献上传：解析、生成、保存、删除', async () => {
  const { w, AppW } = await setup();
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});

  // 模拟选择文件：读入文本
  const fileInput = w.document.getElementById('hmFile');
  const text = '长风破浪会有时，直挂云帆济沧海。海内存知己，天涯若比邻。';
  // 触发 change 需 FileReader；jsdom 中通过手动调用 onchange 逻辑
  // 直接给 fileInput 赋值 file 对象模拟
  const file = new w.File([text], '材料.txt', { type: 'text/plain' });
  // 由于 FileReader 在 jsdom 中可用，需触发 change 事件
  Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
  fileInput.dispatchEvent(new w.Event('change'));
  await new Promise((r) => setTimeout(r, 40));

  // 点"用此文献取名"
  w.document.getElementById('hmSurname2').value = '林';
  w.document.getElementById('hmGenMaterial').click();
  await new Promise((r) => setTimeout(r, 60));
  assert.ok(main.querySelectorAll('#hmMaterialResult .name-card').length > 0, '文献取名应有结果');

  // 文献已保存
  const mats = await AppW.DB.getAll('materials');
  assert.ok(mats.length > 0, '应保存文献');
  assert.ok(mats[0].words.length > 0, '文献应提炼出字');
  assert.strictEqual(mats[0].name, '材料.txt', '应记录文件名');

  // 删除文献
  const delBtn = main.querySelector('#hmMaterials [data-mat]');
  assert.ok(delBtn, '应有删除按钮');
  delBtn.click();
  await new Promise((r) => setTimeout(r, 40));
  const mats2 = await AppW.DB.getAll('materials');
  assert.strictEqual(mats2.length, 0, '删除后应为空');

  // 历史保存 material
  const recs = await AppW.DB.getAll('records');
  assert.ok(recs.some(r => r.module === 'material'), '应保存文献取名历史');
  await AppW.DB.clear('records');
});

test('S4-6 最近记录展示已生成名字', async () => {
  const { w, AppW } = await setup();
  // 先写入一条记录
  await AppW.DB.add('records', {
    id: 'rec-test-1', module: 'newborn', title: '测试宝宝 · 新生儿取名',
    input: {}, result: { names: ['李承宇', '李思源'] }, createdAt: AppW.now()
  });
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});
  assert.ok(main.innerHTML.includes('李承宇'), '最近记录应展示已生成名字');
  await AppW.DB.clear('records');
});

test('S4-7 最近记录点击跳转到对应模块', async () => {
  const { w, AppW } = await setup();
  await AppW.DB.add('records', {
    id: 'rec-test-2', module: 'score', title: '解析评分 · 李承宇',
    input: {}, result: { names: ['李承宇'] }, createdAt: AppW.now()
  });
  const main = w.document.getElementById('main');
  await AppW.Pages.home.render(main, {});
  const row = main.querySelector('.recent-row[data-page="score"]');
  assert.ok(row, '应有指向评分模块的最近记录行');
  row.click();
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(main.innerHTML.includes('名字解析及评分'), '点击后应跳转到评分模块');
  await AppW.DB.clear('records');
});
