import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { SapIcon } from "@/components/fiori/sap-icon"
import { ListReport } from "@/components/fiori/list-report"
import { FilterBar } from "@/components/fiori/filter-bar"
import { TableToolbar } from "@/components/fiori/table-toolbar"
import { ResponsiveTable } from "@/components/fiori/responsive-table"
import { ObjectStatus } from "@/components/fiori/object-status"
import {
  EMPTY_PURCHASE_ORDER_FILTERS as EMPTY_FILTERS,
  filterPurchaseOrders as filterOrders,
  isPurchaseOrderFilters as isFilters,
  purchaseOrderFilterOptions,
  purchaseOrderStatusTone,
  type PurchaseOrderSample as Order,
  type PurchaseOrderFilters as Filters,
} from "@/lib/purchase-order-sample"
import "./list.css"

type Column =
  "id" | "model" | "supplier" | "factory" | "status" | "delivery" | "amount"
type Sort = { key: Column; direction: "asc" | "desc" }
type FilterKey = Exclude<keyof Filters, "search">
type View = {
  id: string
  name: string
  filters: Filters
  fields: FilterKey[]
  columns: Column[]
  sort: Sort
}
const COLUMN_LABELS: Record<Column, string> = {
  id: "Purchase Order",
  model: "Model",
  supplier: "Supplier",
  factory: "Factory",
  status: "Status",
  delivery: "Expected Delivery Date",
  amount: "Monthly Leasing Instalment (USD)",
}
const FILTER_LABELS: Record<FilterKey, string> = {
  model: "Model",
  supplier: "Supplier",
  factory: "Factory",
  status: "Status",
  from: "Expected Delivery Date From",
  to: "Expected Delivery Date To",
}
const DEFAULT_COLUMNS: Column[] = [
  "id",
  "model",
  "supplier",
  "factory",
  "status",
  "delivery",
  "amount",
]
const FILTER_KEYS: FilterKey[] = [
  "model",
  "supplier",
  "factory",
  "status",
  "from",
  "to",
]
const DEFAULT_FIELDS: FilterKey[] = ["supplier", "factory", "status"]
const DEFAULT_SORT: Sort = { key: "id", direction: "asc" }
const STANDARD: View = {
  id: "standard",
  name: "Standard",
  filters: EMPTY_FILTERS,
  fields: DEFAULT_FIELDS,
  columns: DEFAULT_COLUMNS,
  sort: DEFAULT_SORT,
}
const VIEWS_KEY = "fiori-lab:purchase-views:v1"
const LOAD_SIZE = 20
const COLUMN_WIDTH: Record<Column, number> = {
  id: 0,
  amount: 0,
  model: 460,
  status: 650,
  supplier: 850,
  factory: 1000,
  delivery: 1100,
}
function columnValue(
  order: Order,
  column: Column,
  sorting = false
): string | number {
  if (column === "amount") return order.monthlyLeasingInstalment
  if (column === "delivery")
    return sorting
      ? order.orderDetails.expectedDeliveryDateISO
      : order.orderDetails.expectedDeliveryDate
  return order[column]
}
function money(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
function parseView(value: unknown): View | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  if (!v.sort || typeof v.sort !== "object" || Array.isArray(v.sort))
    return null
  const sort = v.sort as Record<string, unknown>
  if (!(
    typeof v.id === "string" &&
    v.id.length > 0 &&
    v.id !== "standard" &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    isFilters(v.filters) &&
    Array.isArray(v.columns) &&
    v.columns[0] === "id" &&
    v.columns.every(
      (c) => typeof c === "string" && Object.hasOwn(COLUMN_LABELS, c)
    ) &&
    new Set(v.columns).size === v.columns.length &&
    typeof sort.key === "string" &&
    Object.hasOwn(COLUMN_LABELS, sort.key) &&
    typeof sort.direction === "string" &&
    ["asc", "desc"].includes(sort.direction)
  ))
    return null
  const filters = { ...v.filters }
  const fields =
    v.fields === undefined
      ? [
          ...DEFAULT_FIELDS,
          ...(filters.from ? ["from" as const] : []),
          ...(filters.to ? ["to" as const] : []),
        ]
      : v.fields
  if (
    !Array.isArray(fields) ||
    !fields.every((f) => FILTER_KEYS.includes(f)) ||
    new Set(fields).size !== fields.length
  )
    return null
  return {
    id: v.id,
    name: v.name,
    filters,
    fields,
    columns: v.columns as Column[],
    sort: sort as Sort,
  }
}
function readViews(): View[] {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEWS_KEY) || "[]")
    if (!Array.isArray(saved)) return []
    const ids = new Set(["standard"]),
      names = new Set([STANDARD.name])
    return saved.map(parseView).filter((v): v is View => {
      if (!v || ids.has(v.id) || names.has(v.name)) return false
      ids.add(v.id)
      names.add(v.name)
      return true
    })
  } catch {
    return []
  }
}
function commitViews(views: View[]) {
  try {
    localStorage.setItem(VIEWS_KEY, JSON.stringify(views))
  } catch {
    toast.warning("浏览器无法保存视图，当前会话仍可使用。")
  }
}
function Picker({
  value,
  onChange,
  values,
  label,
  id,
}: {
  value: string
  onChange: (value: string) => void
  values: string[]
  label: string
  id?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v || values[0])}>
      <SelectTrigger id={id} aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
