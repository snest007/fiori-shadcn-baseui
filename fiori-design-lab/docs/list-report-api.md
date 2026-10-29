# List Report React 区块 API

本轮把已有列表的结构与交互拆成`DynamicPage`、`FilterBar`、`TableToolbar`、`ResponsiveTable<T>`与`ListReport`。组件接收外部数据、React节点和受控状态，不导入采购样本、库存fixture、页面路由或业务校验；交互仍使用shadcn / Base UI与本地React实现，没有UI5控件运行时。

设计与固定版本行为来源、待执行的截图/键盘矩阵见 [参考说明](../references/list-report-blocks/README.md)。本文件描述源码契约，本轮专项结果见 [List Report 验证记录](./list-report-validation.md)，既有结果见 [QA](../QA.md)，不能从接口存在推定官方全部行为或设备已验收。

## Registry入口

按[本地Registry配置](./registry.md)启动作者服务后，在消费者项目安装组合入口：

```bash
npx shadcn@latest add @fiori/fiori-kit
```

已有安装先通过`--dry-run`与`--diff`审查消费者修改，不能默认覆盖。五个区块也有独立入口：

| 入口 | 内容 |
| --- | --- |
| `@fiori/fiori-dynamic-page` | 受控DynamicPage及共享布局CSS。 |
| `@fiori/fiori-filter-bar` | 调用方字段与actions的FilterBar。 |
| `@fiori/fiori-table-toolbar` | 四组操作与overflow。 |
| `@fiori/fiori-responsive-table` | 外部rows/columns、选择、pop-in、growing及只读导航hook。 |
| `@fiori/fiori-list-report` | `registry:block`的单表格页面组合，引用DynamicPage；FilterBar、toolbar与表格由React节点传入。 |

每个入口只安装其源码引用闭包。完整示例需要FilterBar、TableToolbar和ResponsiveTable时，使用`fiori-kit`，或显式添加所需条目；不能从ListReport的slot用途推定所有子区块都会自动安装。运行安装后的组件不需要Registry服务。

## 分层职责

| 区块 | 接收内容 | 自身负责 | 调用方负责 |
| --- | --- | --- | --- |
| `DynamicPage` | 标题、header、summary、titleActions、expanded/pinned与变更回调 | 根据容器宽度展示phone/桌面页头、scroll/click收起展开、pin入口与页头几何。 | 初始展开状态、筛选值和摘要、手机筛选Dialog、应用滚动容器。 |
| `FilterBar` | `fields`、search、actions、onSubmit | label/控件排版、换行、可选错误容器状态。 | 数据控件、ID、value状态、live/manual更新、查询、Go/Adapt Filters与Dialog。 |
| `TableToolbar` | 标题、结果count与actions | 固定四组顺序、可见按钮和overflow菜单、按钮名称与disabled。 | 业务能否执行、never动作选择、排序/设置/导出回调的结果。 |
| `ResponsiveTable<T>` | 已加载rows、列render与断点、选择ID与导航回调 | 渲染、manual pop-in、分批growing、只读表格键盘与可访问名称。 | 过滤、排序、服务请求、选择重置、路由及自定义cell内容。 |
| `ListReport` | DynamicPage props、contentLabel、toolbar与children | 单表格List Report组合、内容间距、mount时初始焦点。 | 页面状态、过滤模式、手机筛选、空必填/Go的initialFocusRef。 |

已安装源码位于消费者自己的`components/fiori/`；基础依赖primitives位于`components/fiori/ui/`。作者代码的`@/`会按消费者`components.json`的aliases重写，不能把作者页面或全局`list.css`作为安装依赖。组件区域包在既有`FioriProvider`中，布局样式由公共`list-report.css`和隔离foundation提供。

## DynamicPage 与 ListReport

`DynamicPageProps`保留div属性（`title`改为ReactNode），并提供：

