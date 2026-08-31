/**
 * pages/poetry.js —— 诗词取名
 * 诗词库浏览（按出处分类）→ 关键词检索 → 点选名句提炼 → 组合候选名（带出处）
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  let currentBook = '';
  let currentKeyword = '';

  App.Pages.poetry = {
    title: '诗词取名',

    render: async function (container) {
      // 读取默认姓氏
      let prefs = {};
      try {
        const k = await App.DB.get('settings', 'defaultSurname');
        if (k) prefs.surname = k.value;
      } catch (e) { /* ignore */ }

      let html = '<div class="card">';
      html += '<div class="card-title">诗词取名</div>';
      html += '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;">从诗词名句中提炼好字好词取名，每个名字都带出处原文。选句后，提炼的名字会显示在右侧栏，下滑页面时始终可见。</div>';
      html += '<div class="field"><label>姓氏（可选）</label><input id="poSurname" type="text" value="' + (prefs.surname || '') + '" placeholder="如：李"></div>';
      html += '<div class="toolbar" style="margin-top:10px;">';
      html += '<input id="poSearch" type="text" placeholder="输入字/词检索诗句" style="flex:1;min-width:160px;padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-sm);">';
      html += '<select id="poBook"><option value="">全部出处</option>';
      App.Data.poetryBooks.forEach(function (b) {
        html += '<option value="' + b + '">' + b + '</option>';
      });
      html += '</select>';
      html += '</div>';
      html += '</div>';

      // 两栏布局：左侧诗词列表（可滚动），右侧结果面板（sticky 常驻可视区）
      html += '<div class="poetry-layout">';
      html += '<div class="poetry-main">';
      html += '<div id="poPoems" class="card"></div>';
      html += '</div>';
      html += '<aside class="poetry-side">';
      html += '<div class="card"><div class="card-title">🎯 提炼的名字</div>';
      html += '<div id="poResult"><div class="empty-state">在左侧点选一句诗，名字会显示在这里</div></div>';
      html += '</div></aside>';
      html += '</div>';

      container.innerHTML = html;

      function renderPoems() {
        const box = document.getElementById('poPoems');
        const book = document.getElementById('poBook').value;
        const kw = document.getElementById('poSearch').value;
        const list = App.Engine.poetry.search(kw, book);
        if (list.length === 0) {
          box.innerHTML = '<div class="empty-state">没有找到相关诗句</div>';
          return;
        }
        let h = '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">找到 ' + list.length + ' 句名句，点击任意一句提炼取名</div>';
        list.forEach(function (p, idx) {
          h += '<div class="poem-item" data-idx="' + idx + '"><div class="line">' + p.line + '</div><div class="src">' + p.book + ' · ' + p.title + '</div></div>';
        });
        box.innerHTML = h;
        box.querySelectorAll('.poem-item').forEach(function (el) {
          el.addEventListener('click', function () {
            const idx = parseInt(el.getAttribute('data-idx'), 10);
            const poem = list[idx];
            selectPoem(poem);
          });
        });
      }

      function selectPoem(poem) {
        const surname = document.getElementById('poSurname').value.trim();
        const names = App.Engine.poetry.generate({ line: poem.line, full: poem.full, poem: poem, surname: surname, count: 8 });
        const box = document.getElementById('poResult');
        if (names.length === 0) {
          box.innerHTML = '<div class="empty-state">该句没有可提炼的字，试试其他句</div>';
          return;
        }
        // 是否使用了全篇提取（名句字不足时回退到全篇，保证必有结果）
        const fromFull = names.some(function (n) { return n.poem.fromFull; });
        let h = '<div class="card-title">『' + poem.line + '』 提炼的名字</div>';
        h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">' + poem.book + ' · ' + poem.title + ' · ' + poem.meaning + (fromFull ? '<span style="color:var(--accent-dark);"> · 已从全篇提取</span>' : '') + '</div>';
        h += '<div class="name-grid">';
        names.forEach(function (n) {
          h += '<div class="name-card">';
          h += '<button class="fav-btn" data-name="' + n.fullName + '" title="收藏">☆</button>';
          h += '<div class="nm">' + n.fullName + '</div>';
          h += '<div class="py">' + n.py + '</div>';
          h += '<div class="meta">五行 ' + (n.wuxing || '—') + '</div>';
          h += '<div class="mean">' + n.meaning + '</div>';
          h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:6px;">「' + n.poem.line + '」</div>';
          h += '</div>';
        });
        h += '</div>';
        box.innerHTML = h;

        // 收藏
        box.querySelectorAll('.fav-btn').forEach(function (btn) {
          const name = btn.getAttribute('data-name');
          btn.addEventListener('click', async function () {
            const n = names.find(function (x) { return x.fullName === name; });
            if (!n) return;
            if (btn.textContent === '★') {
              const favs = await App.DB.getAll('favorites');
              const t = favs.find(function (f) { return f.name === name && f.module === 'poetry'; });
              if (t) await App.DB.delete('favorites', t.id);
              btn.textContent = '☆';
              App.App.toast('已取消收藏');
            } else {
              await App.DB.add('favorites', {
                id: App.uuid('fav'), module: 'poetry', name: name,
                meta: { py: n.py, wuxing: n.wuxing, meaning: n.meaning, poem: n.poem.line + '（' + n.poem.book + '·' + n.poem.title + '）', moduleLabel: '诗词取名' },
                createdAt: App.now()
              });
              btn.textContent = '★';
              App.App.toast('已收藏');
            }
            App.App.refreshSidebarCounts();
          });
        });

        // 保存历史
        App.DB.add('records', {
          id: App.uuid('rec'), module: 'poetry',
          title: '诗词取名 · ' + poem.title,
          input: { poem: poem },
          result: { names: names.slice(0, 8).map(function (n) { return n.fullName; }) },
          createdAt: App.now()
        }).catch(function () {});
      }

      // 事件绑定
      const searchInput = document.getElementById('poSearch');
      const bookSelect = document.getElementById('poBook');
      if (searchInput) searchInput.addEventListener('input', renderPoems);
      if (bookSelect) bookSelect.addEventListener('change', renderPoems);
      renderPoems();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
