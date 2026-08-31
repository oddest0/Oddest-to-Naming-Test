/**
 * engine/score.js —— 名字解析及评分引擎
 * 解析：逐字拆解（拼音/笔画/五行/寓意）；评分：字形、音律、寓意、谐音、五行均衡、性别契合。
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Engine = App.Engine || {};

  const SCORE = {};

  /**
   * 解析名字
   * @param {string} fullName 如 "李承宇"
   * @returns {object|null} { surname, given, chars:[{char,py,tone,strokes,wuxing,meaning,inLib}], hasLib }
   */
  SCORE.analyze = function (fullName) {
    if (!fullName) return null;
    const s = String(fullName).trim();
    if (s.length < 2) return null;
    // 姓氏：优先匹配内置常见复姓，否则取单姓
    const SINGLE = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文'];
    const SURNAMES = SINGLE.concat(['欧阳', '司马', '上官', '诸葛', '东方', '皇甫', '尉迟', '公孙', '慕容', '司徒', '司空', '夏侯', '令狐', '长孙', '轩辕', '南宫', '端木', '独孤']);
    const doubled = s.slice(0, 2);
    if (SURNAMES.includes(doubled) && s.length > 2) {
      return buildResult(s, doubled, s.slice(2));
    }
    if (SURNAMES.includes(s[0]) && s.length > 1) {
      return buildResult(s, s[0], s.slice(1));
    }
    // 无法识别姓氏：将第一个字当作姓
    return buildResult(s, s[0], s.slice(1));
  };

  function buildResult(full, surname, given) {
    const chars = [];
    let hasLib = true;
    for (const ch of (surname + given)) {
      const info = App.Data.hanziMap[ch];
      if (!info) hasLib = false;
      chars.push({
        char: ch,
        py: info ? info.py : '',
        tone: info ? info.tone : 0,
        strokes: info ? info.strokes : 0,
        wuxing: info ? info.wuxing : (App.HANZI_WUXING[ch] || ''),
        meaning: info ? info.meaning : '',
        inLib: !!info
      });
    }
    return {
      full: full,
      surname: surname,
      given: given,
      chars: chars,
      hasLib: hasLib
    };
  }

  /** 中文声调名称 */
  function toneName(t) {
    return ['', '一声', '二声', '三声', '四声', '轻声'][t] || '';
  }

  /**
   * 评分
   * @param {string|object} fullName 名字或 analyze 结果
   * @returns {object} { total, scores:{shape,tone,meaning,harmony,wuxing,gender}, notes:[], detail }
   */
  SCORE.rate = function (fullName) {
    const a = typeof fullName === 'string' ? SCORE.analyze(fullName) : fullName;
    if (!a) return null;
    const notes = [];
    const scores = {};

    // 1. 字形（笔画均衡 + 简洁）
    let shape = 60;
    if (a.hasLib) {
      const strokes = a.chars.map(c => c.strokes);
      const sum = strokes.reduce((x, y) => x + y, 0);
      const avg = sum / strokes.length;
      const maxDev = Math.max(...strokes.map(s => Math.abs(s - avg)));
      if (maxDev <= 2) shape += 20; else if (maxDev <= 5) shape += 12; else shape += 4;
      if (sum >= 8 && sum <= 32) shape += 15; else if (sum < 8) shape += 6; else shape += 8;
      notes.push('总笔画 ' + sum + '，结构较' + (maxDev <= 2 ? '匀称' : '一般'));
    } else {
      notes.push('含生僻字，笔画字形信息不全，按基础分计');
    }
    scores.shape = Math.min(100, Math.round(shape));

    // 2. 音律（声调起伏 + 无拗口）
    let tone = 60;
    if (a.hasLib && a.chars.length >= 2) {
      const tones = a.chars.map(c => c.tone);
      let changes = 0;
      for (let i = 1; i < tones.length; i++) if (tones[i] !== tones[i - 1]) changes++;
      if (changes >= tones.length - 1) tone += 25;
      else if (changes >= 1) tone += 15;
      else tone += 5;
      const pyStr = a.chars.map(c => c.py).join('');
      const awkward = ['ang', 'eng', 'ong'];
      // 简单拗口检测：连续同尾音
      let sameTail = 0;
      for (let i = 1; i < a.chars.length; i++) {
        if (a.chars[i].py.endsWith(a.chars[i - 1].py.slice(-2))) sameTail++;
      }
      if (sameTail > 0) tone -= sameTail * 8;
      notes.push('声调 ' + a.chars.map(c => toneName(c.tone)).join(' / '));
    } else {
      notes.push('生僻字音律无法完整判断');
    }
    scores.tone = Math.min(100, Math.max(0, Math.round(tone)));

    // 3. 寓意（字义积极 + 均入库）
    let meaning = 60;
    const meaningChars = a.chars.slice(a.surname.length).filter(c => c.inLib);
    if (meaningChars.length === a.given.length && a.given.length > 0) {
      meaning += 25;
      const goodWords = ['美好', '光明', '智慧', '大气', '文雅', '希望', '坚定', '吉祥', '温柔', '勇敢'];
      if (meaningChars.some(c => goodWords.some(g => c.meaning.includes(g)))) meaning += 10;
      notes.push('名字用字均有良好寓意');
    } else if (a.given.length > 0) {
      meaning += 10;
      notes.push('部分用字未入库，寓意参考有限');
    }
    scores.meaning = Math.min(100, Math.round(meaning));

    // 4. 谐音（避免不吉谐音）
    let harmony = 80;
    const bad = App.checkHomophone(a.full);
    if (bad && bad.length > 0) {
      harmony -= 35;
      notes.push('谐音检查：建议注意「' + a.full + '」的谐音联想（' + bad.join('；') + '）');
    } else {
      harmony += 10;
      notes.push('谐音检查：无明显不吉联想');
    }
    scores.harmony = Math.min(100, Math.round(harmony));

    // 5. 五行（均衡性）
    let wx = 65;
    if (a.hasLib) {
      const wuxings = a.chars.slice(a.surname.length).map(c => c.wuxing).filter(Boolean);
      if (wuxings.length >= 2) {
        if (wuxings[0] === wuxings[1]) {
          wx += 15; notes.push('名字用字五行相同（' + wuxings[0] + '），五行纯粹');
        } else {
          wx += 25; notes.push('名字用字五行搭配（' + wuxings.join('+') + '）');
        }
      } else {
        notes.push('用字五行信息有限');
      }
    }
    scores.wuxing = Math.min(100, Math.round(wx));

    // 6. 性别契合（简单启发：字是否带性别倾向 tag）
    let gender = 70;
    if (a.hasLib) {
      const givenChars = a.chars.slice(a.surname.length);
      // 中性评价，仅提示
      notes.push('性别契合需结合个人偏好判断');
    }
    scores.gender = Math.min(100, Math.round(gender));

    // 总分：权重
    const weights = { shape: 0.2, tone: 0.2, meaning: 0.25, harmony: 0.15, wuxing: 0.1, gender: 0.1 };
    let total = 0;
    for (const k in weights) total += (scores[k] || 0) * weights[k];
    total = Math.round(total);

    return {
      total: total,
      scores: scores,
      notes: notes,
      detail: a
    };
  };

  App.Engine.score = SCORE;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