| 属性 | 类型/规则 |
| --- | --- |
| `title` | 必填`ReactNode`，标题持续可见。 |
| `header` | 可选`ReactNode`，通常为FilterBar；phone不直接展示这一整块。 |
| `summary` | 可选`ReactNode`，仅在header收起时展示；调用方根据已应用过滤生成。 |
| `titleActions` | `ReactNode`或`(state: DynamicPageState) => ReactNode`；state含`expanded`、`pinned`、`phone`，表示当前实际显示状态。手机筛选入口可放在这里。 |
| `expanded` / `pinned` | 必填boolean，均由调用方控制。 |
| `onExpandedChange` / `onPinnedChange` | 必填`(next: boolean) => void`；调用方回写状态。不可只观察事件却保持旧值。 |
| `onWidthChange` | 可选`(width: number) => void`，提供内容容器CSS px宽度，供调用方响应式控制。 |
| `scrollContainerRef` | 可选`RefObject<HTMLElement \| null>`，指向真正滚动的页面容器。否则查找`[data-fiori-scroll]`或`.page-scroll`祖先，无祖先时使用window滚动。 |
| `labels` | 可选`{ expand?, collapse?, pin?, unpin? }`，为按钮提供本地化名称与tooltip。 |

`ListReportProps`另外接收必填`contentLabel: string`、可选`toolbar: ReactNode`与`initialFocusRef: RefObject<HTMLElement | null>`。children放ResponsiveTable及必要的调用方空态/提示节点；本轮只定义单表格组合，不内置多tab、chart或Flexible Column Layout。

初始焦点只在mount时决策，不随每次筛选或页头切换抢焦点：展开默认定位首个筛选控件，收起定位首个表格行。manual模式应把Go按钮的ref传给`initialFocusRef`；若有空必填，传首个空必填控件的ref。异步结果尚未出现时的后续焦点、隐藏tab再展示和跨路由焦点由应用处理。

DynamicPage通用UI5默认展开；本组件要求显式传入状态。List Report初始无query/无结果时展开，已有query结果时可收起；已有采购页面保留其显式初始化。phone宽度小于600 CSS px时不展示桌面header和pin，由调用方给出筛选Dialog入口；900px测试点不是自动判定平板设备的API。

滚动snap以SAPUI5 1.151.0实测校准的高度阈值为契约：`T = max(ceil(H) - R, 0)`，H为展开的DynamicPageHeader内容实际高度（排除title），R为document根元素的1rem。未固定时，`scrollTop >= T`收起，滚回T以下或0时展开；在超过T的内容中段向上滚动不触发展开。手动title/箭头切换与滚动阈值是不同触发方式。整个页头高度另外用于sticky toolbar/列头堆叠，不代替H计算T。`data-header-snap-threshold`只用于本轮验证读数，不是新增公共配置API；最终实现回归待[专项记录](./list-report-validation.md)填写。

手动collapse的滚动补偿按官方观察区分：未固定且顶部展开时收起，滚动到`ceil(H)`；固定后在中段手动收起，解除pin并回到T。此时不能沿用“只改expanded而保持旧scrollTop”的状态处理。

当前明确边界：官方样本在内容中段`scrollTop=500`、collapsed状态手动Expand，会把header内容移到title区并补偿到417（该样本`ceil(H)=83`）；本React的普通flow/sticky结构展开时保持500。这个手动展开补偿分支尚未与官方一致，不能把跨阈值snap通过扩大为所有手动scroll-position行为等价。

phone、没有页面滚动、或页头高度超过可用页高60%的情况下不能固定header；有效性丢失时调用`onPinnedChange(false)`。正常pin保持展开，手动collapse/title snap覆盖pin。header内部控件的点击不应触发title snap。本轮没有完整UI5 F6分组跳转或任意header后代的自动展开/离开收起引擎。

## FilterBar

```ts
type FilterBarField = {
  id: string
  label: ReactNode
  control: ReactNode
  invalid?: boolean
}
```

`FilterBarProps`包含必填`fields: FilterBarField[]`，可选`search: ReactNode`、`actions: ReactNode`、`label: string`、`onSubmit: FormEventHandler<HTMLFormElement>`。search先于一般字段；字段上方有label并在宽度不足时换行。

每个`control`必须把同一个`id`传给实际可聚焦输入/SelectTrigger，确保label关联；ID在整个document唯一。`invalid`只设置字段容器的`data-invalid`，调用方仍需向控件传`aria-invalid`、错误description和对应值状态。Value Help可作为control组合，仍使用既有外部目录/受控值API。

FilterBar不检查字段值，不自动执行过滤。默认submit只阻止浏览器导航；自定义`onSubmit`也应`preventDefault()`再执行Go逻辑。live更新直接更新应用过滤状态；manual更新区分draft与applied，Go/Enter才提交。手机筛选Dialog的确认、取消和Escape必须明确作用于草稿，关闭后恢复到原触发器。

## TableToolbar

