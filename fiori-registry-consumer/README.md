# Fiori Registry 独立 React 消费验证

这是第一批 Fiori 源码的独立消费项目，基于 React 19、Vite 8、Tailwind CSS 4 与 shadcn / Base UI。它有自己的 package.json、锁文件、构建和 `~/` 别名；Fiori 组件由标准 shadcn CLI 复制安装到 `src/components/fiori/` 与 `src/lib/fiori/`，没有 alias 或 symlink 回设计实验室源码。

本轮 Registry 有10个标准条目，组合入口 `@fiori/fiori-kit` 安装37个源码、CSS与许可文件。本项目使用自己的仓库、物料、批次和库存校验数据，验证组件能够接收调用方数据；组件不包含采购或型号 fixture，也没有 UI5 控件运行时。

## 运行

需要 Node.js 22.12 或更新版本及 npm：

```bash
npm ci
npm run build
npm run preview
```

生产预览：[http://127.0.0.1:4188/](http://127.0.0.1:4188/)。开发使用 `npm run dev`，地址为 [http://127.0.0.1:5188/](http://127.0.0.1:5188/)。端口固定且仅绑定本机；`dist/` 通过 HTTP 访问，不支持双击 index.html 离线运行。已安装组件的运行不需要 Registry 服务。

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

它核对37个安装目标、TypeScript aliases、本地导入闭包、运行依赖、内嵌字体及源码独立性。证据位于作者项目 `registry/evidence/`；源码检查不能代替浏览器、触屏或屏幕阅读器验收。

## 使用契约

Fiori 组件放在 `FioriProvider` 内。Registry 的 `--color-fiori-*` 映射对应 `bg-fiori-primary`、`text-fiori-muted-foreground` 等专用 utilities，实际变量与组件选择器限制在 Provider 内；弹层进入所属容器。宿主原有控件放在 Provider 外。字体私有名称为 `Fiori 72` / `Fiori 72 Bold`；并列 Provider 支持不同密度，嵌套 Provider 暂不支持。

Select Root 要传 `items={[{ value: "normal", label: "标准" }, ...]}`，并与 SelectItem 的值保持一致，确保 `<SelectValue />` 在弹层尚未挂载时也显示文案。数据与 `value/onValueChange` 由调用方管理。只读 Select 可聚焦但不能打开；非受控展开状态锁定后关闭，解锁仍保持关闭。若外部控制 `open`，锁定时也应由调用方设为 false。

完整 API 见作者项目 [组件契约](../fiori-design-lab/docs/component-contracts.md)、[Value Help](../fiori-design-lab/docs/value-help-api.md)、[消息](../fiori-design-lab/docs/messages-api.md) 与 [Registry](../fiori-design-lab/docs/registry.md)。

## 已操作与待验收

桌面浏览器已操作仓库自定义列和区域筛选、物料单选/多选提交与取消、token 删除、只读/禁用、Select 只读状态转换、Preserve 条件及半区间 Warning。消息已检查分类、详情、快捷键返回、字段 ref 定位、修正后成功状态和关闭焦点恢复。并列 Provider 的弹层归属和 Compact/Cozy 尺寸已读回，Provider 外宿主紫色 Button、Geist 字体与圆角/高度保持原值。

详细数据 ID、尺寸、焦点及截图见作者项目 [QA](../fiori-design-lab/QA.md) 的“React 试产独立消费”，重复步骤见 [消费与设备验收](../fiori-design-lab/docs/consumer-validation.md)。axe首扫发现的问题已修复；最终桌面、390px手机页面与手机Value Help复扫均未报告违规，未判定项另有颜色与键盘复核。手机选择/条件/消息流程与全屏布局已验证。真实触屏和 Safari / VoiceOver 未执行，不能用视口模拟或 AX 树代替。

当前为 Morning Horizon 明亮主题的本地试产，未公网发布 Registry 或 npm 包，不包含 OData/后端、完整 UI5 API、Edit 表格、暗色/高对比度或可分发的 List Report/Object Page 模板。库存“保存”仅更新本项目的本地状态，不调用服务。
