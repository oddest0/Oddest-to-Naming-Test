/**
 * pages/favorites.js —— 收藏夹（全局抽屉内展示）
 * 跨模块统一查看收藏的名字，支持取消收藏。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  App.Pages.favorites = {
    title: '收藏夹',

    render: async function (container) {
      container.innerHTML = '';
      let favs;
      try {
        favs = await App.DB.getAll('favorites');
      } catch (e) {
        container.innerHTML = '<div class="empty-state">读取收藏失败</div>';
        return;
      }
      // 按时间倒序（兼容数字/字符串 createdAt）
      favs = App.sortNewestFirst(favs);
      const drawerTitle = document.getElementById('drawerTitle');
      if (drawerTitle) drawerTitle.textContent = '收藏夹（' + favs.length + '）';

      if (favs.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="big">☆</div><div>还没有收藏任何名字</div><div style="font-size:12px;margin-top:6px;">在各模块结果卡片上点星标即可收藏</div></div>';
        return;
      }

      const list = document.createElement('div');
      list.className = 'fav-list';
      favs.forEach(function (fav) {
        const item = document.createElement('div');
        item.className = 'name-card';
        const meta = fav.meta || {};
        let html = '<button class="fav-btn faved" data-id="' + fav.id + '" title="取消收藏">★</button>';
        html += '<div class="nm">' + (fav.name || '') + '</div>';
        html += '<div class="py">' + (meta.py || meta.en || '') + '</div>';
        html += '<div class="meta">';
        if (meta.wuxing) html += '<span class="badge">五行 ' + meta.wuxing + '</span>';
        if (meta.moduleLabel) html += '<span class="badge">' + meta.moduleLabel + '</span>';
        html += '</div>';
        if (meta.meaning) html += '<div class="mean">' + meta.meaning + '</div>';
        if (meta.poem) html += '<div class="mean" style="color:var(--text-secondary);font-size:12px;">' + meta.poem + '</div>';
        item.innerHTML = html;
        const btn = item.querySelector('.fav-btn');
        if (btn) {
          btn.addEventListener('click', async function () {
            try {
              await App.DB.delete('favorites', fav.id);
              App.App.toast('已取消收藏');
              await App.Pages.favorites.render(container);
              App.App.refreshSidebarCounts();
            } catch (e) {
              App.App.toast('操作失败', 'error');
            }
          });
        }
        list.appendChild(item);
      });
      container.appendChild(list);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