```ts
type TableToolbarGroup = "business" | "personalization" | "export" | "view"
type TableToolbarAction = {
  id: string
  label: string
  ariaLabel?: string
  icon?: SapIconName
  group?: TableToolbarGroup
  onAction: () => void
  disabled?: boolean
  overflow?: "never" | "auto"
  iconOnly?: boolean
}
```

`icon`实际类型沿用`ComponentProps<typeof SapIcon>["name"]`，上面的`SapIconName`是说明用简写。`TableToolbarProps`接收必填`title: ReactNode`、`actions: TableToolbarAction[]`，可选`count: number`、`label: string`和`overflowLabel: string`。

动作按business→personalization→export→view排序，组内保留输入顺序；未指定group视为business。count是当前过滤结果数量，零行不展示括号counter。`iconOnly`仍需要label作为tooltip和可访问名称；overflow项保留名称、disabled与同一个onAction，不创建第二套业务逻辑。

默认动作可进入overflow；主操作、Create/Delete/Add/Remove等必须由调用方指定`overflow: "never"`。只提供实际需要的动作；已有FilterBar执行主要筛选时，避免再加重复table search/filter。选择相关操作的disabled由调用方根据当前selectedIds和业务条件计算。

toolbar可用方向键、Home/End在可见启用按钮之间移动，overflow菜单继续使用Base UI菜单键盘与关闭焦点行为。本轮提供四个语义组与never/auto配置，未提供UI5完整priority、一起溢出的数字group、AlwaysOverflow或Disappear API；也不自动实现业务、导出或P13n Dialog。

公共CSS包含现有设置Dialog的布局类：`table-settings-dialog`、`column-options`、`column-option`与`sort-fields`。它们让调用方组合的列选项和排序表单沿用同一外观；Dialog打开状态、draft、确认/取消与业务字段仍在应用，不能将这些class视为完整P13n API。

## ResponsiveTable<T>

```ts
type ResponsiveTableColumn<T> = {
  id: string
  label: ReactNode
  render: (row: T) => ReactNode
  minWidth?: number
  align?: "start" | "end"
  className?: string
}
type ResponsiveTableCounts = {
  total: number
  loaded: number
  selected: number
}
```

| 属性 | 类型/规则 |
| --- | --- |
| `rows` | 必填`T[]`，调用方已加载、已过滤、已排序的完整结果。 |
| `columns` | 必填`ResponsiveTableColumn<T>[]`，定义当前显示顺序。`render`同时用于主表格和pop-in值；`minWidth`是实际table容器宽度断点，默认0。 |
| `getRowId` | 必填`(row: T) => string`，稳定唯一业务ID；不能用索引或随机ID。 |
| `getRowLabel` | 可选`(row: T) => string`，为逻辑行提供易理解名称。 |
| `selectedIds` / `onSelectionChange` | 可选`string[]`与`(ids: string[]) => void`；存在回调时才显示选择列，值由调用方回写。 |
| `onRowNavigate` | 可选`(id: string) => void`；存在时显示导航入口并支持行Enter/点击，真正路由由应用执行。 |
| `sort` | 可选`{ key: string; direction: "asc" \| "desc" }`，只展示箭头和`aria-sort`。**组件不对rows排序，也不从表头产生排序请求。** |
| `growingPageSize` | 可选number，默认20，决定首批/追加数量和PageUp/PageDown跨度。使用有限正整数。 |
| `scrollContainerRef` | 可选页面滚动容器ref，与DynamicPage保持一致。 |
| `labels` | 必填，至少`table: string`。另有`selectAll?`、`selectRow?: (row: T) => string`、`navigateRow?: (row: T) => string`、`noData?`、`columnHeaders?`、`navigation?`、`status?: (counts: ResponsiveTableCounts) => string`。 |

columns至少包含一列，列id必须唯一；建议对象标识列`minWidth: 0`，保证最小宽度保留关键内容，其余列用minWidth进入label/value pop-in。若全部列断点都超过容器宽度，组件仍保留第一列在主表格。这里是manual配置，不是UI5自动pop-in/importance计算。避免把业务ID`header`或列id`row/selection/navigation`用作数据键，列id不要含冒号，以免与现有导航节点键冲突。

