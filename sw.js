/**
 * sw.js —— Service Worker（PWA 离线缓存）
 * 预缓存应用外壳（HTML/CSS/JS/数据/图标），并保证资源更新能自动生效：
 * - 导航请求：network-first（在线时总是回源拿最新 HTML，离线回退缓存）
 * - 静态资源：stale-while-revalidate（先返回缓存保证速度，同时后台回源更新缓存）
 * - 升级缓存版本号 CACHE 会触发 SW 更新并在 activate 时清理旧版本缓存
 * 子路径部署（GitHub Pages /Oddest-to-Naming-Test/）下使用相对路径，保证可移植。
 */
const CACHE = 'qsmq-v0.1.7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/utils.js',
  './js/data/hanzi.js',
  './js/data/names.js',
  './js/data/poetry.js',
  './js/data/pet.js',
  './js/db.js',
  './js/engine/generator.js',
  './js/engine/bazi.js',
  './js/engine/poetry.js',
  './js/engine/score.js',
  './js/pages/home.js',
  './js/pages/newborn.js',
  './js/pages/bazi.js',
  './js/pages/poetry.js',
  './js/pages/pet.js',
  './js/pages/score.js',
  './js/pages/favorites.js',
  './js/pages/history.js',
  './js/pages/settings.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 导航请求：network-first，在线回源拿最新 HTML，离线回退应用外壳缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(new URL('./index.html', self.location.href));
      })
    );
    return;
  }

  // 静态资源：stale-while-revalidate（先返回缓存，同时后台回源更新缓存）
  e.respondWith(
    caches.match(req).then(function (hit) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return null; });
      if (hit) return hit;
      return network.then(function (nres) { return nres || Response.error(); });
    })
  );
});
