/**
 * engine/generator.js —— 通用取名引擎
 * 基于内置汉字库，按性别/风格/避讳/字辈过滤，组合 + 打分排序 + 换一批去重。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Engine = App.Engine || {};

  const GENERATOR = {};

  // 性别 → 字风格倾向（用于筛选，字本身 tags 已含）
  const GENDER_TAG = { 男: ['大气', '文雅'], 女: ['文雅', '可爱'] };

  /**
   * 打分：字义正面 + 五行均衡 + 音律顺口
   * @returns 0-100
   */
  function scoreName(chars) {
    let score = 60;
    const wuxingSet = new Set();
    chars.forEach(function (ch) {
      const info = App.Data.hanziMap[ch];
      if (!info) return;
      if (info.wuxing) wuxingSet.add(info.wuxing);
      // 寓意丰富加分
      if (info.meaning && info.meaning.length >= 6) score += 3;
      // 笔画适中（4-18）加分
      if (info.strokes >= 4 && info.strokes <= 18) score += 2;
    });
    // 五行不重复（搭配更多样）加分
    if (wuxingSet.size >= 2) score += 4;
    // 声调错落加分
    const tones = chars.map(function (ch) {
      const info = App.Data.hanziMap[ch];
      return info ? info.tone : 0;
    }).filter(function (t) { return t > 0; });
    const toneSet = new Set(tones);
    if (toneSet.size >= 2) score += 4;
    return Math.min(100, Math.max(30, score + Math.floor(Math.random() * 6)));
  }

  /**
   * 根据性别筛选候选字
   */
  function filterByGender(candidates, gender) {
    if (!gender || gender === '中性') return candidates.slice();
    const tags = GENDER_TAG[gender] || [];
    const hasGenderTag = candidates.filter(function (c) {
      return c.tags && c.tags.some(function (t) { return tags.includes(t); });
    });
    // 若性别标记字过少，回退全部
    return hasGenderTag.length >= 10 ? hasGenderTag : candidates.slice();
  }

  /**
   * 生成新生儿/通用双字名
   * @param {object} opts
   *  - surname 姓氏
   *  - gender 性别（男/女/中性/空）
   *  - styles 风格数组 ['文雅','大气',...]
   *  - tabooChars 避讳字（string，任一命中即剔除）
   *  - generation 字辈字（固定中间字，可选）
   *  - count 生成数量
   *  - seed 随机种子（用于换一批去重）
   * @returns [{fullName, chars, py, strokes, wuxing, meaning, score, gender}]
   */
  GENERATOR.generateNewborn = function (opts) {
    const count = opts.count || 10;
    const taboo = (opts.tabooChars || '').replace(/\s/g, '');
    let pool = App.Data.hanzi.slice();

    // 风格过滤
    if (opts.styles && opts.styles.length > 0) {
      const styled = pool.filter(function (c) {
        return c.tags && c.tags.some(function (t) { return opts.styles.includes(t); });
      });
      if (styled.length >= 20) pool = styled;
    }

    // 性别过滤
    pool = filterByGender(pool, opts.gender);

    // 避讳字过滤
    if (taboo) {
      const tabooSet = new Set(taboo.split(''));
      pool = pool.filter(function (c) { return !tabooSet.has(c.c); });
    }

    // 字辈：固定中间字
    const gen = (opts.generation || '').trim();

    const results = [];
    const used = new Set();
    const maxAttempts = count * 60 + 200;
    let attempts = 0;
    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      let first, second;
      if (gen) {
        first = gen; // 字辈字为用户指定，即使不在库中也接受
        second = pickRandom(pool);
      } else {
        first = pickRandom(pool);
        second = pickRandom(pool);
      }
      if (!first || !second) continue;
      if (first === second) continue;
      const fullName = (opts.surname || '') + first + second;
      if (used.has(fullName)) continue;
      used.add(fullName);
      // 可变字必须入库；字辈字可不入库（属性容错）
      const c1 = gen ? (App.Data.hanziMap[first] || fallbackInfo(first)) : App.Data.hanziMap[first];
      const c2 = App.Data.hanziMap[second];
      if (!c1 || !c2) continue;
      const name = {
        fullName: fullName,
        chars: [first, second],
        py: App.pinyinOfName(first + second),
        strokes: (c1.strokes || 0) + (c2.strokes || 0),
        wuxing: (c1.wuxing || '') + (c2.wuxing || ''),
        meaning: [c1.meaning, c2.meaning].filter(Boolean).join('；') || '字辈名',
        score: scoreName([first, second]),
        gender: opts.gender || '中性'
      };
      results.push(name);
    }
    // 按分数排序
    results.sort(function (a, b) { return b.score - a.score; });
    return results;
  };

  /** 字辈字不在库中时的兜底信息 */
  function fallbackInfo(ch) {
    return {
      c: ch, py: '?', tone: 0, strokes: 0, wuxing: App.HANZI_WUXING[ch] || '', meaning: '字辈字', tags: []
    };
  }

  function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)].c;
  }

  /**
   * 用用户上传的素材字生成名字（文献取名）
   * @param {object} opts { surname, words:[{char,...}], count }
   */
  GENERATOR.generateFromMaterial = function (opts) {
    const words = opts.words || [];
    const chars = words.map(function (w) { return typeof w === 'string' ? w : w.char; }).filter(Boolean);
    if (chars.length === 0) return [];
    const count = opts.count || 10;
    const results = [];
    const used = new Set();
    const maxAttempts = count * 40 + 100;
    let attempts = 0;
    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      const c1 = chars[Math.floor(Math.random() * chars.length)];
      const c2 = chars[Math.floor(Math.random() * chars.length)];
      if (!c1 || !c2 || c1 === c2) continue;
      const fullName = (opts.surname || '') + c1 + c2;
      if (used.has(fullName)) continue;
      used.add(fullName);
      const info1 = App.Data.hanziMap[c1];
      const info2 = App.Data.hanziMap[c2];
      results.push({
        fullName: fullName,
        chars: [c1, c2],
        py: App.pinyinOfName(c1 + c2),
        strokes: (info1 && info1.strokes || 0) + (info2 && info2.strokes || 0),
        wuxing: (info1 && info1.wuxing || '') + (info2 && info2.wuxing || ''),
        meaning: [info1 && info1.meaning, info2 && info2.meaning].filter(Boolean).join('；') || '取自上传文献',
        score: scoreName([c1, c2]),
        gender: '中性',
        source: '文献'
      });
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return results;
  };

  /**
   * 换一批：用不同随机种子重新生成（通过传入不同 shuffle 起点自然产生差异）
   */
  GENERATOR.reshuffle = function (opts) {
    return GENERATOR.generateNewborn(opts);
  };

  /**
   * 宠物名生成：从宠物词库按风格 + 类型抽取
   */
  GENERATOR.generatePet = function (opts) {
    const styles = opts.styles && opts.styles.length ? opts.styles : ['萌系'];
    const pool = [];
    styles.forEach(function (st) {
      const list = App.Data.petByStyle[st] || [];
      pool.push.apply(pool, list);
    });
    if (pool.length === 0) return [];
    const count = opts.count || 10;
    const shuffled = App.shuffle(pool);
    const results = [];
    shuffled.slice(0, count).forEach(function (p) {
      results.push({
        name: p.name,
        en: p.en || '',
        meaning: p.meaning || '',
        fit: p.fit || '',
        style: p.style || styles[0],
        fullName: p.name
      });
    });
    return results;
  };

  App.Engine.generator = GENERATOR;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
