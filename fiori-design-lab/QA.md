# MessageStrip 对齐与值帮助间距修复 · 2026-10-29

本轮只修两处视觉问题。共享 Alert 移除 shadcn 默认的 `translate-y-0.5` 图标位移，避免独立 CSS translate 仍保留2px偏移；条件预览专属 FieldSet 补齐桌面24px、手机16px水平内边距，底部分别留24px和20px。没有修改条件交互或其他页面内容。

生产构建重新加载后，information、positive、critical、negative 四条 MessageStrip 的 SVG 与标题矩形均高16px，纵向偏差从2px变为0px，computed translate 为 none。桌面条件标题、字段与结果表左边均为x265，与单选/多选区域的内容对齐；390px手机视口均为x33，卡片边x16含1px边框加16px内边距，页面 clientWidth/scrollWidth 均390。条件表底部留20px，不与下方说明重叠。清除视口覆盖后保留桌面值帮助预览。

`npm run build`、`npm run lint`通过，浏览器 error/warn 日志为空。截图：`screenshots/message-strip-alignment-fixed.png`（完整页面）、`message-strip-alignment-detail.png`（同一截图的局部）、`screenshots/value-help-padding-fixed.png`。

---

# 五项验证补齐与回归 · 2026-10-29

本轮补齐采购列表只读表格键盘、基础控件状态、Value Help 条件、消息系统，并回归 Object Page 页头。应用继续使用 React、shadcn 和 Base UI；SAP 主题、字体、图标与官方源码仅作为静态资源或对照证据，没有引入 UI5 控件运行时。新增校验与条件过滤独立于采购单和官方对象页，不增加 sample 原本没有的业务 handlers。

对象页内容与动态页头参考保留 **OpenUI5 nightly 1.155.0-SNAPSHOT**；基础控件、条件、表格键盘和 Message Popover 对照固定为 **SAPUI5 1.151.0 / Morning Horizon**，设计规范为 **v1-151**。不同版本分别记录。官方原始文件、来源与 SHA256 在 `references/basic-controls/`、`table-keyboard/`、`value-help/conditions/` 和 `messages/`；这些文件不参加应用运行。

以下结果来自本轮应用内浏览器的真实操作，检查入口为 `http://127.0.0.1:4178/#/orders`、`#/components` 与 `#/orders/PO-48865`。手机使用 **390×844 浏览器视口模拟**，不等于真实触屏设备验收。旧记录保留在本文后部；旧 items-only 范围是当时的事实，当前已额外实现独立 conditions-only 示例。

## 1. 采购列表与只读表格键盘

| 检查项 | 本轮实测结果 |
| --- | --- |
| 32条数据与全选 | 首批20条全选后滚动追加到32条，保持32条已选；Ctrl/Meta+A可全选及反选32条。原 PO-48865 与其对应对象页仍保留官方样本值。 |
| 行、单元格与控件 | F2进入checkbox，Tab移动到行导航按钮，F7回到行；Supplier单元格ArrowDown保持同列，Home到selection、End到navigation。 |
| 翻页键 | 首行Supplier按PageDown到`PO-48884:supplier`，PageUp回到`header:supplier`。 |
| 空结果与响应式回退 | 空结果仍有可Tab进入的header，导出禁用；桌面Supplier单元格跨手机视口后，Tab入口回退到所属row，避免已隐藏列持有入口。 |
| Sticky表头 | 滚动时toolbar为y140、h48，表头th为y188、h52.5；表头位于toolbar之后，键盘操作保持可见。数值为当时桌面视口的现场测量。 |
| 设置提交与取消 | View Settings取消保留原列；确认Supplier前移、Factory隐藏及Amount降序后，列表按设置显示。 |
| 筛选及视图恢复 | MotionWorks返回5条。保存“QA采购视图1029”后reload仍恢复5条结果、列顺序和排序；空视图名报错。Heavy搜索使视图标记`*`，重选该视图恢复结果且去掉`*`。临时视图已删除，最终回到Standard。 |
| CSV | 导出6个可见列与5条记录。ID为PO-48870、PO-48876、PO-48882、PO-48888、PO-48894；Amount按降序为968.99、951.74、934.49、917.24、899.99。下载文件经Python解析核对。 |

参考 `references/table-keyboard/README.md` 中的官方Navigate-mode源码和实际UI5操作记录。当前实现不包含完整Edit mode、可编辑单元格、范围选择、虚拟化导航或全部内嵌控件快捷键。

截图：`screenshots/purchase-table-keyboard-sticky.png`、`screenshots/purchase-view-restored.png`。

## 2. 基础控件状态与Dialog

| 检查项 | 本轮实测结果 |
| --- | --- |
| Button / Checkbox | Button按Enter使次数读数递增；Checkbox按Space切换，readonly保持原值，部分选中点击后变为普通checked=true。 |
| RadioButton / Input | 标准Radio按ArrowRight选择另一项，readonly不变；readonly Input保持原文本。 |
| Select桌面 | readonly Select按Alt+Down仍为expanded=false；普通Select按Escape关闭并回焦trigger。修复Base UI默认readonly仍能响应Alt+Down打开的路径，保留只读控件焦点。 |
| 密度 | Cozy Checkbox和Radio可见尺寸均22px，Select高度36px；Compact/Cozy状态矩阵分别留有截图，尺寸规则及来源见`references/basic-controls/README.md`。 |
| 手机Select | 选择页全屏；Close关闭回焦trigger，选择“加急”回填字段。 |
| Dialog草稿及校验 | 空名称不能保存；Cancel保留原已保存值，重新打开重置草稿，Save更新读数。Tab循环和Escape关闭回焦trigger；点击弹窗外的h1不关闭Dialog。手机Dialog矩形为x0/y0/390×844。 |
| 手机Value Help内嵌Select焦点 | 制造商Select点击Close后，activeElement.id为`value-help-multiple-filter-manufacturer`、role为combobox，与expected trigger严格相等；浏览器AX焦点为“制造商”。`aria-label=null`是因为通过Field关联名称，DOM/AX焦点核对通过。 |

