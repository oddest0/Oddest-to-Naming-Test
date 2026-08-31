/**
 * pages/bazi.js —— 生辰八字取名
 * 三步向导：①出生信息 → ②排盘结果（四柱/五行/喜用）→ ③五行补益推荐
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  let step = 1;
  let baziResult = null;

  App.Pages.bazi = {
    title: '生辰八字取名',

    render: async function (container) {
      // 读取默认偏好
      let prefs = {};
      try {
        const k1 = await App.DB.get('settings', 'defaultSurname');
        const k2 = await App.DB.get('settings', 'defaultGender');
        if (k1) prefs.surname = k1.value;
        if (k2) prefs.gender = k2.value;
      } catch (e) { /* ignore */ }

      // 今天日期作为默认
      const today = new Date();
      const pad = (n) => (n < 10 ? '0' + n : '' + n);
      const todayStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());

      let html = '<div class="card">';
      html += '<div class="card-title">生辰八字取名</div>';
      html += '<div class="steps">';
      html += '<div class="step active" data-step="1">① 出生信息</div>';
      html += '<div class="step" data-step="2">② 排盘结果</div>';
      html += '<div class="step" data-step="3">③ 五行补益推荐</div>';
      html += '</div>';

      // Step 1 表单
      html += '<div id="bzStep1">';
      html += '<div class="form-grid">';
      html += '<div class="field"><label>姓氏</label><input id="bzSurname" type="text" value="' + (prefs.surname || '') + '" placeholder="如：李"></div>';
      html += '<div class="field"><label>性别</label><select id="bzGender">';
      ['', '男', '女'].forEach(function (g) {
        html += '<option value="' + g + '"' + (prefs.gender === g ? ' selected' : '') + '>' + (g || '不限制') + '</option>';
      });
      html += '</select></div>';
      html += '<div class="field"><label>公历出生日期</label><input id="bzDate" type="date" value="' + todayStr + '"></div>';
      html += '<div class="field"><label>出生时辰（可选）</label><input id="bzHour" type="time" value=""><div class="hint">不填则五行判断较粗略</div></div>';
      html += '</div>';
      html += '<div class="toolbar"><button id="bzCalc" class="btn btn-primary" type="button">开始排盘</button></div>';
      html += '</div>';

      // Step 2 排盘结果（初始隐藏）
      html += '<div id="bzStep2" style="display:none;"></div>';
      // Step 3 推荐（初始隐藏）
      html += '<div id="bzStep3" style="display:none;"></div>';

      container.innerHTML = html;

      function setStep(s) {
        step = s;
        container.querySelectorAll('.step').forEach(function (el) {
          const n = parseInt(el.getAttribute('data-step'), 10);
          el.className = 'step' + (n === s ? ' active' : (n < s ? ' done' : ''));
        });
        document.getElementById('bzStep1').style.display = s === 1 ? '' : 'none';
        document.getElementById('bzStep2').style.display = s === 2 ? '' : 'none';
        document.getElementById('bzStep3').style.display = s === 3 ? '' : 'none';
      }

      const calcBtn = document.getElementById('bzCalc');
      if (calcBtn) {
        calcBtn.addEventListener('click', function () {
          const surname = document.getElementById('bzSurname').value.trim();
          const dateStr = document.getElementById('bzDate').value;
          const hourStr = document.getElementById('bzHour').value;
          if (!surname) { App.App.toast('请填写姓氏', 'error'); return; }
          if (!dateStr) { App.App.toast('请选择出生日期', 'error'); return; }
          const parts = dateStr.split('-').map(Number);
          let hour = null;
          if (hourStr) {
            const h = parseInt(hourStr.split(':')[0], 10);
            hour = h;
          }
          try {
            baziResult = App.Engine.bazi.compute({
              solarYear: parts[0], solarMonth: parts[1], solarDay: parts[2], hour: hour,
              gender: document.getElementById('bzGender').value
            });
          } catch (e) {
            App.App.toast('排盘失败：' + e.message, 'error');
            return;
          }
          renderStep2();
          renderStep3();
          setStep(2);
        });
      }

      function renderStep2() {
        const box = document.getElementById('bzStep2');
        const bz = baziResult;
        const p = bz.pillars;
        const fmt = (pair) => pair ? pair.join('') : '——';
        let h = '<div class="card"><div class="card-title">排盘结果</div>';
        h += '<div class="form-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));margin-bottom:12px;">';
        h += '<div class="field"><label>年柱</label><div style="font-size:20px;font-weight:700;">' + fmt(p.year) + '</div></div>';
        h += '<div class="field"><label>月柱</label><div style="font-size:20px;font-weight:700;">' + fmt(p.month) + '</div></div>';
        h += '<div class="field"><label>日柱</label><div style="font-size:20px;font-weight:700;">' + fmt(p.day) + '</div></div>';
        h += '<div class="field"><label>时柱</label><div style="font-size:20px;font-weight:700;">' + fmt(p.hour) + '</div><div class="hint">' + (bz.hourKnown ? '已填时辰' : '未填时辰（粗略）') + '</div></div>';
        h += '</div>';

        // 五行统计可视化
        h += '<div style="font-size:14px;font-weight:600;margin:8px 0 6px;">五行分布</div>';
        const colors = { 金: '#E1B98F', 木: '#A2DDAA', 水: '#94D8C3', 火: '#EAA7B2', 土: '#E4D48F' };
        const max = Math.max(1, Math.max.apply(null, Object.values(bz.wuxingCount)));
        for (const k of ['金', '木', '水', '火', '土']) {
          const v = bz.wuxingCount[k] || 0;
          h += '<div class="wuxing-bar"><span class="label">' + k + '</span><div class="track"><div class="fill" style="width:' + Math.round(v / max * 100) + '%;background:' + (colors[k] || '#E1B98F') + ';"></div></div><span class="val">' + v + '</span></div>';
        }

        // 喜用提示
        h += '<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:var(--accent-soft);font-size:13px;">';
        if (bz.missing.length > 0) {
          h += '八字缺 <b>' + bz.missing.join('、') + '</b>，建议以补益「' + bz.favor.join('、') + '」五行为主。';
        } else {
          h += '八字五行俱全，偏弱为「' + bz.weakest.join('、') + '」，建议适当补益。';
        }
        if (!bz.hourKnown) h += '<br><span style="color:var(--text-secondary);font-size:12px;">未填时辰，时柱与五行判断较粗略。</span>';
        h += '</div>';
        h += '<div class="toolbar"><button id="bzNext3" class="btn btn-primary" type="button">下一步：查看五行补益推荐</button></div>';
        h += '</div>';
        box.innerHTML = h;
        const nextBtn = box.querySelector('#bzNext3');
        if (nextBtn) {
          nextBtn.addEventListener('click', function () { setStep(3); });
        }
      }

      function buildRecommendList() {
        const surname = document.getElementById('bzSurname').value.trim();
        const gender = document.getElementById('bzGender').value;
        return App.Engine.bazi.recommend({ surname: surname, baziResult: baziResult, gender: gender, count: 10 });
      }

      function renderStep3(saveHistory) {
        const box = document.getElementById('bzStep3');
        const surname = document.getElementById('bzSurname').value.trim();
        const list = buildRecommendList();
        if (list.length === 0) {
          box.innerHTML = '<div class="empty-state">暂无可推荐的名字</div>';
          return;
        }
        // 保存历史（换一批不重复写历史，saveHistory === false 时跳过）
        if (saveHistory !== false) {
          App.DB.add('records', {
            id: App.uuid('rec'), module: 'bazi',
            title: (surname || '?') + '宝宝 · 八字取名',
            input: { baziResult: baziResult },
            result: { names: list.slice(0, 10).map(function (n) { return n.fullName; }) },
            createdAt: App.now()
          }).catch(function () {});
        }
        let h = '<div class="card"><div class="card-title">五行补益推荐（补益：' + baziResult.favor.join('、') + '）</div>';
        h += '<div class="toolbar" style="margin-top:0;margin-bottom:12px;">';
        h += '<button id="bzReshuffle" class="btn" type="button">换一批</button>';
        h += '<span style="font-size:12px;color:var(--text-secondary);">基于同一八字重新组合补益五行的名字</span>';
        h += '</div>';
        h += '<div class="name-grid">';
        list.forEach(function (n) {
          h += '<div class="name-card">';
          h += '<button class="fav-btn" data-name="' + n.fullName + '" title="收藏">☆</button>';
          h += '<div class="nm">' + n.fullName + '</div>';
          h += '<div class="py">' + n.py + '</div>';
          h += '<div class="meta">五行 ' + n.wuxing + ' · ' + n.matchNote + '</div>';
          h += '<div class="mean">' + n.meaning + '</div>';
          h += '</div>';
        });
        h += '</div></div>';
        box.innerHTML = h;

        // 换一批：重新生成并展示，不重复写历史
        const reshuffleBtn = box.querySelector('#bzReshuffle');
        if (reshuffleBtn) {
          reshuffleBtn.addEventListener('click', function () {
            renderStep3(false);
            App.App.toast('已换一批');
          });
        }

        // 收藏
        box.querySelectorAll('.fav-btn').forEach(function (btn) {
          const name = btn.getAttribute('data-name');
          btn.addEventListener('click', async function () {
            const n = list.find(function (x) { return x.fullName === name; });
            if (!n) return;
            if (btn.textContent === '★') {
              const favs = await App.DB.getAll('favorites');
              const t = favs.find(function (f) { return f.name === name && f.module === 'bazi'; });
              if (t) await App.DB.delete('favorites', t.id);
              btn.textContent = '☆';
              App.App.toast('已取消收藏');
            } else {
              await App.DB.add('favorites', {
                id: App.uuid('fav'), module: 'bazi', name: name,
                meta: { py: n.py, wuxing: n.wuxing, meaning: n.meaning, moduleLabel: '生辰八字取名' },
                createdAt: App.now()
              });
              btn.textContent = '★';
              App.App.toast('已收藏');
            }
            App.App.refreshSidebarCounts();
          });
        });
      }

      setStep(1);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
