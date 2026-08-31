/**
 * 阶段 0 测试：项目骨架完整性
 * 1. index.html / css / 全部 js 文件存在
 * 2. index.html 中 script 引用与磁盘文件一一对应
 * 3. 脚本加载顺序正确（utils 在前、app 最后）
 * 4. CSS 包含设计令牌
 */
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { readProject, SCRIPTS, ROOT } = require('./helpers');

const INDEX = readProject('index.html');

test('S0-1 index.html 存在且含应用外壳骨架', () => {
  for (const s of ['app-shell', 'app-topbar', 'app-sidebar', 'app-main', 'toastContainer', 'btnExport', 'btnImport', 'btnSettings']) {
    assert.ok(INDEX.includes(s), `index.html 应包含 ${s}`);
  }
  assert.ok(INDEX.includes('css/style.css'), '应引用样式表');
});

test('S0-2 index.html 引用的脚本文件全部存在', () => {
  const re = /<script src="([^"]+)"><\/script>/g;
  const refs = [];
  let m;
  while ((m = re.exec(INDEX)) !== null) refs.push(m[1]);
  assert.ok(refs.length >= 20, '应有 20 个以上脚本引用，实际 ' + refs.length);
  for (const rel of refs) {
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `脚本 ${rel} 应存在于磁盘`);
  }
});

test('S0-3 脚本加载顺序：utils 在前，data 在 engine 前，app 最后', () => {
  // 从 index.html 提取脚本引用顺序
  const re = /<script src="([^"]+)"><\/script>/g;
  const refs = [];
  let m;
  while ((m = re.exec(INDEX)) !== null) refs.push(m[1]);
  const idxUtils = refs.indexOf('js/utils.js');
  const idxApp = refs.indexOf('js/app.js');
  assert.ok(idxUtils === 0, 'utils.js 应是第一个加载');
  assert.ok(idxApp === refs.length - 1, 'app.js 应是最后一个加载');
  const idxData = refs.indexOf('js/data/hanzi.js');
  const idxEngine = refs.indexOf('js/engine/generator.js');
  assert.ok(idxData < idxEngine, 'data 应早于 engine 加载');
  assert.deepStrictEqual(SCRIPTS, refs, 'helpers 中的加载顺序应与 index.html 一致');
});

test('S0-4 样式表包含设计令牌与关键组件', () => {
  const css = readProject('css/style.css');
  for (const t of ['--accent', '--radius', '.app-shell', '.name-card', '.toast', '.empty-state', '.btn-primary', '.summary-card']) {
    assert.ok(css.includes(t), `style.css 应包含 ${t}`);
  }
});

test('S0-5 页面标题与顶栏文案已更新', () => {
  // 浏览器标签标题
  assert.ok(INDEX.includes('<title>奇思妙取 · 该工作台由Oddest娱乐制作，生成内容仅供参考</title>'), '浏览器标题应为新标题');
  // 顶栏 logo
  assert.ok(INDEX.includes('<div class="app-logo">奇思妙取</div>'), '顶栏 logo 应为奇思妙取');
  // 顶栏副标题（免责声明）
  assert.ok(INDEX.includes('该工作台由Oddest娱乐制作，生成内容仅供参考'), '副标题应含免责声明');
  // 旧标题不应残留
  assert.ok(!INDEX.includes('专属取名工作台'), '不应残留旧副标题');
});
