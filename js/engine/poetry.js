/**
 * engine/poetry.js —— 诗词取名引擎
 * 从名句或全篇提炼好字、组合候选名；支持按全篇内容检索与提取。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Engine = App.Engine || {};

  const POETRY = {};

  // 虚词/不适合入名的字（仅纯虚词，不误伤"云""新"等好取名字）
  const STOP_CHARS = new Set(['之', '乎', '者', '也', '矣', '兮', '与', '于', '其', '何', '乃', '且', '而', '或', '亦', '以', '为', '所', '在', '有', '无', '是', '不', '未', '此', '彼', '夫', '如', '若', '我', '吾', '尔', '子', '天', '下', '上', '中', '一', '二', '三', '千', '万', '的', '了', '吗', '呢', '既', '余', '焉', '哉', '莫', '岂', '虽', '苟', '於', '已', '自', '各', '同', '共', '可', '非']);

  /**
   * 从文本提炼可入名字/关键字
   * @param {string} text 名句或全篇
   * @param {object} opts { useHanziLib } 是否只取内置库中有寓意的字
   * @returns [{char, meaning, wuxing, strokes, inLib}]
   */
  POETRY.extract = function (text, opts) {
    opts = opts || {};
    if (!text) return [];
    const seen = new Set();
    const out = [];
    const useLib = opts.useHanziLib !== false;
    for (const ch of text) {
      if (seen.has(ch)) continue;
      if (!/[\u4e00-\u9fff]/.test(ch)) continue; // 只取汉字
      if (STOP_CHARS.has(ch)) continue;
      seen.add(ch);
      const info = App.Data.hanziMap[ch];
      if (useLib && !info) continue; // 只保留内置库中可查询的字
      out.push({
        char: ch,
        meaning: info ? info.meaning : '',
        wuxing: info ? info.wuxing : (App.HANZI_WUXING[ch] || ''),
        strokes: info ? info.strokes : 0,
        tone: info ? info.tone : 0,
        inLib: !!info
      });
    }
    return out;
  };

  /**
   * 用诗句提炼字组合候选名（优先全篇，回退保证必有结果）
   * @param {object} opts { line, full, poem, surname, count }
   * @returns [{name, fullName, chars, py, meaning, poem:{book,title,line,fromFull}, wuxing}]
   */
  POETRY.generate = function (opts) {
    const line = opts.line || '';
    const full = opts.full || line;
    const poem = opts.poem || {};
    let fromFull = false;

    // 1. 从全篇提炼（优先内置库中的字）
    let extracted = POETRY.extract(full, { useHanziLib: true });
    if (extracted.length < 2) {
      // 2. 库内字不足：放宽到库外字（保证能提炼）
      extracted = POETRY.extract(full, { useHanziLib: false });
      fromFull = true;
    }
    // 3. 仍不足（全文几乎都是虚词）：从内置常用字补充
    if (extracted.length < 2) {
      const fallback = App.Data.hanzi.filter(function (h) { return h.tags && h.tags.indexOf('常用') >= 0; }).slice(0, 24);
      extracted = extracted.concat(fallback.map(function (h) {
        return { char: h.c, meaning: h.meaning, wuxing: h.wuxing, strokes: h.strokes, tone: h.tone, inLib: true };
      }));
      fromFull = true;
    }
    if (extracted.length < 2) return [];

    const chars = extracted.map(function (e) { return e.char; });
    const count = opts.count || 8;
    const results = [];
    const used = new Set();
    let attempts = 0;
    const maxAttempts = count * 60 + 200;
    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      const c1 = chars[Math.floor(Math.random() * chars.length)];
      const c2 = chars[Math.floor(Math.random() * chars.length)];
      if (!c1 || !c2 || c1 === c2) continue;
      const fullName = (opts.surname || '') + c1 + c2;
      if (used.has(fullName)) continue;
      used.add(fullName);
      const e1 = extracted.find(function (e) { return e.char === c1; });
      const e2 = extracted.find(function (e) { return e.char === c2; });
      results.push({
        name: c1 + c2,
        fullName: fullName,
        chars: [c1, c2],
        py: App.pinyinOfName(c1 + c2),
        meaning: [e1 && e1.meaning, e2 && e2.meaning].filter(Boolean).join('；') || '出自诗句',
        wuxing: (e1 && e1.wuxing || '') + (e2 && e2.wuxing || ''),
        poem: {
          book: poem.book || '',
          title: poem.title || '',
          line: line,
          full: full,
          fromFull: fromFull
        },
        score: 70 + Math.floor(Math.random() * 25) + (fromFull ? 0 : 5)
      });
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return results;
  };

  /**
   * 检索诗句：名句 / 全篇正文 / 标题 / 关键字 均可命中
   * @param {string} keyword
   * @param {string} book 出处过滤（可选）
   * @returns [{book, title, line, full, meaning, keywords}]
   */
  POETRY.search = function (keyword, book) {
    let list = App.Data.poetry;
    if (book) list = list.filter(function (p) { return p.book === book; });
    if (!keyword) return list;
    const kw = keyword.trim();
    if (!kw) return list;
    return list.filter(function (p) {
      return (p.full && p.full.indexOf(kw) >= 0) ||
        p.line.indexOf(kw) >= 0 ||
        (p.title && p.title.indexOf(kw) >= 0) ||
        (p.keywords && p.keywords.some(function (k) { return k.indexOf(kw) >= 0; }));
    });
  };

  App.Engine.poetry = POETRY;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
