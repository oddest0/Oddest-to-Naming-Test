/**
 * pages/newborn.js —— 新生儿取名
 * 条件面板（姓氏/性别/风格/避讳字/字辈）→ 生成 → 名字卡片 → 收藏/换一批/筛选 → 历史
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  const STYLES = ['文雅', '大气', '可爱', '现代'];
  let lastInput = null;   // 最近一次生成条件
  let lastResults = [];   // 最近一次结果
  let onlyFav = false;    // 只看收藏过滤

  App.Pages.newborn = {
    title: '新生儿取名',

    render: async function (container, params) {
      // 读取默认偏好
      let prefs = {};
      try {
        const k1 = await App.DB.get('settings', 'defaultSurname');
        const k2 = await App.DB.get('settings', 'defaultGender');
        const k3 = await App.DB.get('settings', 'defaultStyle');
        if (k1) prefs.surname = k1.value;
        if (k2) prefs.gender = k2.value;
        if (k3) prefs.style = k3.value;
      } catch (e) { /* ignore */ }

      // 从参数恢复（首页快速取名跳转过来）
      const prefill = params.prefill || {};

      let html = '<div class="card">';
      html += '<div class="card-title">新生儿取名</div>';
      html += '<div class="form-grid">';
      html += '<div class="field"><label>姓氏</label><input id="nbSurname" type="text" value="' + (prefill.surname || prefs.surname || '') + '" placeholder="如：李"></div>';
      html += '<div class="field"><label>性别</label><select id="nbGender">';
      ['', '男', '女', '中性'].forEach(function (g) {
        const cur = prefill.gender || prefs.gender || '';
        html += '<option value="' + g + '"' + (cur === g ? ' selected' : '') + '>' + (g || '不限制') + '</option>';
      });
      html += '</select></div>';
      html += '<div class="field"><label>字辈字（可选）</label><input id="nbGeneration" type="text" value="" maxlength="1" placeholder="如：永"></div>';
      html += '<div class="field"><label>避讳字（多个用空格隔开）</label><input id="nbTaboo" type="text" value="" placeholder="如：祖 父 名"></div>';
      html += '</div>';
      html += '<div class="field" style="margin-top:14px;"><label>期望风格</label><div id="nbStyles" class="toolbar">';
      STYLES.forEach(function (st) {
        const active = (prefs.style && prefs.style[0] === st) || (prefill.style && prefill.style[0] === st);
        html += '<button type="button" class="btn btn-sm style-btn' + (active ? ' btn-primary' : '') + '" data-style="' + st + '">' + st + '</button>';
      });
      html += '</div></div>';
      html += '<div class="toolbar">';
      html += '<button id="nbGenerate" class="btn btn-primary" type="button">生成名字</button>';
      html += '<button id="nbReshuffle" class="btn" type="button">换一批</button>';
      html += '</div>';
      html += '</div>';

      html += '<div id="nbResult"></div>';
      html += '<div id="nbCurated" class="card" style="margin-top:16px;"></div>';
      container.innerHTML = html;

      // 精选名字参考（内置精选名字库，随性别/风格联动）
      function renderCurated() {
        const box = document.getElementById('nbCurated');
        if (!box) return;
        const gender = document.getElementById('nbGender').value;
        const styles = [];
        container.querySelectorAll('.style-btn.btn-primary').forEach(function (b) {
          styles.push(b.getAttribute('data-style'));
        });
        let list = App.Data.names.filter(function (n) {
          if (gender && gender !== '中性' && n.gender !== gender && n.gender !== '中性') return false;
          if (gender === '中性') return true;
          if (styles.length > 0) return n.tags.some(function (t) { return styles.includes(t); });
          return true;
        });
        // 洗牌取 6 个
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
        }
        list = list.slice(0, 6);
        if (list.length === 0) { box.innerHTML = ''; return; }
        let h = '<div class="card-title">✨ 精选名字参考</div>';
        h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">来自内置精选名字库，可作灵感参考</div>';
        h += '<div class="name-grid">';
        list.forEach(function (n) {
          h += '<div class="name-card">';
          h += '<div class="nm">' + n.name + '</div>';
          h += '<div class="py">' + n.py + '</div>';
          h += '<div class="meta">五行 ' + (n.wuxing || '—') + ' · ' + (n.source || '精选') + '</div>';
          h += '<div class="mean">' + n.meaning + '</div>';
          h += '</div>';
        });
        h += '</div>';
        box.innerHTML = h;
      }

      // 风格选择交互
      container.querySelectorAll('.style-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.classList.toggle('btn-primary');
          renderCurated();
        });
      });
      const genderSel = document.getElementById('nbGender');
      if (genderSel) genderSel.addEventListener('change', renderCurated);

      function collectInput() {
        const styles = [];
        container.querySelectorAll('.style-btn.btn-primary').forEach(function (b) {
          styles.push(b.getAttribute('data-style'));
        });
        return {
          surname: document.getElementById('nbSurname').value.trim(),
          gender: document.getElementById('nbGender').value,
          styles: styles,
          tabooChars: document.getElementById('nbTaboo').value,
          generation: document.getElementById('nbGeneration').value.trim()
        };
      }

      async function renderResults() {
        const box = document.getElementById('nbResult');
        if (!box) return;
        if (lastResults.length === 0) {
          box.innerHTML = '<div class="empty-state"><div class="big">👶</div><div>设置条件后点击「生成名字」</div></div>';
          return;
        }
        // 查询本模块已收藏的名字集合
        let favSet = new Set();
        try {
          const favs = await App.DB.getAll('favorites');
          favs.forEach(function (f) { if (f.module === 'newborn') favSet.add(f.name); });
        } catch (e) { /* ignore */ }
        let list = lastResults;
        if (onlyFav) list = list.filter(function (n) { return favSet.has(n.fullName); });
        let html = '<div class="toolbar">';
        html += '<span style="font-size:13px;color:var(--text-secondary);">共 ' + (onlyFav ? list.length : lastResults.length) + ' 个候选</span>';
        html += '<button id="nbOnlyFav" class="btn btn-sm' + (onlyFav ? ' btn-primary' : '') + '" type="button">' + (onlyFav ? '★ 只看收藏（已开）' : '☆ 只看收藏') + '</button>';
        html += '</div>';
        if (list.length === 0) {
          html += '<div class="empty-state">当前结果还没有收藏，点卡片上的 ★ 收藏后再来看</div>';
          box.innerHTML = html;
          const onlyBtn = box.querySelector('#nbOnlyFav');
          if (onlyBtn) onlyBtn.addEventListener('click', function () { onlyFav = !onlyFav; renderResults(); });
          return;
        }
        html += '<div class="name-grid">';
        list.forEach(function (n) {
          const isFav = favSet.has(n.fullName);
          html += '<div class="name-card">';
          html += '<button class="fav-btn' + (isFav ? ' faved' : '') + '" data-name="' + n.fullName + '" title="收藏">' + (isFav ? '★' : '☆') + '</button>';
          html += '<div class="nm">' + n.fullName + '</div>';
          html += '<div class="py">' + n.py + '</div>';
          html += '<div class="meta">笔画 ' + n.strokes + ' · 五行 ' + (n.wuxing || '—') + ' · 评分 ' + n.score + '</div>';
          html += '<div class="mean">' + n.meaning + '</div>';
          html += '</div>';
        });
        html += '</div>';
        box.innerHTML = html;

        // 只看收藏切换
        const onlyBtn = box.querySelector('#nbOnlyFav');
        if (onlyBtn) onlyBtn.addEventListener('click', function () { onlyFav = !onlyFav; renderResults(); });

        // 收藏按钮
        box.querySelectorAll('.fav-btn').forEach(function (btn) {
          const name = btn.getAttribute('data-name');
          btn.addEventListener('click', async function () {
            const n = lastResults.find(function (x) { return x.fullName === name; });
            if (!n) return;
            const isFav = btn.textContent === '★';
            if (isFav) {
              // 取消收藏
              const favs = await App.DB.getAll('favorites');
              const target = favs.find(function (f) { return f.name === name && f.module === 'newborn'; });
              if (target) await App.DB.delete('favorites', target.id);
              btn.textContent = '☆';
              btn.classList.remove('faved');
              App.App.toast('已取消收藏');
            } else {
              await App.DB.add('favorites', {
                id: App.uuid('fav'),
                module: 'newborn',
                name: name,
                meta: { py: n.py, wuxing: n.wuxing, meaning: n.meaning, moduleLabel: '新生儿取名' },
                createdAt: App.now()
              });
              btn.textContent = '★';
              btn.classList.add('faved');
              App.App.toast('已收藏');
            }
            App.App.refreshSidebarCounts();
            // 只看收藏状态下收藏状态变化后刷新展示
            if (onlyFav) renderResults();
          });
        });
      }

      // 保存历史
      async function saveHistory(input, results) {
        try {
          await App.DB.add('records', {
            id: App.uuid('rec'),
            module: 'newborn',
            title: (input.surname || '?') + '宝宝 · 新生儿取名',
            input: input,
            result: { names: results.slice(0, 10).map(function (n) { return n.fullName; }) },
            createdAt: App.now()
          });
        } catch (e) { console.error(e); }
      }

      async function doGenerate() {
        const input = collectInput();
        if (!input.surname) {
          App.App.toast('请填写姓氏', 'error');
          return;
        }
        const results = App.Engine.generator.generateNewborn({
          surname: input.surname,
          gender: input.gender,
          styles: input.styles,
          tabooChars: input.tabooChars,
          generation: input.generation,
          count: 12
        });
        if (results.length === 0) {
          App.App.toast('没有找到合适的名字，请调整条件', 'error');
          return;
        }
        lastInput = input;
        lastResults = results;
        renderResults();
        await saveHistory(input, results);
      }

      const btnGenerate = document.getElementById('nbGenerate');
      const btnReshuffle = document.getElementById('nbReshuffle');
      if (btnGenerate) btnGenerate.addEventListener('click', doGenerate);
      if (btnReshuffle) {
        btnReshuffle.addEventListener('click', function () {
          if (!lastInput) { App.App.toast('请先生成一次', 'error'); return; }
          const results = App.Engine.generator.generateNewborn({
            surname: lastInput.surname,
            gender: lastInput.gender,
            styles: lastInput.styles,
            tabooChars: lastInput.tabooChars,
            generation: lastInput.generation,
            count: 12
          });
          lastResults = results;
          renderResults();
          App.App.toast('已换一批');
        });
      }

      renderResults();
      renderCurated();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
