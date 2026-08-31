/**
 * pages/pet.js —— 宠物取名
 * 宠物信息（类型/性别/毛色/性格/风格）→ 风格词库 → 名字卡片 → 中英文切换 → 收藏/存档
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  const PET_TYPES = ['猫', '狗', '鸟', '其他'];
  let lastResults = [];

  App.Pages.pet = {
    title: '宠物取名',

    render: async function (container) {
      // 读取默认宠物类型
      let prefs = {};
      try {
        const k = await App.DB.get('settings', 'defaultPetType');
        if (k) prefs.petType = k.value;
      } catch (e) { /* ignore */ }

      let html = '<div class="card">';
      html += '<div class="card-title">宠物取名</div>';
      html += '<div class="form-grid">';
      html += '<div class="field"><label>宠物类型</label><select id="petType">';
      PET_TYPES.forEach(function (t) {
        html += '<option value="' + t + '"' + (prefs.petType === t ? ' selected' : '') + '>' + t + '</option>';
      });
      html += '</select></div>';
      html += '<div class="field"><label>性别</label><select id="petGender"><option value="">不限制</option><option value="公">公</option><option value="母">母</option></select></div>';
      html += '<div class="field"><label>毛色</label><input id="petColor" type="text" placeholder="如：橘色、白色、黑白"></div>';
      html += '<div class="field"><label>性格</label><input id="petCharacter" type="text" placeholder="如：粘人、高冷、活泼"></div>';
      html += '</div>';
      html += '<div class="field" style="margin-top:14px;"><label>想要的风格</label><div id="petStyles" class="toolbar">';
      App.Data.petStyles.forEach(function (st) {
        html += '<button type="button" class="btn btn-sm style-btn' + (st === '萌系' ? ' btn-primary' : '') + '" data-style="' + st + '">' + st + '</button>';
      });
      html += '</div></div>';
      html += '<div class="toolbar">';
      html += '<button id="petGenerate" class="btn btn-primary" type="button">生成宠物名</button>';
      html += '<button id="petReshuffle" class="btn" type="button">换一批</button>';
      html += '<button id="petToggleLang" class="btn" type="button">中文名 / 英文名</button>';
      html += '</div>';
      html += '</div>';

      html += '<div id="petResult"></div>';
      container.innerHTML = html;

      container.querySelectorAll('.style-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.classList.toggle('btn-primary');
        });
      });

      let showEn = false;

      function collectStyles() {
        const styles = [];
        container.querySelectorAll('.style-btn.btn-primary').forEach(function (b) {
          styles.push(b.getAttribute('data-style'));
        });
        return styles.length > 0 ? styles : ['萌系'];
      }

      function collectInput() {
        return {
          type: document.getElementById('petType').value,
          gender: document.getElementById('petGender').value,
          color: document.getElementById('petColor').value.trim(),
          character: document.getElementById('petCharacter').value.trim(),
          styles: collectStyles()
        };
      }

      function renderResults() {
        const box = document.getElementById('petResult');
        if (lastResults.length === 0) {
          box.innerHTML = '<div class="empty-state"><div class="big">🐾</div><div>设置宠物信息后点击「生成宠物名」</div></div>';
          return;
        }
        let h = '<div class="toolbar"><span style="font-size:13px;color:var(--text-secondary);">共 ' + lastResults.length + ' 个候选</span></div>';
        h += '<div class="name-grid">';
        lastResults.forEach(function (p) {
          const display = showEn && p.en ? p.en : p.name;
          const sub = showEn && p.en ? p.name : p.en;
          h += '<div class="name-card">';
          h += '<button class="fav-btn" data-name="' + p.name + '" title="收藏">☆</button>';
          h += '<div class="nm">' + display + '</div>';
          if (sub) h += '<div class="py">' + sub + '</div>';
          h += '<div class="meta"><span class="badge">' + p.style + '</span></div>';
          h += '<div class="mean">' + p.meaning + '</div>';
          if (p.fit) h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">适合：' + p.fit + '</div>';
          h += '</div>';
        });
        h += '</div>';
        box.innerHTML = h;

        box.querySelectorAll('.fav-btn').forEach(function (btn) {
          const name = btn.getAttribute('data-name');
          btn.addEventListener('click', async function () {
            const p = lastResults.find(function (x) { return x.name === name; });
            if (!p) return;
            if (btn.textContent === '★') {
              const favs = await App.DB.getAll('favorites');
              const t = favs.find(function (f) { return f.name === name && f.module === 'pet'; });
              if (t) await App.DB.delete('favorites', t.id);
              btn.textContent = '☆';
              App.App.toast('已取消收藏');
            } else {
              await App.DB.add('favorites', {
                id: App.uuid('fav'), module: 'pet', name: name,
                meta: { en: p.en, meaning: p.meaning, fit: p.fit, style: p.style, moduleLabel: '宠物取名' },
                createdAt: App.now()
              });
              btn.textContent = '★';
              App.App.toast('已收藏');
            }
            App.App.refreshSidebarCounts();
          });
        });
      }

      function doGenerate() {
        const input = collectInput();
        lastResults = App.Engine.generator.generatePet({ styles: input.styles, count: 12 });
        renderResults();
        // 保存历史（含宠物信息）
        App.DB.add('records', {
          id: App.uuid('rec'), module: 'pet',
          title: (input.type || '宠物') + ' · 宠物取名',
          input: input,
          result: { names: lastResults.slice(0, 12).map(function (n) { return n.name; }) },
          createdAt: App.now()
        }).catch(function () {});
      }

      const genBtn = document.getElementById('petGenerate');
      const reshuffleBtn = document.getElementById('petReshuffle');
      const langBtn = document.getElementById('petToggleLang');
      if (genBtn) genBtn.addEventListener('click', doGenerate);
      if (reshuffleBtn) {
        reshuffleBtn.addEventListener('click', function () {
          const input = collectInput();
          lastResults = App.Engine.generator.generatePet({ styles: input.styles, count: 12 });
          renderResults();
          App.App.toast('已换一批');
        });
      }
      if (langBtn) {
        langBtn.addEventListener('click', function () {
          showEn = !showEn;
          langBtn.textContent = showEn ? '中文名 / 英文名' : '英文名 / 中文名';
          renderResults();
        });
      }

      renderResults();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
