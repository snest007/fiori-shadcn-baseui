# 本地 Fiori Registry 消费契约

本轮交付的是可复制安装的 React 组件源码，底座为当前项目已经适配的 shadcn/Base UI。安装后源码归消费项目所有，修改、升级与回归由消费项目显式管理。它没有 UI5 控件运行时，也不是 SAP 官方发行包。

当前source registry为15条目，`fiori-kit`组合入口覆盖47个源码、CSS和许可文件。第二轮新增单表格ListReport区块；第一批10条目/37文件安装记录作为历史保留，不覆盖旧结果。

## 目录与隔离

- `src/components/ui/` 和 `src/components/fiori/` 是设计实验室作者源码。
- `scripts/registry-build.mjs` 将公开组件与必要的本地 UI 依赖转换到 `registry/fiori/` staging，不分发采购单或型号 fixture、组件预览页面及业务校验逻辑。
- `registry.json` 是标准 shadcn source registry；`public/r/*.json` 是官方 CLI 生成的消费载荷。
- 组件 target 为 `@components/fiori/`，内部 UI target 为 `@components/fiori/ui/`，工具与 CSS target 为 `@lib/fiori/`。这些 target 使用 shadcn 目标占位符，由消费项目 `components.json` 中的 aliases 解析。
- 宿主原有的 `components/ui/button.tsx` 等文件不作为安装目标。Fiori 内部 UI 是作者的适配版本，不从官方裸名 registry 重新安装覆盖。
- `FioriProvider` 导入独立的 scoped CSS。组件规则与实际主题变量限定在 `[data-fiori-root]` 中；弹层通过 context 进入所属 Provider 的根容器。并列 Provider 可以分别使用 Compact / Cozy；嵌套 Provider 暂不支持。Provider 是整个 Fiori 区域的样式边界，宿主控件应放在该区域外。
- Registry 使用专用 Tailwind color utility namespace：`--color-fiori-primary` 对应 `bg-fiori-primary`，`--color-fiori-muted-foreground` 对应 `text-fiori-muted-foreground`。这些 utility 映射会由 Tailwind 全局登记，实际取值来自 Provider 内的主题变量；不会重定义宿主 `--color-primary`、`--color-border` 等已有映射。作者页面保留原类名，staging 时转换组件源码与 CSS `@apply` 中的 color utilities。
- 字体以 data URI 包含在 `fiori-fonts.css`，注册名称为 `Fiori 72` / `Fiori 72 Bold`，不依赖作者 localhost 字体路径或 SAP CDN。字体与图标许可证随 foundation 安装。

## 第一批条目

| Registry 地址 | 内容 |
| --- | --- |
| `@fiori/fiori-foundation` | Provider、context、主题、字体、静态图标与通用工具 |
| `@fiori/fiori-button` | 本地适配 Button |
| `@fiori/fiori-input` | 本地适配 Input |
| `@fiori/fiori-select` | 本地适配 Select 与手机 picker |
| `@fiori/fiori-message-strip` | 公共 MessageStrip |
| `@fiori/fiori-value-help` | 使用调用方数据与列配置的单选/多选 Value Help |
| `@fiori/fiori-value-help-conditions` | 独立条件字段、操作符与纯条件工具 |
| `@fiori/fiori-message-popover` | 调用方消息列表、详情、筛选和定位回调 |
| `@fiori/fiori-kit` | 公开条目的组合安装入口，现包含下方第二轮5个区块 |

`fiori-primitives` 是以上组件的内部依赖集合，包括 Dialog、Popover、Field、Table、Checkbox 等本地适配源码。它们通过 `@fiori/` 依赖地址引用；没有用 `"button"` 等裸名误指向官方 registry。

## 第二轮 List Report区块

| Registry 地址 | 类型/内容 |
| --- | --- |
| `@fiori/fiori-dynamic-page` | `registry:component`；受控页头、scroll snap/pin和共享布局CSS。 |
| `@fiori/fiori-filter-bar` | `registry:component`；调用方字段、搜索与actions布局。 |
| `@fiori/fiori-table-toolbar` | `registry:component`；四组操作、never/auto overflow与键盘。 |
| `@fiori/fiori-responsive-table` | `registry:component`；外部rows/columns、选择、pop-in、growing和只读导航hook。 |
| `@fiori/fiori-list-report` | `registry:block`；单表格ListReport组合，数据、筛选、toolbar与table由调用方传入。 |

本轮primitives另包含调用方设置/菜单组合需要的DropdownMenu、Tabs与ObjectStatus。每个独立条目按源码import闭包安装依赖；ListReport的React节点slot不会自动引入其未引用的FilterBar、toolbar和table。完整组合安装`fiori-kit`，或显式安装所需条目。API、更新模式、手机筛选和只读范围见[List Report API](./list-report-api.md)。

## 作者构建

```bash
npm run foundation:build
npm run foundation:check
npm run registry:build
npx shadcn@latest registry validate ./registry.json
npm run registry:check
```

构建脚本先生成 scoped foundation，再分发公开 CSS 的 scoped 副本，重写导入与 color utility namespace，生成标准 `registry.json`，最后运行官方 `shadcn build`。`--check` 不修改源码或载荷，检查 foundation、staging、来源 SHA256、目标、依赖闭包、依赖 DAG 和 built payload 是否一致。

当前本地服务入口为 `http://127.0.0.1:4178/r/{name}.json`。如果本地端口变更，消费项目中的 `@fiori` 地址需要同步更新；组件运行本身不需要此 Registry 服务。

