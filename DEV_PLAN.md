# 取名 App · 第一版开发计划（DEV_PLAN）

> 版本：v1.0
> 依据：PRD.md（本计划与 PRD 一一对应，验收标准见 PRD 第 10 章）
> 目标：产出一个可双击打开、断网可用的本地单页应用，数据持久化不丢失

---

## 1. 技术方案

| 决策项 | 选择 | 理由 |
|---|---|---|
| 技术形态 | 纯静态前端：HTML + CSS + 原生 JS | 无构建、无依赖、双击即用，满足"不联网、不部署" |
| JS 模块方式 | 普通 `<script>` 标签顺序加载 + 全局命名空间 `App.*` | **不用 ES Module**：`file://` 协议下浏览器禁用模块跨文件加载（CORS），会导致双击打开白屏 |
| 数据存储 | IndexedDB（主）+ localStorage（偏好等轻量数据） | IndexedDB 容量大、持久、适合记录/收藏/素材 |
| 内置数据库 | 以 JS 数据文件随应用打包（只读常量），不写入 IndexedDB | 与用户数据分离，备份只导出用户数据（符合 PRD 7） |
| 界面样式 | 原生 CSS 变量设计令牌 + 卡片式布局 | 轻量、统一、易于调整 |
| 交互反馈 | 原生 JS 实现 Toast、骨架态、空状态 | 零依赖 |
| 测试 | 每个引擎/页面完成后，按 PRD 10 验收项逐条人工验证 | 纯前端，本地浏览器即可验证 |

### 关键约束提醒
- **不能用 `<script type="module">`**，不能用 CDN，所有资源本地化。
- 建议用 **Chrome / Edge** 打开（对 `file://` + IndexedDB 支持最稳）。
- 文件名用英文小写，避免某些路径/浏览器对中文文件名的兼容问题（可用 `index.html` 为入口）。

---

## 2. 项目目录结构

```
取名app/
├── index.html              # 唯一入口（应用外壳 + 各页面容器 + 全局抽屉）
├── css/
│   └── style.css           # 设计令牌 + 全部样式
├── js/
│   ├── app.js              # 应用外壳：导航、路由、抽屉、Toast、页面注册
│   ├── db.js               # IndexedDB 封装（records/favorites/materials/settings）
│   ├── utils.js            # 通用工具：日期、农历换算、拼音、笔画、五行映射、谐音词库
│   ├── data/
│   │   ├── hanzi.js        # 内置汉字库（App.Data.hanzi）
│   │   ├── names.js        # 内置精选名字库（App.Data.names）
│   │   ├── poetry.js       # 内置诗词名句库（App.Data.poetry）
│   │   └── pet.js          # 内置宠物词库（App.Data.pet）
│   ├── engine/
│   │   ├── generator.js    # 通用取名引擎（组合/过滤/打分/换一批）App.Engine.generator
│   │   ├── bazi.js         # 八字排盘 + 五行分析 + 补益推荐 App.Engine.bazi
│   │   ├── poetry.js       # 诗词提炼组合 App.Engine.poetry
│   │   └── score.js        # 名字解析评分 App.Engine.score
│   └── pages/
│       ├── home.js         # 首页（快速取名/上传文献/摘要卡/最近记录）
│       ├── newborn.js      # 新生儿取名
│       ├── bazi.js         # 生辰八字取名
│       ├── poetry.js       # 诗词取名
│       ├── pet.js          # 宠物取名
│       ├── score.js        # 名字解析及评分
│       ├── favorites.js    # 收藏夹（全局抽屉）
│       ├── history.js      # 历史记录（全局抽屉）
│       └── settings.js     # 设置（默认偏好/备份导出/导入恢复）
```

脚本加载顺序（index.html 内）：
`utils.js → data/hanzi.js → data/names.js → data/poetry.js → data/pet.js → db.js → engine/*.js → pages/*.js → app.js`

---

## 3. 数据层设计

### 3.1 IndexedDB 数据库结构
库名 `nameApp`，版本 1，含 4 个 objectStore：

**store: `records`（历史记录）**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | `rec_时间戳_随机` |
| module | string | `newborn` / `bazi` / `poetry` / `pet` / `score` / `home_quick` / `home_upload` |
| title | string | 记录标题（如"李宝宝 · 新生儿取名"） |
| input | object | 本次输入条件快照 |
| result | object | 结果快照（名字列表/解析结果等） |
| createdAt | number | 时间戳 |
| 索引 | module, createdAt | |

