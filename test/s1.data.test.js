/**
 * 阶段 1 测试：数据层
 * 1. 内置数据库结构与字段完整性
 * 2. utils 工具函数（干支、五行、农历、谐音等）
 * 3. db.js IndexedDB 增删改查 + 导出/导入备份
 */
'use strict';

const { test, before } = require('node:test');
const assert = require('node:assert');
const { loadApp } = require('./helpers');

let window, App;

before(async () => {
  const env = await loadApp();
  window = env.window;
  App = window.App;
});

// ============ 内置数据库 ============

test('S1-1 汉字库：非空、字段完整、无重复字', () => {
  const hanzi = App.Data.hanzi;
  assert.ok(Array.isArray(hanzi) && hanzi.length >= 100, '汉字库应至少 100 字，实际 ' + hanzi.length);
  const seen = new Set();
  for (const h of hanzi) {
    assert.ok(h.c && h.py && typeof h.strokes === 'number' && h.wuxing && h.meaning, `汉字 ${h.c} 字段应完整`);
    assert.ok(!seen.has(h.c), `汉字 ${h.c} 不应重复`);
    seen.add(h.c);
  }
  // 五行必须合法
  for (const h of hanzi) {
    assert.ok(['金', '木', '水', '火', '土'].includes(h.wuxing), `${h.c} 五行应为金木水火土之一`);
  }
});

test('S1-2 汉字库：hanziMap 可查询', () => {
  const map = App.Data.hanziMap;
  assert.ok(map['安'] && map['安'].py === 'an', 'hanziMap 应可查到"安"');
  assert.strictEqual(App.wuxingOf('安'), '土', 'wuxingOf("安") 应为土');
  assert.strictEqual(App.pyOf('安'), 'an', 'pyOf("安") 应为 an');
});

test('S1-3 名字库：结构完整', () => {
  const names = App.Data.names;
  assert.ok(names.length >= 20, '名字库应至少 20 个，实际 ' + names.length);
  for (const n of names) {
    assert.ok(n.name && n.py && n.meaning && n.gender, `名字 ${n.name} 字段应完整`);
    assert.ok(['男', '女', '中性'].includes(n.gender), `${n.name} 性别应为男/女/中性`);
  }
});

test('S1-4 诗词库：分类与结构', () => {
  const poetry = App.Data.poetry;
  assert.ok(poetry.length >= 20, '诗词库应至少 20 句，实际 ' + poetry.length);
  assert.ok(App.Data.poetryBooks.includes('诗经') && App.Data.poetryBooks.includes('唐诗'), '应包含诗经/唐诗分类');
  for (const p of poetry) {
    assert.ok(p.book && p.line && p.keywords && p.keywords.length > 0, `诗句 ${p.line} 字段应完整`);
  }
});

test('S1-5 宠物词库：按风格聚合', () => {
  const pet = App.Data.pet;
  assert.ok(pet.length >= 30, '宠物词库应至少 30 条，实际 ' + pet.length);
  assert.ok(App.Data.petStyles.length >= 4, '应有至少 4 种风格，实际 ' + App.Data.petStyles.join(','));
  // 每种风格至少若干条
  for (const style of App.Data.petStyles) {
    assert.ok(App.Data.petByStyle[style].length >= 3, `风格 ${style} 至少 3 条`);
  }
  for (const p of pet) {
    assert.ok(p.name && p.meaning && p.style, `宠物名 ${p.name} 字段应完整`);
  }
});

// ============ utils ============

test('S1-6 干支计算：2024 甲辰、2025 乙巳', () => {
  const g1 = App.yearGanzhi(2024);
  assert.strictEqual(g1[0], '甲');
  assert.strictEqual(g1[1], '辰');
  const g2 = App.yearGanzhi(2025);
  assert.strictEqual(g2[0], '乙');
  assert.strictEqual(g2[1], '巳');
});

test('S1-7 时辰映射：23点子时、12点午时', () => {
  assert.strictEqual(App.ZHI[App.hourZhiIndex(23)], '子', '23点应属子时');
  assert.strictEqual(App.ZHI[App.hourZhiIndex(12)], '午', '12点应属午时');
});

test('S1-8 五行统计与缺失', () => {
  const count = App.countWuxing([['甲', '辰'], ['乙', '巳']]);
  assert.strictEqual(count['木'], 2, '甲乙为木，应计2');
  assert.ok(App.missingWuxing(count).includes('金') || App.missingWuxing(count).includes('水') || App.missingWuxing(count).includes('火') || App.missingWuxing(count).includes('土'), '应识别缺失五行');
});