## 独立 React 项目安装

前提是 React 19、Tailwind CSS 4 与有效的 `components.json`。本轮新消费项目使用独立 package.json、源码、build 与端口，没有从设计实验室直接 alias 或 symlink 组件目录。

在消费项目的 `components.json` 中添加：

```json
{
  "registries": {
    "@fiori": "http://127.0.0.1:4178/r/{name}.json"
  }
}
```

通过标准 CLI 检查和安装：

```bash
npx shadcn@latest view @fiori/fiori-kit
npx shadcn@latest add @fiori/fiori-kit --dry-run
npx shadcn@latest add @fiori/fiori-kit
```

首次安装进入新的 Fiori namespace，不需要覆盖宿主已有 shadcn 文件。如果已经安装并自行修改 Fiori 源码，更新前先执行 `--dry-run` / `--diff` 审查；不要把覆盖作为默认升级方式。

最小使用例子（下面以 `@/` 为消费项目实际别名）：

```tsx
import { FioriProvider } from "@/components/fiori/fiori-provider"
import { Button } from "@/components/fiori/ui/button"

export function FioriRegion() {
  return (
    <FioriProvider density="compact">
      <Button variant="default">保存</Button>
    </FioriProvider>
  )
}
```

所有复杂组件的数据、受控状态和确认/取消逻辑由调用方提供。详细API见[Value Help](./value-help-api.md)、[消息](./messages-api.md)、[List Report](./list-report-api.md)与第一批组件契约文档。

## 消费验证

```bash
npm run registry:verify-consumer -- /absolute/path/to/consumer
```

脚本检查标准安装 target、消费项目的 TypeScript aliases、全部本地导入闭包、runtime dependencies、内嵌字体，以及不包含作者 fixture、preview 或 UI5 控件 import，结果写入 `registry/evidence/consumer-source-check.json`。

这个检查证明源码安装和依赖隔离；它不替代浏览器交互、主题几何、真实触屏或原生屏幕阅读器验收。后者按实际执行结果另记 QA，不从 build 成功推定通过。

## 第一批真实消费证据（37文件，历史）

已在独立项目 `../fiori-registry-consumer/` 使用 `~/` import alias 配置，标准 CLI 安装 `@fiori/fiori-kit` 创建37个文件。源码检查确认目标与导入跟随消费别名，没有越界引用或 symlink 回作者目录；宿主 `src/components/ui/button.tsx` 的安装前后 SHA256 一致。

第一批原始安装输出保留在`registry/evidence/consumer-install.txt`，宿主文件记录为`host-button-before.json`与`host-button-after.json`。`consumer-source-check.json`随当前安装重跑，是最新轮次报告，不能当作第一批37文件报告的固定快照。九项外部目录/条件纯逻辑检查及作者全局/相关文件ESLint的第一批结果保留；源码SHA一致证明宿主文件未被覆盖，颜色、字体和几何另外按浏览器computed-style记录。浏览器、物理设备和VoiceOver结果见QA追加记录，不从源码检查推定。

人工专项步骤见 [消费与设备验收](./consumer-validation.md)。本轮没有公网发布、npm发布、OData/后端接入，也没有完成全部UI5 API或Edit模式。

## 第二轮真实CLI安装与当前源码报告

2026-10-29在同一独立消费项目使用标准`shadcn add @fiori/fiori-kit`，从临时`127.0.0.1:4279` Registry服务安装第二轮载荷。**本轮操作记录**为新增10文件、跳过37文件；7个已有文件的差异仅`use client` directive，逐项选择保留原文件，没有使用`--overwrite`。这次原始CLI输出未保存，以上是操作摘要，不能标作原始日志证据。日常Registry配置与运行端口仍按前文4178入口。

当前生成的`registry.json`有15条目，source manifest有47文件；最新`registry/evidence/consumer-source-check.json`报告`installedSourceFiles=47`、`failures=[]`，保持`~/` aliases和独立安装目标。该报告只验证源码/导入闭包，不能证明滚动、overflow或像素一致性。

DynamicPage随后按固定1.151官方运行样本修正scroll阈值，targeted更新的原始dry-run、单文件diff与apply输出保存在[consumer-list-report-update.txt](../registry/evidence/consumer-list-report-update.txt)。dry-run列出14个目标，其中1个待更新、13个跳过；审查`dynamic-page.tsx`差异后只确认该文件的覆盖提示，实际输出为更新1文件、跳过13文件，未使用全局`--overwrite`。临时Registry配置已恢复4178。

安装后的最终全量检查和浏览器结果待[List Report专项记录](./list-report-validation.md)汇总。不得把第二轮首次安装摘要、后续targeted更新日志和第一批原始安装日志混作同一轮证据。

## 参考与版本

- [shadcn Registry 入门](https://ui.shadcn.com/docs/registry/getting-started)
- [Registry schema](https://ui.shadcn.com/schema/registry.json)
- [Registry item schema 与 target placeholders](https://ui.shadcn.com/schema/registry-item.json)
- [Base UI 组件文档](https://ui.shadcn.com/docs/components/base/button)

本轮使用 npm 项目 runner 的 `npx shadcn@latest`，CLI 实际构建和 schema validation 结果保存在验收记录。基础控件对照保留 SAPUI5 1.151.0 / Morning Horizon；原型 Object Page nightly 快照不参与本轮 Registry 分发。
