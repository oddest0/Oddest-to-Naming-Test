/**
 * data/names.js —— 内置精选名字库（V1 种子）
 * 字段：name 姓名（不含姓） / chars 字 / py 拼音 / gender 性别倾向 / wuxing 五行 / meaning 寓意 / tags 风格 / source 来源
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Data = App.Data || {};

  const NAMES = [
    // 男 / 中性 · 大气文雅
    { name: '宇轩', chars: ['宇', '轩'], py: 'yǔ xuān', gender: '男', wuxing: '土土', meaning: '气宇轩昂，气度不凡', tags: ['大气'], source: '精选' },
    { name: '浩然', chars: ['浩', '然'], py: 'hào rán', gender: '男', wuxing: '水金', meaning: '浩然正气，光明磊落', tags: ['大气'], source: '诗词' },
    { name: '梓睿', chars: ['梓', '睿'], py: 'zǐ ruì', gender: '男', wuxing: '木金', meaning: '栋梁之才，睿智过人', tags: ['文雅'], source: '精选' },
    { name: '沐宸', chars: ['沐', '宸'], py: 'mù chén', gender: '男', wuxing: '水金', meaning: '沐浴恩泽，宸宇宏大', tags: ['文雅'], source: '精选' },
    { name: '景行', chars: ['景', '行'], py: 'jǐng xíng', gender: '男', wuxing: '木水', meaning: '高山景行，品行高尚', tags: ['文雅'], source: '诗词' },
    { name: '子墨', chars: ['子', '墨'], py: 'zǐ mò', gender: '男', wuxing: '水土', meaning: '书生墨香，文质彬彬', tags: ['文雅'], source: '精选' },
    { name: '俊哲', chars: ['俊', '哲'], py: 'jùn zhé', gender: '男', wuxing: '火火', meaning: '才智出众，明达事理', tags: ['大气'], source: '精选' },
    { name: '一鸣', chars: ['一', '鸣'], py: 'yī míng', gender: '男', wuxing: '土水', meaning: '一鸣惊人', tags: ['大气'], source: '成语' },
    { name: '云帆', chars: ['云', '帆'], py: 'yún fān', gender: '男', wuxing: '水水', meaning: '直挂云帆济沧海，志向高远', tags: ['大气'], source: '诗词' },
    { name: '凯歌', chars: ['凯', '歌'], py: 'kǎi gē', gender: '男', wuxing: '木金', meaning: '凯旋高歌，寓意成功', tags: ['大气'], source: '精选' },
    { name: '立诚', chars: ['立', '诚'], py: 'lì chéng', gender: '男', wuxing: '火金', meaning: '立身以诚', tags: ['大气'], source: '精选' },
    { name: '思远', chars: ['思', '远'], py: 'sī yuǎn', gender: '男', wuxing: '金土', meaning: '思虑深远，志存高远', tags: ['文雅'], source: '精选' },
    { name: '泽宇', chars: ['泽', '宇'], py: 'zé yǔ', gender: '男', wuxing: '水土', meaning: '恩泽广宇，福泽深厚', tags: ['大气'], source: '精选' },
    { name: '致远', chars: ['致', '远'], py: 'zhì yuǎn', gender: '男', wuxing: '火土', meaning: '宁静致远，厚积薄发', tags: ['文雅'], source: '成语' },
    { name: '博文', chars: ['博', '文'], py: 'bó wén', gender: '男', wuxing: '水水', meaning: '博学多闻', tags: ['大气'], source: '精选' },
    { name: '修远', chars: ['修', '远'], py: 'xiū yuǎn', gender: '男', wuxing: '金土', meaning: '路漫漫其修远兮，求索不止', tags: ['文雅'], source: '诗词' },
    { name: '景澄', chars: ['景', '澄'], py: 'jǐng chéng', gender: '男', wuxing: '木水', meaning: '景象澄明，心境开阔', tags: ['文雅'], source: '精选' },
    { name: '瑞霖', chars: ['瑞', '霖'], py: 'ruì lín', gender: '男', wuxing: '金水', meaning: '祥瑞甘霖，福泽绵长', tags: ['大气'], source: '精选' },
    { name: '鸿煊', chars: ['鸿', '煊'], py: 'hóng xuān', gender: '男', wuxing: '水火', meaning: '鸿鹄之志，光耀煊赫', tags: ['大气'], source: '精选' },
    { name: '明轩', chars: ['明', '轩'], py: 'míng xuān', gender: '男', wuxing: '火土', meaning: '光明磊落，器宇轩昂', tags: ['大气'], source: '精选' },
    { name: '柏舟', chars: ['柏', '舟'], py: 'bǎi zhōu', gender: '男', wuxing: '木水', meaning: '泛彼柏舟，坚毅不移', tags: ['文雅'], source: '诗词' },
    { name: '其琛', chars: ['其', '琛'], py: 'qí chēn', gender: '男', wuxing: '木金', meaning: '如获珍宝，珍贵非凡', tags: ['文雅'], source: '诗词' },
    { name: '牧遥', chars: ['牧', '遥'], py: 'mù yáo', gender: '男', wuxing: '水火', meaning: '牧童遥指杏花村，悠然恬淡', tags: ['文雅'], source: '诗词' },
    { name: '星野', chars: ['星', '野'], py: 'xīng yě', gender: '男', wuxing: '金土', meaning: '星辰旷野，胸怀广阔', tags: ['现代'], source: '精选' },
    { name: '凌霄', chars: ['凌', '霄'], py: 'líng xiāo', gender: '男', wuxing: '水水', meaning: '凌霄直上，志向凌云', tags: ['大气'], source: '精选' },
    { name: '朝歌', chars: ['朝', '歌'], py: 'zhāo gē', gender: '男', wuxing: '金金', meaning: '朝气高歌，积极向上', tags: ['大气'], source: '精选' },
    // 女 / 中性 · 文雅可爱
    { name: '婉清', chars: ['婉', '清'], py: 'wǎn qīng', gender: '女', wuxing: '土水', meaning: '温婉清雅，如清水芙蓉', tags: ['文雅'], source: '诗词' },
    { name: '诗涵', chars: ['诗', '涵'], py: 'shī hán', gender: '女', wuxing: '金水', meaning: '诗书涵养，气质如兰', tags: ['文雅'], source: '精选' },
    { name: '若曦', chars: ['若', '曦'], py: 'ruò xī', gender: '女', wuxing: '木火', meaning: '如晨曦般温暖明亮', tags: ['文雅'], source: '精选' },
    { name: '芷兰', chars: ['芷', '兰'], py: 'zhǐ lán', gender: '女', wuxing: '木木', meaning: '如兰芷般高洁芬芳', tags: ['文雅'], source: '诗词' },
    { name: '语嫣', chars: ['语', '嫣'], py: 'yǔ yān', gender: '女', wuxing: '木土', meaning: '巧笑嫣然，温言软语', tags: ['文雅'], source: '精选' },
    { name: '沐瑶', chars: ['沐', '瑶'], py: 'mù yáo', gender: '女', wuxing: '水水', meaning: '如瑶玉般温润美好', tags: ['文雅'], source: '精选' },
    { name: '婉如', chars: ['婉', '如'], py: 'wǎn rú', gender: '女', wuxing: '土金', meaning: '温柔婉约，美若天仙', tags: ['文雅'], source: '诗词' },
    { name: '清欢', chars: ['清', '欢'], py: 'qīng huān', gender: '女', wuxing: '水火', meaning: '人间至味是清欢，淡泊安然', tags: ['文雅'], source: '诗词' },
    { name: '念安', chars: ['念', '安'], py: 'niàn ān', gender: '女', wuxing: '火土', meaning: '心念平安，岁月静好', tags: ['文雅'], source: '精选' },
    { name: '知夏', chars: ['知', '夏'], py: 'zhī xià', gender: '女', wuxing: '火火', meaning: '如夏花般绚烂，知性灵动', tags: ['现代'], source: '精选' },
    { name: '乐瑶', chars: ['乐', '瑶'], py: 'lè yáo', gender: '女', wuxing: '火水', meaning: '快乐美好，如玉温润', tags: ['可爱'], source: '精选' },
    { name: '安然', chars: ['安', '然'], py: 'ān rán', gender: '女', wuxing: '土金', meaning: '安然自在，从容不迫', tags: ['文雅'], source: '精选' },
    { name: '雨桐', chars: ['雨', '桐'], py: 'yǔ tóng', gender: '女', wuxing: '水木', meaning: '雨润梧桐，清雅高洁', tags: ['文雅'], source: '精选' },
    { name: '嘉言', chars: ['嘉', '言'], py: 'jiā yán', gender: '女', wuxing: '木火', meaning: '嘉言懿行，德才兼备', tags: ['文雅'], source: '成语' },
    { name: '一诺', chars: ['一', '诺'], py: 'yī nuò', gender: '女', wuxing: '土火', meaning: '一诺千金，诚信可靠', tags: ['大气'], source: '成语' },
    { name: '瑾瑜', chars: ['瑾', '瑜'], py: 'jǐn yú', gender: '女', wuxing: '金金', meaning: '怀瑾握瑜，美玉般的品德', tags: ['文雅'], source: '成语' },
    { name: '梦琪', chars: ['梦', '琪'], py: 'mèng qí', gender: '女', wuxing: '木木', meaning: '梦境般美好，如琪花瑶草', tags: ['文雅'], source: '精选' },
    { name: '若彤', chars: ['若', '彤'], py: 'ruò tóng', gender: '女', wuxing: '木火', meaning: '如朝霞般明艳', tags: ['文雅'], source: '精选' },
    { name: '静姝', chars: ['静', '姝'], py: 'jìng shū', gender: '女', wuxing: '金金', meaning: '静女其姝，娴静美好', tags: ['文雅'], source: '诗词' },
    { name: '思慕', chars: ['思', '慕'], py: 'sī mù', gender: '女', wuxing: '金水', meaning: '令人思慕，气质出众', tags: ['文雅'], source: '精选' },
    { name: '书瑶', chars: ['书', '瑶'], py: 'shū yáo', gender: '女', wuxing: '金水', meaning: '书卷气与温润美兼具', tags: ['文雅'], source: '精选' },
    { name: '芊芊', chars: ['芊', '芊'], py: 'qiān qiān', gender: '女', wuxing: '木木', meaning: '草木茂盛，生机勃勃', tags: ['文雅'], source: '诗词' },
    { name: '慕晴', chars: ['慕', '晴'], py: 'mù qíng', gender: '女', wuxing: '水火', meaning: '仰慕晴空，心境明朗', tags: ['文雅'], source: '精选' },
    { name: '澄心', chars: ['澄', '心'], py: 'chéng xīn', gender: '女', wuxing: '水火', meaning: '澄澈明净的内心', tags: ['文雅'], source: '精选' },
    { name: '玲珑', chars: ['玲', '珑'], py: 'líng lóng', gender: '女', wuxing: '火火', meaning: '八面玲珑，聪慧可爱', tags: ['可爱'], source: '精选' },
    { name: '雨薇', chars: ['雨', '薇'], py: 'yǔ wēi', gender: '女', wuxing: '水木', meaning: '雨润蔷薇，清新柔美', tags: ['文雅'], source: '精选' },
    // 中性 · 现代
    { name: '子初', chars: ['子', '初'], py: 'zǐ chū', gender: '中性', wuxing: '水金', meaning: '不忘初心，方得始终', tags: ['现代'], source: '精选' },
    { name: '沐白', chars: ['沐', '白'], py: 'mù bái', gender: '中性', wuxing: '水水', meaning: '沐浴清辉，纯净通透', tags: ['现代'], source: '精选' },
    { name: '林染', chars: ['林', '染'], py: 'lín rǎn', gender: '中性', wuxing: '木水', meaning: '层林尽染，诗意盎然', tags: ['现代'], source: '诗词' },
    { name: '初九', chars: ['初', '九'], py: 'chū jiǔ', gender: '中性', wuxing: '金水', meaning: '潜龙在渊，厚积薄发', tags: ['现代'], source: '精选' },
    { name: '南乔', chars: ['南', '乔'], py: 'nán qiáo', gender: '中性', wuxing: '火木', meaning: '南有乔木，不可休思', tags: ['文雅'], source: '诗词' },
    { name: '望舒', chars: ['望', '舒'], py: 'wàng shū', gender: '中性', wuxing: '水金', meaning: '前望舒使先驱，追求光明', tags: ['文雅'], source: '诗词' },
    { name: '既白', chars: ['既', '白'], py: 'jì bái', gender: '中性', wuxing: '木水', meaning: '东方既白，天将破晓', tags: ['现代'], source: '诗词' },
    { name: '微澜', chars: ['微', '澜'], py: 'wēi lán', gender: '中性', wuxing: '水水', meaning: '心有微澜，灵动细腻', tags: ['文雅'], source: '精选' },
    { name: '向晚', chars: ['向', '晚'], py: 'xiàng wǎn', gender: '中性', wuxing: '水火', meaning: '向晚意不适，意境悠然', tags: ['现代'], source: '诗词' },
    { name: '如约', chars: ['如', '约'], py: 'rú yuē', gender: '中性', wuxing: '金土', meaning: '如约而至，守信美好', tags: ['现代'], source: '精选' }
  ];

  App.Data.names = NAMES;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
