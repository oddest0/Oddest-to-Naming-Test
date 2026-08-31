/**
 * engine/poetry.js —— 诗词取名引擎
 * 从诗句提炼关键字、用提炼字组合候选名。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Engine = App.Engine || {};

  const POETRY = {};

  // 虚词/不适合入名的字
  const STOP_CHARS = new Set(['之', '乎', '者', '也', '矣', '兮', '与', '于', '其', '何', '乃', '且', '而', '或', '亦', '以', '为', '所', '在', '有', '无', '是', '不', '未', '此', '彼', '夫', '如', '若', '我', '吾', '尔', '子', '天', '下', '上', '中', '一', '二', '三', '千', '万', '的', '了', '吗', '呢']);

  /**
   * 从诗句提炼可入名字/关键字
   * @param {string} line
   * @param {object} opts { useHanziLib } 是否只取内置库中有寓意的字
   * @returns [{char, meaning, wuxing, strokes}]
   */
  POETRY.extract = function (line, opts) {
    opts = opts || {};
    if (!line) return [];
    const seen = new Set();
    const out = [];
    const useLib = opts.useHanziLib !== false;
    for (const ch of line) {
      if (seen.has(ch)) continue;
      if (!/[\u4e00-\u9fff]/.test(ch)) continue; // 只取汉字
      if (STOP_CHARS.has(ch)) continue;
      seen.add(ch);
      const info = App.Data.hanziMap[ch];
      if (useLib && !info) continue; // 只保留内置库中可查询的字
      out.push({
        char: ch,
        meaning: info ? info.meaning : '',
        wuxing: info ? info.wuxing : App.HANZI_WUXING[ch] || '',
        strokes: info ? info.strokes : 0,
        tone: info ? info.tone : 0
      });
    }
    return out;
  };

  /**
   * 用诗句提炼字组合候选名（双字名，第二字可选姓氏拼配）
   * @param {object} opts { line, surname, count }
   * @returns [{name, fullName, chars, py, meaning, poem:{book,title,line}, wuxing}]
   */
  POETRY.generate = function (opts) {
    const line = opts.line || '';
    const poem = opts.poem || {};
    const extracted = POETRY.extract(line);
    if (extracted.length === 0) return [];
    const chars = extracted.map(function (e) { return e.char; });
    const count = opts.count || 8;
    const results = [];
    const used = new Set();
    let attempts = 0;
    const maxAttempts = count * 50 + 200;
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
          line: line
        },
        score: 70 + Math.floor(Math.random() * 25)
      });
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return results;
  };

  /**
   * 检索诗句
   * @param {string} keyword
   * @param {string} book 出处过滤（可选）
   * @returns [{book, title, line, meaning, keywords}]
   */
  POETRY.search = function (keyword, book) {
    let list = App.Data.poetry;
    if (book) list = list.filter(function (p) { return p.book === book; });
    if (!keyword) return list;
    const kw = keyword.trim();
    if (!kw) return list;
    return list.filter(function (p) {
      return p.line.includes(kw) || (p.title && p.title.includes(kw)) || (p.keywords && p.keywords.some(function (k) { return k.includes(kw); }));
    });
  };

  App.Engine.poetry = POETRY;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
