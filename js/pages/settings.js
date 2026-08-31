/**
 * pages/settings.js —— 设置
 * 默认偏好（姓氏/性别/风格/宠物类型）+ 数据导出/导入入口说明。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Pages = App.Pages || {};

  App.Pages.settings = {
    title: '设置',

    render: async function (container) {
      container.innerHTML = '';

      // 读取当前偏好
      let prefs = {};
      try {
        const keys = ['defaultSurname', 'defaultGender', 'defaultStyle', 'defaultPetType'];
        for (const k of keys) {
          const s = await App.DB.get('settings', k);
          if (s) prefs[k] = s.value;
        }
      } catch (e) { /* ignore */ }

      const styles = ['文雅', '大气', '可爱', '现代'];

      let html = '<div class="card" style="max-width:640px;">';
      html += '<div class="card-title">默认偏好</div>';
      html += '<div class="form-grid">';

      html += '<div class="field"><label>默认姓氏</label><input id="setSurname" type="text" value="' + (prefs.defaultSurname || '') + '" placeholder="如：李"></div>';

      html += '<div class="field"><label>默认性别</label><select id="setGender">';
      ['', '男', '女', '中性'].forEach(function (g) {
        html += '<option value="' + g + '"' + (prefs.defaultGender === g ? ' selected' : '') + '>' + (g || '不设置') + '</option>';
      });
      html += '</select></div>';

      html += '<div class="field"><label>默认风格</label><select id="setStyle">';
      html += '<option value="">不设置</option>';
      styles.forEach(function (st) {
        const cur = Array.isArray(prefs.defaultStyle) ? prefs.defaultStyle[0] : (prefs.defaultStyle || '');
        html += '<option value="' + st + '"' + (cur === st ? ' selected' : '') + '>' + st + '</option>';
      });
      html += '</select></div>';

      html += '<div class="field"><label>默认宠物类型</label><select id="setPetType">';
      ['', '猫', '狗', '鸟', '其他'].forEach(function (t) {
        html += '<option value="' + t + '"' + (prefs.defaultPetType === t ? ' selected' : '') + '>' + (t || '不设置') + '</option>';
      });
      html += '</select></div>';

      html += '</div>';
      html += '<div class="toolbar"><button id="btnSavePrefs" class="btn btn-primary" type="button">保存偏好</button></div>';
      html += '</div>';

      html += '<div class="card" style="max-width:640px;margin-top:16px;">';
      html += '<div class="card-title">数据备份与恢复</div>';
      html += '<div style="font-size:13px;color:var(--text-secondary);line-height:1.8;">';
      html += '· 所有记录、收藏、素材、偏好都保存在本机浏览器中，刷新/关闭/重启不会丢失。<br>';
      html += '· 点击顶栏「导出备份」下载 JSON 文件；点击「导入恢复」选择备份文件即可还原。<br>';
      html += '· 建议定期导出备份，以防清理浏览器数据时误删。';
      html += '</div></div>';

      container.innerHTML = html;

      const saveBtn = document.getElementById('btnSavePrefs');
      if (saveBtn) {
        saveBtn.addEventListener('click', async function () {
          const vals = {
            defaultSurname: document.getElementById('setSurname').value.trim(),
            defaultGender: document.getElementById('setGender').value,
            defaultStyle: document.getElementById('setStyle').value ? [document.getElementById('setStyle').value] : [],
            defaultPetType: document.getElementById('setPetType').value
          };
          for (const k of Object.keys(vals)) {
            if (vals[k] === '' || (Array.isArray(vals[k]) && vals[k].length === 0)) {
              await App.DB.delete('settings', k);
            } else {
              await App.DB.put('settings', { key: k, value: vals[k] });
            }
          }
          App.App.toast('偏好已保存');
        });
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
