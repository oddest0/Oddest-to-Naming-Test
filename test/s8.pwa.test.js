/**
 * 阶段 8 测试：PWA 改造（manifest + Service Worker + 图标 + 注册）
 * 1. manifest.json 合法且包含 PWA 必需字段
 * 2. sw.js 预缓存列表覆盖 index.html 的全部资源引用
 * 3. index.html 已接入 manifest 与 SW 注册
 * 4. 图标文件存在且为有效 PNG
 */
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { readProject, ROOT } = require('./helpers');

const INDEX = readProject('index.html');
const MANIFEST = JSON.parse(readProject('manifest.json'));
const SW = readProject('sw.js');

function extractScriptRefs(html) {
  const re = /<script src="([^"]+)"><\/script>/g;
  const refs = [];
  let m;
  while ((m = re.exec(html)) !== null) refs.push(m[1]);
  return refs;
}

test('S8-1 manifest.json 含 PWA 必需字段且合法', () => {
  assert.ok(MANIFEST.name, '应有 name');
  assert.ok(MANIFEST.short_name, '应有 short_name');
  assert.strictEqual(MANIFEST.start_url, './');
  assert.strictEqual(MANIFEST.scope, './');
  assert.strictEqual(MANIFEST.display, 'standalone');
  assert.ok(MANIFEST.theme_color && MANIFEST.background_color, '应有主题/背景色');
  assert.ok(Array.isArray(MANIFEST.icons) && MANIFEST.icons.length >= 2, '应有至少两个图标');
  const sizes = MANIFEST.icons.map(i => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'), '应包含 192 与 512 尺寸');
});

test('S8-2 sw.js 预缓存列表覆盖 index.html 全部脚本资源', () => {
  const refs = extractScriptRefs(INDEX);
  assert.ok(refs.length >= 20, '脚本引用应完整');
  for (const ref of refs) {
    assert.ok(SW.includes(`'./${ref}'`), `sw.js 应预缓存 ${ref}`);
  }
  for (const a of ['./', './index.html', './manifest.json', './css/style.css', './icons/icon-192.png', './icons/icon-512.png']) {
    assert.ok(SW.includes(`'${a}'`), `sw.js 应预缓存 ${a}`);
  }
  assert.ok(SW.includes("self.addEventListener('fetch'"), 'sw.js 应处理 fetch 事件');
  assert.ok(SW.includes("self.addEventListener('install'"), 'sw.js 应处理 install 事件');
});

test('S8-3 index.html 已接入 manifest 与 SW 注册', () => {
  assert.ok(INDEX.includes('rel="manifest"'), '应引用 manifest');
  assert.ok(INDEX.includes('name="theme-color"'), '应设置主题色');
  assert.ok(INDEX.includes("'serviceWorker' in navigator"), '应注册 Service Worker');
  assert.ok(INDEX.includes("navigator.serviceWorker.register('./sw.js')"), '应注册 sw.js');
  assert.ok(INDEX.includes('rel="icon"'), '应设置应用图标');
});

test('S8-4 图标文件存在且为有效 PNG', () => {
  for (const name of ['icon-192.png', 'icon-512.png']) {
    const p = path.join(ROOT, 'icons', name);
    assert.ok(fs.existsSync(p), `${name} 应存在`);
    const buf = fs.readFileSync(p);
    assert.ok(buf.length > 1000, `${name} 不应为空`);
    // PNG 魔数：89 50 4E 47 0D 0A 1A 0A
    assert.strictEqual(buf[0], 0x89);
    assert.strictEqual(buf[1], 0x50);
    assert.strictEqual(buf[2], 0x4E);
    assert.strictEqual(buf[3], 0x47);
  }
});
