# 独立消费与人工设备验收

本文件提供第一批组件的可重复验证步骤。源码检查、浏览器操作、物理设备触摸和原生屏幕阅读器是不同证据：准备好了步骤不表示已经执行。当前阶段的实际结果见 `QA.md` 末尾的组件库试产记录及 `registry/evidence/`。

## 已执行的源码消费检查

消费项目为同级 `../fiori-registry-consumer/`，独立 package.json / lock / build，导入别名为 `~/`。实际用标准 shadcn CLI 安装 `@fiori/fiori-kit`，创建37个 Fiori 源码、CSS和许可文件；未将作者项目目录配置成消费 alias 或 symlink。

```bash
# 作者项目
npm run registry:verify-consumer -- ../fiori-registry-consumer
npm run test:contracts
```

检查37个安装目标、TypeScript aliases、全部本地导入、运行依赖、字体 data URI 和源码独立性。九项纯逻辑检查分别覆盖外部列/过滤契约及字符串条件语义。宿主 `src/components/ui/button.tsx` 的安装前后 SHA256 一致；这证明安装没有覆盖该文件，不能据此推定宿主按钮的浏览器外观未变化。

证据：`registry/evidence/consumer-install.txt`、`consumer-source-check.json`、`host-button-before.json`、`host-button-after.json`。

## 已执行的独立消费桌面路径 · 2026-10-29

以下是消费页面 `http://127.0.0.1:4188/` 的实际操作，使用仓库、物料和批次数据，不复用作者的型号或采购 fixture。详细焦点与几何读回见 [QA](../QA.md) 末尾“React 试产独立消费”。

| 范围 | 已观察结果 |
| --- | --- |
| 外部数据与提交 | 仓库使用调用方列顺序及“华东 / 西南 / 华南”映射；区域 `west` + 名称“成品”得到唯一 `wh-cd-04` 并单选提交。物料初值 `mat-a01`：Cancel 保留初值，OK 追加 `mat-a02`，删除 token 后回到 `mat-a01`。 |
| 只读与状态转换 | 只读 Value Help 的 F4 不打开，触发按钮 disabled；只读/禁用修改回调仍为0。Select 从初始只读解锁后可打开，选“加急”，再次锁定关闭，解锁仍保持关闭。 |
| 字符串条件 | `Preserve` 初始匹配4个小写 `lot-` 批次并排除 `lot-b2`，大写 `LOT-A1` 不匹配；仅保留排除后匹配5条，包含大写批次。新增半端 BT 触发 Warning，Cancel 回缺失输入，补齐第二端后 OK 提交。 |
| 消息与调用方校验 | 初始2条 error、1条 warning、1条 information；warning 分类为1条。详情、Shift+Enter 返回、Alt+Enter 定位 `consumer-stock-material` 与 `material-required` 回调已操作。修正物料/库位/数量50/备注后仅1条成功消息，状态为“已保存”；从消息按钮打开再 Close，焦点回 `stock-message-trigger`。 |
| Provider 与宿主隔离 | 第二弹层父容器为 `comparison-provider`，密度为 cozy，ref 定位 `comparison-input`。桌面消息弹层440×320px，字体 Fiori 72；Compact Select 高26px、Cozy Input 高36px。Provider 外宿主 Button 的紫色、Geist、10px圆角、32px高度及原生 Input 的 Geist、6px圆角、35.5px高度保持原值。 |

axe 首扫发现源 textbox 使用不适用的 `aria-expanded`，以及只读 InputGroup 被禁用触发按钮连带降低 opacity。源码已修复并进入标准 CLI 更新；最终 axe 复扫与手机回归尚待记录，不能把首扫后的修复直接标为验收通过。真实触屏及 Safari / VoiceOver 仍未执行，步骤如下。

## 浏览器验收步骤

