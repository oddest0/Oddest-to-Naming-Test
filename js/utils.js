/**
 * utils.js —— 通用工具
 * 全局命名空间 App；日期、农历换算、五行映射、拼音/声调、笔画、谐音词库等。
 * 兼容浏览器(全局 App)与 Node(module.exports)。
 */
(function (global) {
  'use strict';

  const App = global.App = global.App || {};

  // ============ 命名空间工具 ============
  App.ns = function (name) {
    const parts = name.split('.');
    let cur = App;
    for (let i = 0; i < parts.length; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    return cur;
  };

  // ============ 五行映射 ============
  // 天干五行
  App.GAN_WUXING = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  // 地支五行（简化按本气）
  App.ZHI_WUXING = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  // 汉字五行（内置库为主，这里放常用兜底映射）
  App.HANZI_WUXING = {
    安: '土', 澜: '水', 宇: '土', 轩: '土', 晨: '金', 曦: '火', 梓: '木', 萱: '木',
    浩: '水', 然: '金', 沐: '水', 阳: '火', 思: '金', 远: '土', 清: '水', 雅: '木',
    文: '水', 嘉: '木', 煜: '火', 泽: '水', 宁: '火', 瑶: '火', 玥: '土', 宸: '金',
    子: '水', 涵: '水', 俊: '火', 杰: '木', 伟: '土', 芳: '木', 静: '金', 丽: '火',
    明: '火', 亮: '火', 欣: '木', 悦: '金', 琪: '木', 琳: '木', 华: '水', 春: '木',
    秋: '金', 冬: '水', 夏: '火', 天: '火', 地: '土', 山: '土', 川: '金', 云: '水',
    风: '水', 雷: '木', 林: '木', 森: '木', 竹: '木', 松: '木', 梅: '木', 兰: '木',
    菊: '木', 荷: '木', 竹: '木', 石: '金', 玉: '木', 金: '金', 银: '金', 星: '金',
    月: '木', 日: '火', 光: '火', 德: '火', 仁: '金', 义: '木', 礼: '火', 智: '火',
    信: '金', 忠: '火', 孝: '水', 谦: '木', 和: '水', 平: '水', 正: '金', 中: '火',
    国: '木', 家: '木', 民: '水', 凤: '水', 龙: '火', 虎: '水', 麟: '火', 瑞: '金',
    祥: '金', 福: '水', 禄: '火', 寿: '金', 喜: '水', 乐: '火', 康: '木', 健: '木',
    泰: '火', 安: '土', 全: '火', 生: '金', 志: '火', 向: '水', 望: '水', 新: '金',
    灵: '火', 慧: '水', 敏: '水', 聪: '金', 睿: '金', 捷: '金', 若: '木', 兮: '金',
    雪: '水', 霜: '水', 露: '水', 雨: '水', 虹: '水', 霞: '水', 云: '水', 岚: '土',
    峰: '水', 岳: '木', 峻: '金', 巍: '土', 恒: '水', 毅: '木', 勇: '土', 强: '木',
    刚: '金', 锋: '金', 剑: '金', 儒: '金', 雅: '木', 婉: '土', 娴: '土', 淑: '水',
    慧: '水', 妍: '水', 娇: '木', 媚: '水', 红: '水', 艳: '土', 丹: '火', 青: '木',
    蓝: '木', 紫: '金', 白: '水', 黄: '土', 赤: '火', 黑: '水', 绿: '木', 翠: '金',
    莹: '木', 晶: '金', 洁: '水', 净: '金', 纯: '金', 素: '金', 朴: '木', 拙: '火',
    初: '金', 元: '木', 亨: '水', 贞: '火', 乾: '木', 坤: '土', 震: '木', 巽: '木',
    离: '火', 坎: '水', 艮: '土', 兑: '金', 玄: '水', 黄: '土', 宇: '土', 宙: '金',
    洪: '水', 荒: '木', 日: '火', 盈: '水', 昃: '火', 辰: '土', 宿: '金', 列: '金',
    张: '火', 寒: '水', 暑: '火', 往: '水', 秋: '金', 收: '金', 冬: '水', 藏: '金'
  };

  // ============ 天干地支 ============
  App.GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  App.ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  // 地支对应时辰（23-1 子时 ... 21-23 亥时）
  App.SHI_CHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  /**
   * 计算某公历年柱干支。返回 [天干, 地支]
   */
  App.yearGanzhi = function (year) {
    const g = App.GAN[((year - 4) % 10 + 10) % 10];
    const z = App.ZHI[((year - 4) % 12 + 12) % 12];
    return [g, z];
  };

  /**
   * 由小时(0-23)得到地支序号(0-11)
   */
  App.hourZhiIndex = function (hour) {
    return Math.floor(((hour + 1) % 24) / 2);
  };

  /**
   * 简化五行统计：输入干支数组（如 ['甲','子']），返回五行计数对象
   */
  App.countWuxing = function (ganzhiPairs) {
    const count = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
    (ganzhiPairs || []).forEach(function (pair) {
      if (!pair) return;
      const g = App.GAN_WUXING[pair[0]];
      const z = App.ZHI_WUXING[pair[1]];
      if (g) count[g]++;
      if (z) count[z]++;
    });
    return count;
  };

  /**
   * 找出缺失五行；若无缺失返回最弱（计数最小）的五行数组
   */
  App.missingWuxing = function (count) {
    const missing = [];
    for (const k of Object.keys(count)) {
      if (count[k] === 0) missing.push(k);
    }
    return missing;
  };

  App.weakestWuxing = function (count) {
    let min = Infinity;
    let list = [];
    for (const k of Object.keys(count)) {
      if (count[k] < min) { min = count[k]; list = [k]; }
      else if (count[k] === min) { list.push(k); }
    }
    return list;
  };

  // ============ 公历 → 农历（简化查表法，支持 1900-2100） ============
  // 农历数据表：每项为当年农历年数据（用于转换的基础数据，来源于公开农历算法）
  const LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ];
  // 简化：使用查表法仅转换"年份、闰月、大小月"；精确到日的农历转换较复杂，
  // V1 采用"通过基准日 1900-01-31 = 农历1900年正月初一"逐日推算。
  // 这里提供 convertSolarToLunar 的基础实现，后续在 bazi 引擎使用。

  App.LUNAR_INFO = LUNAR_INFO;

  /**
   * 公历转农历（支持 1900-2100）
   * @param {number} y 公历年
   * @param {number} m 公历月
   * @param {number} d 公历日
   * @returns {{lunarYear, lunarMonth, lunarDay, isLeap, ganzhiYear:[string,string]}|null}
   */
  App.solarToLunar = function (y, m, d) {
    if (y < 1900 || y > 2100) return null;
    const lunarInfo = App.LUNAR_INFO;
    let offset = Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31); // 天数差
    offset = Math.floor(offset / 86400000);
    if (offset < 0) return null;

    let year = 1900;
    let yearDays = 0;
    // 逐年的天数
    function lunarYearDays(yy) {
      let sum = 348;
      for (let i = 0x8000; i > 0x8; i >>= 1) {
        sum += (lunarInfo[yy - 1900] & i) ? 1 : 0;
      }
      return sum + App.leapDays(yy);
    }
    for (; year < 2101 && offset >= 0; year++) {
      yearDays = lunarYearDays(year);
      if (offset < yearDays) break;
      offset -= yearDays;
    }
    // 求闰月
    let leapMonth = App.leapMonth(year);
    let isLeap = false;
    let month = 1;
    let monthDays;
    while (month <= 12) {
      monthDays = (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
      if (leapMonth > 0 && month === leapMonth + 1 && !isLeap) {
        // 先处理闰月
        if (offset < App.leapDays(year)) { isLeap = true; break; }
        offset -= App.leapDays(year);
        isLeap = true;
        continue;
      }
      if (offset < monthDays) break;
      offset -= monthDays;
      month++;
      isLeap = false;
    }
    const lunarDay = offset + 1;
    const ganzhiYear = App.yearGanzhi(year);
    return {
      lunarYear: year,
      lunarMonth: month,
      lunarDay: lunarDay,
      isLeap: isLeap,
      ganzhiYear: ganzhiYear
    };
  };

  App.leapMonth = function (yy) {
    return App.LUNAR_INFO[yy - 1900] & 0xf;
  };
  App.leapDays = function (yy) {
    if (App.leapMonth(yy) === 0) return 0;
    return (App.LUNAR_INFO[yy - 1900] & 0x10000) ? 30 : 29;
  };

  // ============ 拼音 / 声调 / 笔画 ============
  /**
   * 简化拼音：从内置汉字库查找（由 hanzi.js 填充），查不到返回 '?'
   */
  App.pyOf = function (ch) {
    const lib = (App.Data && App.Data.hanziMap) || {};
    return lib[ch] ? lib[ch].py : null;
  };
  App.toneOf = function (ch) {
    const lib = (App.Data && App.Data.hanziMap) || {};
    return lib[ch] ? lib[ch].tone : null;
  };
  App.strokesOf = function (ch) {
    const lib = (App.Data && App.Data.hanziMap) || {};
    return lib[ch] ? lib[ch].strokes : null;
  };
  App.wuxingOf = function (ch) {
    const lib = (App.Data && App.Data.hanziMap) || {};
    return lib[ch] ? lib[ch].wuxing : (App.HANZI_WUXING[ch] || null);
  };
  App.meaningOf = function (ch) {
    const lib = (App.Data && App.Data.hanziMap) || {};
    return lib[ch] ? lib[ch].meaning : null;
  };

  // ============ 谐音词库（负面/不良谐音检查） ============
  App.BAD_HOMOPHONES = [
    '死', '亡', '灾', '祸', '病', '丧', '晦', '霉', '难', '穷', '苦',
    '痛', '悲', '哀', '惨', '污', '浊', '贱', '短', '残', '弃', '囚',
    '狱', '鬼', '魂', '妖', '怪', '痴', '傻', '疯', '瘫', '哑', '瞎',
    '钝', '拙', '蠢', '笨', '懒', '脏', '臭', '屁', '尿', '屎', '疾',
    '癌', '瘤', '煞', '凶', '厄', '劫', '亏', '损', '败', '破', '裂',
    '堕', '沉', '溺', '焚', '烧', '烫', '刺', '毒', '腐', '溃', '疡',
    '哭', '泣', '怜', '悯', '乞', '讨', '丐', '禁', '缚',
    '捆', '绑', '埋', '葬', '坟', '墓', '牌',
    '逝', '殁', '毙', '殇', '夭', '痿', '痨', '瘫', '挛', '萎', '瘸',
    '哑', '聋', '眇', '瞽', '衄', '呕', '吐', '泻', '痢', '疫', '瘟',
    '蛊', '瘴', '疠', '疣', '痣', '瘤', '癖', '癫', '狂', '妄', '虐',
    '戮', '斩', '刃', '剐', '剜', '刈', '瘗', '殡', '殓', '殍'
  ];

  /**
   * 谐音检查：对文本做拼音首尾比对（简化规则：单字谐音表 + 拼音相同）
   * @param {string} text
   * @returns {string[]} 命中的不良谐音词（若有）
   */
  App.checkHomophone = function (text) {
    const hits = [];
    if (!text) return hits;
    const py = App.pinyinOfName(text);
    // 简化：对每个字，若其拼音与不良词表某字同音，则提示
    for (const ch of text) {
      if (App.BAD_HOMOPHONES.includes(ch)) {
        hits.push('含不吉字「' + ch + '」');
        continue;
      }
      const p = App.pyOf(ch);
      if (!p) continue;
      for (const bad of App.BAD_HOMOPHONES) {
        const bp = App.pyOf(bad);
        if (bp && bp === p) {
          hits.push('「' + ch + '」谐音近「' + bad + '」');
          break;
        }
      }
    }
    // 去重
    return Array.from(new Set(hits));
  };

  /**
   * 名字全拼：将名字逐字转为拼音字符串（小写，空格分隔）
   */
  App.pinyinOfName = function (text) {
    if (!text) return '';
    const parts = [];
    for (const ch of text) {
      const p = App.pyOf(ch);
      parts.push(p || '?');
    }
    return parts.join(' ');
  };

  // ============ 通用工具 ============
  App.uuid = function (prefix) {
    return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  };

  App.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  App.now = function () { return Date.now(); };

  App.formatTime = function (ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };

  // ============ Node 兼容 ============
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
