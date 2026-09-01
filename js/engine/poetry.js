/**
 * engine/poetry.js —— 诗词取名引擎
 * 从名句/全篇提炼好字、组合候选名；支持按全篇内容检索与提取。
 *
 * 提炼策略（v0.1.2 优化）：
 * 传统做法是从诗句中拆出单个字后随机组合，导致"名字与诗句关联不大"。
 * 现在改为「相邻二字对」提炼：扫描诗句中紧邻的两个字（如"明月""清泉""松间"），
 * 保留原文的词组意象与上下文（ctx），再按意象相关度 + 字库覆盖评分排序。
 * 优先从名句提炼，名句不足时补充全篇正文，保证名字都能直接指回原句。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Engine = App.Engine || {};

  const POETRY = {};

  // 虚词/不适合入名的字（仅纯虚词，不误伤"云""新"等好取名字）
  const STOP_CHARS = new Set(['之', '乎', '者', '也', '矣', '兮', '与', '于', '其', '何', '乃', '且', '而', '或', '亦', '以', '为', '所', '在', '有', '无', '是', '不', '未', '此', '彼', '夫', '如', '若', '我', '吾', '尔', '子', '天', '下', '上', '中', '一', '二', '三', '千', '万', '的', '了', '吗', '呢', '既', '余', '焉', '哉', '莫', '岂', '虽', '苟', '於', '已', '自', '各', '同', '共', '可', '非']);

  // 相邻二字对使用的宽松虚词集：只有两字都是纯虚词时才跳过该对，
  // 避免误伤"天生""明月""春潮"这类含实词的好词组。
  const STOP_PAIR = new Set(['之', '乎', '者', '也', '矣', '兮', '哉', '欤', '焉', '耳', '与', '于', '其', '何', '乃', '且', '而', '或', '亦', '以', '为', '所', '在', '有', '无', '是', '此', '彼', '夫', '如', '若', '我', '吾', '尔', '既', '余', '莫', '岂', '虽', '苟', '自', '各', '共', '可', '非', '但', '等', '则', '的', '了', '吗', '呢', '便', '那', '这', '要', '被', '把', '让']);

  // 明显不适合入名的字（在相邻对中作为减分项）
  const BAD_CHARS = new Set(['死', '病', '愁', '恨', '悲', '泪', '孤', '寒', '冷', '枯', '残', '衰', '乱', '急', '苦', '哀', '怨', '泣', '亡', '阴', '暗', '凶', '凄', '惨', '贱', '贫', '朽', '颓', '废', '悔']);

  function isHanziChar(ch) {
    return /[\u4e00-\u9fff]/.test(ch);
  }

  /** 构造一个相邻二字对的评分 */
  function makePair(a, b, i, text, key, inLine) {
    const infoA = App.Data.hanziMap[a];
    const infoB = App.Data.hanziMap[b];
    const before = i > 0 ? text[i - 1] : '';
    const after = (i + 2 < text.length) ? text[i + 2] : '';
    const boundBefore = i === 0 || /[，。；：！？、\s\n]/.test(before);
    const boundAfter = (i + 2 >= text.length) || /[，。；：！？、\s\n]/.test(after);
    let score = 0;
    if (inLine) score += 10;           // 意象锚点：来自名句
    if (boundBefore) score += 3;       // 词组起点（前有标点/句首），天然词组通常以实词开头
    if (infoA) score += 4; else score += 1; // 字库覆盖（库外字也可能好，给保底分）
    if (infoB) score += 4; else score += 1;
    if (infoA && infoB) score += 2;    // 两字都在库，天然词组的强信号
    if (infoA && infoB && infoA.tone === infoB.tone) score -= 1; // 同声调平淡
    if (BAD_CHARS.has(a) || BAD_CHARS.has(b)) score -= 4;        // 含劣质字
    return {
      name: key,
      c1: a,
      c2: b,
      c1Info: infoA || null,
      c2Info: infoB || null,
      inLibCount: (infoA ? 1 : 0) + (infoB ? 1 : 0),
      inLine: inLine === true,
      score: score,
      ctx: text.slice(Math.max(0, i - 8), i + 10)
    };
  }

  /**
   * 从文本提炼"相邻二字对"（保留原句词组意象）
   * @param {string} text 名句或全篇
   * @param {object} opts { inLine } 是否来自名句（用于意象加分）
   * @returns [{name, c1, c2, c1Info, c2Info, inLibCount, inLine, score, ctx}]
   */
  POETRY.extractPairs = function (text, opts) {
    opts = opts || {};
    const t = String(text || '');
    const seen = new Set();
    const out = [];
    for (let i = 0; i < t.length - 1; i++) {
      const a = t[i];
      const b = t[i + 1];
      if (!isHanziChar(a) || !isHanziChar(b)) continue; // 只取相邻两个汉字
      if (STOP_PAIR.has(a) && STOP_PAIR.has(b)) continue; // 两字均为纯虚词才跳过
      const key = a + b;
      if (seen.has(key)) continue; // 去重（同一对保留首次出现位置）
      seen.add(key);
      out.push(makePair(a, b, i, t, key, opts.inLine));
    }
    return out;
  };

  /**
   * 从文本提炼可入名字/关键字（单字，供 extractPairs 兜底与展示）
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
        wuxing: info ? info.wuxing : (App.HANZI_WUXING ? (App.HANZI_WUXING[ch] || '') : ''),
        strokes: info ? info.strokes : 0,
        tone: info ? info.tone : 0,
        inLib: !!info
      });
    }
    return out;
  };

  /**
   * 用诗句提炼名字（相邻二字对优先，名句→全篇，保证名字能指回原句）
   * @param {object} opts { line, full, poem, surname, count }
   * @returns [{name, fullName, chars, py, meaning, poem:{book,title,line,full,fromFull}, fromLine, ctx, score}]
   */
  POETRY.generate = function (opts) {
    const line = opts.line || '';
    const full = opts.full || line;
    const poem = opts.poem || {};
    const surname = opts.surname || '';
    const count = opts.count || 8;

    // 1. 名句相邻对（意象最强）
    const cands = POETRY.extractPairs(line, { inLine: true });
    const seenPairs = {};
    cands.forEach(function (c) { seenPairs[c.name] = true; });
    // 2. 全篇补充（跳过名句已出现的对，保留名句版）
    POETRY.extractPairs(full).forEach(function (c) {
      if (!seenPairs[c.name]) {
        seenPairs[c.name] = true;
        cands.push(c);
      }
    });
    cands.sort(function (a, b) { return b.score - a.score; });

    const results = [];
    const used = new Set();
    for (let i = 0; i < cands.length && results.length < count; i++) {
      const c = cands[i];
      const fullName = surname + c.name;
      if (used.has(fullName)) continue;
      used.add(fullName);
      const e1 = c.c1Info || { meaning: '', wuxing: App.HANZI_WUXING ? (App.HANZI_WUXING[c.c1] || '') : '', strokes: 0, tone: 0 };
      const e2 = c.c2Info || { meaning: '', wuxing: App.HANZI_WUXING ? (App.HANZI_WUXING[c.c2] || '') : '', strokes: 0, tone: 0 };
      results.push({
        name: c.name,
        fullName: fullName,
        chars: [c.c1, c.c2],
        py: App.pinyinOfName(c.name),
        meaning: [e1.meaning, e2.meaning].filter(Boolean).join('；') || '出自诗句',
        wuxing: (e1.wuxing || '') + (e2.wuxing || ''),
        poem: {
          book: poem.book || '',
          title: poem.title || '',
          line: line,
          full: full,
          fromFull: !c.inLine
        },
        fromLine: c.inLine,
        ctx: c.ctx,
        score: Math.min(100, Math.round(c.score * 3 + 55))
      });
    }

    // 3. 极端兜底：全篇几乎没有可取相邻对时，用单字随机组合保证必有结果
    if (results.length < count) {
      const extracted = POETRY.extract(full, { useHanziLib: false });
      if (extracted.length >= 2) {
        const chars = extracted.map(function (e) { return e.char; });
        let attempts = 0;
        const maxAttempts = count * 60 + 200;
        while (results.length < count && attempts < maxAttempts) {
          attempts++;
          const c1 = chars[Math.floor(Math.random() * chars.length)];
          const c2 = chars[Math.floor(Math.random() * chars.length)];
          if (!c1 || !c2 || c1 === c2) continue;
          const fullName = surname + c1 + c2;
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
            poem: { book: poem.book || '', title: poem.title || '', line: line, full: full, fromFull: true },
            fromLine: false,
            ctx: full.slice(0, 18),
            score: 65 + Math.floor(Math.random() * 10)
          });
        }
      }
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
