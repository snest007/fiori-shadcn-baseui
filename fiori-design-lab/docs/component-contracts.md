# Fiori React 试产契约 · v0.1

本轮分发的是可编辑 React 源码。shadcn CLI 从本地 Registry 安装到消费者自己的 `components/fiori/`、`lib/fiori/`，不引用设计实验室的页面、演示数据或 node_modules，不引入 UI5 控件运行时。基础行为使用 Base UI 1.9；主题对照 SAPUI5 1.151.0 Morning Horizon。

## 第一批公共组件

| 组件 | 输入与受控状态 | 事件与职责 |
| --- | --- | --- |
| FioriProvider | `density: compact / cozy`，默认 compact；接收 div 的 className/style/children | 在区域内部提供主题、字体与弹窗容器，不改 document、body 或 localStorage。低于600 CSS px使用cozy。 |
| Button | 沿用 Base UI Button 与 shadcn `variant`、`size`、`disabled`、`render` | `onClick`等原生事件；`default`为强调、`outline/secondary`为标准、`ghost`为透明、`accept/reject`为语义操作。异步状态由消费者组合和管理。 |
| Input | 原生 input props；`value/onChange`受控或`defaultValue`；`disabled/readOnly` | Field提供可访问label和description；错误用`aria-invalid`与外层Field的`data-invalid`，语义状态使用`data-value-state="error/warning/success/information"`。组件不执行业务校验。 |
| Select | Base UI Root的`items`值/文案映射、`value/onValueChange`、`open/onOpenChange`、`disabled/readOnly`；完整Trigger/Value/Content/Group/Item组合 | 只读可聚焦但不能打开；`SelectContent.mobileTitle`配置手机选择页标题；关闭回原触发器。只读状态可动态切换，锁定关闭弹层。 |
| MessageStrip | `tone`、正文、`link`、`showIcon`、`onDismiss`、`dismissLabel` | 消费者负责显示/移除。默认role=note，可显式设置status/alert。图标、文字、链接与关闭按钮使用统一视觉。 |
| ValueHelpField | 外部`items/columns`、`value`(ID数组)、`selectionMode`、`disabled/readOnly` | `onValueChange`只提交确认值；单选选择行即提交，多选OK提交、Cancel放弃草稿；`onOpenChange`观察弹层显隐。 |
| ValueHelpConditionsField | 外部`value`(条件数组)、`displayFormat`、`disabled/readOnly` | `onValueChange`提交条件；包含取并集，再移除排除；不完整区间Warning确认或返回补值。条件匹配纯工具单独导出。 |
| MessagePopover | 外部`messages`、受控`open/onOpenChange`、`resolveTarget`、`labels`；每条消息可带`targetRef/target` | 内部管理分类、详情及行焦点；`onActiveTitle`通知激活；本地目标存在时关闭后定位字段，跨页面导航的焦点由消费者管理。 |

完整类型与例子：[Value Help](./value-help-api.md)、[消息](./messages-api.md)。本地安装步骤见[Registry](./registry.md)。

## Select 的值与显示文案

使用 `<SelectValue />` 显示选中文案时，Root 必须提供 `items` 中的 `value / label` 映射，Item 的 `value` 与该映射保持一致。不要只在 `SelectItem` 的 children 写文案：弹层最初关闭、选项尚未挂载时，Root 仍需要知道 `urgent` 对应“加急”，否则源字段可能显示编码。

```tsx
const priorities = [
  { value: "normal", label: "标准" },
  { value: "urgent", label: "加急" },
]

<Select
  items={priorities}
  value={priority}
  onValueChange={(next) => setPriority(next ?? "normal")}
  readOnly={readOnly}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent mobileTitle="补货优先级">
    <SelectGroup>
      {priorities.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

非受控展开状态下，从初始只读切为可编辑可以正常打开；锁定时关闭并丢弃展开状态，再解锁仍保持关闭。若应用提供受控 `open`，应在锁定时同步设为 `false`，由调用方决定之后何时再次打开。`readOnly` 阻止打开和改值，`disabled` 另外阻止正常聚焦；两者都不能触发值提交。

## 组合与隔离

- 先安装foundation，用FioriProvider包住Fiori组件；直接使用未经Provider包裹的源码不保证主题完整。
- 支持多个并列Provider分别使用Compact/Cozy。当前不支持嵌套Provider；每个主题区域使用一个Provider。
- Dialog、Popover、Select和条件ComboBox均把Portal放在所属Provider内部，使主题和字体继续继承。区域和其祖先不要添加transform/filter/contain:paint，会改变fixed定位或裁剪弹窗。
- 主题变量与组件选择器限制在`[data-fiori-root]`内；72字体使用私有family名称，避免替换宿主字体。Registry 的 Tailwind color utilities 使用 `--color-fiori-*` namespace，如 `bg-fiori-primary`、`text-fiori-muted-foreground`、`border-fiori-border`；不重定义宿主 `--color-primary` 等映射，也不修改宿主实际CSS变量值、圆角或字体token。
- Provider 是整体 Fiori 区域的样式边界，通用 `data-slot` 控件也遵循区域规则；宿主原有控件应放在 Provider 外。宿主主题采用字面量颜色 token 时仍需浏览器 computed-style 对照，不能仅凭宿主源码 SHA 未变化推定视觉未变。
- 不导入宿主的`components/ui`，安装的依赖primitives也放在`components/fiori/ui`。文件可编辑，后续升级必须先diff消费者的改动。

## 密度、键盘和可访问性

Compact按钮/字段/Select可见高26px，按钮操作区32px；Cozy可见高36px、操作区44px。小于600px的手机布局自动Cozy。表格/选项行高32px/44px。

键盘契约延续已验收样本：Tab/Shift+Tab、Enter/Space、Select方向键与Escape、Value Help F4/Alt+Down、行选择和token删除、消息Alt+Enter定位与Shift+Enter返回。控件始终需要稳定的可访问名称；ID必须在整个document唯一，MessagePopover目标优先用ref。

浏览器键盘、DOM/AX、自动化无障碍扫描与真实屏幕阅读器是不同证据。本轮独立消费已操作外部目录、受控确认/取消、Preserve条件、消息定位和并列Provider，具体路径见 [消费验收](./consumer-validation.md) 与 [QA](../QA.md) 的 React 试产追加记录。axe 首扫发现的问题已进入源码修复，最终复扫与手机回归结果另记，不能用axe或AX tree代替VoiceOver/NVDA朗读验收。真实触屏设备、原生读屏、RTL、暗色/高对比度及完整UI5 API仍需专项验收。

## 数据与能力边界

所有业务数据和校验函数留在应用。Value Help目前为本地加载完的列表与字符串条件，没有OData、服务端过滤、日期/数值条件或UI5完整Edit表格模式；items-only与conditions-only为两个独立入口。消息没有MessageModel或异步长文本服务。当前试产不分发Object Page、List Report或完整页面模板。
