/**
 * S9 诗词取名页：手机端结果面板置顶常驻
 * 用户需求：手机上诗词取名结果固定常驻可见，避免每次下拉到底部查看。
 * 验收：900px 媒体查询内 .poetry-side 使用 sticky + order:-1 置顶，而非 static 落到列表底部。
 */
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

/** 提取指定媒体查询的完整块（含外层花括号） */
function mediaBlock(query) {
  const idx = css.indexOf('@media ' + query);
  if (idx < 0) return '';
  let depth = 0;
  const start = css.indexOf('{', idx);
  if (start < 0) return '';
  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return css.slice(idx, i + 1);
    }
  }
  return '';
}

/** 提取某选择器在给定 CSS 块内的首条规则体 */
function ruleBody(block, selector) {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
  const m = block.match(re);
  return m ? m[1] : '';
}

test('S9-1 手机端(≤900px)诗词结果面板置顶常驻，不再落到列表底部', () => {
  const block = mediaBlock('(max-width: 900px)');
  assert.ok(block, '应存在 900px 媒体查询块');
  const rule = ruleBody(block, '.poetry-side');
  assert.ok(rule, '媒体查询内应包含 .poetry-side 规则');
  assert.match(rule, /position\s*:\s*sticky/, '结果面板应为 sticky 常驻');
  assert.match(rule, /top\s*:\s*0/, 'sticky 应固定于可视区顶部');
  assert.match(rule, /order\s*:\s*-1/, '结果面板应置顶于诗词列表之前');
  assert.doesNotMatch(rule, /position\s*:\s*static/, '不得回退为 static（否则结果落到底部）');
  assert.match(rule, /overflow-y\s*:\s*auto/, '面板超高时内部滚动');
});

test('S9-2 手机端结果面板设置不透明背景，滚动列表时不透出底层文字', () => {
  const block = mediaBlock('(max-width: 900px)');
  const rule = ruleBody(block, '.poetry-side');
  assert.match(rule, /background\s*:\s*var\(--card-color\)/, '应有卡片背景避免文字叠加');
});

test('S9-3 桌面端仍保持右侧 sticky 两栏布局（回归保护）', () => {
  const layout = ruleBody(css, '.poetry-layout');
  assert.match(layout, /display\s*:\s*flex/, '桌面端应为 flex 两栏');
  const side = ruleBody(css, '.poetry-side');
  assert.match(side, /position\s*:\s*sticky/, '桌面端右侧面板仍 sticky');
  assert.match(side, /width\s*:\s*380px/, '桌面端右侧栏固定宽度');
});