`rows`改变引用时会重置当前渲染批次；应用应使用`useMemo`生成过滤排序结果，避免仅改变selectedIds或打开Dialog就重新创建同内容rows。growing只分批渲染已经在内存的rows，通过页面滚动追加；没有网络分页、cursor或虚拟化。counter/status区分`total`全结果、`loaded`已渲染、`selected`当前结果内选中数量。

全选作用于`rows`的**全部结果**，包含尚未渲染批次；取消全选移除当前rows中的ID，保留不属于当前结果的外部ID。如果应用希望每次筛选忘记选择，应在提交新的applied过滤时同步清空selectedIds；组件不会擅自清除外部状态。growing追加本身不改变selectedIds。

自定义cell中的链接/按钮需遵循组件导航结构与可访问名称，避免行点击和控件操作重复导航。可能进入pop-in的列，其render应使用只读文本/状态等展示内容，不能放可聚焦链接、按钮、输入或带tabIndex的元素：当前视觉pop-in行有`aria-hidden="true"`，通过主行的`aria-describedby`提供描述，不提供独立grid cell编辑与导航。只有描述文本的pop-in保持当前只读范围；任意互动控件的pop-in需要另外实现和验收。只读键盘范围及边界场景见 [参考矩阵](../references/list-report-blocks/README.md)。

## 最小外部数据组合

以下是调用方结构示例；items和导航函数来自应用，组件内部没有库存数据。aliases按消费者自己的项目配置替换。

```tsx
import { useMemo, useState } from "react"
import { FioriProvider } from "@/components/fiori/fiori-provider"
import { ListReport } from "@/components/fiori/list-report"
import { FilterBar } from "@/components/fiori/filter-bar"
import { TableToolbar } from "@/components/fiori/table-toolbar"
import {
  ResponsiveTable,
  type ResponsiveTableColumn,
} from "@/components/fiori/responsive-table"
import { Input } from "@/components/fiori/ui/input"

type Item = { id: string; name: string; warehouse: string }
const columns: ResponsiveTableColumn<Item>[] = [
  { id: "id", label: "物料", render: (row) => row.id, minWidth: 0 },
  { id: "name", label: "名称", render: (row) => row.name, minWidth: 650 },
  { id: "warehouse", label: "仓库", render: (row) => row.warehouse, minWidth: 900 },
]

export function ItemList({
  items,
  onOpen,
}: {
  items: Item[]
  onOpen: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [warehouse, setWarehouse] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const rows = useMemo(
    () => items.filter((item) => item.warehouse.includes(warehouse)),
    [items, warehouse],
  )

  return (
    <FioriProvider density="compact">
      <ListReport
        title="库存"
        contentLabel="库存列表"
        expanded={expanded}
        pinned={pinned}
        onExpandedChange={setExpanded}
        onPinnedChange={setPinned}
        summary={warehouse ? "1 filter active: 仓库" : "No filters active"}
        header={
          <FilterBar
            fields={[
              {
                id: "item-list-warehouse",
                label: "仓库",
                control: (
                  <Input
                    id="item-list-warehouse"
                    value={warehouse}
                    onChange={(event) => {
                      setWarehouse(event.target.value)
                      setSelectedIds([])
                    }}
                  />
                ),
              },
            ]}
          />
        }
        toolbar={<TableToolbar title="物料" count={rows.length} actions={[]} />}
      >
        <ResponsiveTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `${row.id} ${row.name}`}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowNavigate={onOpen}
          labels={{ table: "库存物料", noData: "没有符合条件的物料" }}
        />
      </ListReport>
    </FioriProvider>
  )
}
```

这是外部rows、列和受控选择的最小组合，未包括phone筛选Dialog。跨设备应用还必须通过`titleActions={({ phone }) => ...}`提供手机筛选入口，并组合现有Dialog、草稿和确认/取消。需要页面滚动容器时，两组件传同一个`scrollContainerRef`；多个列表实例的字段ID按实例生成，不能重复上例固定ID。

## 当前能力边界

本轮交付是单表格List Report区块的源码试产。已有采购的本地视图/导出/适配筛选Dialog和独立库存的业务规则仍留在调用方。没有新增完整UI5 Variant Management、P13n、复杂表格Edit模式、服务端growing、OData/Fiori Elements元数据、chart/multiple views或Object Page模板；内容中段手动Expand的scroll-position补偿仍有上述结构差异。本地安装、source closure、浏览器交互、视觉对照与真实设备结果分别记录；以最终Registry与专项验证记录判断本轮验收，不能用本文件的示例替代验证。