当前消费项目的预览配置为 `http://127.0.0.1:4188/`。先完成其生产构建和HTTP预览，再按消费页实际标签执行下面流程；不要以源文件存在或 build 成功代替页面结果。

| 范围 | 操作与期望 |
| --- | --- |
| 外部单选目录 | 打开 Value Help，检索调用方提供的ID/名称，选择结果，关闭后回填调用方受控值并回焦源字段。换查询与属性筛选，确认不依赖原型号目录字段。 |
| 外部多选目录 | 跨查询选择至少两项，Cancel/Escape保留已提交值；重新打开恢复提交值，OK提交新草稿。删除token后检查行checkbox同步。 |
| 条件字段 | 输入包含范围与排除条件，确认结果由调用方过滤；有一端缺失的区间出现Warning，Cancel回缺失输入，OK忽略不完整行。测试Preserve和UpperCase实际配置，不混用结果。 |
| 消息组件 | 调用方提供不同严重程度消息，检查最高级别数量、全部/分类、详情/返回、消息定位回调和最终字段焦点；关闭回trigger。单消息打开详情与多消息列表分别验证。 |
| 密度与主题隔离 | 并列 Compact/Cozy Provider 内控件使用不同尺寸，打开各自弹层仍保持所属密度和字体；Provider 外宿主控件不继承 Fiori 颜色、字体、尺寸或焦点样式。宿主 `@theme` 的 `--color-primary`、`--color-border` 使用字面量或指向不同名称的变量，再对照安装前后宿主 Button/Input/Select 的 computed styles，避免仅验证标准 `var(--primary)` 配置。 |
| 窄屏 | 390px视口中Value Help、条件、Select和MessagePopover采用预期全屏视图；页面无整体横向滚动，关闭/返回路径正常。视口模拟只记为浏览器响应式证据。 |
| 基础状态 | Button Enter/Space、只读/禁用Input、Select方向键/Enter/Escape、MessageStrip关闭及恢复；不把静态状态样本计为实际交互通过。 |

每项记录：实际数据ID、动作、结果、focus元素ID/可访问名称、密度、窗口尺寸与截图。读 DOM/AX 能核对语义和焦点，不等同于屏幕阅读器实际朗读。

Registry 的 `--color-fiori-*` 映射与宿主 color utilities 分开登记，组件 staging 使用 `bg-fiori-primary`、`text-fiori-muted-foreground` 等类名；Provider 内才定义实际主题变量。此验收分别核对映射隔离与区域样式隔离。Provider 代表整个 Fiori 区域，内部通用 `data-slot` 控件遵循该区域规则；宿主对照控件应放在 Provider 外。并列 Provider 可用，嵌套 Provider 暂不支持。

## 真实触屏设备检查（待执行）

本轮最终浏览器验收已执行1280×720与390×844：单选、多选确认/取消、token删除、只读/禁用、Select动态只读、Preserve包含/排除与Warning、消息分类/详情/返回/ref定位和重新校验通过。手机Value Help、嵌套Select、条件与消息均为390×844，整体页面无横向溢出；两个并列Provider的密度和字体隔离、宿主紫色Button/Geist字体保持已读回。详细动作、截图与具体ID见[QA](../QA.md)。

axe 4.14.0复扫普通桌面、手机页面与手机Value Help均未报告违规。7个颜色未判定节点已另按computed颜色与真实背景位置复核，弹层11个aria-hidden-focus未判定节点另做模态Tab边界检查。自动扫描、颜色计算和键盘证据各自保存；这些结果不等同于真实触屏或屏幕阅读器验收。

使用一台真实 iPhone/iPad 或 Android 设备。准备可从该设备访问的同一构建；本机 `127.0.0.1` 不能直接由手机访问。设备入口和网络安排完成后，再填写结果，不用浏览器模拟结果替代。

