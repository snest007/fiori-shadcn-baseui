# Message Popover reference and implementation

Reference baseline: **SAPUI5 1.151.0, SAP Horizon**. The downloaded files are reference evidence and are not imported by the application.

## Official evidence

- [MessagePopover](https://ui5.sap.com/1.151.0/resources/sap/m/MessagePopover-dbg.js): footer messaging trigger; desktop/tablet popover; phone full-screen dialog; default content size 440 × 320 px; initial list focus.
- [MessageView](https://ui5.sap.com/1.151.0/resources/sap/m/MessageView-dbg.js): All / Error / Warning / Success / Information filters; nonempty types; filters hidden for a single type; list and details; active title event; Shift+Enter returns to list; a single item with a description opens its details initially.
- [Official sample](https://ui5.sap.com/1.151.0/#/entity/sap.m.MessagePopover/sample/sap.m.sample.MessagePopover), [sample controller](https://ui5.sap.com/1.151.0/test-resources/sap/m/demokit/sample/MessagePopover/controller/MessagePopover.controller.js), and [sample view](https://ui5.sap.com/1.151.0/test-resources/sap/m/demokit/sample/MessagePopover/view/MessagePopover.view.xml): trigger severity Error > Warning > Success > Information, trigger count equals the number of messages with the highest severity, and trigger button type Negative / Critical / Success / Neutral.
- [Horizon library CSS](https://ui5.sap.com/1.151.0/resources/sap/m/themes/sap_horizon/library.css): semantic icons retain their colors inside selected message filters; list and details typography, spacing and semantic button tokens. `message-css-extract.txt` contains readable MessageView / MessagePopover rules.

`source-index.json` records successful sources with SHA-256 digests and sizes, plus failed retrieval attempts. Initial sample paths without `view/` and `controller/` returned 404; corrected paths succeeded. The versioned Message Popover design guideline URL returned HTTP 403, so the guideline body has not been claimed as live-verified.

## React implementation

`src/components/fiori/message-preview.tsx` composes the existing shadcn Button, Field, Input, ToggleGroup, Popover, and Dialog components. Popover's arrow uses the same Base UI primitive as the existing shadcn Popover. SVG icons and SAP theme parameters are assets only; no SAPUI5 or UI5 Web Components controls are used.

`MessagePopover` accepts controlled `messages`, `open`, `onOpenChange`, and optional `resolveTarget`. A message contains `id`, `type`, `title`, optional `subtitle`, `description`, and DOM `target`. Target resolution defaults to `document.getElementById`; the sample passes an input-ref resolver.

The sample validation rules and navigation destination are application behavior. The official active-title sample shows a toast; this preview demonstrates the intended app integration by closing the message surface, scrolling to the associated field, and focusing it. The same close policy is used on desktop and phone. Keyboard list navigation adds ArrowUp / ArrowDown / Home / End, with Enter or Space opening details; Alt+Enter activates the message title. Title links and separate details buttons remain distinct actions. The official browser reference confirms that desktop and phone list views use a title/close header followed by a separate segmented-filter bar; details hide the filter bar.

## Reproducible browser validation

Open `#/components`, then the messaging tab, and use the panel titled “消息汇总与错误定位 Message Popover”.

1. Click 保存 with initial values. Expect 2 errors, 1 warning and 1 information message. The negative trigger shows **2**, while its accessible label states **4** messages in total.
2. Switch between 全部, 错误 (2), 警告 (1), and 信息 (1). The list should show the corresponding messages; empty types are absent.
3. Open the first row's 查看详情 button. Confirm description, 返回消息列表, Close, and Shift+Enter. Return should restore the same list row's focus.
4. Click the active error title “请输入客户名称。” or focus its row and press Alt+Enter. Expect the surface to close and 客户名称 to receive focus. Fill a customer name. Repeat for 电子邮件, entering `sales@example.com`.
5. Save while quantity remains `25` and note is empty. Expect save success toast, no errors, and warning / information / success messages. The trigger shows the single highest-severity warning.
6. Set quantity to `0` and save. Expect the quantity error and field navigation. Set it to `5`, fill a note, and save. Expect a single success message that opens directly to its details.
7. Reset. Expect initial values and no validation messages. The message button is disabled until validation produces messages.
8. Repeat open, details, Back, title navigation, Close and Escape at phone width (≤599 px). Expect a full-screen dialog with message type filters in a separate row.
9. Repeat at Compact / Cozy and Light / Dark. Check semantic value states, filters, message list, popup size and clipping. On desktop, Close and Escape should return focus to the messaging button; title navigation should return focus to the field.

Code checks are separate from browser evidence. Browser screenshots and interaction results belong in the project QA record after the real page and official sample have been exercised.

## Scope

This is a local component preview with synchronous validation and simulated saving. It does not modify Purchase Orders or Object Page data, persist business data, implement UI5 MessageModel / OData error handling, asynchronous long-text retrieval, grouped messages, or the optional initially-collapsed popover variant.
