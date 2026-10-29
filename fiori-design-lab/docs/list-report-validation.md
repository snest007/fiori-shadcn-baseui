# List Report 区块验证记录

2026-10-29完成本轮组件拆分、独立库存消费及浏览器回归。以下分别记录官方观察、源码安装、实现回归和未执行项；不将当前实现基线当作官方逐像素一致性证明。API见[List Report API](./list-report-api.md)，规范来源与完整复核矩阵见[参考说明](../references/list-report-blocks/README.md)。

## 环境与安装

| 项目 | 实际结果 |
| --- | --- |
| 系统与浏览器 | macOS；Chromium 156.0.8078.4；Playwright 1.64.1。 |
| 作者/消费测试地址 | 独立端口4278/4488；隔离副本由脚本自动启动4278/4288并在结束后关闭。用户4178服务不参与本轮回归。 |
| 自动化视口 | 作者1280×720 Compact/Cozy、900×720与390×844；库存1280×720、390×844、320×844菜单。手机组件使用Cozy尺寸。 |
| 库存人工视口 | 1280×720 Compact、390×844 Cozy。 |
| Registry | 15条目、47个源码/CSS/许可文件。 |
| 标准CLI安装 | 第二轮新增10、跳过37，是本轮操作摘要，初次原始输出未保存。之后仅审查并更新DynamicPage，更新1、跳过13。 |
| 依赖与源码 | 47文件aliases、导入闭包、嵌入字体检查通过；无UI5控件运行时或作者页面依赖。 |
| 独立安装复核 | 从只含本轮改动的Git tree导出副本，根项目及两子项目分别`npm ci`成功，`npm run verify`通过。未包含并行ComponentLibrary/ObjectPage改动。 |

CLI的[dry-run、单文件diff与安装输出](../registry/evidence/consumer-list-report-update.txt)及[最后的空header守卫同步](../registry/evidence/consumer-list-report-guard-update.txt)均已保存。只接受已审查单文件的覆盖提示，没有使用全局`--overwrite`。消费package.json及既有依赖version/resolved/integrity未变化，保留可跨平台安装的锁文件。

`npm run verify`通过两端lint/build、194个官方主题参数、foundation/Registry生成一致性、9项目录/条件契约测试和47文件消费源码检查。消费构建有bundle超过500kB的非阻断提示；本轮未进行体积优化。

## 官方DynamicPage对照

固定运行样本：[SAPUI5 1.151.0 DynamicPageFreeStyle](https://ui5.sap.com/1.151.0/#/entity/sap.f.DynamicPage/sample/sap.f.sample.DynamicPageFreeStyle)，运行时为1.151.0、sap_horizon、1280×900。Header内容高82.4140625px，根1rem=16px，`T=max(ceil(H)-1rem,0)=67px`，排除Title高度。

[官方9个状态记录](../../output/playwright/ui5-reference/dynamic-page-evidence.json)及[截图说明](../../output/playwright/ui5-reference/README.md)确认：67收起、66展开；500向上滚至300仍收起；pin后500保持展开；pinned手动收起解除pin并回到T；未固定顶部手动收起到ceil(H)。公共React组件已经修正这些状态，去掉按向上滚动delta展开及300ms抑制逻辑。

**仍有一项结构差异：**中段500手动展开时，官方搬移Header并将scrollTop补偿为417；React的sticky Header保持在普通流中，保留500。此项没有完成官方滚动位置一致性，不记录为一致性通过。官方artifact只覆盖DynamicPage，不代表完整List Report或所有toolbar变体已验收。

## 作者与库存交互

| 场景 | 实际验证与边界 |
| --- | --- |
| Header | 作者自动回归通过T/T-1、500中段向上仍收起、回顶部展开、pin滚动保持、手动收起清除pin、顶部collapse到ceil(H)。sticky Header/toolbar/列头的接缝误差不超过1px。 |
| 过滤与选择 | 作者实时过滤到PO-48865、全选不导航；32条全结果选择与growing追加通过。库存不同筛选schema通过，cd仓库12条，cd+empty唯一INV-0034。 |
| 业务回调 | 库存标记已盘点后同一ID仍选中，日期更新且重复操作禁用；筛选更新清空选择。数据为72库存记录、12种物料、6个仓库。 |
| 设置与排序 | 库存人工确认/取消列设置通过，确认隐藏更新日期、取消保留；可用库存降序的首三条为INV-0065/0052/0039。排序设置取消未专项执行。 |
| 键盘与导航 | 自动检查ArrowDown、Space、Ctrl/Meta+A、ArrowRight、F2进出checkbox、Enter行导航。库存详情返回恢复原行焦点和滚动位置；人工另在scrollTop600验证INV-0024。其余完整键盘矩阵未逐项执行。 |
| 手机pop-in与overflow | 作者900/390、库存390/320无横向溢出，次要列进入pop-in；库存never业务动作保持可见，设置/导出进入overflow；Escape等待菜单隐藏后返回trigger。 |
| 手机筛选Dialog | 自动与人工验证提交、取消、重置及返焦；人工另验证Escape丢弃草稿、嵌套仓库Select的Escape只关闭自身，父Dialog保留。 |
| 手机Dialog修复 | 清除Tailwind独立translate变量，覆盖全屏max-height，字段内边距16px。最终390×844 Dialog为x0/y0/w390/h844，字段x17/right373，底部按钮bottom839。作者手机设置Dialog也通过全屏几何断言。 |
| Growing/空态 | 作者20→32追加通过；库存初始渲染20/72，空结果、恢复与选择计数通过。未执行服务端分页，CSV内容未人工检查。 |
| 宿主与设备 | 独立消费和Portal归属通过源码及DOM检查。新库存页的完整axe、宿主computed-style专项、聚焦行异步消失/隐藏列焦点矩阵未执行。 |

库存的[15项人工操作报告](../../output/playwright/inventory-manual/validation-report.json)保存数据ID、几何、焦点和截图；错误手机弹窗的before截图不作为最终证据。

## 自动回归与截图

根目录运行：

```bash
npm run verify
npm run test:list-report
```

最终工作目录与隔离副本均通过**15/15组交互断言、15/15张截图比较**；15张图的changedPixelRatio均为0，浏览器runtime errors为0。证据为[工作目录报告](../../output/playwright/list-report-regression-report.json)和[隔离副本报告](../../output/playwright/list-report-isolated-report.json)，已审查的macOS基线在`output/playwright/baselines/darwin/`。更新基线前已经检查桌面、手机表格、菜单与Dialog截图；不以更新expected来掩盖问题。

脚本默认自动管理4278/4288生产预览。已有服务可用`--external`及`FIORI_LAB_URL`/`FIORI_CONSUMER_URL`指定地址。PNG比较阈值为单通道差异>12的像素不超过0.5%。Linux Actions使用`--capture-only`执行相同交互断言并上传截图，不比较macOS像素基线；云端实际结果以该提交的Actions记录为准。

## 保留的验收边界

真实触屏、软键盘与viewport变化、Safari/Firefox、原生VoiceOver未执行。没有把浏览器视口模拟、axe历史结果或源码检查当作这些设备通过。完整UI5 F6分组、Edit模式、范围选择、OData/元数据驱动页面、多视图、全部toolbar优先级及Object Page模板仍不在本轮交付范围内。
