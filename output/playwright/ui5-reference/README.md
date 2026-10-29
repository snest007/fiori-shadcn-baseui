# SAPUI5 1.151.0 DynamicPage 官方参考实测

来源：[Dynamic Page FreeStyle sample](https://ui5.sap.com/1.151.0/#/entity/sap.f.DynamicPage/sample/sap.f.sample.DynamicPageFreeStyle)。SDK 中正常点击进入 sample 并切换全屏；运行时读回 `sap.ui.version=1.151.0`、`sap_horizon`，视口 1280×900。使用正常按钮点击和鼠标滚动，JavaScript 仅用于 DOM / UI5 控件属性读回。

该样例的 Header 内容实测高 82.4140625px，根字号 16px。源码 `_getSnappingHeight()` 对内容高度取 `ceil(H) - 1rem`，故 T=67px，排除 DynamicPageTitle。

|操作|读回|截图|
|---|---|---|
|向下滚动至500|Header收起|dynamic-page-scrolled-collapsed-1280.png|
|从500向上滚200至300|保持收起|dynamic-page-upscroll-300-still-collapsed-1280.png|
|从67上滚1至66|展开|dynamic-page-threshold-66-expanded-1280.png|
|从66下滚1至67|收起|dynamic-page-threshold-67-collapsed-1280.png|
|顶部Pin，再滚至500|展开，Pin pressed=true|dynamic-page-pinned-scrolled-1280.png|
|Pinned 500时手动收起|解除Pin，收起，scrollTop=67|dynamic-page-manually-collapsed-after-pin-1280.png|
|Unpinned顶部手动收起|收起，scrollTop=83=ceil(H)|dynamic-page-manually-collapsed-top-1280.png|
|Collapsed 500时手动展开|展开，scrollTop=417=500-ceil(H)|dynamic-page-manually-expanded-midscroll-1280.png|

精确来源、源码 SHA256、操作与读回记录见 [dynamic-page-evidence.json](./dynamic-page-evidence.json)。这些是官方 FreeStyle DynamicPage 的观察，不代表整个 Fiori List Report 或表格工具栏完成视觉验收。

React 共享组件已采用 T 的自动滚动规则，并实现 Unpinned 顶部收起至 ceil(H)、Pinned 收起解除固定并回到 T。中段手动展开的滚动补偿仍有结构边界：本实现的 sticky Header 一直处于普通文档流，保留当前 scrollTop；UI5 在 title / scroll 区域间搬移 Header 内容，并相应减去 ceil(H)。本记录不宣称该位置补偿完全一致。独立作者 / CLI 消费项目回归结果由主任务记录。
