# Fiori Design Lab · 原型与组件库试产 v0.1

基于 React、shadcn/ui 与 Base UI 的 SAP Fiori 对照原型。本轮以官方 **ObjectPageSectionShowTitle** 样本为对象页的内容、结构和交互基准，保留原始 **Robot Arm Series 9 / PO-48865** 对照数据，并补充同结构的采购演示记录。目标是复刻明确样本，验证哪些能力适合提炼为基础组件、复合组件与页面模板。

当前包含本地对照原型和第一批 React 组件库试产源码。已经建立本地 shadcn Registry，并通过标准 CLI 将37个文件安装到独立 React 消费项目；尚未发布公网 Registry 或 npm 包。独立消费的桌面浏览器已检查外部目录、受控确认/取消、条件、消息定位与主题隔离；桌面与390px手机回归、最终axe复扫已经执行，真实设备结果另行记录，不能由安装成功推定全部 Fiori 行为等价。

## 第一批可复用组件与独立消费

第一批公开组件包括 Button、Input、Select、MessageStrip、Value Help 单选/多选、独立条件字段和 Message Popover，配套 `FioriProvider`、scoped Morning Horizon 主题、72 字体与静态图标。

- [组件契约](./docs/component-contracts.md)：受控状态、密度、键盘/焦点和明确边界。
- [Value Help API](./docs/value-help-api.md)：外部 items/columns/filters、单选/多选及条件工具。
- [消息 API](./docs/messages-api.md)：外部消息、打开状态、详情与定位回调。
- [本地 Registry 安装](./docs/registry.md)：条目、依赖闭包、目标映射和更新规则。
- [消费与人工设备验收](./docs/consumer-validation.md)：浏览器、真实触屏与 VoiceOver 分开记录。

