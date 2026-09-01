/**
 * pages/history.js —— 历史记录（全局抽屉内展示）
 * 所有模块的操作记录，支持按模块筛选、清空、单条删除。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  const MODULE_LABELS = {
    home_quick: '快速取名',
    home_upload: '文献取名',
    newborn: '新生儿取名',
    bazi: '生辰八字取名',
    poetry: '诗词取名',
    pet: '宠物取名',
    score: '名字解析'
  };

  App.Pages.history = {
    title: '历史记录',

    render: async function (container) {
      container.innerHTML = '';
      let records;
      try {
        records = await App.DB.getAll('records');
      } catch (e) {
        container.innerHTML = '<div class="empty-state">读取历史失败</div>';
        return;
      }
      records = App.sortNewestFirst(records);
      const drawerTitle = document.getElementById('drawerTitle');
      if (drawerTitle) drawerTitle.textContent = '历史记录（' + records.length + '）';

      if (records.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="big">◷</div><div>还没有操作记录</div><div style="font-size:12px;margin-top:6px;">使用各模块后，记录会自动保存在这里</div></div>';
        return;
      }

      // 模块筛选工具条
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      const modules = ['all'].concat(Object.keys(MODULE_LABELS).filter(function (m) {
        return records.some(function (r) { return r.module === m; });
      }));
      modules.forEach(function (m) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm' + (m === 'all' ? ' btn-primary' : '');
        btn.textContent = m === 'all' ? '全部' : (MODULE_LABELS[m] || m);
        btn.setAttribute('data-module', m);
        btn.addEventListener('click', function () {
          container.querySelectorAll('.toolbar .btn').forEach(function (b) { b.classList.remove('btn-primary'); });
          btn.classList.add('btn-primary');
          applyFilter(m);
        });
        toolbar.appendChild(btn);
      });
      // 清空按钮
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn btn-sm';
      clearBtn.textContent = '清空历史';
      clearBtn.addEventListener('click', async function () {
        await App.DB.clear('records');
        App.App.toast('历史已清空');
        await App.Pages.history.render(container);
      });
      toolbar.appendChild(clearBtn);
      container.appendChild(toolbar);

      const list = document.createElement('div');
      list.id = 'historyList';
      container.appendChild(list);

      function applyFilter(module) {
        const filtered = module === 'all' ? records : records.filter(function (r) { return r.module === module; });
        renderList(list, filtered);
      }
      applyFilter('all');
    }
  };

  function renderList(listEl, records) {
    listEl.innerHTML = '';
    if (records.length === 0) {
      listEl.innerHTML = '<div class="empty-state">该模块暂无记录</div>';
      return;
    }
    records.forEach(function (rec) {
      const item = document.createElement('div');
      item.className = 'card';
      item.style.marginBottom = '10px';
      item.style.padding = '12px 14px';
      const label = MODULE_LABELS[rec.module] || rec.module;
      let namesHtml = '';
      const res = rec.result || {};
      const nameList = res.names || res.result || [];
      if (Array.isArray(nameList)) {
        const shown = nameList.slice(0, 3).map(function (n) {
          return typeof n === 'string' ? n : (n.fullName || n.name || '');
        }).filter(Boolean).join('、');
        if (shown) namesHtml = '<div style="font-size:13px;margin-top:4px;">' + shown + '</div>';
      } else if (res.name) {
        namesHtml = '<div style="font-size:13px;margin-top:4px;">' + res.name + '</div>';
      }
      item.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span class="badge">' + label + '</span>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:12px;color:var(--text-secondary);">' + App.formatTime(rec.createdAt) + '</span>' +
        '<button type="button" class="history-del-btn" title="删除这条记录">删除</button>' +
        '</div></div>' +
        '<div style="font-size:14px;font-weight:600;margin-top:6px;">' + (rec.title || '') + '</div>' +
        namesHtml;
      // 单条删除：删除后重新渲染（更新计数与列表）
      item.querySelector('.history-del-btn').addEventListener('click', async function () {
        await App.DB.delete('records', rec.id);
        App.App.toast('已删除该记录');
        await App.Pages.history.render(listEl.parentNode);
      });
      listEl.appendChild(item);
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
