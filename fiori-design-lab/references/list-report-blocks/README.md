# List Report 区块：来源、基线与复核场景

本轮将已有采购列表提炼为 React 的 `DynamicPage`、`FilterBar`、`TableToolbar`、`ResponsiveTable` 和 `ListReport`，再由独立库存应用消费。交互使用 shadcn / Base UI 和本地 React 状态；下列 UI5 文件只作为行为依据，不作为运行时依赖，也不复制完整 vendor 源码进 Registry。

本文列出来源和可重复验证步骤，**不表示本轮React实现或设备验证已经通过**。本轮专项结果、截图与失败修复另记在 [List Report 验证记录](../../docs/list-report-validation.md)，既有记录见 [QA](../../QA.md)。公共 API 与组合职责见 [List Report API](../../docs/list-report-api.md)。

## 版本与来源

| 层次 | 基线 | 用途 |
| --- | --- | --- |
| 设计规范入口 | SAP Fiori for Web **v1-151** | List Report 的结构、Filter Bar、Dynamic Page、Table Toolbar、Responsive Table 的规范入口。 |
| 控件行为源码 | SAPUI5 **1.151.0**，2026-10-29读取 | 固定版本的默认属性、pin条件、overflow数据与表格键盘行为。 |
| 主题 | Morning Horizon；`@sap-theming/theming-base-content@11.36.5` | 复用已有字体、图标、主题、Compact/Cozy映射，不增加另一个主题系统。 |
| 对象页已有参考 | OpenUI5 nightly **1.155.0-SNAPSHOT** | 仅保留原对象页样本的独立基线，不用于声称本轮 List Report 对应同一版本。 |

官方设计规范入口：

