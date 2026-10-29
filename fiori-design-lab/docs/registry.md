# 本地 Fiori Registry 消费契约

本轮交付的是可复制安装的 React 组件源码，底座为当前项目已经适配的 shadcn/Base UI。安装后源码归消费项目所有，修改、升级与回归由消费项目显式管理。它没有 UI5 控件运行时，也不是 SAP 官方发行包。

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
| `@fiori/fiori-kit` | 上述公开条目的组合安装入口 |

`fiori-primitives` 是以上组件的内部依赖集合，包括 Dialog、Popover、Field、Table、Checkbox 等本地适配源码。它们通过 `@fiori/` 依赖地址引用；没有用 `"button"` 等裸名误指向官方 registry。

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

所有复杂组件的数据、受控状态和确认/取消逻辑由调用方提供。详细 API 见 `value-help-api.md`、`messages-api.md` 与第一批组件契约文档。

## 消费验证

```bash
npm run registry:verify-consumer -- /absolute/path/to/consumer
```

脚本检查标准安装 target、消费项目的 TypeScript aliases、全部本地导入闭包、runtime dependencies、内嵌字体，以及不包含作者 fixture、preview 或 UI5 控件 import，结果写入 `registry/evidence/consumer-source-check.json`。

这个检查证明源码安装和依赖隔离；它不替代浏览器交互、主题几何、真实触屏或原生屏幕阅读器验收。后者按实际执行结果另记 QA，不从 build 成功推定通过。

## 本轮真实消费证据

已在独立项目 `../fiori-registry-consumer/` 使用 `~/` import alias 配置，标准 CLI 安装 `@fiori/fiori-kit` 创建37个文件。源码检查确认目标与导入跟随消费别名，没有越界引用或 symlink 回作者目录；宿主 `src/components/ui/button.tsx` 的安装前后 SHA256 一致。

证据文件为 `registry/evidence/consumer-install.txt`、`consumer-source-check.json`、`host-button-before.json`、`host-button-after.json`。九项外部目录/条件纯逻辑检查及作者全局/相关文件 ESLint 已执行通过。源码 SHA 一致证明宿主文件未被覆盖；宿主颜色、字体和几何是否保持不变还需浏览器 computed-style 对照，尤其要覆盖宿主 theme 使用字面量 color token 的情况。浏览器、物理设备和 VoiceOver 的最终结果见 QA 追加记录，不从源码检查推定。

人工专项步骤见 [消费与设备验收](./consumer-validation.md)。本轮没有公网发布、npm发布、OData/后端接入，也没有完成全部UI5 API或Edit模式。

## 参考与版本

- [shadcn Registry 入门](https://ui.shadcn.com/docs/registry/getting-started)
- [Registry schema](https://ui.shadcn.com/schema/registry.json)
- [Registry item schema 与 target placeholders](https://ui.shadcn.com/schema/registry-item.json)
- [Base UI 组件文档](https://ui.shadcn.com/docs/components/base/button)

本轮使用 npm 项目 runner 的 `npx shadcn@latest`，CLI 实际构建和 schema validation 结果保存在验收记录。基础控件对照保留 SAPUI5 1.151.0 / Morning Horizon；原型 Object Page nightly 快照不参与本轮 Registry 分发。