function activeFilter(key: FilterKey, filters: Filters) {
  return key === "status" || key === "supplier" || key === "factory"
    ? filters[key] !== "All"
    : !!filters[key].trim()
}
function FilterControl({
  field,
  filters,
  onChange,
  prefix,
}: {
  field: FilterKey
  filters: Filters
  onChange: (field: keyof Filters, value: string) => void
  prefix: string
}) {
  if (field === "status" || field === "supplier" || field === "factory")
    return (
      <Picker
        value={filters[field]}
        onChange={(v) => onChange(field, v)}
        values={["All", ...purchaseOrderFilterOptions[field]]}
        label={`${prefix}${FILTER_LABELS[field]}`}
        id={`${prefix}-${field}`}
      />
    )
  return (
    <Input
      id={`${prefix}-${field}`}
      type={field === "from" || field === "to" ? "date" : "text"}
      aria-label={`${prefix}${FILTER_LABELS[field]}`}
      placeholder={field === "model" ? "Model" : undefined}
      value={filters[field]}
      min={field === "to" ? filters.from || undefined : undefined}
      max={field === "from" ? filters.to || undefined : undefined}
      onChange={(e) => onChange(field, e.target.value)}
    />
  )
}
function OrderValue({ order, column }: { order: Order; column: Column }) {
  if (column === "id")
    return (
      <div className="object-identifier">
        <strong>{order.id}</strong>
      </div>
    )
  if (column === "status")
    return (
      <ObjectStatus tone={purchaseOrderStatusTone[order.status]}>
        {order.status}
      </ObjectStatus>
    )
  if (column === "amount")
    return (
      <div className="object-number">
        <strong>{money(order.monthlyLeasingInstalment)}</strong>
      </div>
    )
  return <>{columnValue(order, column)}</>
}
function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