test('S1-9 农历转换：1900-01-31 为正月初一', () => {
  const lunar = App.solarToLunar(1900, 1, 31);
  assert.ok(lunar, '应能转换');
  assert.strictEqual(lunar.lunarMonth, 1, '应为正月');
  assert.strictEqual(lunar.lunarDay, 1, '应为初一');
});

test('S1-10 谐音检查：命中与未命中', () => {
  // "梓涵" 不应命中（两个正常字）
  const hits = App.checkHomophone('梓涵');
  assert.ok(Array.isArray(hits), '应返回数组');
  assert.strictEqual(hits.length, 0, '"梓涵"不应命中不良谐音');
  // 直接含不吉字
  const hits2 = App.checkHomophone('安逝');
  assert.ok(hits2.some(h => h.includes('逝') || h.includes('不吉')), '含"逝"应被提示，实际：' + JSON.stringify(hits2));
});

// ============ db.js ============

test('S1-11 IndexedDB：增查改删', async () => {
  const rec = { id: 'rec_test_1', module: 'newborn', title: '测试', input: {}, result: {}, createdAt: Date.now() };
  await App.DB.add('records', rec);
  const got = await App.DB.get('records', 'rec_test_1');
  assert.deepStrictEqual(got, rec, '应能读回写入记录');
  // 改
  rec.title = '修改后';
  await App.DB.put('records', rec);
  const got2 = await App.DB.get('records', 'rec_test_1');
  assert.strictEqual(got2.title, '修改后', 'put 应能更新');
  // 删
  await App.DB.delete('records', 'rec_test_1');
  const got3 = await App.DB.get('records', 'rec_test_1');
  assert.strictEqual(got3, undefined, '删除后应查不到');
});

test('S1-12 IndexedDB：按索引查询与 getAll', async () => {
  await App.DB.clear('records');
  const t = Date.now();
  await App.DB.add('records', { id: 'r1', module: 'poetry', title: 'A', input: {}, result: {}, createdAt: t - 1000 });
  await App.DB.add('records', { id: 'r2', module: 'newborn', title: 'B', input: {}, result: {}, createdAt: t });
  const all = await App.DB.getAll('records');
  assert.strictEqual(all.length, 2, '应返回 2 条');
  const poetryRecs = await App.DB.getByIndex('records', 'module', 'poetry');
  assert.strictEqual(poetryRecs.length, 1, '按 module 索引应返回 1 条');
  await App.DB.clear('records');
});

test('S1-13 备份导出与导入恢复一致', async () => {
  // 准备数据
  await App.DB.clear('records');
  await App.DB.clear('favorites');
  await App.DB.clear('materials');
  await App.DB.clear('settings');
  const fav = { id: 'fav_1', module: 'poetry', name: '云帆', meta: {}, createdAt: Date.now() };
  const mat = { id: 'mat_1', fileName: 'a.txt', words: [{ char: '云' }], createdAt: Date.now() };
  const set = { key: 'defaultSurname', value: '李' };
  await App.DB.add('favorites', fav);
  await App.DB.add('materials', mat);
  await App.DB.put('settings', set);

  const backup = await App.DB.exportAll();
  assert.strictEqual(backup.version, 1, '备份应含版本号');
  assert.ok(backup.stores && backup.stores.favorites && backup.stores.materials && backup.stores.settings, '备份应含各 store');

  // 清空后导入
  await App.DB.clear('favorites');
  await App.DB.clear('materials');
  await App.DB.clear('settings');
  await App.DB.importAll(backup);

  const favAfter = await App.DB.getAll('favorites');
  const matAfter = await App.DB.getAll('materials');
  const setAfter = await App.DB.get('settings', 'defaultSurname');
  assert.strictEqual(favAfter.length, 1, '收藏应恢复');
  assert.strictEqual(favAfter[0].name, '云帆', '收藏内容应一致');
  assert.strictEqual(matAfter.length, 1, '素材应恢复');
  assert.strictEqual(setAfter.value, '李', '设置应恢复');
});

test('S1-14 导入校验：格式错误应抛错', async () => {
  await assert.rejects(() => App.DB.importAll({ foo: 1 }), '格式不正确应抛错');
  await assert.rejects(() => App.DB.importAll(null), 'null 应抛错');
});

test('S1-15 设置存取', async () => {
  await App.DB.put('settings', { key: 'defaultStyle', value: ['文雅'] });
  const s = await App.DB.get('settings', 'defaultStyle');
  assert.deepStrictEqual(s.value, ['文雅'], '设置应能存取');
  await App.DB.delete('settings', 'defaultStyle');
});