- [List Report](https://www.sap.com/design-system/fiori-design-web/v1-151/page-types/floorplans/list-report-floorplan-sap-fiori-element)
- [Dynamic Page](https://www.sap.com/design-system/fiori-design-web/v1-151/page-types/page-layouts/dynamic-page-layout)
- [Filter Bar](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/filter-bar)
- [Table Toolbar](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/table-bar)
- [Responsive Table](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/responsive-table)
- [Toolbar Overview](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/toolbar-overview)

读取边界：2026-10-29的文本工具对v1-151 List Report、Filter Bar、Table Toolbar只返回标题与`Usage`包装页；`/usage`正文未成功读取。计划中的规范规则同时参考本地 SAP Fiori guideline 技能整理的正文，但该整理不能视为一份完整、固定的v1-151网页快照。固定版本实现细节以下表的官方源码读回为准；最终视觉与交互复核应在官方页面/示例中逐状态对照，记录实际网址和版本。

| 官方固定源码 | 本轮读取的SHA256 | 主要依据 |
| --- | --- | --- |
| [DynamicPage-dbg.js](https://ui5.sap.com/1.151.0/resources/sap/f/DynamicPage-dbg.js) | `b777ff0b9d53bb9a8dee3eb0421bb877ee64e9280acadd236777b029ee4a8ff3` | `headerExpanded`默认true，title click、scroll和pin状态；页头高度超过60%时不可固定。 |
| [DynamicPageHeader-dbg.js](https://ui5.sap.com/1.151.0/resources/sap/f/DynamicPageHeader-dbg.js) | `4b5e9ae94861ea13b5984358f640bb97473e9b4fc5f62520a1f0f7898fb3d71a` | `pinnable`默认true；没有header内容或phone设备时不提供pin。 |
| [FilterBar-dbg.js](https://ui5.sap.com/1.151.0/resources/sap/ui/comp/filterbar/FilterBar-dbg.js) | `fbf6ce594df8a088d9faa82956fce005d4055928204c029d02af244271bfb54d` | Go属性、搜索事件、Adapt Filters状态；本库的FilterBar只负责布局，搜索/弹窗由调用方组合。 |
| [OverflowToolbarLayoutData-dbg.js](https://ui5.sap.com/1.151.0/resources/sap/m/OverflowToolbarLayoutData-dbg.js) | `8df90b242477838cd47e3e345c33a253bf3ac9e5781d6b92dd4b0ab56dbc2ce6` | priority、group与overflow行为；完整UI5优先级引擎不属于本轮。 |
| [Table-dbg.js](https://ui5.sap.com/1.151.0/resources/sap/m/Table-dbg.js) | `867dfb9e5aed69344b922f3cbc6aefdbf5cd61921bfa9147512161ffdb6d1738` | 行/单元格导航、manual/auto pop-in差异；本轮采用调用方列断点配置。 |
| [ListBase-dbg.js](https://ui5.sap.com/1.151.0/resources/sap/m/ListBase-dbg.js) | `14c2bebcb8fd748f442f2b6485b1b76f7d0149f085a936473faee1836b05bcc6` | `growingThreshold=20`、`keyboardMode=Navigation`与选择/键盘行为。UI5的`growing`与`growingScrollToLoad`默认均false，本轮显式选用滚动追加。 |

现有 [表格键盘来源索引](../table-keyboard/source-index.json) 还包含ColumnListItem、ListItemBase、ItemNavigation的固定版本URL与hash。[键盘说明](../table-keyboard/README.md) 中的既有采购页结果属于上一轮，不能直接记为新公共组件和库存消费的验证结果。来源文件各自的版权声明仍适用；本文不将SAPUI5源文件标为Apache或随包授权。

### 固定版本Dynamic Page运行观察

本轮已由组件验证代理打开[DynamicPageFreeStyle官方样本](https://ui5.sap.com/1.151.0/#/entity/sap.f.DynamicPage/sample/sap.f.sample.DynamicPageFreeStyle)，iframe版本SAPUI5 1.151.0、主题sap_horizon、视口1280×900。官方样本展开的DynamicPageHeader内容高度为82.4140625px，document根字体16px；`ceil(82.4140625) - 16 = 67`。从scrollTop67向上wheel1px到66读回expanded=true，再向下wheel1px回67读回expanded=false。这是官方样本状态观察，不是本轮React回归通过结论。

对应本机截图为根目录`output/playwright/ui5-reference/dynamic-page-threshold-66-expanded-1280.png`与`dynamic-page-threshold-67-collapsed-1280.png`，同目录另有expanded、scrolled-collapsed、pinned-scrolled及manually-collapsed-after-pin截图。截图和观察描述区分“官方行为基线”与“React实现回归”；最终React结果另记专项记录。

已保存[官方运行证据JSON](../../../output/playwright/ui5-reference/dynamic-page-evidence.json)与[场景步骤说明](../../../output/playwright/ui5-reference/README.md)，包括9个场景及9张截图、iframe版本/主题、源码hash和实现差异。scope只覆盖桌面DynamicPage样本，未覆盖完整ListReport或TableToolbar；DemoKit外层SDK的console状况也单独保留，不能当作目标React应用的console审计。

官方另读回：内容中段500→300向上滚动后仍collapsed，对应`dynamic-page-upscroll-300-still-collapsed-1280.png`。未固定、顶部0手动Collapse后滚动到83（ceil(H)）；pin后在500手动Collapse，解除pin并滚动到67（T）。中段500手动Expand后，官方因header内容在滚动区/title区之间移位而补偿到417；当前React普通flow/sticky结构保持500。最后一个分支是明确的实现差异，最终结果不能写作所有snap/click行为完全一致。

## 需要保持的状态约束

### 页头与筛选

- Dynamic Page通用初始状态可展开；List Report调用层根据是否已执行查询决定初始状态。无查询、内容尚为空时展开，已有查询结果时可收起。已有采购页面保留其显式初始状态，独立库存调用方明确自己的初始化。
- 标题持续可见，收起时显示当前**已应用**筛选摘要。无筛选时使用`No filters active`；有筛选显示数量和至多五个名称，再用省略号。摘要不是尚未提交的弹窗草稿。
- 桌面筛选横向排列、label在控件上方，宽度不足换行；tablet默认收起，phone不把整块桌面筛选挤进页头，而从筛选入口打开Dialog。手机Dialog、草稿、Go/OK/Cancel和返回焦点由调用方管理。
- 未固定时按阈值snap：`T = max(ceil(H) - R, 0)`，H为展开header内容的实际DOM高度，排除title；R为document根元素1rem。`scrollTop >= T`收起，回到T以下或0时展开。在内容中段向上滚动、但仍超过T时保持收起。整个header高度只供sticky offsets使用，不代替H。pin使展开内容在滚动时保留；点击收起或标题空白的snap动作覆盖pin并清除固定状态，标题内按钮/字段/链接不应误触发title snap。
- 手动collapse核对顶部未固定→ceil(H)、中段已固定→T并解除pin；中段手动Expand还需单独记录header移位/scroll-position补偿。本轮React在最后一个分支保持原scrollTop的结构差异必须保留，不能由T/T-1断言通过覆盖。
- phone、没有页面滚动、页头内容过高且超过可用页高60%时不提供pin，并清除失效的固定状态。不能为了保留图标而遮住结果区。
- live模式立即应用值，无Go；manual模式编辑与应用分开，由Go/Enter提交。结果过期的overlay和loading由调用方显式传入/组合。本轮不新增后端查询或UI5 FilterBar完整状态机。
- List Report初始焦点需按使用场景配置：展开live→首个筛选控件，展开manual→Go，存在空必填→首个空必填，收起→首个表格行。Dynamic Page本身不决定业务初始焦点。

### 表格工具栏

- 表格标题与可选counter位于左侧，零行不显示counter；右侧只放需要的表格操作。不自行添加不存在的业务按钮。
- 官方动作组完整顺序为finalizing→business→modification→personalization→share→export→view→end。本轮只提供business→personalization→export→view四组子集，按此顺序排列，组间用分隔线。
- 主操作、Create/Delete/Add/Remove等必须保留可见，由调用方配置`overflow="never"`；可溢出的操作从右侧进入overflow，入口保留名称、禁用状态与原动作回调。UI5的priority/group完整算法仍是独立能力，不可由此四组推定等价。
- List Report以Filter Bar作为主要筛选入口时，不另加重复table search/filter。空选择时禁用需要选择的操作；业务是否允许应用到所选行由调用方决定。

### 响应式表格、growing与键盘

- 表格随页面竖向滚动，toolbar/column header可sticky；避免独立横向滚动容器。列断点针对实际表格宽度，而非假定整个viewport都属于表格。
- 采用manual pop-in：调用方提供每列`minWidth`，优先保留对象标识和关键属性。断点以下的列在同一逻辑行下面展示label/value，不把信息直接丢掉；至少一列留在表格。
- `rows`是调用方已加载的完整结果；公共组件分批渲染，默认20行，滚动到末尾继续追加。本轮不是服务端分页，count表示全结果数量，键盘仅在当前已渲染行间移动。
- 选择由外部ID数组与回调控制；growing追加保留仍有效的选择。筛选更新后是否重置选择，由应用在同一次状态提交中处理；本轮列表调用方按筛选更新清空选择。不要用已选择行数量替代结果counter。
- 只读Navigation模式：Tab进入记忆的导航节点，方向键、Home/End、PageUp/PageDown移动；Enter导航，Space选择，Ctrl/Meta+A选择；F2/F7在导航节点与已有控件间切换。没有选择/导航回调时不制造对应功能。pop-in是行的描述，不是独立可编辑grid cell；进入pop-in的render不应带可聚焦控件，以免视觉行aria-hidden与键盘焦点冲突。
- 不覆盖UI5 Edit模式、范围选择、虚拟化、全套F6分组跳转、任意嵌套控件快捷键、完整读屏公告、OData或元数据驱动Fiori Elements。

## 可重复截图与键盘场景矩阵

视口以CSS px记录，浏览器缩放固定100%。桌面1280×720与tablet宽度900×720分别检查Compact、Cozy；phone390×844检查Cozy，并确认宿主即使偏好Compact也使用手机尺寸。900px是本轮中等宽度测试点，不等于UI5的设备分类承诺。每个案例分别在采购作者页面、独立库存消费页面执行。

| 场景ID | 视口/密度 | 操作与预期 | 建议证据 |
| --- | --- | --- | --- |
| LR-01 初始布局 | 1280/900，Compact/Cozy | 读取title、筛选布局、toolbar与table；无query/有query初始化分别符合调用方配置，无额外说明栏或横向溢出。 | expanded/collapsed截图，初始焦点名称与DOM尺寸。 |
| LR-02 collapse/scroll | 1280/900，Compact/Cozy | 读取H、根1rem与T；展开滚到T收起，向上到T-1展开；在远超过T的中段向上滚动保持收起。标题空白click切换，内嵌按钮click不切换；sticky标题/toolbar/列头不互相覆盖。 | H/R/T、T与T-1截图、滚动位置和aria-expanded。 |
| LR-03 pin/manual snap | 1280/900，Compact/Cozy | 展开→pin→下滚保持展开→unpin；pin后手动collapse清除pin并回T，顶部未固定collapse补偿到ceil(H)；中段manual Expand补偿单独记录差异；增高header超过60%时pin消失且内容可用。 | pinned/collapsed截图、H/T与scrollTop、aria-pressed、焦点位置。 |
| LR-04 phone筛选 | 390，Cozy | 页面保留标题和筛选入口；打开筛选Dialog、修改草稿、Cancel/Escape不应用，确认/Go应用；关闭回入口。无pin，Select/Value Help保持自身全屏与返回行为。 | phone页/筛选Dialog截图、关闭后activeElement。 |
| LR-05 overflow | 1280/900/390，各适用密度 | 用相同actions缩小宽度，never动作保留；auto进入overflow，组顺序、名称、disabled与回调一致。Escape关闭回overflow trigger。 | toolbar/overflow截图、每个动作触发次数。 |
| LR-06 pop-in | 1280/900/390，各适用密度 | 按实际table宽度缩放；关键列留在表格，其余label/value下移；column显隐/重排后仍对应正确行，没有重复/丢失值。 | table宽度、可见header与pop-in截图。 |
| LR-07 growing | 1280/390，各适用密度 | 结果超过20；初次仅渲染首批，下滚追加直到完整；append不改变已选ID、不跳焦点；筛选为0后呈现明确空态，再恢复。 | 渲染/结果数量、最后一行ID、追加前后焦点。 |
| LR-08 selection | 1280/900/390，各适用密度 | 单行/全选、取消、growing后选择范围；无选择时selection-dependent操作禁用；筛选应用按调用方约定清空选择。 | selectedIds、checkbox mixed状态和业务回调参数。 |
| LR-09 keyboard | 1280/900，Compact/Cozy | Tab一次进入table；方向键、Home/End、PageUp/Down；Enter行导航；Space与Ctrl/Meta+A选择；F2进入checkbox/链接、F7返回行；离开再进恢复合法节点。 | 操作序列、activeElement与导航/选择事件。 |
| LR-10 边界焦点 | 1280/390，各适用密度 | 聚焦行被筛选掉、聚焦列被隐藏、空结果、追加结果后再次Tab；不存在的节点退回合法row/header，不残留失焦陷阱。 | 状态更新前后焦点与Tab路线。 |
| LR-11 宿主隔离 | 1280/390，各适用密度 | 库存应用的宿主控件在Provider外，Fiori区块与Dialog在内部；安装后无alias/symlink回作者，宿主颜色/字号/圆角不受影响。 | 源码闭包、computed styles与并排截图。 |

每条结果记录为`通过/失败/未执行`并写明URL、浏览器版本、视口、density、输入ID和截图文件。浏览器viewport、DOM/AX、axe检查分别记录；真实触屏、软键盘、Safari/VoiceOver需要独立设备记录，不能以截图矩阵代替。当前本文只建立步骤，没有新增已通过结果。

## 本机实现回归脚本

仓库根目录的[scripts/list-report-regression.mjs](../../../scripts/list-report-regression.mjs)使用Playwright Chromium运行采购作者与独立库存页面。先安装根目录与两子项目依赖、执行两端build；脚本默认启动临时生产预览`127.0.0.1:4278/4288`，结束后停止这两个进程，不占用日常4178/4188预览。

```bash
node scripts/list-report-regression.mjs --capture-only
```

`--capture-only`执行交互断言并采集截图，但不做像素比较。人工检查截图与相应官方状态后，可以用`--update-baselines`建立或更新本平台基线；后续默认执行比较：

```bash
node scripts/list-report-regression.mjs --update-baselines
node scripts/list-report-regression.mjs
```

截图与`report.json`写入根目录`output/playwright/current/`，平台基线位于`output/playwright/baselines/<process.platform>/`。比较中单像素RGB通道差异超过12才记为变化，变化像素比例上限为0.5%；尺寸不同记为全图变化。没有该平台基线时，默认比较不能判为通过，需先建立并审查基线。`--external`改为使用已启动的4178/4188服务，此时脚本不负责服务生命周期。

这套基线是**当前React实现的回归证据**，用于发现同一环境后续改动；它没有把UI5截图当作expected image，也不能证明官方组件逐像素一致。`--update-baselines`只是替换expected文件，不能作为自动修复或掩盖不符合规范的结果。官方对照、人工视觉判断、脚本断言/像素比较与真实设备验收分别记录。

脚本覆盖目标为采购Compact/Cozy、展开/固定/跨阈值滚动、过滤、选择/growing/部分键盘、900/390 pop-in/overflow，以及库存外部rows、业务回调、空态、导航和手机布局；滚动断言正按上述官方阈值观察修正，最终结果待专项回归记录填写。上方完整矩阵仍包含需要人工或额外脚本覆盖的场景，不能用一次脚本成功将所有矩阵行统一标为通过。