修正依据包括内部焦点圈、普通/强调按钮字体、只读虚线、语义字段色、Checkbox部分选中方块、Select选中项无额外tick、MessageStrip默认图标及浅色边框、ObjectStatus独立文字/图标色。20份基础控件原始参考文件的SHA256与字节数核对一致；TypeScript、相关文件scoped ESLint与最终全局lint通过，`theme:check`194/194变量一致。代码和截图不代表全部UI5 API或Input值状态消息浮层已实现。

截图：`screenshots/basic-states-compact.png`、`screenshots/basic-states-cozy.png`、`screenshots/select-phone.png`、`screenshots/object-page-shared-controls-phone.png`。官方Select对照：`screenshots/ui5-select-state-reference.png`。

## 3. Value Help条件与Warning

| 检查项 | 本轮实测结果 |
| --- | --- |
| 条件集合与回填 | `between RA09-01...RA09-04`加`not equal to RA09-02`提交后返回3行：RA09-01、RA09-03、RA09-04。加入`starts with RA11`后返回9行；删除排除token后返回10行。 |
| 条件操作与格式 | 可编辑操作ComboBox按输入过滤，ArrowDown导航保留筛选文本；型号编号按UpperCase处理，token使用官方格式。包含取并集，再移除排除匹配值。 |
| 不完整区间 | 仅填写between的一端时出现官方Warning。Cancel返回缺值字段；OK忽略不完整行并提交完整有效条件。 |
| 手机与源token | 390px手机条件页已操作核对；源token的键盘导航与删除已检查。条件结果保持在独立36条型号目录，未改写采购列表或官方对象页。 |

本例明确配置扩展排除操作；UI5默认排除列表并不默认包含所有扩展操作。它是独立`supportRangesOnly`风格示例，没有合并选行与条件页的全部ValueHelpDialog变体，不包含日期/数值类型、多个key、条件分页、suggestions或服务端查询。范围、排除集合、空值、UpperCase及不完整条件另有四项语义检查脚本`scripts/verify-value-help-conditions.mjs`，本轮四项语义检查全部通过，语义检查与浏览器结果分开看。

截图：`screenshots/value-help-conditions-results.png`、`screenshots/value-help-conditions-phone.png`。官方对照：`screenshots/ui5-conditions-reference.png`、`screenshots/ui5-condition-warning-reference.png`。

## 4. 消息系统、详情与字段定位

| 检查项 | 本轮实测结果 |
| --- | --- |
| 初始保存与严重程度 | 初值保存自动打开2条Error、1条Warning、1条Info，共4条；触发按钮显示最高严重程度的2条Error数量。 |
| 分类及详情焦点 | 各类型筛选数量与列表正确；详情按Shift+Enter返回原消息行并恢复行焦点。桌面消息区域440×320px，最终为标题/关闭header加独立分类行。本地与官方标题同为72-Bold/72-Boldfull family、fontWeight400、fontSize16px，不因weight400误改字体。 |
| 字段定位 | 客户名称、邮箱及数量activeTitle实际定位并聚焦对应字段；修正客户名与邮箱后，Warning+Info+Success仍可保存。数量0产生Error；改为5并填写备注后只有Success，打开时直接进入其详情。 |
| 手机行为 | 消息页为x0/y0/390×844；手机Alt+Enter激活标题后的最终焦点是customer字段，Close/Escape回到消息trigger。 |

这是独立本地校验与模拟保存，不包含UI5 MessageModel、OData错误绑定、异步长文本或真实业务保存服务。官方guideline正文请求受限的事实保留在`references/messages/README.md`，本轮没有声称已读取受限正文。

截图：`screenshots/message-popover-desktop.png`、`screenshots/message-popover-phone.png`。官方对照：`screenshots/ui5-message-reference.png`、`screenshots/ui5-message-list-reference.png`。

## 5. Object Page页头回归

| 检查项 | 本轮实测结果 |
| --- | --- |
| 手机到桌面手动展开 | 手机Products定位后切回桌面，下方点击Expand保持`collapsed=false`、`docked=true`，现场scrollTop348.5。继续真实滚动可恢复snapped；再次展开不被异步布局补偿立即关闭。 |
| Pin与Anchor | Pin后选择Contact anchor，保持`collapsed=false`、`docked=true`、`pinned=true`，scrollTop666.5。 |
| Unpin后真实滚动 | Unpin后PageUp，变为`collapsed=true`、`docked=false`、`pinned=false`，scrollTop391.5。 |

