/**
 * data/pet.js —— 内置宠物词库（V1）
 * 按风格分类：萌系叠词 / 食物系 / 拟声系 / 洋气音译 / 霸气 / 文艺
 * 每条：name 中文名 / en 英文名 / meaning 含义 / fit 适合说明
 */
(function (global) {
  'use strict';
  const App = global.App = global.App || {};
  App.Data = App.Data || {};

  const PET = [
    // 萌系叠词
    { style: '萌系', name: '团团', en: 'Tuantuan', meaning: '圆滚滚，软萌可爱', fit: '小奶猫小奶狗，圆润型' },
    { style: '萌系', name: '圆圆', en: 'Yuanyuan', meaning: '圆润可爱，讨人喜欢', fit: '脸圆、体型圆润的宠物' },
    { style: '萌系', name: '豆豆', en: 'Doudou', meaning: '像小豆子一样小巧', fit: '体型小巧的幼宠' },
    { style: '萌系', name: '点点', en: 'Diandian', meaning: '小巧灵动，一点一点长大', fit: '小花猫、小奶狗' },
    { style: '萌系', name: '毛毛', en: 'Maomao', meaning: '毛茸茸的触感', fit: '长毛、蓬松的宠物' },
    { style: '萌系', name: '朵朵', en: 'Duoduo', meaning: '像花朵一样柔软', fit: '毛色好看、性格温柔的宠物' },
    { style: '萌系', name: '啾啾', en: 'JiuJiu', meaning: '小鸟的叫声，活泼可爱', fit: '小鸟、小体型宠物' },
    { style: '萌系', name: '糯糯', en: 'Nuonuo', meaning: '软糯黏人，甜甜的', fit: '黏人、性格软的宠物' },
    { style: '萌系', name: '滚滚', en: 'Gungun', meaning: '胖乎乎的，像在滚动', fit: '胖乎乎的宠物' },
    { style: '萌系', name: '甜甜', en: 'Tiantian', meaning: '甜到心里', fit: '性格温顺讨喜的宠物' },
    { style: '萌系', name: '暖暖', en: 'Nuannuan', meaning: '温暖治愈', fit: '爱撒娇、爱贴人的宠物' },
    { style: '萌系', name: '胖胖', en: 'Pangpang', meaning: '圆滚滚，憨态可掬', fit: '体型偏胖的宠物' },
    { style: '萌系', name: '泡泡', en: 'Paopao', meaning: '轻盈梦幻', fit: '活泼好动的宠物' },
    { style: '萌系', name: '糊糊', en: 'Huhu', meaning: '迷迷糊糊，呆萌', fit: '呆萌、慢半拍的宠物' },
    { style: '萌系', name: '丢丢', en: 'Diudiu', meaning: '活泼灵动，调皮', fit: '爱玩爱闹的宠物' },
    // 食物系
    { style: '食物', name: '奶茶', en: 'Naicha', meaning: '甜甜的奶茶，治愈系', fit: '棕色系毛发的宠物' },
    { style: '食物', name: '布丁', en: 'Pudding', meaning: '软滑Q弹，可爱', fit: '软萌的小体型宠物' },
    { style: '食物', name: '汤圆', en: 'Tangyuan', meaning: '白白糯糯，团圆美好', fit: '白色圆润的小宠物' },
    { style: '食物', name: '年糕', en: 'Niangua', meaning: '软糯有嚼劲，年年高', fit: '黏人乖巧的宠物' },
    { style: '食物', name: '肉肉', en: 'Rourou', meaning: '肉嘟嘟的可爱', fit: '肉感十足、贪吃的宠物' },
    { style: '食物', name: '花生', en: 'Huangsheng', meaning: '小小一颗，机灵', fit: '体型小、机灵的宠物' },
    { style: '食物', name: '豆包', en: 'Doubao', meaning: '鼓鼓囊囊，可爱', fit: '圆滚滚的宠物' },
    { style: '食物', name: '麻薯', en: 'Mashu', meaning: '软糯Q弹', fit: '手感好、黏人的宠物' },
    { style: '食物', name: '果冻', en: 'Guodong', meaning: '晶莹剔透，软弹', fit: '毛发光滑、性格软的宠物' },
    { style: '食物', name: '包子', en: 'Baozi', meaning: '白白胖胖', fit: '白色圆润的宠物' },
    { style: '食物', name: '奶茶', en: 'Naicha', meaning: '香浓治愈', fit: '棕白相间的宠物' },
    { style: '食物', name: '曲奇', en: 'Cookie', meaning: '香甜酥脆，治愈', fit: '棕黄色毛发的宠物' },
    { style: '食物', name: '酸奶', en: 'SuanNai', meaning: '酸酸甜甜，活泼', fit: '白色的宠物' },
    { style: '食物', name: '米粒', en: 'Mili', meaning: '小小一粒，精致', fit: '超小体型的宠物' },
    { style: '食物', name: '桃子', en: 'Taozi', meaning: '粉嫩可爱', fit: '粉白毛色的宠物' },
    // 拟声系
    { style: '拟声', name: '汪汪', en: 'Wangwang', meaning: '狗狗的叫声，直白可爱', fit: '狗狗' },
    { style: '拟声', name: '喵喵', en: 'Miaomiao', meaning: '猫咪的叫声，软萌', fit: '猫咪' },
    { style: '拟声', name: '咪咪', en: 'Mimi', meaning: '猫咪的经典昵称', fit: '猫咪' },
    { style: '拟声', name: '叮当', en: 'Dingdang', meaning: '铃铛声响，清脆活泼', fit: '爱戴铃铛的宠物' },
    { style: '拟声', name: '咕噜', en: 'Gulu', meaning: '打呼噜的声音，慵懒', fit: '爱打呼噜、慵懒的宠物' },
    { style: '拟声', name: '嘎嘎', en: 'Gaga', meaning: '鸭子的叫声，欢快', fit: '鸭子、小鸟' },
    { style: '拟声', name: '哞哞', en: 'Momu', meaning: '牛的叫声，憨厚', fit: '宠物牛、大体型宠物' },
    { style: '拟声', name: '噜噜', en: 'Lulu', meaning: '呼噜声，慵懒放松', fit: '安静慵懒的宠物' },
    { style: '拟声', name: '唧唧', en: 'Jiji', meaning: '小动物的轻叫声', fit: '仓鼠、小鸟' },
    { style: '拟声', name: '汪汪', en: 'Wangwang', meaning: '欢快活泼的叫声', fit: '活泼的狗狗' },
    // 洋气音译
    { style: '洋气', name: 'Lucky', en: 'Lucky', meaning: '幸运，讨彩头', fit: '任何宠物，寓意好运' },
    { style: '洋气', name: 'Coco', en: 'Coco', meaning: '可可，俏皮可爱', fit: '小巧活泼的宠物' },
    { style: '洋气', name: 'Momo', en: 'Momo', meaning: '泡泡/蜜桃，软萌', fit: '软萌可爱的宠物' },
    { style: '洋气', name: 'Nono', en: 'Nono', meaning: '小不点，可爱', fit: '小体型宠物' },
    { style: '洋气', name: 'Bella', en: 'Bella', meaning: '美丽动人', fit: '漂亮的母宠物' },
    { style: '洋气', name: 'Oreo', en: 'Oreo', meaning: '奥利奥，黑白分明', fit: '黑白毛色的宠物' },
    { style: '洋气', name: 'Pumpkin', en: 'Pumpkin', meaning: '小南瓜，可爱', fit: '橘色毛发的宠物' },
    { style: '洋气', name: 'Cookie', en: 'Cookie', meaning: '小饼干，香甜', fit: '棕黄色毛发的宠物' },
    { style: '洋气', name: 'Sunny', en: 'Sunny', meaning: '阳光，温暖开朗', fit: '性格开朗的宠物' },
    { style: '洋气', name: 'Luna', en: 'Luna', meaning: '月亮，神秘优雅', fit: '优雅、安静的宠物' },
    { style: '洋气', name: 'Milo', en: 'Milo', meaning: '米洛，活力', fit: '活泼好动的宠物' },
    { style: '洋气', name: 'Tofu', en: 'Tofu', meaning: '豆腐，软糯', fit: '白色柔软的宠物' },
    { style: '洋气', name: 'Kiwi', en: 'Kiwi', meaning: '奇异果，清新', fit: '绿色系或小巧宠物' },
    { style: '洋气', name: 'Dobby', en: 'Dobby', meaning: '多比，机灵可爱', fit: '耳朵大的宠物' },
    { style: '洋气', name: 'Yuki', en: 'Yuki', meaning: '雪，纯净', fit: '白色毛发的宠物' },
    // 霸气
    { style: '霸气', name: '雷神', en: 'Thor', meaning: '雷霆万钧，霸气十足', fit: '大型犬、性格霸道的宠物' },
    { style: '霸气', name: '虎子', en: 'Huzi', meaning: '如虎生威，威猛', fit: '有气势的中大型宠物' },
    { style: '霸气', name: '将军', en: 'General', meaning: '威风凛凛，大将风范', fit: '威风、有气场的宠物' },
    { style: '霸气', name: '黑豹', en: 'Panther', meaning: '迅捷勇猛', fit: '黑色毛发的宠物' },
    { style: '霸气', name: '阿霸', en: 'Aba', meaning: '霸气外露，不好惹', fit: '性格强势的宠物' },
    { style: '霸气', name: '王炸', en: 'Wangzha', meaning: '王炸出场，全场镇住', fit: '有个性的宠物' },
    { style: '霸气', name: '铁蛋', en: 'Tiedan', meaning: '结实耐造，皮实', fit: '身体强壮、皮实的宠物' },
    { style: '霸气', name: '钢镚', en: 'Gangbeng', meaning: '硬气十足', fit: '小型但凶悍的宠物' },
    { style: '霸气', name: '阿狼', en: 'Alang', meaning: '如狼般孤傲', fit: '高冷、有个性的宠物' },
    { style: '霸气', name: '暴风', en: 'Storm', meaning: '风驰电掣，速度', fit: '奔跑速度快的宠物' },
    { style: '霸气', name: '金刚', en: 'Jingang', meaning: '金刚不坏，强壮', fit: '体格健壮的宠物' },
    { style: '霸气', name: '霸王', en: 'Bawang', meaning: '霸王之气，舍我其谁', fit: '体型大、气场强的宠物' },
    // 文艺
    { style: '文艺', name: '墨白', en: 'Mobai', meaning: '水墨留白，诗意', fit: '黑白毛色的宠物' },
    { style: '文艺', name: '青禾', en: 'Qinghe', meaning: '青翠禾苗，清新', fit: '灵动清新的宠物' },
    { style: '文艺', name: '南风', en: 'Nanfeng', meaning: '南风知我意，温柔', fit: '温柔安静的宠物' },
    { style: '文艺', name: '晚星', en: 'Wanxing', meaning: '傍晚的星星，静谧', fit: '安静优雅的宠物' },
    { style: '文艺', name: '拾光', en: 'Shiguang', meaning: '拾取美好时光', fit: '陪伴型宠物' },
    { style: '文艺', name: '青柠', en: 'Qingning', meaning: '清新酸甜，灵动', fit: '活泼清新的宠物' },
    { style: '文艺', name: '未央', en: 'Weiyang', meaning: '未尽之意，意蕴悠长', fit: '气质优雅的宠物' },
    { style: '文艺', name: '山茶', en: 'Shancha', meaning: '山茶花开，明艳', fit: '毛色鲜艳的宠物' },
    { style: '文艺', name: '云朵', en: 'Yunduo', meaning: '柔软洁白，轻盈', fit: '白色蓬松的宠物' },
    { style: '文艺', name: '花卷', en: 'Huajuan', meaning: '松软可爱，生活气', fit: '卷毛、蓬松的宠物' },
    { style: '文艺', name: '知秋', en: 'Zhiqiu', meaning: '一叶知秋，通透', fit: '聪明机敏的宠物' },
    { style: '文艺', name: '半夏', en: 'Banxia', meaning: '半夏时光，诗意', fit: '温和安静的宠物' },
    { style: '文艺', name: '浮生', en: 'Fusheng', meaning: '浮生若梦，淡然', fit: '慵懒淡然的宠物' },
    { style: '文艺', name: '清欢', en: 'Qinghuan', meaning: '人间清欢，从容', fit: '性格淡定的宠物' }
  ];

  // 按风格聚合
  const byStyle = {};
  for (const p of PET) {
    byStyle[p.style] = byStyle[p.style] || [];
    byStyle[p.style].push(p);
  }
  App.Data.pet = PET;
  App.Data.petStyles = Object.keys(byStyle);
  App.Data.petByStyle = byStyle;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
})(typeof window !== 'undefined' ? window : globalThis);
