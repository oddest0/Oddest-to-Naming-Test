/**
 * engine/bazi.js —— 生辰八字引擎（V1 简化规则）
 * 功能：四柱排盘（年/月/日/时）、五行统计、喜用缺失提示、按五行补益推荐名字。
 * 说明：采用简化节气月界 + 五虎遁/五鼠遁推算，非专业子平命理（符合 PRD §9）。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Engine = App.Engine || {};

  const BAZI = {};

  // 简化节气月界（公历月/日 → 地支月），适用于现代大致区间
  const JIEQI = [
    { m: 1, d: 6, zhi: '丑' },
    { m: 2, d: 4, zhi: '寅' },
    { m: 3, d: 6, zhi: '卯' },
    { m: 4, d: 5, zhi: '辰' },
    { m: 5, d: 6, zhi: '巳' },
    { m: 6, d: 6, zhi: '午' },
    { m: 7, d: 7, zhi: '未' },
    { m: 8, d: 8, zhi: '申' },
    { m: 9, d: 8, zhi: '酉' },
    { m: 10, d: 8, zhi: '戌' },
    { m: 11, d: 7, zhi: '亥' },
    { m: 12, d: 7, zhi: '子' }
  ];

  /** 由公历月日得到地支月（简化节气） */
  function monthZhi(month, day) {
    let cur = '子';
    for (const j of JIEQI) {
      if (month > j.m || (month === j.m && day >= j.d)) cur = j.zhi;
    }
    return cur;
  }

  // 五虎遁：年干 → 正月(寅)天干序
  const YEAR_GAN_TO_MONTH_GAN = { 甲: '丙', 乙: '戊', 丙: '庚', 丁: '壬', 戊: '甲', 己: '丙', 庚: '戊', 辛: '庚', 壬: '壬', 癸: '甲' };

  /** 由年干 + 地支月，推月干 */
  function monthGan(yearGan, zhi) {
    const start = YEAR_GAN_TO_MONTH_GAN[yearGan];
    const startIdx = App.GAN.indexOf(start);
    const zhiIdx = App.ZHI.indexOf(zhi); // 寅=2, 卯=3 ...
    // 寅月天干=start，之后每推一个地支，天干顺移一位
    const offset = (zhiIdx - 2 + 12) % 12;
    return App.GAN[(startIdx + offset) % 10];
  }

  // 五鼠遁：日干 → 子时天干
  const DAY_GAN_TO_HOUR_GAN = { 甲: '甲', 乙: '丙', 丙: '戊', 丁: '庚', 戊: '壬', 己: '甲', 庚: '丙', 辛: '戊', 壬: '庚', 癸: '壬' };

  /** 由日干 + 时辰地支，推时干 */
  function hourGan(dayGan, zhi) {
    const start = DAY_GAN_TO_HOUR_GAN[dayGan];
    const startIdx = App.GAN.indexOf(start);
    const zhiIdx = App.ZHI.indexOf(zhi); // 子=0
    return App.GAN[(startIdx + zhiIdx) % 10];
  }

  // 日柱：以 1900-01-01 为基准日（该日干支为甲戌），逐日推算（V1 简化口径）
  const BASE_UTC = Date.UTC(1900, 0, 1);
  const BASE_GAN_IDX = 0; // 甲
  const BASE_ZHI_IDX = 10; // 戌

  function dayGanzhi(year, month, day) {
    const offset = Math.floor((Date.UTC(year, month - 1, day) - BASE_UTC) / 86400000);
    const g = (BASE_GAN_IDX + offset) % 10;
    const z = (BASE_ZHI_IDX + offset) % 12;
    return [App.GAN[g], App.ZHI[z]];
  }

  /**
   * 排盘
   * @param {object} p { solarYear, solarMonth, solarDay, hour(0-23, 可空), gender }
   * @returns {object}
   *  - pillars: { year:[g,z], month:[g,z], day:[g,z], hour:[g,z]|null }
   *  - wuxingCount: 五行计数
   *  - missing: 缺失五行[]
   *  - weakest: 最弱五行[]
   *  - favor: 补益目标五行[]（缺失优先，否则最弱）
   *  - hourKnown: boolean
   */
  BAZI.compute = function (p) {
    if (!p || !p.solarYear || !p.solarMonth || !p.solarDay) {
      throw new Error('缺少出生日期');
    }
    const y = Number(p.solarYear);
    const m = Number(p.solarMonth);
    const d = Number(p.solarDay);
    if (y < 1900 || y > 2100) throw new Error('年份需在 1900-2100 之间');
    if (m < 1 || m > 12) throw new Error('月份不合法');
    if (d < 1 || d > 31) throw new Error('日期不合法');
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
      throw new Error('日期不合法');
    }
    const yearG = App.yearGanzhi(y);
    const mZhi = monthZhi(m, d);
    const mGan = monthGan(yearG[0], mZhi);
    const day = dayGanzhi(y, m, d);

    const hourKnown = typeof p.hour === 'number' && p.hour >= 0 && p.hour <= 23;
    let hour = null;
    if (hourKnown) {
      const hZhi = App.ZHI[App.hourZhiIndex(p.hour)];
      const hGan = hourGan(day[0], hZhi);
      hour = [hGan, hZhi];
    }

    const pairs = [yearG, [mGan, mZhi], day, hour];
    const wuxingCount = App.countWuxing(pairs);
    const missing = App.missingWuxing(wuxingCount);
    const weakest = App.weakestWuxing(wuxingCount);
    const favor = missing.length > 0 ? missing : weakest;

    return {
      pillars: { year: yearG, month: [mGan, mZhi], day: day, hour: hour },
      wuxingCount: wuxingCount,
      missing: missing,
      weakest: weakest,
      favor: favor,
      hourKnown: hourKnown
    };
  };

  /**
   * 按补益五行推荐名字
   * @param {object} opts { surname, baziResult, gender, count }
   * @returns [{fullName, chars, wuxing, matchNote}]
   */
  BAZI.recommend = function (opts) {
    const bazi = opts.baziResult;
    if (!bazi || !bazi.favor || bazi.favor.length === 0) return [];
    const favorSet = new Set(bazi.favor);
    // 候选字：五行命中补益目标
    let pool = App.Data.hanzi.filter(function (h) { return favorSet.has(h.wuxing); });
    // 性别倾向过滤（若太少则放宽）
    if (opts.gender && opts.gender !== '中性') {
      const tags = opts.gender === '男' ? ['大气', '文雅'] : ['文雅', '可爱'];
      const genPool = pool.filter(function (h) { return h.tags && h.tags.some(function (t) { return tags.includes(t); }); });
      if (genPool.length >= 10) pool = genPool;
    }
    if (pool.length < 4) {
      // 补益五行字太少时放宽：补充该五行或混合
      pool = App.Data.hanzi.filter(function (h) {
        return favorSet.has(h.wuxing) || h.tags.includes('常用');
      });
    }
    const count = opts.count || 10;
    const results = [];
    const used = new Set();
    let attempts = 0;
    const maxAttempts = count * 50 + 200;
    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      const c1 = pool[Math.floor(Math.random() * pool.length)];
      const c2 = pool[Math.floor(Math.random() * pool.length)];
      if (!c1 || !c2 || c1.c === c2.c) continue;
      const fullName = (opts.surname || '') + c1.c + c2.c;
      if (used.has(fullName)) continue;
      used.add(fullName);
      const bothFavor = favorSet.has(c1.wuxing) && favorSet.has(c2.wuxing);
      results.push({
        fullName: fullName,
        chars: [c1.c, c2.c],
        py: App.pinyinOfName(c1.c + c2.c),
        strokes: (c1.strokes || 0) + (c2.strokes || 0),
        wuxing: c1.wuxing + c2.wuxing,
        meaning: [c1.meaning, c2.meaning].filter(Boolean).join('；'),
        matchNote: bothFavor ? ('双字皆补' + bazi.favor.join('/')) : ('含补益五行 ' + bazi.favor.join('/')),
        score: 70 + Math.floor(Math.random() * 25) + (bothFavor ? 5 : 0)
      });
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return results;
  };

  App.Engine.bazi = BAZI;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