1. 记录设备型号、系统版本、浏览器版本、横竖屏、构建指纹与访问入口。
2. 用手指打开单选、多选Value Help，搜索时显示软键盘。观察键盘弹出后搜索字段、当前结果和底部OK/Cancel是否可达。
3. 在结果列表中上下触摸滚动，点击行与checkbox；触摸滚动不能误提交行，单次点击不能双切换。搜索后跨结果选择、取消及确认，核对受控值。
4. 打开条件字段与操作ComboBox，测试触摸展开、选择、输入两端、删除条件和Warning的Cancel/OK；软键盘不应遮挡缺失输入与确认操作。
5. 从筛选页进入嵌套Select，全屏选择后返回；关闭Select仍停留在原筛选页，关闭主Value Help再回源字段。检查标题、返回与关闭按钮可见并可点。
6. 打开MessagePopover手机页，触摸类型筛选、详情/返回和消息标题定位。定位后主弹层关闭、目标字段可见；输入修正后重新打开得到新消息。
7. 横竖屏各做一次，检查全屏高度、浏览器地址栏伸缩、安全区、滚动锁和关闭后的页面滚动。记录实际失败路径与截图/视频。

结果填写为“通过 / 失败 / 未执行”，并保留设备与动作证据。没有物理设备时保持“未执行”。

## macOS VoiceOver 与 Safari 检查（待执行）

记录 macOS、Safari与VoiceOver版本，以及消费构建指纹。用 Safari 打开独立消费页，然后启用VoiceOver（通常为 Command+F5；部分键盘需要Fn）。下面的VO表示 Control+Option，也可使用用户配置的VoiceOver修饰键。实际按键可因系统设置不同而变化。

1. 用VO+Right逐项浏览页面：标题、区域、字段标签、只读/禁用状态、按钮名称与状态顺序正确。宿主区域和两个Fiori Provider不能形成重复或跳过的阅读内容。
2. 用VO+Space激活Value Help源触发器。应听到Dialog标题或进入弹窗内容；Basic Search有明确可访问名称。继续浏览列头、结果ID/名称和多选checkbox，确认隐藏的原生checkbox没有重复朗读。
3. 检索并选择外部目录中的一个结果。单选回填后焦点回源字段；多选分别测试Cancel保留与OK更新。重新打开时已提交项的选中状态应可感知，token删除按钮应有对应值名称。
4. 在条件页浏览操作ComboBox及值输入。读取可编辑ComboBox当前操作与候选，选择between并只填一端；Warning应作为独立警告Dialog被读取，Cancel回缺失字段。修正后确认，源token的值与删除动作有可访问名称。
5. 浏览静态MessageStrip时应读到信息内容及关闭按钮名称；颜色不是唯一信息。关闭并恢复后确认可读性，按该组件实际role判断，不要求静态note无条件打断朗读。
6. 激活消息trigger，核对严重程度与数量；读取类型筛选的选中状态、消息列表与详情标题。返回后应回原消息，激活消息定位后关闭弹窗并到调用方目标字段。
7. 在可交互控件组中另做键盘Tab/Shift+Tab、Escape、Enter、Space、方向键检查。VoiceOver导航与DOM Tab序列分别记录，不能把某一种成功推广成全部模式通过。
8. 关闭弹层后继续VO导航，检查没有隐藏页残留、丢失焦点或重复内容。结束后恢复测试前的VoiceOver设置。

记录实际朗读文本、角色、状态和焦点落点；发现名称不清或顺序异常时，记录最短复现步骤。截图/AX树只能辅助定位，必须听到/观察到VoiceOver输出才能标“通过”。

## 验收记录模板

| 项目 | 环境/版本/构建 | 动作 | 实际朗读或界面结果 | 焦点/值 | 状态 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| 例：多选Cancel | 待填 | 待填 | 待填 | 待填 | 未执行 | 待填 |

正式关闭本轮专项前，分别记录桌面浏览器、响应式模拟、真实触屏、原生VoiceOver结果。任何未执行项保持边界，不通过自动检查的数量替代。
