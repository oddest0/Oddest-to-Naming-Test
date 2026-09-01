/**
 * engine/poetry.js —— 诗词取名引擎
 * 从名句/全篇提炼好字、组合候选名；支持按全篇内容检索与提取。
 *
 * 提炼策略（v0.1.2 优化）：
 * 名字的"字"一律来自所选诗句（名句优先、全篇补充），组合方式有两种：
 * 1. 相邻二字对（如"明月""清泉""松间"）——保留原句词组意象，天然贴切；
 * 2. 字池随机组合（名句/全篇中可入名的字两两组合）——更灵活。
 * 两类候选统一按「意象相关度 + 音律（平仄、声调）+ 寓意 + 字库覆盖」评分排序，
 * 保证组合不违和、朗朗上口、有寓意，且名字都能直接指回原诗。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Engine = App.Engine || {};

  const POETRY = {};

  // 虚词/不适合入名的字（仅纯虚词，不误伤"云""新"等好取名字）
  const STOP_CHARS = new Set(['之', '乎', '者', '也', '矣', '兮', '与', '于', '其', '何', '乃', '且', '而', '或', '亦', '以', '为', '所', '在', '有', '无', '是', '不', '未', '此', '彼', '夫', '如', '若', '我', '吾', '尔', '子', '天', '下', '上', '中', '一', '二', '三', '千', '万', '的', '了', '吗', '呢', '既', '余', '焉', '哉', '莫', '岂', '虽', '苟', '於', '已', '自', '各', '同', '共', '可', '非']);

  // 相邻二字对使用的虚词集：任一字为纯虚词即跳过该对，
  // 避免误伤"天生""明月""春潮"这类含实词的好词组。
  const STOP_PAIR = new Set(['之', '乎', '者', '也', '矣', '兮', '哉', '欤', '焉', '耳', '与', '于', '其', '何', '乃', '且', '而', '或', '亦', '以', '为', '所', '在', '有', '无', '是', '此', '彼', '夫', '如', '若', '我', '吾', '尔', '既', '余', '莫', '岂', '虽', '苟', '自', '各', '共', '可', '非', '但', '等', '则', '的', '了', '吗', '呢', '便', '那', '这', '要', '被', '把', '让']);

  // 明显不适合入名的字（作为减分项）
  const BAD_CHARS = new Set(['死', '病', '愁', '恨', '悲', '泪', '孤', '寒', '冷', '枯', '残', '衰', '乱', '急', '苦', '哀', '怨', '泣', '亡', '阴', '暗', '凶', '凄', '惨', '贱', '贫', '朽', '颓', '废', '悔']);

  // 寓意正面词（用于组合寓意加分）
  const GOOD_WORDS = ['美', '好', '明', '清', '雅', '润', '安', '福', '慧', '智', '德', '贤', '仁', '勇', '光', '华', '瑞', '祥', '嘉', '宁', '静', '舒', '悦', '欣', '文', '乐', '和', '顺', '谦', '诚', '信', '善', '珍', '宝', '锦', '秀', '灵', '妙', '新', '望', '远', '荣', '茂', '盛', '盈', '丰', '芳', '香', '洁', '澄', '澈', '云', '月', '星', '春', '秋', '晨', '晴', '熙', '晖', '曜', '旭', '斌', '卓', '超', '鹏', '鸿', '洋', '海', '天', '龙', '凤', '兰', '松', '竹', '梅'];

  function isHanziChar(ch) {
    return /[\u4e00-\u9fff]/.test(ch);
  }

  /** 平仄判断：1/2 声为平，3/4 声为仄 */
  function isPing(tone) {
    return tone === 1 || tone === 2;
  }

  /**
   * 音律评分：两字声调不同 +1；平仄交替 +2；同平仄 -2
   * @param {{tone:number}} infoA
   * @param {{tone:number}} infoB
   */
  POETRY.toneScore = function (infoA, infoB) {
    if (!infoA || !infoB || !infoA.tone || !infoB.tone) return 0;
    let s = 0;
    if (infoA.tone !== infoB.tone) s += 1;
    if (isPing(infoA.tone) !== isPing(infoB.tone)) s += 2;
    else s -= 2;
    return s;
  };

  /** 字库覆盖分：两字都在库(有寓意且可评估音律) +8；一字在库 +2；都不在库 -4 */
  function libScore(infoA, infoB) {
    const n = (infoA ? 1 : 0) + (infoB ? 1 : 0);
    if (n === 2) return 8;
    if (n === 1) return 2;
    return -4;
  }

  /** 寓意评分：有字义 +1/字；含正面词再 +1 */
  function meaningScore(infoA, infoB) {
    let s = 0;
    if (infoA && infoA.meaning) s += 1;
    if (infoB && infoB.meaning) s += 1;
    const text = (infoA ? infoA.meaning : '') + (infoB ? infoB.meaning : '');
    if (GOOD_WORDS.some(function (w) { return text.indexOf(w) >= 0; })) s += 1;
    return s;
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
    score += (inLine ? 10 : 2);                 // 意象相关度：名句相邻 +10；全篇相邻 +2
    score += 2;                                 // 相邻保真（词组）
    score += libScore(infoA, infoB);            // 字库覆盖（决定寓意与音律可评估性）
    score += POETRY.toneScore(infoA, infoB);    // 音律（平仄/声调）
    score += meaningScore(infoA, infoB);        // 寓意
    if (BAD_CHARS.has(a) || BAD_CHARS.has(b)) score -= 6; // 含劣质字
    return {
      name: key,
      c1: a,
      c2: b,
      c1Info: infoA || null,
      c2Info: infoB || null,
      inLibCount: (infoA ? 1 : 0) + (infoB ? 1 : 0),
      inLine: inLine === true,
      adjacent: true,
      score: score,
      ctx: text.slice(Math.max(0, i - 8), i + 10)
    };
  }

  /** 构造一个"字池随机组合"候选（非相邻） */
  function makeCombo(a, b, inLineAny, line, full) {
    const infoA = App.Data.hanziMap[a];
    const infoB = App.Data.hanziMap[b];
    let score = (inLineAny ? 7 : -4);           // 意象相关度：名句字组合 +7；全篇组合 -4（与所选名句脱节惩罚）
    score += libScore(infoA, infoB);            // 字库覆盖
    score += POETRY.toneScore(infoA, infoB);    // 音律
    score += meaningScore(infoA, infoB);        // 寓意
    if (BAD_CHARS.has(a) || BAD_CHARS.has(b)) score -= 6; // 含劣质字
    return {
      name: a + b,
      c1: a,
      c2: b,
      c1Info: infoA || null,
      c2Info: infoB || null,
      inLibCount: (infoA ? 1 : 0) + (infoB ? 1 : 0),
      inLine: inLineAny === true,
      adjacent: false,
      score: score,
      ctx: inLineAny ? (line || '') : String(full || '').slice(0, 18)
    };
  }

  /**
   * 从文本提炼"相邻二字对"（保留原句词组意象）
   * @param {string} text 名句或全篇
   * @param {object} opts { inLine } 是否来自名句（用于意象加分）
   * @returns [{name, c1, c2, c1Info, c2Info, inLibCount, inLine, adjacent, score, ctx}]
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
      if (STOP_PAIR.has(a) || STOP_PAIR.has(b)) continue; // 任一字为纯虚词即跳过（避免"河之""其姝"等含虚词的劣质组合）
      const key = a + b;
      if (seen.has(key)) continue; // 去重（同一对保留首次出现位置）
      seen.add(key);
      out.push(makePair(a, b, i, t, key, opts.inLine));
    }
    return out;
  };

  /**
   * 从文本提炼可入名字/关键字（单字，供字池与兜底）
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
   * 用诗句提炼名字（相邻二字对 + 字池随机组合，名句优先、全篇补充）
   * @param {object} opts { line, full, poem, surname, count }
   * @returns [{name, fullName, chars, py, meaning, poem:{book,title,line,full,fromFull}, fromLine, ctx, score}]
   */
  POETRY.generate = function (opts) {
    const line = opts.line || '';
    const full = opts.full || line;
    const poem = opts.poem || {};
    const surname = opts.surname || '';
    const count = opts.count || 8;

    // ---- 1. 相邻二字对（名句优先 + 全篇补充）----
    const adjacent = POETRY.extractPairs(line, { inLine: true });
    const seen = {};
    adjacent.forEach(function (c) { seen[c.name] = true; });
    POETRY.extractPairs(full).forEach(function (c) {
      if (!seen[c.name]) { seen[c.name] = true; adjacent.push(c); }
    });

    // ---- 2. 字池（库内可入名字）：名句字池高优先 ----
    const lineLib = POETRY.extract(line, { useHanziLib: true }).map(function (e) { return e.char; });
    const fullLib = POETRY.extract(full, { useHanziLib: true }).map(function (e) { return e.char; });

    // ---- 3. 字池随机组合（非相邻）：名句字池 → 全篇字池 ----
    const combos = [];
    function addCombos(pool, inLineAny) {
      for (let i = 0; i < pool.length; i++) {
        for (let j = 0; j < pool.length; j++) {
          if (i === j) continue; // 排除同字组合
          const key = pool[i] + pool[j];
          if (seen[key]) continue; // 相邻对已产出 / 组合已存在
          seen[key] = true;
          combos.push(makeCombo(pool[i], pool[j], inLineAny, line, full));
        }
      }
    }
    addCombos(lineLib, true);
    addCombos(fullLib, false);

    // ---- 4. 合并去重排序 ----
    const cands = adjacent.concat(combos);
    cands.sort(function (a, b) { return b.score - a.score; });

    // ---- 5. 组装结果 ----
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

    // ---- 6. 极端兜底：几乎无可入名字时，单字随机组合保证必有结果 ----
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
