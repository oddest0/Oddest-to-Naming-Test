/**
 * pages/home.js —— 首页工作台
 * ① 快速 AI 取名（内置数据库直出） ② 上传自定义文献取名 ③ 各模块摘要 ④ 最近记录
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  const QUICK_TYPES = [
    { key: 'newborn', label: '新生儿' },
    { key: 'bazi', label: '生辰八字' },
    { key: 'poetry', label: '诗词' },
    { key: 'pet', label: '宠物' }
  ];

  const MODULE_SUMMARY = [
    { key: 'newborn', icon: '👶', title: '新生儿取名', desc: '按姓氏、性别、风格、避讳字与字辈，从内置汉字库组合候选名。' },
    { key: 'bazi', icon: '☯', title: '生辰八字取名', desc: '输入出生时间排四柱，分析五行喜忌，按补益五行推荐名字。' },
    { key: 'poetry', icon: '📜', title: '诗词取名', desc: '从诗经、楚辞、唐诗、宋词名句中提炼好字，每个名字带出处。' },
    { key: 'pet', icon: '🐾', title: '宠物取名', desc: '按宠物类型、性格与风格生成中英文名，可爱又贴切。' },
    { key: 'score', icon: '⭐', title: '名字解析评分', desc: '逐字解析拼音、笔画、五行与寓意，多维评分并给点评。' }
  ];

  App.Pages.home = {
    title: '首页',

    render: async function (container) {
      let prefs = {};
      try {
        const k = await App.DB.get('settings', 'defaultSurname');
        if (k) prefs.surname = k.value;
      } catch (e) { /* ignore */ }

      // 统计数据
      let stats = { favs: 0, recs: 0, mats: 0 };
      try {
        const [favs, recs, mats] = await Promise.all([
          App.DB.getAll('favorites'),
          App.DB.getAll('records'),
          App.DB.getAll('materials')
        ]);
        stats = { favs: favs.length, recs: recs.length, mats: mats.length };
      } catch (e) { /* ignore */ }

      let html = '';

      // 欢迎区
      html += '<div class="welcome">';
      html += '<div class="welcome-title">专属取名工作台</div>';
      html += '<div class="welcome-sub">所有数据仅保存在本机浏览器，不联网、不上云，刷新与重启都不会丢失。</div>';
      html += '<div class="stat-row">';
      html += '<div class="stat-chip">已收藏 <b>' + stats.favs + '</b> 个</div>';
      html += '<div class="stat-chip">历史记录 <b>' + stats.recs + '</b> 条</div>';
      html += '<div class="stat-chip">自定义文献 <b>' + stats.mats + '</b> 份</div>';
      html += '</div>';
      html += '</div>';

      // ① 快速 AI 取名
      html += '<div class="card">';
      html += '<div class="card-title">⚡ 快速 AI 取名</div>';
      html += '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">基于内置取名数据库一键生成，无需切换模块。</div>';
      html += '<div class="toolbar">';
      html += '<input id="hmSurname" type="text" value="' + (prefs.surname || '') + '" placeholder="姓氏（如：李）" style="width:110px;padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-sm);">';
      html += '<select id="hmType" style="padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-sm);">';
      QUICK_TYPES.forEach(function (t) {
        html += '<option value="' + t.key + '">' + t.label + '取名</option>';
      });
      html += '</select>';
      html += '<button id="hmGo" class="btn btn-primary" type="button">生成</button>';
      html += '</div>';
      html += '<div id="hmResult" style="margin-top:14px;"></div>';
      html += '</div>';

      // ② 上传自定义文献取名
      html += '<div class="card">';
      html += '<div class="card-title">📄 上传自定义文献取名</div>';
      html += '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">上传自己的 .txt 文本（诗词、家训、文章等），自动提炼好字取名并保存，可反复使用。</div>';
      html += '<div class="toolbar">';
      html += '<input id="hmSurname2" type="text" value="' + (prefs.surname || '') + '" placeholder="姓氏（可选）" style="width:110px;padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-sm);">';
      html += '<label class="btn" for="hmFile" style="cursor:pointer;">选择 .txt 文件</label>';
      html += '<input id="hmFile" type="file" accept=".txt,text/plain" style="display:none;">';
      html += '<button id="hmGenMaterial" class="btn btn-primary" type="button">用此文献取名</button>';
      html += '</div>';
      html += '<div id="hmMaterialResult" style="margin-top:14px;"></div>';
      html += '<div id="hmMaterials" style="margin-top:14px;"></div>';
      html += '</div>';

      // ③ 模块摘要
      html += '<div class="card">';
      html += '<div class="card-title">📚 功能模块</div>';
      html += '<div class="module-grid">';
      MODULE_SUMMARY.forEach(function (m) {
        html += '<div class="module-card" data-page="' + m.key + '">';
        html += '<div class="module-icon">' + m.icon + '</div>';
        html += '<div class="module-title">' + m.title + '</div>';
        html += '<div class="module-desc">' + m.desc + '</div>';
        html += '<div class="module-go">进入 →</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';

      // ④ 最近记录
      html += '<div id="hmRecent" style="margin-top:16px;"></div>';

      container.innerHTML = html;
      bindEvents(container);
      await renderRecent(container);
    }
  };

  // ---- 快速 AI 取名 ----
  function quickGenerate(input, surname) {
    const r = {};
    if (input.key === 'newborn') {
      r.names = App.Engine.generator.generateNewborn({ surname: surname, gender: '', styles: [], count: 8 });
    } else if (input.key === 'pet') {
      r.names = App.Engine.generator.generatePet({ styles: [], count: 8 });
    } else if (input.key === 'poetry') {
      // 随机选句，直到能提炼出至少 2 个可取名汉字
      let poem = null;
      let names = [];
      for (let i = 0; i < App.Data.poetry.length; i++) {
        const p = App.Data.poetry[Math.floor(Math.random() * App.Data.poetry.length)];
        const n = App.Engine.poetry.generate({ line: p.line, poem: p, surname: surname, count: 8 });
        if (n.length >= 2) { poem = p; names = n; break; }
      }
      r.names = names;
      r.poem = poem;
    } else if (input.key === 'bazi') {
      const now = new Date();
      const bazi = App.Engine.bazi.compute({
        solarYear: now.getFullYear(), solarMonth: now.getMonth() + 1, solarDay: now.getDate(), hour: null, gender: ''
      });
      r.names = App.Engine.bazi.recommend({ surname: surname, baziResult: bazi, gender: '', count: 8 });
      r.bazi = bazi;
    }
    return r;
  }

  function renderQuickNames(box, input, surname, r) {
    if (!r.names || r.names.length === 0) {
      box.innerHTML = '<div class="empty-state">没有生成结果，试试其他类型</div>';
      return;
    }
    let h = '';
    if (r.poem) h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">出处：' + r.poem.book + '·' + r.poem.title + '「' + r.poem.line + '」</div>';
    if (r.bazi) h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">八字补益五行：' + r.bazi.favor.join('、') + '</div>';
    h += '<div class="name-grid">';
    r.names.forEach(function (n) {
      h += '<div class="name-card"><div class="nm">' + n.fullName + '</div><div class="py">' + n.py + '</div><div class="mean">' + n.meaning + '</div></div>';
    });
    h += '</div>';
    h += '<div class="toolbar" style="margin-top:12px;"><button class="btn btn-sm" data-jump="' + input.key + '" type="button">进入' + input.label + '模块 →</button></div>';
    box.innerHTML = h;
    box.querySelectorAll('[data-jump]').forEach(function (b) {
      b.addEventListener('click', function () {
        const page = b.getAttribute('data-jump');
        App.App.navigate(page, { prefill: { surname: surname } });
      });
    });
    // 保存历史
    App.DB.add('records', {
      id: App.uuid('rec'), module: 'quick',
      title: '首页快速取名 · ' + input.label,
      input: { type: input.key, surname: surname },
      result: { names: r.names.slice(0, 8).map(function (n) { return n.fullName; }) },
      createdAt: App.now()
    }).catch(function () {});
  }

  // ---- 文献取名 ----
  function extractWordsFromText(text) {
    // 提炼汉字 + 常见双字词（简化：仅单字去重）
    const seen = new Set();
    const out = [];
    for (const ch of text) {
      if (!/[\u4e00-\u9fff]/.test(ch)) continue;
      if (seen.has(ch)) continue;
      seen.add(ch);
      const info = App.Data.hanziMap[ch];
      if (!info) continue; // 只保留可查询寓意的字
      out.push({ char: ch, meaning: info.meaning, wuxing: info.wuxing, strokes: info.strokes });
    }
    return out;
  }

  function bindEvents(container) {
    // 快速 AI
    const goBtn = document.getElementById('hmGo');
    const typeSel = document.getElementById('hmType');
    const sur1 = document.getElementById('hmSurname');
    if (goBtn) {
      goBtn.addEventListener('click', function () {
        const surname = (sur1 ? sur1.value : '').trim();
        const key = typeSel ? typeSel.value : 'newborn';
        const input = QUICK_TYPES.find(function (t) { return t.key === key; });
        const box = document.getElementById('hmResult');
        const r = quickGenerate(input, surname);
        renderQuickNames(box, input, surname, r);
      });
    }

    // 文献上传
    const fileInput = document.getElementById('hmFile');
    const genMatBtn = document.getElementById('hmGenMaterial');
    const sur2 = document.getElementById('hmSurname2');
    let pendingText = '';
    let pendingName = '';
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = function () {
          pendingText = String(reader.result || '');
          pendingName = f.name;
          const box = document.getElementById('hmMaterialResult');
          const words = extractWordsFromText(pendingText);
          if (words.length === 0) {
            box.innerHTML = '<div style="font-size:13px;color:var(--text-secondary);">已读取「' + f.name + '」（' + pendingText.length + ' 字），未提炼到可取名汉字。</div>';
            return;
          }
          box.innerHTML = '<div style="font-size:13px;color:var(--text-secondary);">已读取「' + f.name + '」（' + pendingText.length + ' 字），提炼出 <b>' + words.length + '</b> 个可用字，点「用此文献取名」生成。</div>';
        };
        reader.readAsText(f, 'utf-8');
      });
    }
    if (genMatBtn) {
      genMatBtn.addEventListener('click', function () {
        if (!pendingText) {
          App.App.toast('请先选择 .txt 文件', 'error');
          return;
        }
        const surname = (sur2 ? sur2.value : '').trim();
        const words = extractWordsFromText(pendingText);
        if (words.length < 2) {
          App.App.toast('该文献可取名汉字太少', 'error');
          return;
        }
        const names = App.Engine.generator.generateFromMaterial({ surname: surname, words: words, count: 8 });
        const box = document.getElementById('hmMaterialResult');
        if (names.length === 0) {
          box.innerHTML = '<div class="empty-state">未能生成，请换一篇文献</div>';
          return;
        }
        // 保存文献
        const matId = App.uuid('mat');
        App.DB.add('materials', {
          id: matId, name: pendingName, text: pendingText, words: words.slice(0, 60),
          createdAt: App.now()
        }).catch(function () {});
        // 展示结果
        let h = '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">已保存文献「' + pendingName + '」，提炼 ' + words.length + ' 字</div>';
        h += '<div class="name-grid">';
        names.forEach(function (n) {
          h += '<div class="name-card"><div class="nm">' + n.fullName + '</div><div class="py">' + n.py + '</div><div class="mean">' + n.meaning + '</div></div>';
        });
        h += '</div>';
        box.innerHTML = h;
        renderMaterials(container);
        // 历史
        App.DB.add('records', {
          id: App.uuid('rec'), module: 'material',
          title: '文献取名 · ' + pendingName,
          input: { name: pendingName },
          result: { names: names.slice(0, 8).map(function (n) { return n.fullName; }) },
          createdAt: App.now()
        }).catch(function () {});
      });
    }

    // 模块卡片跳转
    container.querySelectorAll('.module-card').forEach(function (card) {
      card.addEventListener('click', function () {
        App.App.navigate(card.getAttribute('data-page'));
      });
    });

    renderMaterials(container);
  }

  // ---- 已保存文献列表 ----
  async function renderMaterials(container) {
    const box = document.getElementById('hmMaterials');
    if (!box) return;
    let mats = [];
    try { mats = await App.DB.getAll('materials'); } catch (e) { /* ignore */ }
    mats.sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    if (mats.length === 0) {
      box.innerHTML = '';
      return;
    }
    let h = '<div style="font-size:14px;font-weight:600;margin:4px 0 8px;">已保存的文献</div>';
    mats.slice(0, 5).forEach(function (m) {
      h += '<div class="material-row">';
      h += '<div style="flex:1;"><div>' + m.name + '</div><div style="font-size:12px;color:var(--text-secondary);">' + (m.words ? m.words.length : 0) + ' 个可用字 · ' + (m.createdAt || '') + '</div></div>';
      h += '<button class="btn btn-sm btn-danger" data-mat="' + m.id + '" type="button">删除</button>';
      h += '</div>';
    });
    box.innerHTML = h;
    box.querySelectorAll('[data-mat]').forEach(function (b) {
      b.addEventListener('click', async function () {
        const id = b.getAttribute('data-mat');
        await App.DB.delete('materials', id);
        renderMaterials(container);
        App.App.toast('已删除文献');
      });
    });
  }

  // ---- 最近记录 ----
  async function renderRecent(container) {
    const box = document.getElementById('hmRecent');
    if (!box) return;
    let recs = [];
    try { recs = await App.DB.getAll('records'); } catch (e) { /* ignore */ }
    recs.sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    if (recs.length === 0) {
      box.innerHTML = '<div class="card"><div class="card-title">🕘 最近记录</div><div class="empty-state">还没有生成记录，试试上面的快速取名</div></div>';
      return;
    }
    let h = '<div class="card"><div class="card-title">🕘 最近记录</div>';
    recs.slice(0, 5).forEach(function (r) {
      const names = (r.result && r.result.names) || [];
      const pageMap = { newborn: 'newborn', bazi: 'bazi', poetry: 'poetry', pet: 'pet', score: 'score' };
      const target = pageMap[r.module] || '';
      h += '<div class="recent-row" data-page="' + target + '" style="' + (target ? 'cursor:pointer;' : '') + '">';
      h += '<div style="flex:1;"><div style="font-weight:600;">' + (r.title || r.module) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);">' + names.slice(0, 6).join('、') + '</div></div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);">' + (r.createdAt || '') + '</div>';
      h += '</div>';
    });
    h += '</div>';
    box.innerHTML = h;
    box.querySelectorAll('.recent-row[data-page]').forEach(function (row) {
      const page = row.getAttribute('data-page');
      if (!page) return;
      row.addEventListener('click', function () {
        App.App.navigate(page);
      });
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
