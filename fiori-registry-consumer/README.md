# Fiori Registry 独立 React 消费验证

这是 Fiori 源码的独立消费项目，基于 React 19、Vite 8、Tailwind CSS 4 与 shadcn / Base UI。它有自己的 package.json、锁文件、构建和 `~/` 别名；Fiori 组件由标准 shadcn CLI 复制安装到 `src/components/fiori/` 与 `src/lib/fiori/`，没有 alias 或 symlink 回设计实验室源码。

本轮 Registry 有15个标准条目，组合入口 `@fiori/fiori-kit` 安装47个源码、CSS与许可文件；第一批10条目/37文件的历史证据仍保留。本轮新增DynamicPage、FilterBar、TableToolbar、ResponsiveTable和ListReport区块，库存应用组合这些安装源码，使用自己的数据与业务状态；组件不包含采购或型号fixture，也没有UI5控件运行时。

## 运行

需要 Node.js 22.12 或更新版本及 npm：

```bash
npm ci
npm run build
npm run preview
```

生产预览：[http://127.0.0.1:4188/](http://127.0.0.1:4188/)。开发使用 `npm run dev`，地址为 [http://127.0.0.1:5188/](http://127.0.0.1:5188/)。端口固定且仅绑定本机；`dist/` 通过 HTTP 访问，不支持双击 index.html 离线运行。已安装组件的运行不需要 Registry 服务。

## 库存列表与详情

本轮入口为[物料库存列表](http://127.0.0.1:4188/#/inventory)，详情示例为[INV-0001](http://127.0.0.1:4188/#/inventory/INV-0001)。开发服务使用同样hash路径；原有单组件验证表单仍从页面导航进入。

`src/inventory/data.ts`由调用方提供72条虚构库存记录：12种物料×6个仓库，覆盖正常、低库存、缺货和盘点状态。数据结构与作者采购页不同；公共组件只接收rows、列render、选择ID与回调，不读取这个文件。

页面组合公共ListReport、FilterBar、TableToolbar和ResponsiveTable，提供跨库存记录/编码/名称/仓库的搜索、仓库/状态筛选、列与排序设置、growing、全结果选择和CSV导出。手机通过筛选Dialog编辑草稿，应用/取消由库存调用方控制。`标记已盘点`只更新消费应用的React状态，不调用服务、不写库存数据库，刷新会回到源码初始记录。

行进入只读库存详情，显示同一记录的编码、名称、仓库、数量、状态、盘点状态与日期，并提供返回列表。它是验证列表导航及外部数据传递的简单详情页，**尚未提炼为Object Page模板**，没有增加编辑/保存业务。

本轮公共API见[List Report API](../fiori-design-lab/docs/list-report-api.md)，最终浏览器与回归结果见[专项验证记录](../fiori-design-lab/docs/list-report-validation.md)。页面实现范围、官方运行观察和最终通过结果分别记录，不能把第一批组件结果当成本轮库存页面已经验收。

## Registry 与更新

`components.json` 已配置：

```json
{
  "registries": {
    "@fiori": "http://127.0.0.1:4178/r/{name}.json"
  }
}
```

安装或检查新版本时，先启动同级 `../fiori-design-lab/` 的本地 Registry 服务，再执行：

```bash
npx shadcn@latest view @fiori/fiori-kit
npx shadcn@latest add @fiori/fiori-kit --dry-run
```

首次安装在新项目执行 `npx shadcn@latest add @fiori/fiori-kit`。本项目已经安装；更新前用 `--diff` 审查消费者的本地修改，不能把覆盖作为默认升级方式。宿主原有 `src/components/ui/button.tsx` 没有作为 Fiori 安装目标，其安装前后 SHA256 一致。

从作者项目检查实际消费源码：

```bash
# 在 ../fiori-design-lab/ 中执行
npm run registry:verify-consumer -- ../fiori-registry-consumer
```

它核对当前47个安装目标、TypeScript aliases、本地导入闭包、运行依赖、内嵌字体及源码独立性。证据位于作者项目`registry/evidence/`，当前`consumer-source-check.json`是最新轮次报告；第一批37文件安装原始日志单独保留。第二轮首次安装为新增10/跳过37的操作记录，原始CLI输出未保存，后续targeted更新另保留日志，详情见[Registry轮次记录](../fiori-design-lab/docs/registry.md)。源码检查不能代替浏览器、触屏或屏幕阅读器验收。

## 使用契约

Fiori 组件放在 `FioriProvider` 内。Registry 的 `--color-fiori-*` 映射对应 `bg-fiori-primary`、`text-fiori-muted-foreground` 等专用 utilities，实际变量与组件选择器限制在 Provider 内；弹层进入所属容器。宿主原有控件放在 Provider 外。字体私有名称为 `Fiori 72` / `Fiori 72 Bold`；并列 Provider 支持不同密度，嵌套 Provider 暂不支持。

Select Root 要传 `items={[{ value: "normal", label: "标准" }, ...]}`，并与 SelectItem 的值保持一致，确保 `<SelectValue />` 在弹层尚未挂载时也显示文案。数据与 `value/onValueChange` 由调用方管理。只读 Select 可聚焦但不能打开；非受控展开状态锁定后关闭，解锁仍保持关闭。若外部控制 `open`，锁定时也应由调用方设为 false。

完整 API 见作者项目 [组件契约](../fiori-design-lab/docs/component-contracts.md)、[Value Help](../fiori-design-lab/docs/value-help-api.md)、[消息](../fiori-design-lab/docs/messages-api.md)、[List Report区块](../fiori-design-lab/docs/list-report-api.md) 与 [Registry](../fiori-design-lab/docs/registry.md)。

## 第一批专项结果与本轮待验收

桌面浏览器已操作仓库自定义列和区域筛选、物料单选/多选提交与取消、token 删除、只读/禁用、Select 只读状态转换、Preserve 条件及半区间 Warning。消息已检查分类、详情、快捷键返回、字段 ref 定位、修正后成功状态和关闭焦点恢复。并列 Provider 的弹层归属和 Compact/Cozy 尺寸已读回，Provider 外宿主紫色 Button、Geist 字体与圆角/高度保持原值。

详细数据 ID、尺寸、焦点及截图见作者项目 [QA](../fiori-design-lab/QA.md) 的“React 试产独立消费”，重复步骤见 [消费与设备验收](../fiori-design-lab/docs/consumer-validation.md)。axe首扫发现的问题已修复；最终桌面、390px手机页面与手机Value Help复扫均未报告违规，未判定项另有颜色与键盘复核。手机选择/条件/消息流程与全屏布局已验证。真实触屏和 Safari / VoiceOver 未执行，不能用视口模拟或 AX 树代替。

以上保留第一批组件专项结果。本轮新增库存ListReport已完成15组自动回归与15项人工操作，最终交互、像素回归和未执行设备状态见[专项验证记录](../fiori-design-lab/docs/list-report-validation.md)。

当前为Morning Horizon明亮主题的本地试产，未公网发布Registry或npm包，无OData/后端、完整UI5 API、Edit表格、暗色/高对比度。单表格ListReport区块已通过Registry分发，Object Page仍是作者样本演示，未作为模板分发；库存详情保持只读、本地业务操作不调用服务。
