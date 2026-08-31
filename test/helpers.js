/**
 * 测试辅助工具：在 Node 中搭建浏览器环境（jsdom + fake-indexeddb + 全局 localStorage）
 * 供各阶段测试复用。加载顺序与 index.html 保持一致。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

// IndexedDB 注入（fake-indexeddb）
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');

// 需要按 index.html 顺序加载的脚本（相对项目根）
const SCRIPTS = [
  'js/utils.js',
  'js/data/hanzi.js',
  'js/data/names.js',
  'js/data/poetry.js',
  'js/data/pet.js',
  'js/db.js',
  'js/engine/generator.js',
  'js/engine/bazi.js',
  'js/engine/poetry.js',
  'js/engine/score.js',
  'js/pages/home.js',
  'js/pages/newborn.js',
  'js/pages/bazi.js',
  'js/pages/poetry.js',
  'js/pages/pet.js',
  'js/pages/score.js',
  'js/pages/favorites.js',
  'js/pages/history.js',
  'js/pages/settings.js',
  'js/app.js',
];

/**
 * 构建一个 jsdom 环境并加载全部应用脚本。
 * @param {object} opts
 * @param {string} opts.html 初始 HTML（默认简单骨架）
 * @param {boolean} opts.persistIndexedDB 是否持久化 IDB（跨调用共享）
 * @returns {Promise<{window, dom, scripts}>}
 */
async function loadApp(opts = {}) {
  const html = opts.html || '<!DOCTYPE html><html><body><div id="app"></div></body></html>';
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
  const { window } = dom;

  // 注入浏览器全局
  window.indexedDB = indexedDB;
  window.IDBKeyRange = IDBKeyRange;
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);

  // 注入脚本
  const scripts = [];
  for (const rel of SCRIPTS) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`脚本不存在: ${rel}`);
    }
    const code = fs.readFileSync(abs, 'utf8');
    window.eval(code);
    scripts.push(rel);
  }
  return { window, dom, scripts };
}

/**
 * 读取项目根下文件的文本。
 */
function readProject(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

module.exports = { loadApp, readProject, ROOT, SCRIPTS };
