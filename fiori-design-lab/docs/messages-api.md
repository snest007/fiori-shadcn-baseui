# 消息组件契约 · 试产 v0.1

实现底座是 React、shadcn 源码和 Base UI。Message Popover 的固定参考为 SAPUI5 1.151.0 / Morning Horizon；MessageStrip 使用同一主题的语义颜色、16px 图标和当前已验证的样式。公共组件不执行字段校验、业务保存、网络请求或 OData 绑定。示例表单仍在 `message-preview.tsx`，不随公共组件分发。

## MessageStrip

公共入口：`components/fiori/message-strip`。

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `tone` | `information \| positive \| critical \| negative`，默认 `information` | 决定官方语义背景、边框和图标。 |
| `children` | `ReactNode` | 消费者提供消息正文，不包含库内业务文案。 |
| `showIcon` | `boolean`，默认 `true` | 默认显示语义图标；关闭后正文仍完整可读。 |
| `link` | 原生链接属性与 `children` | 可选正文末尾链接。链接行为由消费者控制。 |
| `onDismiss` | `() => void` | 提供时显示关闭按钮，点击只通知消费者。组件不自行删除消息。 |
| `dismissLabel` | `string`，默认“关闭消息” | 同时用于关闭按钮可访问名称和提示。 |
| `role` | 原生 ARIA role，默认 `note` | 初始静态消息默认不重复宣布。动态紧急消息可由消费者明确设置 `alert`；避免与字段错误的 live region 重复播报。 |
| 其他原生属性 | Alert 原生容器属性 | 支持 `id`、`aria-label`、`aria-describedby`、`className` 等。`className`用于布局。 |

消费者控制显隐：

```tsx
const [visible, setVisible] = useState(true)

{visible && (
  <MessageStrip tone="positive" onDismiss={() => setVisible(false)}>
    库存调整已保存。
  </MessageStrip>
)}
```

MessageStrip 的 icon 与第一行正文使用相同16px几何，不增加 shadcn 默认的2px向下偏移。正文换行时图标保持第一行对齐；Cozy/Compact 使用共同的消息条尺寸。

## MessagePopover

公共入口：`components/fiori/message-popover`。

`FioriMessage`：

```ts
type MessageType = "error" | "warning" | "success" | "information"
type FioriMessage = {
  id: string
  type: MessageType
  title: string
  subtitle?: string
  description?: string
  target?: string
  targetRef?: React.RefObject<HTMLElement | null>
  activeTitle?: boolean
}
```

- `id` 在一个消息列表内必须唯一，并在数据更新时保持稳定。
- `description` 为纯文本；存在时显示详情入口，只有一条带描述的消息时直接显示详情。
- `target` 是唯一的 DOM id；`targetRef` 直接引用消费者自己的可聚焦字段，更适合一页多个表单或多个主题实例。
- 只提供 `activeTitle=true` 时，标题仍可操作；消费者通过 `onActiveTitle` 自行处理外部导航。没有本地目标时不保证导航后的焦点，由消费者负责新页面焦点。

| 属性 | 类型 / 默认值 | 契约 |
| --- | --- | --- |
| `messages` | `readonly FioriMessage[]`，必填 | 所有消息来自消费者；组件不写回数组。 |
| `open` | `boolean`，必填 | 弹层显隐由消费者控制。 |
| `onOpenChange` | `(open: boolean) => void`，必填 | 接收按钮、关闭、Escape、标题定位等操作产生的显隐请求。 |
| `resolveTarget` | `(message) => HTMLElement \| null` | 优先解析关联字段，适合消费者持有的字段 Map。随后回退 `targetRef` 和 `target` DOM id。 |
| `onActiveTitle` | `(message, target) => void` | 标题点击或 Alt+Enter 的通知。组件先请求关闭；存在本地目标时由组件在关闭后滚动并聚焦。 |
| `disabled` | `boolean`，默认 `false` | 禁用内置触发按钮；无消息时按钮也禁用。程序控制的 `open` 仍由消费者负责。 |
| `triggerProps` | `id`、`className`、`aria-label`、`aria-labelledby`、`aria-describedby`、`title` | 给内置消息按钮附加有限原生属性，不替换其控制行为。 |
| `className` | `string` | 弹层布局扩展类名；公共主题仍负责颜色、字体和密度。 |
| `labels` | 部分 `MessagePopoverLabels` | 覆盖标题、关闭、返回、分类、空态、详情按钮、触发器名称和快捷键说明。`types` 支持局部覆盖。换语言时同时覆盖 `trigger` 和 `detailButton` 函数。 |

用消费者字段 ref：

```tsx
const stockRef = useRef<HTMLInputElement>(null)
const [open, setOpen] = useState(false)
const messages: FioriMessage[] = [{
  id: "stock-minimum",
  type: "error",
  title: "补货数量必须大于零。",
  subtitle: "补货数量",
  description: "输入有效数量后重新校验。",
  targetRef: stockRef,
}]

<Input ref={stockRef} aria-label="补货数量" />
<MessagePopover messages={messages} open={open} onOpenChange={setOpen} />
```

`getMessageSummary(messages)`返回 `{ severity, count, total }`。严重程度顺序为 Error → Warning → Success → Information；按钮显示最高严重程度的条数，名称包含总消息数。空数组返回 Information、0、0，不启用按钮。

## 内部状态、键盘与焦点

`open`与消息数据受控；分类、当前消息行和列表/详情状态为组件内部状态。弹层重新打开时分类回到全部；单条带描述的消息按上述规则进入详情。

- 桌面弹层440×320px，分类栏与标题/关闭按钮分两行；内容溢出在消息区内部滚动。
- <=599px使用全屏 Dialog，保留分类与详情行为。
- ArrowUp/Down、Home/End 移动当前消息行；Enter/Space进入详情。
- Alt+Enter激活当前行或详情的关联标题。
- Shift+Enter或返回按钮从详情回到原消息行。
- 普通关闭/Escape回到触发按钮；有效字段标题关闭后回到该字段，滚动到其可见位置。
- 字段解析失败且没有消费者标题回调时，保持弹层打开，不凭空导航。
- 没有编写本地DOM目标的消费者回调必须自行管理后续导航与焦点。隐藏、卸载或不可聚焦的目标不在库保证范围内。

## 对照与边界

本轮抽离复用已验证的交互结构，并不新增 UI5 MessageModel、自动字段校验、OData错误解析、HTML长文本、异步详情或独立MessageBox。UI5参考源码不参与运行。实际安装消费、桌面/手机视口、焦点恢复及辅助技术检查由独立消费项目记录；真实触屏和原生读屏必须与浏览器AX/自动检查分别标记。

公共依赖闭包：MessagePopover → Button、Popover、Dialog、ToggleGroup/Toggle、SapIcon；MessageStrip → Alert、Button、SapIcon。布局样式只分发 `message-popover.css`，不分发 `message-preview.css` 或基础预览布局。