**store: `favorites`（收藏夹）**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | `fav_时间戳_随机` |
| module | string | 来源模块 |
| name | string | 名字（如"安澜"） |
| meta | object | 拼音/五行/寓意/出处/适合说明等展示信息 |
| sourceId | string | 来源记录 id（可为空） |
| createdAt | number | |
| 索引 | module, createdAt | |

**store: `materials`（用户上传文献提炼的字词）**
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | `mat_时间戳_随机` |
| fileName | string | 上传的文件名 |
| words | array | 提炼出的好字词列表 `[{char, meaning, tone}]` |
| createdAt | number | |

**store: `settings`（偏好设置，key-value）**
| key | 值示例 | 说明 |
|---|---|---|
| defaultSurname | `"李"` | 默认姓氏 |
| defaultGender | `"男"` | 默认性别 |
| defaultStyle | `["文雅"]` | 默认风格 |
| defaultPetType | `"猫"` | 默认宠物类型 |

### 3.2 db.js 提供的 API
`App.DB.open()`、`App.DB.add(store, obj)`、`App.DB.getAll(store, index?, value?)`、`App.DB.get(id)`、`App.DB.delete(store, id)`、`App.DB.put(store, obj)`、`App.DB.clear(store)`
导出备份：`App.DB.exportAll()` → 返回完整 JSON 对象
导入恢复：`App.DB.importAll(json)` → 校验后清空重建

### 3.3 内置数据库结构（data/*.js）

**hanzi.js — 汉字库**（V1 内置精选常用字，目标 800~1500 字）
```
{ c:'安', py:'an', tone:1, strokes:6, wuxing:'土', meaning:'平安、安定', tags:['文雅','大气','常用'] }
```
字段：`c`字、`py`拼音、`tone`声调、`strokes`笔画、`wuxing`五行、`meaning`寓意、`tags`风格标签数组

**names.js — 精选名字库**（V1 内置 200~400 个）
```
{ name:'安澜', chars:['安','澜'], py:'ān lán', gender:'中性', wuxing:'土水', meaning:'风平浪静，寓意安宁祥和', tags:['文雅'], source:'精选' }
```

**poetry.js — 诗词名句库**（V1 内置 100~200 句，覆盖诗经/楚辞/唐诗/宋词）
```
{ book:'诗经', title:'《关雎》', line:'关关雎鸠，在河之洲', meaning:'...', keywords:['雎鸠','河洲','雎','洲'] }
```

**pet.js — 宠物词库**（按风格分类）
```
{ style:'萌系', words:[{name:'团团', en:'TuanTuan', meaning:'圆滚滚，软萌可爱', fit:'小猫小狗'}, ...] }
styles 含：萌系叠词 / 食物系 / 拟声系 / 洋气音译 / 霸气 / 文艺
```

---

## 4. 引擎设计

### 4.1 通用取名引擎 `engine/generator.js`
- `generateNewborn({surname, gender, styles, tabooChars, generation, count})`：
  1. 从 `App.Data.hanzi` 按性别 + 风格标签过滤候选字
  2. 过滤避讳字（`tabooChars`，含即剔除）
  3. 若设字辈 `generation`：生成 `姓氏+字辈+末字`
  4. 随机组合 → 用"组合分"排序（音律顺口 + 五行均衡 + 字义正面）取前 N
  5. 返回 `[{fullName, chars, py, strokes, wuxing, meaning, score}]`
- `shuffleAndTake(list, count)`：换一批的实现（带随机种子去重，避免与上一批完全相同）
- `filterBy(list, {style, onlyFav})`：风格筛选 / 只看收藏

### 4.2 八字引擎 `engine/bazi.js`
- `compute({solarYear, solarMonth, solarDay, hour, gender})`：
  1. 公历 → 农历（utils 内实现查表/公式，无需联网）
  2. 计算四柱干支：年柱、月柱、日柱、时柱（V1 用公式推算 + 简化节气判断）
  3. 五行统计：天干地支 → 五行映射，统计各五行出现次数，找出**缺失**与**偏弱**
  4. 简化喜用神：取"缺失/最弱"的五行作为补益目标（V1 规则，非专业命理）
- `recommend({surname, baziResult, gender, count})`：
  从汉字库中筛出"五行 = 补益五行"且性别/风格匹配的字 → 组合 → 每个字标注五行 → 返回 `[{fullName, chars, wuxing, matchNote}]`
