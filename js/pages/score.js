/**
 * pages/score.js —— 名字解析及评分
 * 输入名字 → 逐字解析（拼音/笔画/五行/寓意）→ 多维评分（字形/音律/寓意/谐音/五行/性别契合）
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  App.Pages.score = {
    title: '名字解析及评分',

    render: async function (container) {
      let html = '<div class="card">';
      html += '<div class="card-title">名字解析及评分</div>';
      html += '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;">输入完整名字，逐字解析拼音、笔画、五行与寓意，并给出多维评分。</div>';
      html += '<div class="toolbar">';
      html += '<input id="scName" type="text" placeholder="输入名字，如：李承宇" style="flex:1;min-width:180px;padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-sm);">';
      html += '<button id="scRate" class="btn btn-primary" type="button">解析评分</button>';
      html += '</div>';
      html += '</div>';
      html += '<div id="scResult"></div>';
      container.innerHTML = html;

      const btn = document.getElementById('scRate');
      const input = document.getElementById('scName');
      if (btn) {
        btn.addEventListener('click', function () {
          const name = input.value.trim();
          if (!name) { App.App.toast('请输入名字', 'error'); return; }
          const a = App.Engine.score.analyze(name);
          if (!a) { App.App.toast('请输入有效名字', 'error'); return; }
          renderScore(a);
          // 保存历史
          App.DB.add('records', {
            id: App.uuid('rec'), module: 'score',
            title: '解析评分 · ' + a.full,
            input: { name: a.full },
            result: { name: a.full, total: App.Engine.score.rate(a).total },
            createdAt: App.now()
          }).catch(function () {});
        });
      }
      if (input) {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') btn.click();
        });
      }

      function renderScore(a) {
        const box = document.getElementById('scResult');
        const r = App.Engine.score.rate(a);
        if (!r) { box.innerHTML = '<div class="empty-state">无法解析</div>'; return; }

        let h = '<div class="card" style="margin-top:16px;">';
        h += '<div class="card-title">' + a.full + ' 的解析</div>';

        // 总分环
        h += '<div class="score-head">';
        h += '<div class="score-total" style="--pct:' + r.total + '">';
        h += '<div class="score-num">' + r.total + '</div><div class="score-label">综合评分</div>';
        h += '</div>';
        h += '<div class="score-verdict">' + (r.total >= 85 ? '非常不错' : r.total >= 75 ? '挺好的' : r.total >= 65 ? '中规中矩' : '建议再斟酌') + '</div>';
        h += '</div>';

        // 逐字解析表
        h += '<table class="detail-table"><thead><tr><th>字</th><th>拼音</th><th>声调</th><th>笔画</th><th>五行</th><th>寓意</th></tr></thead><tbody>';
        a.chars.forEach(function (c) {
          const toneNames = ['', '一声', '二声', '三声', '四声', '轻声'];
          h += '<tr><td class="cell-char">' + c.char + '</td><td>' + (c.py || '—') + '</td><td>' + (c.tone ? (toneNames[c.tone] || '') : '—') + '</td><td>' + (c.strokes || '—') + '</td><td>' + (c.wuxing || '—') + '</td><td>' + (c.meaning || '库中未收录') + '</td></tr>';
        });
        h += '</tbody></table>';

        // 各维度评分
        h += '<div style="font-size:14px;font-weight:600;margin:14px 0 8px;">各维度评分</div>';
        const dims = [
          ['字形结构', r.scores.shape],
          ['音律声调', r.scores.tone],
          ['字义寓意', r.scores.meaning],
          ['谐音联想', r.scores.harmony],
          ['五行搭配', r.scores.wuxing],
          ['性别契合', r.scores.gender]
        ];
        dims.forEach(function (d) {
          h += '<div class="wuxing-bar"><span class="label" style="width:64px;">' + d[0] + '</span><div class="track"><div class="fill" style="width:' + d[1] + '%;background:var(--accent);"></div></div><span class="val">' + d[1] + '</span></div>';
        });

        // 备注
        h += '<div style="font-size:14px;font-weight:600;margin:14px 0 8px;">点评</div>';
        h += '<ul class="note-list">';
        r.notes.forEach(function (n) { h += '<li>' + n + '</li>'; });
        h += '</ul>';
        h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:10px;">评分基于内置汉字库的简化规则，仅供参考，不构成专业命理建议。</div>';
        h += '</div>';
        box.innerHTML = h;
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
