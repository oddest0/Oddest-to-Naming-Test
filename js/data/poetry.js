/**
 * data/poetry.js —— 内置诗词名句库（V1 种子）
 * 字段：book 出处 / title 篇目 / line 原句 / meaning 释义 / keywords 可提炼关键字
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Data = App.Data || {};

  const POETRY = [
    { book: '诗经', title: '《关雎》', line: '关关雎鸠，在河之洲', meaning: '雎鸠和鸣于河洲，喻君子淑女般美好', keywords: ['雎鸠', '河洲', '之洲', '关雎'] },
    { book: '诗经', title: '《桃夭》', line: '桃之夭夭，灼灼其华', meaning: '桃花盛开鲜艳，喻青春美好', keywords: ['桃夭', '灼华', '其华'] },
    { book: '诗经', title: '《蒹葭》', line: '蒹葭苍苍，白露为霜', meaning: '芦苇苍茫露成霜，意境清远', keywords: ['蒹葭', '白露', '苍苍'] },
    { book: '诗经', title: '《鹿鸣》', line: '呦呦鹿鸣，食野之苹', meaning: '鹿鸣呦呦，欢乐祥和', keywords: ['呦呦', '鹿鸣'] },
    { book: '诗经', title: '《静女》', line: '静女其姝，俟我于城隅', meaning: '娴静女子美好，喻温婉', keywords: ['静女', '其姝'] },
    { book: '诗经', title: '《击鼓》', line: '执子之手，与子偕老', meaning: '牵手共老，情意深长', keywords: ['执子', '偕老'] },
    { book: '楚辞', title: '《离骚》', line: '路漫漫其修远兮，吾将上下而求索', meaning: '追求真理不懈，喻求索', keywords: ['修远', '求索', '漫漫'] },
    { book: '楚辞', title: '《离骚》', line: '朝饮木兰之坠露兮，夕餐秋菊之落英', meaning: '饮露餐英，喻高洁脱俗', keywords: ['木兰', '坠露', '秋菊', '落英'] },
    { book: '楚辞', title: '《九歌·云中君》', line: '灵连蜷兮既留，烂昭昭兮未央', meaning: '光华灿烂没有尽头', keywords: ['昭昭', '未央'] },
    { book: '楚辞', title: '《九歌·湘夫人》', line: '袅袅兮秋风，洞庭波兮木叶下', meaning: '秋风木叶，意境空灵', keywords: ['袅袅', '木叶'] },
    { book: '楚辞', title: '《离骚》', line: '前望舒使先驱兮，后飞廉使奔属', meaning: '望舒为月御，追求光明', keywords: ['望舒', '飞廉'] },
    { book: '楚辞', title: '《九章·涉江》', line: '吾不能变心以从俗兮，固将愁苦而终穷', meaning: '不随波逐流，坚贞不屈', keywords: ['变心', '从俗'] },
    { book: '唐诗', title: '王之涣《登鹳雀楼》', line: '欲穷千里目，更上一层楼', meaning: '登高望远，进取向上', keywords: ['千里', '层楼', '登高'] },
    { book: '唐诗', title: '李白《将进酒》', line: '天生我材必有用，千金散尽还复来', meaning: '自信豁达，才必有用', keywords: ['天材', '千金'] },
    { book: '唐诗', title: '王维《山居秋暝》', line: '明月松间照，清泉石上流', meaning: '月光清泉，意境澄澈', keywords: ['明月', '清泉', '松间'] },
    { book: '唐诗', title: '王维《终南别业》', line: '行到水穷处，坐看云起时', meaning: '行到水尽坐看云起，从容淡泊', keywords: ['水穷', '云起'] },
    { book: '唐诗', title: '李白《行路难》', line: '长风破浪会有时，直挂云帆济沧海', meaning: '乘风破浪，志向远大', keywords: ['长风', '云帆', '沧海'] },
    { book: '唐诗', title: '杜甫《望岳》', line: '会当凌绝顶，一览众山小', meaning: '登临绝顶，胸怀宽广', keywords: ['凌绝', '绝顶', '众山'] },
    { book: '唐诗', title: '王勃《滕王阁序》', line: '落霞与孤鹜齐飞，秋水共长天一色', meaning: '晚霞秋水，色彩明丽', keywords: ['落霞', '秋水', '长天'] },
    { book: '唐诗', title: '刘禹锡《陋室铭》', line: '谈笑有鸿儒，往来无白丁', meaning: '高朋满座，才学卓然', keywords: ['鸿儒'] },
    { book: '唐诗', title: '孟浩然《宿建德江》', line: '野旷天低树，江清月近人', meaning: '旷野清江，月明近人', keywords: ['野旷', '江清', '月近'] },
    { book: '唐诗', title: '李贺《致酒行》', line: '少年心事当拏云，谁念幽寒坐呜呃', meaning: '少年壮志凌云', keywords: ['拏云', '少年'] },
    { book: '唐诗', title: '韦应物《滁州西涧》', line: '春潮带雨晚来急，野渡无人舟自横', meaning: '悠然自得，随遇而安', keywords: ['春潮', '野渡', '舟自'] },
    { book: '唐诗', title: '贾岛《题诗后》', line: '两句三年得，一吟双泪流', meaning: '苦心孤诣，精益求精', keywords: ['一吟'] },
    { book: '唐诗', title: '杜牧《山行》', line: '停车坐爱枫林晚，霜叶红于二月花', meaning: '枫林霜叶，绚烂美好', keywords: ['枫林', '霜叶'] },
    { book: '宋词', title: '苏轼《水调歌头》', line: '但愿人长久，千里共婵娟', meaning: '美好祝愿，共赏明月', keywords: ['长久', '婵娟'] },
    { book: '宋词', title: '苏轼《定风波》', line: '一蓑烟雨任平生', meaning: '从容旷达，笑对风雨', keywords: ['烟雨', '平生'] },
    { book: '宋词', title: '李清照《如梦令》', line: '常记溪亭日暮，沉醉不知归路', meaning: '溪亭日暮，悠然沉醉', keywords: ['溪亭', '日暮'] },
    { book: '宋词', title: '秦观《鹊桥仙》', line: '金风玉露一相逢，便胜却人间无数', meaning: '金风玉露，相逢美好', keywords: ['金风', '玉露'] },
    { book: '宋词', title: '晏殊《浣溪沙》', line: '无可奈何花落去，似曾相识燕归来', meaning: '花落燕归，时光流转', keywords: ['燕归', '花落'] },
    { book: '宋词', title: '岳飞《满江红》', line: '三十功名尘与土，八千里路云和月', meaning: '壮怀激烈，志在千里', keywords: ['云和月', '尘与土'] },
    { book: '宋词', title: '柳永《雨霖铃》', line: '今宵酒醒何处，杨柳岸晓风残月', meaning: '晓风残月，意境清冷', keywords: ['晓风', '残月'] },
    { book: '宋词', title: '辛弃疾《青玉案》', line: '蓦然回首，那人却在灯火阑珊处', meaning: '灯火阑珊，悠然所得', keywords: ['阑珊', '回首'] },
    { book: '宋词', title: '范仲淹《岳阳楼记》', line: '先天下之忧而忧，后天下之乐而乐', meaning: '忧乐天下，胸怀宽广', keywords: ['天下'] },
    { book: '宋词', title: '周邦彦《苏幕遮》', line: '叶上初阳干宿雨，水面清圆', meaning: '荷叶清圆，清新雅致', keywords: ['初阳', '清圆'] },
    // ---- 阶段5扩充 ----
    { book: '诗经', title: '《木瓜》', line: '投我以木桃，报之以琼瑶', meaning: '投桃报李，情意相投', keywords: ['木桃', '琼瑶', '琼'] },
    { book: '诗经', title: '《硕人》', line: '巧笑倩兮，美目盼兮', meaning: '笑容美好、目光灵动', keywords: ['巧笑', '倩', '盼'] },
    { book: '诗经', title: '《淇奥》', line: '如切如磋，如琢如磨', meaning: '精益求精，喻进取', keywords: ['切磋', '琢磨'] },
    { book: '诗经', title: '《采薇》', line: '昔我往矣，杨柳依依', meaning: '杨柳依人，柔情缱绻', keywords: ['杨柳', '依依'] },
    { book: '诗经', title: '《车辖》', line: '高山仰止，景行行止', meaning: '仰慕高尚，向善而行', keywords: ['高山', '景行'] },
    { book: '楚辞', title: '屈原《离骚》', line: '路漫漫其修远兮，吾将上下而求索', meaning: '求索之路漫长，矢志不渝', keywords: ['修远', '求索'] },
    { book: '楚辞', title: '屈原《离骚》', line: '朝饮木兰之坠露兮，夕餐秋菊之落英', meaning: '高洁自持，饮露餐英', keywords: ['木兰', '秋菊'] },
    { book: '楚辞', title: '屈原《离骚》', line: '芳与泽其杂糅兮，唯昭质其犹未亏', meaning: '品行高洁，明德不亏', keywords: ['昭质'] },
    { book: '楚辞', title: '屈原《九歌·湘夫人》', line: '袅袅兮秋风，洞庭波兮木叶下', meaning: '秋风袅袅、湖波木叶，清丽萧疏', keywords: ['袅袅', '木叶'] },
    { book: '唐诗', title: '杜甫《望岳》', line: '会当凌绝顶，一览众山小', meaning: '志存高远，登临绝顶', keywords: ['凌绝', '一览'] },
    { book: '唐诗', title: '张九龄《望月怀远》', line: '海上生明月，天涯共此时', meaning: '明月共赏，思念悠远', keywords: ['明月', '天涯'] },
    { book: '唐诗', title: '高适《别董大》', line: '千里黄云白日曛，北风吹雁雪纷纷', meaning: '边塞苍茫，雄浑壮阔', keywords: ['黄云', '吹雁'] },
    { book: '宋词', title: '苏轼《水调歌头》', line: '明月几时有，把酒问青天', meaning: '潇洒旷达，问月抒怀', keywords: ['明月', '青天'] },
    { book: '宋词', title: '苏轼《定风波》', line: '竹杖芒鞋轻胜马，一蓑烟雨任平生', meaning: '旷达从容，不畏风雨', keywords: ['烟雨', '竹杖'] },
    { book: '宋词', title: '李清照《如梦令》', line: '争渡，争渡，惊起一滩鸥鹭', meaning: '生机灵动，惊鸿之姿', keywords: ['鸥鹭', '惊鸿'] }
  ];

  App.Data.poetry = POETRY;
  // 出处分类
  App.Data.poetryBooks = Array.from(new Set(POETRY.map(function (p) { return p.book; })));

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