- 不填时辰：时柱空缺，提示"未填时辰，五行判断较粗略"

### 4.3 诗词引擎 `engine/poetry.js`
- `extract(line)`：从句中提炼可入名的字/词（去虚词、去重复），返回带寓意的候选字
- `generate({surname, keywords, count})`：用提炼字组合候选名，每个名字附 `poem`（原句+出处+释义）

### 4.4 评分引擎 `engine/score.js`
- `analyze({surname, given})` → 返回：
  - `charDetails`：逐字解析（字义、五行、笔画、声调、结构）
  - `dimensions`：分项分（各 0~100）
    - `meaning` 字义寓意（字库寓意正面性）
    - `wuxing` 五行（与补益目标匹配/是否均衡）
    - `phonetics` 音律（声调组合、平仄是否拗口、声母韵母是否顺口）
    - `structure` 字形（笔画是否过多/过少、结构搭配是否协调）
    - `homophone` 谐音（对照谐音词库，命中不良词扣分）
  - `total`：加权总分
  - `comment`：一句话评语（按分数段生成）
- `checkHomophone(text)`：谐音检查，返回风险提示列表

---

## 5. 分阶段开发任务

> 每个阶段有明确"完成标准"，全部来自 PRD 第 10 章可勾选验收项。

### 阶段 0：初始化项目骨架
- [ ] 建目录结构（第 2 节）
- [ ] 创建 `index.html`：外壳结构（顶栏 + 侧边导航 6 项 + 主内容区 + 抽屉挂载点）+ 按序引入脚本
- [ ] 创建 `css/style.css`：设计令牌（主色/间距/圆角/字号）、卡片、按钮、表单、Toast、骨架态、空状态样式
- [ ] 创建空的 `app.js` 占位，6 个页面 js 各建空渲染函数
- **完成标准**：浏览器打开 index.html，能显示完整外壳框架，点击导航切换 6 个空页面，控制台无报错（PRD 10.1）

### 阶段 1：数据层
- [ ] `utils.js`：公历→农历、拼音/声调、笔画、五行映射、谐音词库（常用负面谐音词）
- [ ] `db.js`：IndexedDB 封装 + open/add/get/getAll/delete/put/clear/exportAll/importAll
- [ ] `data/`：搭建 4 个内置库的**种子数据**（先各放一小批验证结构，后续阶段扩充）
- **完成标准**：
  - 控制台能写入一条 records 并读出（PRD 10.2 数据持久化基础验证）
  - `exportAll()` 返回 JSON；`importAll()` 恢复后数据一致（PRD 10.3 基础验证）

### 阶段 2：应用外壳与全局功能
- [ ] `app.js`：路由（hash 或状态切换）、导航高亮、顶栏、收藏夹抽屉、历史记录抽屉、Toast 组件
- [ ] `pages/favorites.js`：收藏夹列表 + 取消收藏 + 空状态
- [ ] `pages/history.js`：历史记录列表 + 按模块筛选 + 清空历史 + 空状态
- [ ] `pages/settings.js`：默认偏好设置 + 一键导出 JSON + 一键导入恢复
- **完成标准**：
  - 收藏/历史抽屉可从任意页面唤出（PRD 2、10.10）
  - 导出下载 JSON，导入后原数据恢复（PRD 10.3）

### 阶段 3：五个业务模块（先做引擎后做页面）
**3.1 新生儿取名**（`pages/newborn.js` + `generator.generateNewborn`）
- [ ] 条件面板：姓氏、性别、风格多选、避讳字、字辈字
- [ ] 结果工具条：换一批 / 风格筛选 / 只看收藏
- [ ] 名字卡片：拼音、笔画、五行、寓意、星标收藏
- [ ] 历史保存（写入 records）
- **完成标准**：PRD 10.5 全部通过（含避讳字过滤、字辈固定中间字）

**3.2 生辰八字取名**（`pages/bazi.js` + `engine/bazi.js`）
- [ ] 三步向导：①出生信息（公历/农历切换、日期、时辰可选、性别、姓氏）②排盘结果（四柱干支 + 五行统计 + 喜用/缺失提示，可视化五行柱状）③五行补益推荐
- [ ] 推荐名字标注每个字五行属性 + 匹配度说明
- [ ] 不填时辰可出结果并提示粗略
- [ ] 收藏 + 历史保存
- **完成标准**：PRD 10.6 全部通过