根因是展开改变页头与尾部padding，异步滚动位置夹紧可能发出scroll事件。只按scrollTop差值判断会把布局补偿当作用户继续滚动。本轮修正为识别wheel、touchmove、滚动条pointer和滚动键意图；布局补偿同步基线，真实输入后的滚动才结束manual expanded。旧anchor的待执行对齐和平滑滚动在切换页头模式时取消，anchor导航自身仍按原规则清除未pin的manual。

此回归没有修改官方sample文案、5条重复Products记录或增加Edit/Delete/Simulate Assembly/Search/Sort/Filter/Group/Settings业务handlers。

截图：`screenshots/object-page-header-regression.png`；手机共享控件布局截图为`screenshots/object-page-shared-controls-phone.png`。

## 当前验收边界

本轮已经执行上面列出的桌面和390px视口操作，不能扩写为全部组件或完整UI5行为等价。仍未覆盖真实触屏设备、原生屏幕阅读器全量验收、完整Edit mode、全设备/宽度矩阵、全部控件API及Input值状态消息浮层；没有暗色/高对比度主题、后端、OData或正式Registry消费者交付。手机Value Help内嵌Select关闭后的trigger焦点已完成DOM和浏览器AX核对；这不等于原生屏幕阅读器朗读验收。

旧记录的当时构建检查、变量/图标数量和设备结果保留原样；这些历史数字不代表当前生成文件。最终全局 `npm run lint`、`npm run build`、`npm run theme:check`（194/194变量）及四项条件语义检查均通过。最终构建重新加载后，浏览器 error/warn 日志为空；当前 dist 的24个文件（入口、构建 assets、字体和图片等）全部返回 HTTP 200。

页面内“验证记录”同步增加了本轮五项实际结果，截图为 `screenshots/verification-completion.png`。验收结束清除手机视口覆盖，恢复1374×1136桌面与Compact，保留 `#/components` 的消息预览；临时官方对照标签页已关闭。

---

## 历史记录：Switch / Segmented Button 样式修复验证 · 2026-10-29

本轮修复组件预览中的普通无内部文字 Switch 和文字/图标 Segmented Button，并回归使用同一个 ToggleGroup 的页头密度切换器。实现保留 shadcn / Base UI primitives，SAP 图标仅使用本地静态 SVG；没有导入 UI5 控件运行时。

对照基线为 **SAPUI5 1.151.0 / Morning Horizon**。用户提供的未固定版本入口当前显示 1.153.0，本轮固定使用 1.151.0，避免混用版本。官方源码、renderer、主题 CSS、来源和 SHA256 保存在 `references/selection-controls/`；源文件不参与应用运行。

