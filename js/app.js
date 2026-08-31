/**
 * app.js —— 应用外壳
 * 路由、左侧导航、顶栏、收藏/历史抽屉、Toast、备份导入导出。
 * 依赖：utils.js、data/*、db.js、engine/*、pages/*
 * 页面注册：App.Pages[name] = { title, render(container) }
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};

  App.Pages = App.Pages || {};

  const AppShell = {};

  let currentPage = 'home';

  AppShell.getCurrent = function () { return currentPage; };

  /** 导航到某页面（写入 #main） */
  AppShell.navigate = async function (name, params) {
    const page = App.Pages[name];
    if (!page) { AppShell.toast('页面不存在', 'error'); return; }
    currentPage = name;
    // 高亮导航
    document.querySelectorAll('.nav-item[data-page]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-page') === name);
    });
    const main = document.getElementById('main');
    if (!main) return;
    main.innerHTML = '<div class="skeleton" style="height:120px;margin-bottom:16px;"></div>';
    try {
      await page.render(main, params || {});
    } catch (e) {
      console.error('页面渲染失败:', e);
      main.innerHTML = '<div class="empty-state"><div>页面加载出错了：' + (e && e.message || e) + '</div></div>';
    }
  };

  /** Toast 轻提示 */
  AppShell.toast = function (msg, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    el.textContent = msg;
    container.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 400);
    }, 2200);
  };

  /** 打开收藏夹抽屉 */
  AppShell.openFavorites = async function () {
    const drawer = document.getElementById('globalDrawer');
    if (!drawer) return;
    const page = App.Pages.favorites;
    if (!page) return;
    drawer.classList.add('open');
    await page.render(drawer.querySelector('.drawer-body'));
  };

  /** 打开历史记录抽屉 */
  AppShell.openHistory = async function () {
    const drawer = document.getElementById('globalDrawer');
    if (!drawer) return;
    const page = App.Pages.history;
    if (!page) return;
    drawer.classList.add('open');
    await page.render(drawer.querySelector('.drawer-body'));
  };

  AppShell.closeDrawer = function () {
    const drawer = document.getElementById('globalDrawer');
    if (drawer) drawer.classList.remove('open');
  };

  /** 刷新侧边栏入口状态（如收藏数） */
  AppShell.refreshSidebarCounts = async function () {
    const el = document.getElementById('favCount');
    if (!el) return;
    try {
      const favs = await App.DB.getAll('favorites');
      el.textContent = favs.length > 0 ? String(favs.length) : '';
    } catch (e) { /* ignore */ }
  };

  /** 导出备份：下载 JSON 文件 */
  AppShell.exportBackup = async function () {
    try {
      const data = await App.DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '取名备份_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 100);
      AppShell.toast('备份已导出');
    } catch (e) {
      console.error(e);
      AppShell.toast('导出失败：' + (e && e.message || e), 'error');
    }
  };

  /** 导入备份 */
  AppShell.importBackup = async function (file) {
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await App.DB.importAll(json);
      AppShell.closeDrawer();
      AppShell.toast('数据已恢复');
      await AppShell.refreshSidebarCounts();
      // 若当前在首页则刷新
      if (currentPage === 'home' && App.Pages.home) {
        await App.Pages.home.render(document.getElementById('main'));
      }
    } catch (e) {
      console.error(e);
      AppShell.toast('导入失败：' + (e && e.message || e), 'error');
    }
  };

  /** 初始化：绑定事件 */
  AppShell.init = function () {
    // 导航
    document.querySelectorAll('.nav-item[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        AppShell.navigate(btn.getAttribute('data-page'));
      });
    });
    // 收藏/历史
    const btnFav = document.getElementById('btnFavorites');
    const btnHist = document.getElementById('btnHistory');
    if (btnFav) btnFav.addEventListener('click', function () { AppShell.openFavorites(); });
    if (btnHist) btnHist.addEventListener('click', function () { AppShell.openHistory(); });
    // 设置
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) btnSettings.addEventListener('click', function () { AppShell.navigate('settings'); });
    // 导出/导入
    const btnExport = document.getElementById('btnExport');
    const btnImport = document.getElementById('btnImport');
    const importFile = document.getElementById('importFile');
    if (btnExport) btnExport.addEventListener('click', function () { AppShell.exportBackup(); });
    if (btnImport && importFile) {
      btnImport.addEventListener('click', function () { importFile.click(); });
      importFile.addEventListener('change', function () {
        const f = importFile.files && importFile.files[0];
        if (f) AppShell.importBackup(f);
        importFile.value = '';
      });
    }
    // 抽屉关闭
    const drawer = document.getElementById('globalDrawer');
    if (drawer) {
      const closeBtn = drawer.querySelector('.drawer-close');
      if (closeBtn) closeBtn.addEventListener('click', function () { AppShell.closeDrawer(); });
      drawer.addEventListener('click', function (e) {
        if (e.target === drawer) AppShell.closeDrawer();
      });
    }
    // 初始页面
    AppShell.navigate('home');
    AppShell.refreshSidebarCounts();
  };

  App.App = AppShell;

  // 页面 DOM 就绪后初始化（file:// 下脚本在 body 末尾执行，DOM 已存在）
  // __NAMEAPP_NO_AUTO_INIT__ 为测试专用开关：页面级单测直接调用 Pages.xxx.render，
  // 避免 init() 自动导航首页产生的异步渲染与测试写入 main 的竞态；生产环境默认不设置。
  const noAutoInit = typeof window !== 'undefined' && window.__NAMEAPP_NO_AUTO_INIT__ === true;
  if (!noAutoInit) {
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { AppShell.init(); });
    } else if (typeof document !== 'undefined') {
      AppShell.init();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