作者源码位于本项目；独立消费项目为同级 `../fiori-registry-consumer/`，使用自己的 package.json、锁文件和 `~/` 别名。通过 `@fiori/fiori-kit` 复制安装到消费项目的 `components/fiori/` 与 `lib/fiori/`，没有 alias 或 symlink 回作者源码。宿主原有 `components/ui/button.tsx` 不在安装目标中，其安装前后 SHA256 保持一致。消费页面入口为 [http://127.0.0.1:4188/](http://127.0.0.1:4188/)，运行步骤见消费项目 README。

Fiori 规则与实际主题变量限定在 `[data-fiori-root]` 内，弹层进入所属 Provider 的容器；Registry color utilities 使用 `--color-fiori-*` / `bg-fiori-primary` 等专用 namespace，保留宿主现有颜色映射。并列 Provider 可使用不同密度，嵌套 Provider 暂不支持；宿主控件应放在 Provider 外。字体注册名为 `Fiori 72` / `Fiori 72 Bold`，不覆盖宿主字体名称。复杂组件不包含采购单、型号 fixture 或业务校验规则，示例数据留在调用方。

桌面实测使用独立仓库与物料数据：自定义列顺序及“西南 + 成品”筛选选中成都仓库，多选 Cancel 保留原值、OK 提交和 token 删除同步；只读/禁用不提交，Select 从初始只读解锁、选值、再次锁定关闭均已操作。批次 `Preserve` 条件保留大小写，半区间 Warning 可取消回缺失字段；消息支持分类、详情、快捷键返回和 `targetRef` 定位，修正调用方表单后得到成功消息。并列 Provider 的弹层与字体/密度归属正确，Provider 外宿主紫色 Button、Geist 字体、圆角与输入高度保持原值。详细数据ID、尺寸和焦点见 [QA](./QA.md) 的“React 试产独立消费”。

## 本地运行

需要 Node.js **22.12 或更新版本**及 npm。在项目目录执行：

```bash
npm ci
npm run dev
```

开发地址：[http://127.0.0.1:5178/](http://127.0.0.1:5178/)。服务器绑定本机地址，端口被占用时会报错。

| 页面                 | 开发地址                                                      |
| -------------------- | ------------------------------------------------------------- |
| Purchase Orders 列表 | [/#/orders](http://127.0.0.1:5178/#/orders)                   |
| Robot Arm 对象页     | [/#/orders/PO-48865](http://127.0.0.1:5178/#/orders/PO-48865) |
| 组件 Gallery         | [/#/components](http://127.0.0.1:5178/#/components)           |
| 能力与验证记录       | [/#/verification](http://127.0.0.1:5178/#/verification)       |

页面采用 hash 路由。构建及预览：

```bash
npm run build
npm run preview
```

`build` 执行 TypeScript 构建检查和 Vite 生产构建，输出到 `dist/`。预览地址为 [http://127.0.0.1:4178/](http://127.0.0.1:4178/)，页面路径与开发地址相同。预览前请先构建；`dist/` 需要通过 HTTP 服务访问，不能直接双击 `index.html` 作为离线网页运行。

仓库保留源码、锁文件、静态资源、参考说明、Registry载荷与截图；`node_modules/`、`dist/`、本机日志和Git元数据不随源码包分发。源码运行仍需 `npm ci`；保留 `package-lock.json` 以复现本轮依赖。

```bash
npm run lint
npm run typecheck
npm run theme:check
npm run test:contracts
npm run foundation:build
npm run foundation:check
npm run registry:build
npm run registry:check
npm run registry:verify-consumer -- ../fiori-registry-consumer
```

代码/主题命令检查作者源码和生成文件；九项纯逻辑测试分别检查外部目录/列/过滤契约（5项）和条件集合、范围、UpperCase、空值、不完整条件（4项）。foundation 命令生成/检查隔离主题，registry 命令执行标准 CLI 构建/载荷一致性检查，消费检查核对实际安装目标、aliases 与本地导入闭包。它们不能代替浏览器交互、辅助技术或视觉验收。

## 参考基线与技术栈

| 项目         | 本轮基线                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对象页样本   | [ObjectPageSectionShowTitle](https://openui5nightly.hana.ondemand.com/#/entity/sap.uxap.HeaderFacetPattern/sample/sap.uxap.sample.ObjectPageSectionShowTitle) |
| 样本快照版本 | OpenUI5 nightly **1.155.0-SNAPSHOT**；本轮以读取的 XML、manifest、Component 和动态页头源码快照为准                                                            |
| 设计规范     | [SAP Fiori for Web v1-151](https://www.sap.com/design-system/fiori-design-web/v1-151/discover/get-started)                                                    |
| 列表页面规范 | [List Report v1-151](https://www.sap.com/design-system/fiori-design-web/v1-151/page-types/floorplans/list-report-floorplan-sap-fiori-element)                 |
| 实现         | React 19、TypeScript、Vite 8、Tailwind CSS 4、shadcn/ui、Base UI                                                                                              |
| 主题         | Morning Horizon 明亮主题；SAP 参数映射到 shadcn 与本地 Fiori token                                                                                            |
| 主题参数来源 | `@sap-theming/theming-base-content` **11.36.5**，`sap_horizon` 参数的使用子集                                                                                 |
| 图标来源     | `@ui5/webcomponents-icons` **2.28.0**，本地 SAP-icons SVG path                                                                                                |
| 字体与图片   | 本地 SAP 72 字体、官方 sample 的 Robot Arm 静态图片；中文使用系统字体回退                                                                                     |

**nightly 1.155.0-SNAPSHOT 是本轮对象页行为对照快照；v1-151 是设计规范版本，二者并非同一个版本。** nightly 在线内容会变化，后续对比要同时记录快照与日期。主题包和图标包也有独立版本体系，不能直接换成 nightly 的版本号或混用不同来源的样本。

对象页及列表的运行逻辑由 React、shadcn/Base UI 和本地组合组件实现，**没有引入 UI5/SAPUI5 组件运行时**。SAP/UI5 资源仅作为静态图片、字体、图标、主题及对照资料使用。

列表依赖规范包括 [Filter Bar](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/filter-bar)、[Responsive Table](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/responsive-table)、[Table Toolbar](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/table-bar) 与 [P13n Dialog](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/p13n-dialog-popup)。列表是对照入口，不是官方对象页 XML 自带的 List Report。

主题、字体、图标及图片的来源与许可随源码保留。`npm run theme:extract` 从锁定主题包提取实际引用的变量，`npm run theme:check` 检查生成文件与源码一致性；不要手动改写生成的 `src/styles/sap-horizon.css`。

### Figma 参考

公开参考入口：[SAP Fiori Community UI Kit](https://www.figma.com/community/file/1494295794601744471)。精确组件与交互以本文列出的官方规范和 UI5 sample 为对照；个人 Figma 副本链接未随公开源码分发。

## 本轮内容与交互范围

### Object Page：ObjectPageSectionShowTitle

对象页保留官方样本的英文文案与静态值，包括 Robot Arm Series 9、PO-48865、Robotech、Delivery、12 Days、To Be Selected 和 379.99 USD。页面以两大 section 为基准：

- **General Information**：Order Details、Configuration Accounts 表单组，以及 Products 表格。
- **Contact Information**：Phone Numbers、Social Accounts、Addresses、Mailing Address 表单组。

Products 保留 XML 的 **5 条完全重复的文档行**：Document Number `10223882001820`、Jologa、Denise Smith、`11/15/19`、`12,897.00 EUR`。行 key 只用于 React 元素身份，不表示 5 个不同业务文档。保留 `showTitle=false` 等标题层级意图，避免自行增加旧样板中的信息分区。

动态页头对照包括 **expanded / snapped** 标题和内容切换、滚动收缩、手动展开/收起、**pin** 固定、**anchor** 分区定位与滚动同步、窄屏标题与工具栏 **overflow**。这些状态由本地代码实现，具体匹配程度和设备覆盖需要逐项验证。

官方 XML 显示 Edit、Delete、Simulate Assembly 和表格 Search、Sort、Filter、Group、Settings 控件，但**没有绑定相应业务 handlers，也没有 Controller**。因此对象页不附加编辑、删除、保存、模拟装配、表格业务筛选/分组或链接业务跳转。Search 文本输入与清除属于通用控件交互，不改变 5 条表格数据。页头控制、分区导航和 overflow 排布属于本轮复刻范围。边界集中写在本文和“验证记录”页，不向业务页面添加额外解释文案。

### Purchase Orders 列表

列表与详情共用 `src/lib/purchase-order-sample.ts` 的32条采购演示记录：原始 PO-48865 官方样本加31条虚构记录。新增记录覆盖6种机器人型号、4个供应商、多个工厂、4种状态和不同交付日期/金额；每行进入自己的对应详情。首批加载20条，滚动追加其余记录。本地列表提供筛选、行导航、列与排序设置、视图管理及 CSV 导出，作为查看对象页的入口；这些本地列表能力不代表官方对象页 XML 定义了相关业务操作。

采购列表新增只读响应式表格键盘导航：方向键在行与单元格间移动，Home/End移动到边界，PageUp/PageDown跨20行移动，F2/F7在行/单元格和内嵌控件之间切换，Enter执行已有行导航，Space操作行选择。表格主体使用单一 Tab 入口，并在内嵌控件模式中保留控件焦点。行为依据 SAPUI5 1.151.0 的 ListBase/Table 源码，参考文件在 `references/table-keyboard/`。它没有增加单元格编辑、完整UI5 Edit模式或虚拟化引擎，也没有改变官方 Products 表格的静态业务边界。

官方 PO-48865 及其5条重复 Products 行保持原样；新增记录为本地演示数据，不声称来自 SAP 样本。采购单与文档数据不写入浏览器订单存储。

### 组件 Gallery 与密度

Gallery 保留按钮强调与语义类型、默认/悬停/按下/禁用样本，输入值状态，Checkbox、Radio、Switch、Select、Segmented Button、ObjectStatus、消息条、Toast、Dialog、字体和色彩参数。`BasicStatePreview` 补充可操作的基础控件状态矩阵：标准、只读、禁用及错误/警告/成功/信息状态，Checkbox部分选中、Radio分组、Select禁用选项、标准Dialog草稿保存/取消，以及消息条关闭/恢复。手机Select采用全屏选择页，并覆盖Dialog内嵌选择。固定状态样本与真实交互分开验证；它们不是对象页 sample 的业务功能。

Switch 与 Segmented Button 已按 SAPUI5 **1.151.0 / Morning Horizon** 官方运行示例修正。Switch 使用标准蓝色开态与横线关态，Segmented Button 使用内容宽度、等宽分段和内部焦点圈；Compact/Cozy、点击与键盘、手机390px及页头密度切换的实测和对照截图见 `QA.md`。官方源码、主题快照与版本边界在 `references/selection-controls/`，这些文件只用于对照，不引入UI5运行时。

“值帮助”页签提供可操作的单选、多选及独立的条件编辑示例。基础控件中的 Value Help 输入框也使用同一个 `ValueHelpField` 组件。36条虚构型号目录独立存放在 `src/lib/value-help-models.ts`，不读取旧销售订单产品，也不改写采购列表与官方对象页。

单选选择一行后直接回填；多选在弹窗内暂存，确定后回填，取消或 Escape 保留原值。重新打开恢复已选值，搜索支持跨编号、名称、制造商和轴数检索，并可展开属性筛选。组件使用现有 shadcn/Base UI 的 Dialog、InputGroup、Table、Checkbox 和 Badge 组合，未引入 UI5 控件运行时。

`ValueHelpConditionPreview` 新增 **conditions-only** 模式，对照 [SAPUI5 1.151.0 官方条件示例](https://ui5.sap.com/1.151.0/#/entity/sap.ui.comp.valuehelpdialog.ValueHelpDialog/sample/sap.ui.comp.sample.valuehelpdialog.conditionsOnly)。源字段点击、Enter、F4或Alt+Down打开 Define Conditions；桌面显示 Selected Conditions，手机直接进入全屏条件页。可编辑操作ComboBox按输入过滤，支持范围、包含与明确配置的扩展排除操作。型号编号按UpperCase字符串比较，包含条件取并集，再移除排除条件匹配值；确定后回填官方格式token并更新独立结果表。部分范围缺值时使用官方Warning确认，Cancel回到缺值字段，OK只提交完整条件。点击弹窗外部保持弹窗和草稿打开；主Cancel/Escape关闭并保留原条件，源token支持删除与键盘导航。

该预览覆盖独立的items-only单选/多选和conditions-only范围/排除，不包含把两种模式合在同一弹窗的全部变体、suggestion列表、条件分页、日期/数字类型条件或后端查询。配置、来源与边界见 [Value Help参考说明](./references/value-help/README.md) 和 [条件实现说明](./references/value-help/conditions/IMPLEMENTATION.md)。四项条件语义检查由 `scripts/verify-value-help-conditions.mjs` 执行；浏览器已核对范围与排除得到3行、加入第二个包含条件得到9行、删除排除token得到10行，以及缺值Warning、ComboBox过滤/ArrowDown保留、390px手机和源token键盘删除。

“消息”页签新增 `MessageValidationPreview`：在独立本地表单中保存后汇总错误、警告、信息与成功消息。MessagePopover按严重程度显示触发按钮和该级别数量，支持类型过滤、消息详情/返回、标题激活定位并聚焦字段、修正后重新保存及Toast反馈；手机使用全屏消息页。它组合现有shadcn/Base UI控件，校验规则与模拟保存只用于组件验证，不改写采购单或官方对象页数据。来源与流程见 [消息参考说明](./references/messages/README.md)。

顶栏可切换 **Compact / Cozy**。小于 600px 的窗口使用 Cozy，并暂时禁用手动切换；宽屏恢复用户保存的密度偏好。当前仅覆盖 Morning Horizon 明亮主题。

## 本地数据与恢复范围

共享采购单及文档行是固定源码数据。浏览器仅保存本地视图及密度偏好：

| localStorage 键               | 保存内容                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `fiori-lab:purchase-views:v1` | 采购列表自定义视图：搜索/型号/供应商/工厂/状态/预期交付日期筛选、筛选字段显示与顺序、列显示与顺序、排序 |
| `fiori-lab:density`           | Compact / Cozy 偏好                                                                                     |

“恢复列表状态”清除采购自定义视图并重置列表状态和全局搜索，保留密度偏好。固定采购单不受影响。

保存范围是当前浏览器的站点 origin。协议、主机名或端口不同会使用不同存储，因此 `127.0.0.1:5178`、`localhost:5178` 和 `127.0.0.1:4178` 的本地视图互不共享。没有账户、权限或跨设备同步。

## 源码组织与组件化边界

```text
src/
├── App.tsx                     应用壳、hash 导航、共享采购单与密度
├── index.css                   主题映射、字体、密度和基础组件样式
├── layout.css                  顶栏与侧导航
├── styles/sap-horizon.css      官方主题参数使用子集（生成文件）
├── styles/fiori-scoped.css     Registry使用的隔离规则与主题（生成文件）
├── styles/fiori-fonts.css      私有字体名称与内嵌72字体（生成文件）
├── components/
│   ├── ui/                     已定制的 shadcn / Base UI 基础组件
│   └── fiori/
│       ├── sap-icon.tsx        本地SAP图标路径
│       ├── object-status.tsx   语义状态
│       ├── basic-state-preview.tsx
│       │                       基础控件状态与Dialog/消息条交互预览
│       ├── fiori-provider.tsx / fiori-context.ts
│       │                       主题密度与弹层所属环境
│       ├── message-strip.tsx / message-popover.tsx
│       │                       公共消息组件与外部数据 API
│       ├── message-preview.tsx 独立校验表单的薄适配
│       ├── value-help.tsx      items-only单选/多选
│       ├── value-help-conditions-field.tsx
│       │                       公共 conditions-only 字段
│       ├── value-help-condition-preview.tsx
│       │                       型号目录与独立结果预览薄适配
│       ├── value-help-condition-operator.tsx
│       │                       基于shadcn结构的可编辑Base UI ComboBox
│       ├── use-responsive-table-navigation.ts
│       │                       采购列表只读表格键盘导航
│       └── sample-products-table.tsx
│                               官方Products样本表格与工具栏
├── lib/
│   ├── purchase-order-sample.ts 官方样本数据与列表过滤适配
│   ├── value-help-models.ts     独立36条虚构型号目录
│   ├── value-help-query.ts      外部数据、列与属性过滤契约
│   ├── value-help-conditions.ts 条件规范化、token格式与集合匹配
│   └── utils.ts                样式等工具
└── pages/
    ├── OrderList.tsx           Purchase Orders 列表与本地视图
    ├── OrderDetail.tsx         ObjectPageSectionShowTitle 对照对象页
    ├── ComponentGallery.tsx    组件和状态样本
    └── VerificationPage.tsx    能力范围、参考资源与后续路线
public/                        本地字体、图标与 sample 静态图片
references/
├── object-page-section-show-title/
│                              官方XML、manifest与Component快照
├── selection-controls/        Switch与Segmented Button来源
├── basic-controls/            基础控件源码、renderer与Horizon样式
├── messages/                  MessagePopover/MessageView来源与流程
├── table-keyboard/            ListBase/Table/ItemNavigation参考源码
└── value-help/conditions/     条件示例、操作/格式化源码与实现说明
registry.json / registry/fiori/ 标准本地 Registry 与隔离 staging 源码
public/r/                      官方 CLI 生成的 Registry 载荷
scripts/registry-*.mjs          构建、一致性和独立消费检查
scripts/verify-value-help-*.mjs 九项目录/条件纯逻辑检查
screenshots/                   本轮截图
```

后续可提炼为设计基础（tokens、字体、图标、密度）→ 基础组件（Button、Input、Dialog 等）→ 复合组件（动态页头、AnchorBar、响应式表格、FilterBar、VariantManagement 等）→ 页面模板（ListReport、ObjectPage 等）。第一批基础与复合组件已定义外部数据和受控 API，并完成源码消费检查；表格、动态页头和页面模板仍是后续提炼范围。

本轮已有可安装的本地 Registry 和独立消费源码。安装时使用消费项目自己的 `@fiori` 配置；运行组件时不依赖 Registry 服务。升级前仍需 `--dry-run` / `--diff` 审查本地修改，不能默认覆盖。公网发布、npm 发包和正式跨项目版本支持尚未进行。

## 验证边界

| 能力               | 本轮边界                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| 样本一致性         | 以读取的 nightly XML 与页头源码快照为基准；不宣称覆盖所有 Fiori Object Page 变体                          |
| 对象页业务操作     | XML 未绑定 Edit/Delete/Simulate Assembly 与表格业务 handlers；不添加未定义的业务结果                      |
| 动态页头与分区导航 | 本地实现 expanded/snapped、pin、anchor、overflow；逐状态行为与视觉结果由本轮 QA 记录                      |
| 表格               | 采购列表增加只读行/单元格/控件键盘导航；Products保留5重复行；无完整UI5 Edit模式、可编辑单元格或虚拟化引擎 |
| 列表设置与本地视图 | 属于列表对照入口；未实现完整 UI5 Filter Bar、P13n 或 Variant Management                                   |
| 基础组件状态       | BasicStatePreview覆盖明确的状态矩阵与本地交互；未实现全部UI5 API变体及Input值状态消息浮层                 |
| Value Help         | 独立单选、多选与conditions-only范围/排除；无完整组合变体、suggestions、条件分页或远程查询                 |
| 消息流程           | 本地校验、分类、详情和字段定位；无UI5 MessageModel、OData错误绑定或异步长文本处理                         |
| 日期输入           | 列表过滤使用浏览器原生日期控件，不是 Fiori DatePicker；对象页日期为样本静态文本                           |
| 数据集成           | 无后端、OData、Fiori Elements 元数据驱动页面或 SAP Launchpad                                              |
| 无障碍             | Base UI与本地导航提供键盘/焦点行为，实际覆盖见QA；尚未进行原生屏幕阅读器、触屏辅助技术专项验收            |
| 视觉范围           | 不能由单一样本推定全部组件、密度和设备逐像素一致                                                          |
| 分发               | 本地 Registry 已安装到独立 React 消费项目；未发布公网或 npm，尚无正式跨项目版本承诺                           |

本轮实际检查和结果见 [QA.md](./QA.md)。文档中的代码范围不代表所有检查已经通过；验证记录应随本轮修改更新。