实际在应用内浏览器操作 [官方 Switch sample](https://ui5.sap.com/1.151.0/#/entity/sap.m.Switch/sample/sap.m.sample.Switch) 和 [官方 Segmented Button sample](https://ui5.sap.com/1.151.0/#/entity/sap.m.SegmentedButton/sample/sap.m.sample.SegmentedButton)，并与本地生产预览 `http://127.0.0.1:4178/#/components` 对比：

| 检查项 | 实测结果 |
| --- | --- |
| Switch 外观与根因 | 普通开态使用蓝色 track、勾选图标；关态使用灰蓝色 track、横线图标。绿色/红色属于 AcceptReject 类型。移除旧 Tailwind translate 和本地 transform 叠加，thumb 仅作一次位移。修复后置通用图标 display 规则引起的关态双图标问题。 |
| Switch Compact | 官方与本地操作容器均为42×32px，track32×20px，handle20×16px；关态/开态位移差8px。 |
| Switch Cozy | 官方与本地操作容器均为50×44px，track40×24px，handle24×20px；关态/开态位移差12px。 |
| Switch 点击与键盘 | 官方无内部文字开关点击、Space、Enter均切换状态；本地同样可切换，说明文字同步更新。关态只显示less，开态只显示accept；键盘焦点圈为2px官方焦点色。 |
| Segmented Button 外观与根因 | 解除Field满宽规则对控件的拉伸，group按内容宽度排列且两项等宽；操作区与可见表面分离，修正选中圆角、文字粗细、图标间距和内部焦点圈。 |
| Segmented Button 密度 | 官方与本地 Compact 操作高32px、可见高26px；Cozy 操作高44px、可见高36px。本地列表/网格各66px（Compact）及70px（Cozy），group132px及140px，无多余空白轨道。 |
| Segmented Button 键盘 | 官方点击Adults后ArrowRight只移焦Seniors，Space才选择；末项ArrowRight不循环。本地点击网格后ArrowLeft只移焦列表，Space选择列表，Enter重选列表保持选择；End后末项ArrowRight不循环。 |
| 共享消费者 | 页头Compact/Cozy密度切换使用同一ToggleGroup；去掉旧外层padding，Cozy操作区44px、可见表面36px、两项等宽，没有表面越过容器。 |
| 手机390×844 | 自动使用Cozy。Switch开/关、列表/网格点击与说明更新正常；Switch为50×44px，track40×24px，handle24×20px。Segmented Button为140×44px、inner高36px。截图确认滑块没有越界、分段没有额外空白；page client/scrollWidth均390px。 |
| 最终状态与日志 | 桌面验收使用1594×1133；验收结束清除手机视口覆盖，回到用户当前桌面窗口1374×1136，保持Compact、Switch开、列表选中、基础控件页签；浏览器error/warn日志为空。 |

`npm run build`、`npm run lint`、`npm run theme:check`通过。主题提取为103个直接引用的官方变量，静态图标45个。更新ZIP保留源码、构建、参考资料和截图，排除node_modules与Git元数据。

本地截图：`screenshots/selection-controls-before.png`、`selection-controls-compact.png`、`selection-controls-compact-focus.png`、`selection-controls-cozy.png`、`selection-controls-mobile.png`。官方截图：`ui5-switch-compact.png`、`ui5-switch-cozy.png`、`ui5-segmented-button-compact-regular.png`、`ui5-segmented-button-cozy.png`；原`ui5-segmented-button-compact.png`记录的是选中项悬停状态。

本轮验证限于以上外观、密度和真实点击/键盘行为。Switch drag-to-toggle未新增；Segmented Button继续使用Base UI的group/toggle语义，官方为listbox/option。未专项验收全部控件变体、辅助技术、暗色及高对比度，不能据此宣称全套UI5交互等价。

---

## 历史记录：Value Help 组件预览验证 · 2026-10-29

本轮只将通用 `ValueHelpField` 接入组件预览的“值帮助”页签与基础控件原 Value Help 入口。单选、多选使用36条独立的虚构型号目录；采购列表32条数据与官方 Object Page 内容未改动。底座为 shadcn / Base UI 的 Dialog、InputGroup、Field、Select、Table 和 Checkbox，没有导入 UI5 控件运行时。

参考版本边界：v1-151 guideline 只能取得 Usage wrapper，正文未成功读取；设计 Usage 参考是明确标注的官方 v1-148 搜索索引。选择提交、手机视图、标题、Go、Clear 和 SearchField Escape 依据下载的官方 SAPUI5 1.151.0 sample 与控件源码。文件、URL和SHA256见 `references/value-help/`；不据此宣称已完全对齐 v1-151 guideline 或完整 Value Help 能力。

在应用内浏览器检查生产预览 `http://127.0.0.1:4178/#/components`，覆盖默认桌面视口（972×946）与390×844手机视口：

| 检查项             | 实测结果                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 组件入口           | “值帮助”页签有独立单选、多选；基础控件的原入口打开真实弹窗，选择后回填。                                                                                         |
| F4与单选           | 输入RA09-02、F4打开后Basic Search保留查询并返回1条。Enter选择后回填Robot Arm Series 9 · Extended Reach，关闭并回焦原字段。                                       |
| 行键盘             | ArrowDown从RA09-01移动到RA09-02；Enter单选提交，Space多选切换一次。                                                                                              |
| 焦点循环           | Cancel按Tab回到Basic Search；Basic Search按Shift+Tab回到Cancel，焦点保持在modal内。                                                                              |
| 手动搜索           | 输入不存在的型号时提交前保持36条；Go后0条并显示表内无数据。Clear search立即恢复36条。                                                                            |
| 四列筛选           | 编号ra11、名称high payload、制造商Automation Dynamics、轴数7 Axis以AND组合，仅返回RA11-03。Cancel保留之前单选值。                                                |
| 跨搜索多选         | 选RA09-01，再搜索RA11并选RA11-03，保留两项；Cancel后外部仍为空，OK才回填。重开恢复已提交选择。                                                                   |
| token同步          | Remove All同步清除草稿与表格选中；Escape取消后保留原字段的两项。Remove All后OK可提交空选择。                                                                     |
| SearchField Escape | 编辑查询后Escape恢复/清空查询并重新搜索，modal保持打开、草稿保留；原查询为空且没有变化时再次Escape关闭并回焦。非空RA09-02原查询也能准确恢复。                    |
| 桌面结果尺寸       | 编号112px、制造商200px、轴数100px，名称占剩余空间；Compact结果行高32px。弹窗无横向溢出。                                                                         |
| 多选字段尺寸       | 36项回填后桌面字段高26px、手机36px；桌面clientWidth/scrollWidth均389，手机均324，token在字段内部单行滚动。修复fieldset默认min-content与addon负边距引起的横溢出。 |
| 手机结果           | 全屏矩形为x0/y0/390×844，无额外Go及弹窗token区；制造商、轴数进入pop-in；单选无checkbox缩进。修复Tailwind动画translate引起的半屏偏移。                            |
| 手机筛选           | Show Filters切换到Filters独立视图，4列筛选与Back、Go、Cancel，结果表隐藏。编号ra11后Back仍36条；重进保留输入，Go才应用得到6条。                                  |
| 手机提交/取消      | 跨搜索选择RA09-01与RA11-03、OK回填两项；36项重开后取消删除草稿仍保留36项；取消全选后OK回填空值。                                                                 |
| 手机返回图标       | Filters的Back使用官方SAP-icons v5 nav-back静态路径，图标可见且操作正常；静态图标总数44。                                                                         |
| 溢出与日志         | 手机page及dialog的clientWidth/scrollWidth均390；最终浏览器没有error/warn日志。验收结束恢复默认桌面视口。                                                         |

`npm run lint`、`npm run build`、`npm run theme:check`通过，主题仍为78个直接引用的官方变量。预览与当前构建assets返回200。截图：`screenshots/value-help-gallery.png`、`value-help-desktop.png`、`value-help-mobile.png`、`value-help-mobile-filters.png`。

本轮范围是items-only单选/多选。Define Conditions、范围、排除、suggestion列表、后端查询、完整UI5单元格键盘模式、屏幕阅读器、暗色/高对比度和完整设备矩阵未专项实现或验收。

---

## 历史记录：采购列表示例数据扩充验证 · 2026-10-29

保留官方 PO-48865 全部原值，追加 PO-48866 至 PO-48896 共31条虚构演示记录，总计32条。数据覆盖6个型号、4个供应商、6个工厂和4种状态；每条记录均有自己的订单号、合同、金额、日期、配置、联系方式和3至5条单据。页面布局和既有表格行为沿用上一轮实现。

在应用内浏览器检查生产预览 `http://127.0.0.1:4178/#/orders`，实测结果如下：

| 检查项       | 实测结果                                                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 滚动加载     | 初始渲染20条，滚动后追加到32条。清除筛选恢复32条结果、首批20条。                                                                                                           |
| 供应商筛选   | 选项包含All及4个供应商；MotionWorks筛选得到5条，对应PO-48870、PO-48876、PO-48882、PO-48888、PO-48894。                                                                     |
| 状态筛选     | 选项包含All及4种状态；Delivered筛选得到7条，全部显示对应状态。                                                                                                             |
| 新记录详情   | PO-48866搜索仅返回1条；详情为Robot Arm Series 7、249.99 USD、November 12, 2026、Order ID 589946638、Contract 10045877，Products为3条独立单据。                             |
| 最后一条详情 | PO-48896搜索仅返回1条；详情为284.49 USD、November 1, 2026、Order ID 589946668、Contract 10045907，首条单据10223882002130 / 4,897.23 EUR。Standard Assembly使用普通文本色。 |
| 官方原记录   | PO-48865仍为Robot Arm Series 9、379.99 USD、June 23, 2018；Products保持官方5条重复原值。                                                                                   |
| 返回列表     | 返回后保留原筛选；验收结束清空筛选并留在列表顶部。                                                                                                                         |

只读数据核对：32条ID、Order ID及Contract均唯一；全部14个供应商、工厂和状态选项的筛选ID子集准确，交易日期不晚于交付日期。Delivery 9条、In Production 8条、Ready for Delivery 8条、Delivered 7条。新增记录是虚构数据，不声称来自SAP官方sample。

`npm run lint`、`npm run build`、`npm run theme:check`通过，主题仍为78个直接引用的官方变量。生产页面和当前构建入口assets均返回200。截图：`screenshots/list-report-32-orders.png`。本轮验证聚焦数据扩充、筛选、加载和详情绑定，上一轮页头/导航/响应式验收记录保留如下。

---

## 历史记录：Object Page sample 与采购列表验证 · 2026-10-29

本轮按官方 `sap.uxap.sample.ObjectPageSectionShowTitle` 的 XML、Component.js 与浏览器运行结果替换对象页。nightly 快照为 1.155.0-SNAPSHOT；它与 v1-151 设计规范分别记录。业务数据只有官方 sample 中的一个 PO-48865 对象，Products 中的五条相同行也保留原样。

在 Chrome 检查生产预览 `http://127.0.0.1:4178/`，覆盖默认桌面视口、1440×900、390×844，以及390×260的短视口。以下是本轮实际检查结果：

| 检查项              | 实测结果                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 内容与标题          | Robot Arm Series 9 / PO-48865；只有General Information和Contact Information。Order Details、Configuration Accounts及四组联系方式与sample一致；无处理记录。 |
| Expanded / snapped  | 顶部为标题、编号与80px对象图；滚动收缩后标题区显示48px对象图、名称、编号。默认桌面标题区80px、展开内容116px、anchor44px。                                  |
| 滚动中手动展开      | 已收缩时点展开，页头内容在顶部展开；继续滚动且未pin会恢复滚动收缩。                                                                                        |
| Pin                 | 固定后滚动保持expanded，内容区和anchor保持固定；手动收起取消pin。手机不提供pin。                                                                           |
| 收起后回顶部        | 手动收起，滚到底部，再滚回顶部；scrollTop=0，页头恢复expanded。                                                                                            |
| 短视口              | 390×260时展开会回到scrollTop=0，docked=false、pinned=false；页头内容在页面流内，不固定遮满可视区。                                                         |
| Anchor              | Contact Information定位后，section顶部与anchor底部对齐；未固定时180px，默认桌面固定时296px。手滚同步active section。                                       |
| 手机subsection      | Select列出General Information、Order Details、Products、Contact Information；选Products后触发器显示Products，产品区顶部与anchor底部168px对齐。             |
| Products toolbar    | Products、17.5rem Search、Sort、Filter、Group、Settings顺序保持sample；390px时操作进入真实Base UI overflow菜单，点击菜单项关闭菜单。                       |
| Products search边界 | 输入Jologa、清除并恢复输入焦点；表格仍是官方5行。sample没有搜索/排序/筛选/分组/设置业务事件，未增加这些数据处理。                                          |
| Products pop-in     | 390px时Company、Contact Person、Posting Date进入pop-in；Document Number与Amount保留主行；page scrollWidth/clientWidth均390px。                             |
| 列表内容            | PO-48865、Robot Arm Series 9、Robotech、Orlando, Florida、Delivery、June 23, 2018、379.99 USD与详情共用同一数据文件。                                      |
| 列表搜索            | no-match返回0条并禁用导出；Robotech恢复1条。                                                                                                               |
| 列表设置取消        | 取消隐藏Factory的设置后，Factory列仍显示。                                                                                                                 |
| 路由                | 列表chevron进入/orders/PO-48865；返回列表恢复其状态。旧/orders/SO-100428作为sample兼容入口。                                                               |
| 底座                | 源码使用shadcn/Base UI；未导入UI5控件运行时，UI5资源仅静态图片、SVG路径与主题变量。                                                                        |

代码检查：`npm run lint`、`npm run build`、`npm run theme:check`通过；当前主题提取为78个实际引用的官方变量，静态图标43个。

截图：`screenshots/object-page-expanded.png`、`object-page-snapped.png`、`object-page-pinned.png`、`object-page-mobile.png`、`list-report-purchase-orders.png`。官方XML与Component参考文件保存在`references/object-page-section-show-title/`。

Edit、Delete、Simulate Assembly和Products工具栏的业务按钮与官方静态sample一样没有业务handler。当前验证覆盖这个sample及列表示例；不代表完整Object Page变体、全部UI5键盘模式、屏幕阅读器、暗色/高对比度、OData或完整Fiori Elements能力已验收。

参考：[官方Object Page sample](https://openui5nightly.hana.ondemand.com/#/entity/sap.uxap.HeaderFacetPattern/sample/sap.uxap.sample.ObjectPageSectionShowTitle)、[Object Page v1-151](https://www.sap.com/design-system/fiori-design-web/v1-151/page-types/floorplans/object-page)。

---

## 历史记录：上一轮销售数据下的List Report验证

以下记录保留当时结果；本轮采购sample已替换其销售数据、审批和编辑场景。

# List Report 规范修正验证 · 2026-10-28

本轮依据 SAP Fiori v1-151 的 List Report、Filter Bar、Responsive Table、Table Toolbar 和 P13n Dialog 正文修正列表。在 Chrome 检查生产预览 `http://127.0.0.1:4178/`，覆盖默认桌面视口、1440×900、1100×900、900×900 和 390×844。

| 检查项         | 本轮实测结果                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 页面结构       | 页面 variant 是唯一页头标题；单表格内容布局。删除额外面包屑、宣传副标题、销售运营说明、状态 tabs、页码、键盘教学和演示说明 footer。 |
| 初始状态       | 数据已查询，页头初始折叠；首批渲染20条。初始焦点在首行。                                                                            |
| 实时筛选       | 输入 SO-100428 立即得到1条结果。没有 Go 或重复更新按钮。                                                                            |
| 无数据         | 不存在的搜索词显示表格内“未找到数据。请调整筛选条件。”                                                                              |
| 调整筛选取消   | 修改对话框客户值后取消，原筛选值和1条结果保持。                                                                                     |
| 手机调整筛选   | 390px 下对话框覆盖整个视口；显示值后有5个值输入区域，隐藏后为0。选择待审批并确定，返回8条及对应筛选摘要。                           |
| 表格设置取消   | 隐藏负责人后取消，负责人列保持显示。                                                                                                |
| 排序           | Settings / 排序中选订单净额降序，首条SO-100411、639,440.00；原选择清空。                                                            |
| 全选与滚动加载 | 首批20条时全选覆盖24条已知结果；滚动后追加至24条，24条保持选择。                                                                    |
| Sticky         | 滚动后页头底部140px、toolbar顶部140px、列头顶部188px。Compact toolbar高48px，位置无重叠。                                           |
| 页头固定       | 展开并固定页头后滚动，筛选栏保持展开；页头底部192px、toolbar顶部192px、列头顶部240px。                                              |
| 部分处理       | 全选24条后审批对话框明确提示16条状态不适用、8条可处理；取消保留数据。                                                               |
| 本地视图       | 保存临时待审批视图后刷新，菜单仍存在；切换恢复8条及状态筛选。随后删除本轮创建的临时视图。                                           |
| 详情导航       | 行末chevron进入SO-100428对象页；订单、基本信息、项目、交付和处理记录正常加载，返回列表正常。                                        |
| 响应式表格     | 390px下表格宽度390px、page scrollWidth390px；次要列进入pop-in。1100px和900px下也无整体横向溢出。                                    |

代码检查：`npm run lint`、`npm run build`、`npm run theme:check` 通过。主题提取覆盖83个直接引用的官方变量。基础组件仍来自shadcn/Base UI；新增的pin和overflow为官方SVG静态路径，无UI5控件运行时导入。

本轮回归集中在List Report。前轮已经检查的详情编辑校验、值帮助、创建及订单持久化流程未重新做全量回归；本轮未修改这些流程。当前仍使用本地数据、原生日期输入和单层排序，未实现完整UI5单元格键盘模式、OData、所有P13n/variant管理能力；完整设备矩阵、屏幕阅读器、暗色和高对比度主题未专项验收。不能据本记录宣称整套库已与Fiori完全一致。

依据：[List Report](https://www.sap.com/design-system/fiori-design-web/v1-151/page-types/floorplans/list-report-floorplan-sap-fiori-element)、[Filter Bar](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/filter-bar)、[Responsive Table](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/responsive-table)、[Table Toolbar](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/table-bar)、[P13n Dialog](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/p13n-dialog-popup)。主页面通过Usage分片加载正文；已读取其官方`usage.plain.html`内容。


---

## 组件契约、第一批 Registry 与独立消费 · 2026-10-29

本轮在现有原型基础上提炼可复用源码，没有改写Object Page官方sample业务内容。公共Value Help改为接收调用方items、columns、属性filters与受控value/onValueChange；独立条件字段和纯条件工具已从型号预览中拆出。公共MessageStrip及MessagePopover接收调用方内容、消息、open状态与激活/定位回调，customer/email/quantity校验仍留在消息预览薄适配中。

第一批条目为 foundation、Button、Input、Select、MessageStrip、Value Help、conditions-only字段与MessagePopover，加内部primitives依赖和组合fiori-kit，共10个标准Registry条目。源码安装目标隔离到消费项目的components/fiori与lib/fiori；foundation使用[data-fiori-root] scoped规则、私有字体名与所属Provider弹层容器。并列Provider可使用不同密度，嵌套Provider暂不支持。

| 检查项 | 此阶段实际结果 |
| --- | --- |
| API与说明 | docs/component-contracts.md、value-help-api.md、messages-api.md记录公开props、受控提交/取消、数据适配及键盘/焦点边界；docs/registry.md记录安装与升级规则。 |
| 标准CLI | shadcn CLI实际版本4.23.0；此前标准build与registry validate通过，构建10条目/37源码。源文件仍可能在最终浏览器修复中更新，最终registry一致性由最终验收重新确认。 |
| 独立安装 | ../fiori-registry-consumer使用独立package/lock/build与~/别名；标准CLI add @fiori/fiori-kit实际创建37个文件，安装日志保存在registry/evidence/consumer-install.txt。 |
| 消费源码 | registry-verify-consumer已核对37个安装目标、TypeScript aliases、本地导入闭包、依赖和字体内嵌；无作者fixture/preview或UI5控件import，无越界source/target/realpath依赖。证据为consumer-source-check.json。 |
| 宿主源码保留 | 消费项目src/components/ui/button.tsx安装前后SHA256同为313353436d0fcc8e44ab470adb614b9fd013d28626f624328ea0d66d41a6c81b；host-button-before/after.json记录严格一致。这是源码证据，宿主视觉另待浏览器核对。 |
| 纯逻辑 | npm run test:contracts实际9项全通过：5项外部目录、任意属性列、search/filter隔离、Preserve格式与不同目录集合；4项包含/排除、Empty/NotEmpty、UpperCase边界和不完整条件。 |
| 作者Lint | 全局npm run lint及公共组件/底座相关文件scoped ESLint均通过。 |
| 生产构建、浏览器与几何 | 留待root最终验收追加。没有把已存在的旧原型截图计为新消费页面通过。 |
| 真实触屏与VoiceOver | 尚未执行；可重复手动步骤已写docs/consumer-validation.md。浏览器390px模拟和AX/DOM读回不等于物理触屏或原生朗读。 |

新增命令：foundation:build/check、registry:build/check/verify-consumer、test:value-help-contract、test:value-help-conditions及test:contracts。此阶段没有公网Registry/npm发布、Git提交、后端/OData、完整编辑表格或正式跨项目版本承诺。当前结果证明第一批源码与契约可独立安装，不宣称全部Fiori外观与交互等价。

---

## React 试产独立消费 · 2026-10-29

本次浏览器操作针对独立 `../fiori-registry-consumer/` 的生产预览 [http://127.0.0.1:4188/](http://127.0.0.1:4188/)。消费页使用调用方自己的仓库、物料、批次和库存表单，导入前缀为 `~/`，没有引用作者的型号或采购 fixture；Object Page 官方样本及其业务 handlers 边界保留。

标准 shadcn CLI 将第一批10个条目、37个文件安装到消费项目。Registry 生成的 color utilities 已隔离为 `--color-fiori-*` / `bg-fiori-primary`、`text-fiori-muted-foreground` 等 namespace；实际变量、组件规则与弹层归属限制在所属 Provider 内。宿主颜色 token 即使使用字面量值，也不被 Fiori 的全局 utility 映射重新定义。并列 Provider 支持不同密度，嵌套 Provider 暂不支持。

### 已执行的桌面操作与读回

| 检查项 | 实际操作与观察结果 |
| --- | --- |
| 外部仓库列与筛选文案 | 调用方列顺序为仓库名称、区域、仓库编码、容量；区域 filter 显示“华东 / 西南 / 华南”，不显示 `east / west / south` 编码代替文案。 |
| 单选与组合属性筛选 | 区域选 `west`（西南），仓库名称填“成品”，结果唯一为成都成品仓 `wh-cd-04`；选择行后关闭并提交该 ID。 |
| 不同目录多选 | 物料初值为 `mat-a01`。勾选 `mat-a02` 后 Cancel，受控值仍为 `mat-a01`；再次打开并 OK，值为 `mat-a01, mat-a02`；删除 `mat-a02` token 后回到 `mat-a01`。 |
| 只读与禁用 | 只读仓库字段按 F4 不打开 Dialog，Value Help trigger disabled；只读/禁用修改回调计数仍为0。未将只读字段整体当作禁用字段处理。 |
| Select 映射与只读转换 | Root 提供 `items` 的 value/label 映射。最初只读，解锁后正常打开；选“加急”后再次锁定关闭，解锁仍保持关闭。 |
| Preserve 初始条件 | `StartsWith lot-` 包含并排除 `EQ lot-b2`，匹配4条小写批次；大写 `LOT-A1` 不匹配。仅保留排除后匹配5条，包含 `LOT-A1`，说明排除单独从全集计算。 |
| 半区间 Warning | 新增 BT（between），只填一端后 OK 触发 Warning；Cancel 返回缺失操作数输入，补齐第二端后 OK 提交。 |
| 消息分类与详情 | 调用方初始校验给出2条 error、1条 warning、1条 information；切 warning 分类仅1条。打开详情、Shift+Enter 返回已操作。 |
| 消息 ref 定位与回调 | Alt+Enter 激活物料消息后关闭弹层，`targetRef` 定位 `consumer-stock-material`；调用方 `onActiveTitle` 读回 `material-required`。 |
| 修正与成功状态 | 填写物料编码、库位、数量50及备注后再次保存，消息仅剩1条 success，消费页保存状态为“已保存”；业务校验和保存状态仍由调用方管理。 |
| 消息关闭焦点 | 从消息触发器打开后点击 Close，焦点回到 `stock-message-trigger`。由保存按钮打开和由消息触发器打开属于不同进入路径，按实际来源记录。 |
| 第二 Provider | 弹层父容器为 `comparison-provider`，`data-fiori-density=cozy`；消息 ref 定位 `comparison-input`，未跨到主 Provider 的字段。 |
| 桌面消息几何与字体 | MessagePopover 可见弹层440×320px，字体为 Fiori 72。主 Provider 的 Compact Select 高26px；对照 Provider 的 Cozy Input 高36px。 |
| 宿主 Button 视觉 | Provider 外宿主 Button 仍为紫色 `rgb(86, 61, 189)`、Geist 字体、10px圆角和32px高度，与原宿主值一致。 |
| 宿主原生 Input 视觉 | Provider 外原生 Input 保留 Geist 字体、6px圆角和35.5px高度；Fiori区域的字体、密度与焦点规则没有覆盖该宿主控件。 |
| 宿主源码 | `registry/evidence/host-button-before.json` 与 `host-button-after.json` 的 SHA256 同为 `313353436d0fcc8e44ab470adb614b9fd013d28626f624328ea0d66d41a6c81b`，`unchanged=true`。源码与上面 computed-style 结果分别作为证据。 |

### 首次 axe 扫描与源码修复

实际首次 axe 扫描发现 Value Help 源 textbox 带有不适用的 `aria-expanded`；只读 InputGroup 还因 `:has(:disabled)` 命中禁用的 Value Help trigger，被连带施加 disabled opacity。源码已移除 textbox 上不适用的展开属性，并将 InputGroup 的 disabled 判断限定到实际输入控制。两个修复进入标准 CLI 载荷更新；此段记录问题和修复，不据此判定最终 axe 或视觉复验通过。

| 最终验收 | 当前状态 |
| --- | --- |
| 最新载荷与源码一致性 | 最终 registry:check 核对10条目/37源码及 built payload；标准CLI逐文件更新本轮生成文件，consumer source-check、两端 build/lint 通过。更新日志为 consumer-update.txt、consumer-value-help-update.txt、consumer-a11y-update.txt。 |
| 最终 axe 复扫 | axe-core 4.14.0 的 WCAG 2/2.1 A/AA 检查：1280×720页面、390×844页面和手机Value Help弹层均0项报告违规。普通页面各27条规则通过；仍有7个 color-contrast 未自动判定节点，弹层另有11个 aria-hidden-focus 未判定节点，不能当作完整无障碍认证。 |
| 手机响应式回归 | 390×844下页面scrollWidth=390；Value Help、嵌套Select、条件、消息均390×844且归属primary-provider。类别“包装材料”筛选4条，勾选mat-b01并OK提交a01/b01；嵌套Select关闭焦点回consumer-material-filter-category。条件修改为LOT-后Cancel保留原lot-与排除；消息列表/详情已操作。 |
| 真实触屏与软键盘 | 未执行；可重复设备步骤已写 `docs/consumer-validation.md`。 |
| Safari / VoiceOver | 未执行；需真实操作并记录朗读与焦点，不用 AX 树或 axe 结果代替。 |

截图已保存：桌面 `screenshots/consumer-desktop.png`、手机 `screenshots/consumer-phone-value-help.png` 与 `screenshots/consumer-phone-messages.png`。

自动扫描未判定项另行复核：只读左侧纹理只占0–4px，文本从8px以后绘制；computed颜色的WCAG文本对比度为只读14.24:1、普通字段16.86:1、分段按钮选中5.03:1、未选中5.49:1。空的多输入/条件输入不含正文，token和placeholder作为独立内容检查。相关自动与颜色证据见 `registry/evidence/consumer-axe-*.json`、`consumer-contrast-review.json`、`consumer-contrast-calculation.json`。模态键盘复核中Basic Search的Shift+Tab到Cancel，Cancel的Tab回Basic Search；截图/DOM焦点仍不能替代真实朗读。

四种MessageStrip均实测32px高，首行文字与16px图标顶部偏移同为8px。只读Value Help最终opacity=1，文字rgb(19,30,41)，输入框无不适用的aria-expanded；展开状态留在DialogTrigger。两端构建、lint、9项条件/查询契约测试及194个直接引用的SAP主题变量核对通过。浏览器临时视口与axe注入在验收结束时清除。

本轮是本地 React 组件试产，未公网发布 Registry 或 npm 包，未接入 OData/后端，不包含完整 Edit 表格、暗色/高对比度、RTL、全部 UI5 API 或可分发页面模板。以上桌面路径不能推定完整 Fiori 行为等价，真实设备与原生屏幕阅读器仍保持“未执行”。