**3.3 诗词取名**（`pages/poetry.js` + `engine/poetry.js`）
- [ ] 诗词库按出处分类浏览（诗经/楚辞/唐诗/宋词…）
- [ ] 关键词实时检索过滤
- [ ] 点选名句 → 提炼关键字 → 组合候选名（所见即所得）
- [ ] 名字卡附出处原文与释义
- [ ] 收藏 + 历史保存
- **完成标准**：PRD 10.7 全部通过

**3.4 宠物取名**（`pages/pet.js` + `generator` 复用）
- [ ] 宠物信息：类型（猫/狗/鸟/其他）、性别、毛色、性格、风格
- [ ] 风格词库切换（萌系/食物/拟声/洋气/霸气/文艺）
- [ ] 名字卡：含义 + 适合说明；中英文名切换
- [ ] 按宠物存档（记录含宠物信息）+ 收藏
- **完成标准**：PRD 10.8 全部通过

**3.5 名字解析及评分**（`pages/score.js` + `engine/score.js`）
- [ ] 名字输入（姓 + 名，单字/多字）
- [ ] 输入即解析（防抖实时）
- [ ] 分项解析：字义/五行/音律/字形/笔画/谐音
- [ ] 分项评分条 + 总分 + 评语；谐音风险提示
- [ ] 历史保存
- **完成标准**：PRD 10.9 全部通过

### 阶段 4：首页组装（`pages/home.js`）
- [ ] 快速 AI 取名卡片：姓氏 + 场景（新生儿/八字/宠物）→ 一键生成 → 卡片内预览 → 可跳转对应模块深化
- [ ] 上传文献取名卡片：选择本地 .txt → FileReader 读取 → 提炼好字好词 → 存入 materials → 用提炼字生成候选名
- [ ] 5 个模块摘要卡片：各自最近记录、收藏数、常用偏好
- [ ] 最近记录列表：各模块最近一次，点击直达详情
- **完成标准**：PRD 10.4 全部通过

### 阶段 5：内置数据库扩充 + 打磨
- [ ] 汉字库扩充到 800~1500 字（含拼音/笔画/五行/寓意/风格标签）
- [ ] 精选名字库 200~400 个；诗词名句库 100~200 句；宠物词库各风格 20+ 条
- [ ] 谐音词库扩充；Toast/骨架/空状态统一走查
- **完成标准**：各模块生成结果多样性足够，无空结果、无报错

### 阶段 6：全量验收与收尾
- [ ] 按 PRD 第 10 章 10.1~10.10 逐条勾选验收
- [ ] 重点回归：刷新/关闭/重启数据不丢失、备份恢复一致、各模块收藏汇入收藏夹
- [ ] 输出验收结果清单（勾选状态）交付用户
- **完成标准**：PRD 10 全部勾选通过，可交付使用

---

## 6. 开发顺序依赖图

```
阶段0 骨架
  └→ 阶段1 数据层（utils/db/data）
       └→ 阶段2 外壳+全局功能（app/favorites/history/settings）
            └→ 阶段3 业务模块（引擎→页面，可并行开发）
            │    ├ 3.1 新生儿
            │    ├ 3.2 八字
            │    ├ 3.3 诗词
            │    ├ 3.4 宠物
            │    └ 3.5 解析评分
            └→ 阶段4 首页组装（依赖 3.x 的结果数据与记录）
                 └→ 阶段5 数据扩充
                      └→ 阶段6 全量验收
```

---

## 7. 风险与对策

| 风险 | 对策 |
|---|---|
| `file://` 下 JS 模块加载失败 | 统一用普通 `<script>` 顺序加载，禁用 ES Module |
| IndexedDB 在个别浏览器受限 | 验收固定用 Chrome/Edge；如遇异常给页面内提示 |
| 农历换算/八字推算复杂 | V1 用公式 + 查表简化实现，接受"简化五行喜忌"口径（PRD 9） |
| 内置库数据量不够导致结果重复 | 阶段 5 扩充数据；生成时随机种子去重 |
| 谐音误报 | 谐音词库收录常用负面词，解析结果标注"仅供参考" |

---

## 8. 交付物清单（开发完成时）

- [ ] `index.html` + 全部 css/js 源码（本地完整可用）
- [ ] 内置数据库（汉字/名字/诗词/宠物词库）
- [ ] 用户数据备份 JSON 模板（导出文件结构说明）
- [ ] 验收结果清单（对应 PRD 10.1~10.10）
- [ ] `README.md`：如何打开、如何使用、如何备份恢复（可并入交付说明）