export function OrderList({
  orders,
  onOpen,
}: {
  orders: Order[]
  onOpen: (id: string) => void
}) {
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS })
  const [width, setWidth] = useState(1024)
  const phone = width < 600
  const [fields, setFields] = useState<FilterKey[]>(DEFAULT_FIELDS)
  const [expanded, setExpanded] = useState(false),
    [pinned, setPinned] = useState(false)
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS),
    [columnDraft, setColumnDraft] = useState<Column[]>(DEFAULT_COLUMNS)
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT),
    [sortDraft, setSortDraft] = useState<Sort>(DEFAULT_SORT)
  const [settingsOpen, setSettingsOpen] = useState(false),
    [settingsTab, setSettingsTab] = useState("columns")
  const [selected, setSelected] = useState<string[]>([]),
    [selectionResults, setSelectionResults] = useState<Order[] | null>(null)
  const [views, setViews] = useState<View[]>(readViews),
    [activeView, setActiveView] = useState<View>(STANDARD)
  const [saveOpen, setSaveOpen] = useState(false),
    [viewName, setViewName] = useState(""),
    [viewError, setViewError] = useState("")
  const [adaptOpen, setAdaptOpen] = useState(false),
    [adaptFilters, setAdaptFilters] = useState<Filters>(EMPTY_FILTERS)
  const [adaptFields, setAdaptFields] = useState<FilterKey[]>(DEFAULT_FIELDS),
    [adaptSearch, setAdaptSearch] = useState("")
  const [adaptScope, setAdaptScope] = useState("全部筛选器"),
    [showValues, setShowValues] = useState(false),
    [dateError, setDateError] = useState("")
  const viewDirty =
    JSON.stringify({ filters, fields, columns, sort }) !==
    JSON.stringify({
      filters: activeView.filters,
      fields: activeView.fields,
      columns: activeView.columns,
      sort: activeView.sort,
    })
  const results = useMemo(
    () =>
      filterOrders(orders, filters).sort((a, b) => {
        const av = columnValue(a, sort.key, true),
          bv = columnValue(b, sort.key, true)
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "en-US", { numeric: true })
        return (
          (sort.direction === "asc" ? cmp : -cmp) || b.id.localeCompare(a.id)
        )
      }),
    [orders, filters, sort]
  )
  // Business changes retain a selection only while the item still belongs to the result set.
  if (selectionResults !== results) {
    setSelectionResults(results)
    setSelected((current) =>
      current.filter((id) => results.some((o) => o.id === id))
    )
  }
  const filterCount = FILTER_KEYS.filter((key) =>
    activeFilter(key, filters)
  ).length
  const activeTokens = [
    filters.search.trim() && `搜索：${filters.search.trim()}`,
    ...FILTER_KEYS.filter((key) => activeFilter(key, filters)).map(
      (key) => `${FILTER_LABELS[key]}：${filters[key]}`
    ),
  ].filter(Boolean)
  const summary = activeTokens.length
    ? `${activeTokens.length} 个筛选器已激活：${activeTokens.slice(0, 5).join("，")}${activeTokens.length > 5 ? "，…" : ""}`
    : "没有激活的筛选器"
  function setFilter(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value }
    if (next.from && next.to && next.from > next.to) {
      toast.error("开始日期应早于或等于结束日期。")
      return
    }
    setFilters((f) => ({ ...f, [key]: value }))
    setSelected([])
  }
  function chooseView(v: View) {
    setActiveView(v)
    setFilters({ ...v.filters })
    setFields([...v.fields])
    setColumns([...v.columns])
    setSort({ ...v.sort })
    setSelected([])
  }
  function openSave() {
    setViewName("")
    setViewError("")
    setSaveOpen(true)
  }
  function saveView() {
    const name = viewName.trim()
    if (!name) {
      setViewError("请输入视图名称。")
      return
    }
    if ([STANDARD, ...views].some((v) => v.name === name)) {
      setViewError("已存在同名视图，请使用其他名称。")
      return
    }
    if (filters.from && filters.to && filters.from > filters.to) {
      setViewError("请先修正筛选日期范围。")
      return
    }
    const view: View = {
      id: crypto.randomUUID(),
      name,
      filters: { ...filters },
      fields: [...fields],
      columns: [...columns],
      sort: { ...sort },
    }
    const next = [...views, view]
    setViews(next)
    commitViews(next)
    chooseView(view)
    setSaveOpen(false)
    toast.success(`已保存视图「${name}」`)
  }
  function openAdapt() {
    setAdaptFilters({ ...filters })
    setAdaptFields([...fields])
    setAdaptSearch("")
    setAdaptScope("全部筛选器")
    setShowValues(false)
    setDateError("")
    setAdaptOpen(true)
  }
  function openSettings() {
    setColumnDraft([...columns])
    setSortDraft({ ...sort })
    setSettingsTab("columns")
    setSettingsOpen(true)
  }
  function move<T>(values: T[], value: T, delta: number, first = 0): T[] {
    const next = [...values],
      index = next.indexOf(value),
      destination = index + delta
    if (index < first || destination < first || destination >= next.length)
      return values
    ;[next[index], next[destination]] = [next[destination], next[index]]
    return next
  }
  function exportResults() {
    const rows = [
      columns.map((c) => COLUMN_LABELS[c]),
      ...results.map((order) =>
        columns.map((column) => columnValue(order, column))
      ),
    ]
    const csv =
      "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")
    const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" })
      ),
      link = document.createElement("a")
    link.href = url
    link.download = "Purchase Orders.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`已导出 ${results.length} 条订单`)
  }
  const adaptRows = [
    ...adaptFields,
    ...FILTER_KEYS.filter((key) => !adaptFields.includes(key)),
  ].filter(
    (key) =>
      FILTER_LABELS[key]
        .toLocaleLowerCase()
        .includes(adaptSearch.trim().toLocaleLowerCase()) &&
      (adaptScope === "全部筛选器" ||
        (adaptScope === "可见筛选器"
          ? adaptFields.includes(key)
          : activeFilter(key, adaptFilters)))
  )
  return (
    <>
      <ListReport
        title={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="variant-trigger" />}
              aria-label="选择订单视图"
            >
              {activeView.name}
              {viewDirty && <span aria-label="视图已修改"> *</span>}
              <SapIcon name="slim-arrow-down" data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="view-menu">
              <DropdownMenuGroup>
                <span className="menu-section-label">我的视图</span>
                {[STANDARD, ...views].map((v) => (
                  <DropdownMenuItem key={v.id} onClick={() => chooseView(v)}>
                    <span>{v.name}</span>
                    {activeView.id === v.id && <SapIcon name="accept" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={openSave}>另存为</DropdownMenuItem>
                {activeView.id !== "standard" && (
                  <DropdownMenuItem
                    onClick={() => {
                      const next = views.filter((v) => v.id !== activeView.id)
                      setViews(next)
                      commitViews(next)
                      chooseView(STANDARD)
                      toast.success("已删除视图")
                    }}
                  >
                    删除当前视图
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        summary={summary}
        titleActions={({ expanded, phone }) =>
          (!expanded || phone) && (
            <Button variant="ghost" onClick={openAdapt}>
              调整筛选 ({filterCount})
            </Button>
          )
        }
        expanded={expanded}
        pinned={pinned}
        onExpandedChange={setExpanded}
        onPinnedChange={setPinned}
        onWidthChange={setWidth}
        labels={{
          expand: "展开筛选栏",
          collapse: "收起筛选栏",
          pin: "固定页头",
          unpin: "取消固定页头",
        }}
        contentLabel="Purchase Orders"
        header={
          <FilterBar
            label="Purchase Order Filters"
            search={
              <InputGroup>
                <InputGroupInput
                  aria-label="Search Purchase Orders"
                  placeholder="搜索"
                  value={filters.search}
                  onChange={(e) => setFilter("search", e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <SapIcon name="search" />
                </InputGroupAddon>
              </InputGroup>
            }
            fields={fields.map((field) => ({
              id: `筛选-${field}`,
              label: FILTER_LABELS[field],
              invalid:
                (field === "from" || field === "to") &&
                !!filters.from &&
                !!filters.to &&
                filters.from > filters.to,
              control: (
                <FilterControl
                  field={field}
                  filters={filters}
                  prefix="筛选"
                  onChange={setFilter}
                />
              ),
            }))}
            actions={
              <Button variant="ghost" type="button" onClick={openAdapt}>
                调整筛选 ({filterCount})
              </Button>
            }
          />
        }
        toolbar={
          <TableToolbar
            title="Purchase Orders"
            label="Purchase Order Actions"
            overflowLabel="更多表格操作"
            actions={[
              {
                id: "settings",
                label: "设置",
                ariaLabel: "打开表格设置",
                icon: "action-settings",
                group: "personalization",
                onAction: openSettings,
                iconOnly: true,
              },
              {
                id: "export",
                label: "导出",
                ariaLabel: "导出订单 CSV",
                icon: "excel-attachment",
                group: "export",
                onAction: exportResults,
                disabled: results.length === 0,
                iconOnly: true,
              },
            ]}
          />
        }
      >
        <ResponsiveTable
          rows={results}
          columns={columns.map((column) => ({
            id: column,
            label: COLUMN_LABELS[column],
            render: (order: Order) => (
              <OrderValue order={order} column={column} />
            ),
            minWidth: COLUMN_WIDTH[column],
            align: column === "amount" ? ("end" as const) : ("start" as const),
            className: column === "amount" ? "numeric-column" : `col-${column}`,
          }))}
          getRowId={(order) => order.id}
          getRowLabel={(order) => `Purchase Order ${order.id}`}
          selectedIds={selected}
          onSelectionChange={setSelected}
          onRowNavigate={onOpen}
          sort={sort}
          growingPageSize={LOAD_SIZE}
          labels={{
            table: "Purchase Orders",
            selectAll: "选择全部订单",
            selectRow: (order) => `选择订单 ${order.id}`,
            navigateRow: (order) => `查看订单 ${order.id}`,
            navigation: "查看详情",
            columnHeaders: "列标题",
            noData: "未找到数据。请调整筛选条件。",
            status: ({ total, loaded, selected }) =>
              `共 ${total} 条采购订单，已加载 ${loaded} 条，已选择 ${selected} 条`,
          }}
        />
      </ListReport>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="table-settings-dialog">
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
          </DialogHeader>
          <Tabs value={settingsTab} onValueChange={setSettingsTab}>
            <TabsList variant="line" aria-label="表格设置">
              <TabsTrigger value="columns">列</TabsTrigger>
              <TabsTrigger value="sort">排序</TabsTrigger>
            </TabsList>
            <TabsContent value="columns">
              <div className="column-options">
                {[
                  ...columnDraft,
                  ...DEFAULT_COLUMNS.filter((c) => !columnDraft.includes(c)),
                ].map((c) => (
                  <div className="column-option" key={c}>
                    <Checkbox
                      id={`column-${c}`}
                      checked={columnDraft.includes(c)}
                      disabled={c === "id"}
                      onCheckedChange={(checked) =>
                        setColumnDraft((list) =>
                          checked ? [...list, c] : list.filter((x) => x !== c)
                        )
                      }
                    />
                    <label htmlFor={`column-${c}`}>{COLUMN_LABELS[c]}</label>
                    <span className="flex-spacer" />
                    {columnDraft.includes(c) && c !== "id" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`前移${COLUMN_LABELS[c]}`}
                          disabled={columnDraft.indexOf(c) <= 1}
                          onClick={() =>
                            setColumnDraft((v) => move(v, c, -1, 1))
                          }
                        >
                          <SapIcon name="slim-arrow-up" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`后移${COLUMN_LABELS[c]}`}
                          disabled={
                            columnDraft.indexOf(c) === columnDraft.length - 1
                          }
                          onClick={() =>
                            setColumnDraft((v) => move(v, c, 1, 1))
                          }
                        >
                          <SapIcon name="slim-arrow-down" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="sort">
              <FieldGroup className="sort-fields">
                <Field>
                  <FieldLabel>排序依据</FieldLabel>
                  <Picker
                    label="排序依据"
                    value={COLUMN_LABELS[sortDraft.key]}
                    values={DEFAULT_COLUMNS.map(
                      (column) => COLUMN_LABELS[column]
                    )}
                    onChange={(label) =>
                      setSortDraft((current) => ({
                        ...current,
                        key:
                          DEFAULT_COLUMNS.find(
                            (column) => COLUMN_LABELS[column] === label
                          ) ?? "id",
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>排序顺序</FieldLabel>
                  <Picker
                    label="排序顺序"
                    value={sortDraft.direction === "asc" ? "升序" : "降序"}
                    values={["升序", "降序"]}
                    onChange={(v) =>
                      setSortDraft((s) => ({
                        ...s,
                        direction: v === "升序" ? "asc" : "desc",
                      }))
                    }
                  />
                </Field>
              </FieldGroup>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setColumnDraft(DEFAULT_COLUMNS)
                setSortDraft(DEFAULT_SORT)
              }}
            >
              重置
            </Button>
            <span className="flex-spacer" />
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                setColumns([...columnDraft])
                setSort({ ...sortDraft })
                setSelected([])
                setSettingsOpen(false)
              }}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={adaptOpen} onOpenChange={setAdaptOpen}>
        <DialogContent className="adapt-dialog">
          <DialogHeader>
            <DialogTitle>调整筛选</DialogTitle>
          </DialogHeader>
          <div className="adapt-tools">
            <Picker
              value={adaptScope}
              onChange={setAdaptScope}
              values={["全部筛选器", "可见筛选器", "激活的筛选器"]}
              label="显示筛选器"
            />
            <InputGroup>
              <InputGroupInput
                placeholder="搜索筛选器"
                aria-label="搜索筛选器"
                value={adaptSearch}
                onChange={(e) => setAdaptSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <SapIcon name="search" />
              </InputGroupAddon>
            </InputGroup>
            <Button variant="ghost" onClick={() => setShowValues((v) => !v)}>
              {showValues ? "隐藏值" : "显示值"}
            </Button>
          </div>
          {phone && (
            <FieldGroup className="adapt-basic-search">
              <Field>
                <InputGroup>
                  <InputGroupInput
                    aria-label="Search Purchase Orders"
                    placeholder="搜索"
                    value={adaptFilters.search}
                    onChange={(e) =>
                      setAdaptFilters((f) => ({ ...f, search: e.target.value }))
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <SapIcon name="search" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          )}
          <div className="adapt-options">
            {adaptRows.map((key) => (
              <div className="adapt-option" key={key}>
                <div className="adapt-option-title">
                  <Checkbox
                    id={`adapt-${key}`}
                    checked={adaptFields.includes(key)}
                    onCheckedChange={(checked) =>
                      setAdaptFields((list) =>
                        checked ? [...list, key] : list.filter((k) => k !== key)
                      )
                    }
                  />
                  <label htmlFor={`adapt-${key}`}>{FILTER_LABELS[key]}</label>
                  {activeFilter(key, adaptFilters) && !showValues && (
                    <SapIcon name="filter" aria-label="已激活" />
                  )}
                  <span className="flex-spacer" />
                  {adaptFields.includes(key) && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`前移${FILTER_LABELS[key]}筛选器`}
                        disabled={adaptFields.indexOf(key) === 0}
                        onClick={() => setAdaptFields((v) => move(v, key, -1))}
                      >
                        <SapIcon name="slim-arrow-up" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`后移${FILTER_LABELS[key]}筛选器`}
                        disabled={
                          adaptFields.indexOf(key) === adaptFields.length - 1
                        }
                        onClick={() => setAdaptFields((v) => move(v, key, 1))}
                      >
                        <SapIcon name="slim-arrow-down" />
                      </Button>
                    </>
                  )}
                </div>
                {showValues && (
                  <div className="adapt-value">
                    <FilterControl
                      field={key}
                      filters={adaptFilters}
                      prefix="对话框"
                      onChange={(field, value) => {
                        setAdaptFilters((f) => ({ ...f, [field]: value }))
                        setDateError("")
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          {dateError && (
            <p className="field-error-text adapt-error" role="alert">
              {dateError}
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdaptOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (
                  adaptFilters.from &&
                  adaptFilters.to &&
                  adaptFilters.from > adaptFilters.to
                ) {
                  setDateError("开始日期应早于或等于结束日期。")
                  return
                }
                setFilters({ ...adaptFilters })
                setFields([...adaptFields])
                setSelected([])
                setAdaptOpen(false)
              }}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>另存为视图</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!viewError}>
              <FieldLabel htmlFor="view-name">
                视图名称 <span aria-hidden="true">*</span>
              </FieldLabel>
              <Input
                id="view-name"
                autoFocus
                value={viewName}
                aria-invalid={!!viewError}
                aria-describedby={viewError ? "view-error" : undefined}
                onChange={(e) => {
                  setViewName(e.target.value)
                  setViewError("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveView()
                }}
              />
              {viewError && (
                <p id="view-error" role="alert" className="field-error-text">
                  {viewError}
                </p>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              取消
            </Button>
            <Button onClick={saveView}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
