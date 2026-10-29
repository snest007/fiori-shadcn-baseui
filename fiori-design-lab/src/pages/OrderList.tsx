import { Fragment, useEffect, useMemo, useRef, useState } from "react"
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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useResponsiveTableNavigation } from "@/components/fiori/use-responsive-table-navigation"
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
  const reportRef = useRef<HTMLDivElement>(null),
    headerRef = useRef<HTMLElement>(null),
    loadRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS })
  const [fields, setFields] = useState<FilterKey[]>(DEFAULT_FIELDS)
  const [expanded, setExpanded] = useState(false),
    [pinned, setPinned] = useState(false)
  const [width, setWidth] = useState(1024),
    [headerHeight, setHeaderHeight] = useState(96)
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS),
    [columnDraft, setColumnDraft] = useState<Column[]>(DEFAULT_COLUMNS)
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT),
    [sortDraft, setSortDraft] = useState<Sort>(DEFAULT_SORT)
  const [settingsOpen, setSettingsOpen] = useState(false),
    [settingsTab, setSettingsTab] = useState("columns")
  const [selected, setSelected] = useState<string[]>([]),
    [selectionResults, setSelectionResults] = useState<Order[] | null>(null)
  const [loaded, setLoaded] = useState(LOAD_SIZE)
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
  const phone = width < 600
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
  const visible = results.slice(0, loaded)
  const mainColumns = columns.filter((c) => width >= COLUMN_WIDTH[c]),
    popinColumns = columns.filter((c) => width < COLUMN_WIDTH[c])
  const allSelected =
      results.length > 0 && results.every((o) => selected.includes(o.id)),
    someSelected = results.some((o) => selected.includes(o.id))
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
  useEffect(() => {
    const report = reportRef.current,
      header = headerRef.current
    if (!report || !header) return
    const observer = new ResizeObserver(() => {
      if (!report.closest("[hidden]")) {
        setWidth(
          report.querySelector<HTMLElement>(".order-worklist")?.clientWidth ??
            report.clientWidth
        )
        setHeaderHeight(header.offsetHeight)
      }
    })
    observer.observe(report)
    observer.observe(header)
    if (!report.closest("[hidden]"))
      report
        .querySelector<HTMLElement>(".order-row")
        ?.focus({ preventScroll: true })
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const scroll = reportRef.current?.closest(".page-scroll")
    if (!scroll) return
    let last = scroll.scrollTop,
      changeAt = 0
    const onScroll = () => {
      const y = scroll.scrollTop,
        delta = y - last
      last = y
      if (
        pinned ||
        phone ||
        reportRef.current?.closest("[hidden]") ||
        performance.now() - changeAt < 300
      )
        return
      if (delta > 12 && expanded) {
        changeAt = performance.now()
        setExpanded(false)
      } else if ((delta < -20 || y === 0) && !expanded && delta < 0) {
        changeAt = performance.now()
        setExpanded(true)
      }
    }
    scroll.addEventListener("scroll", onScroll, { passive: true })
    return () => scroll.removeEventListener("scroll", onScroll)
  }, [expanded, pinned, phone])
  useEffect(() => {
    const target = loadRef.current,
      root = reportRef.current?.closest(".page-scroll")
    if (!target || !root || loaded >= results.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((e) => e.isIntersecting) &&
          !reportRef.current?.closest("[hidden]")
        )
          setLoaded((n) => Math.min(n + LOAD_SIZE, results.length))
      },
      { root, rootMargin: "0px 0px 100px 0px" }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [loaded, results.length])
  function setFilter(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value }
    if (next.from && next.to && next.from > next.to) {
      toast.error("开始日期应早于或等于结束日期。")
      return
    }
    setFilters((f) => ({ ...f, [key]: value }))
    setSelected([])
    setLoaded(LOAD_SIZE)
  }
  function chooseView(v: View) {
    setActiveView(v)
    setFilters({ ...v.filters })
    setFields([...v.fields])
    setColumns([...v.columns])
    setSort({ ...v.sort })
    setSelected([])
    setLoaded(LOAD_SIZE)
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
  function toggle(id: string, checked: boolean) {
    setSelected((s) =>
      checked ? [...new Set([...s, id])] : s.filter((x) => x !== id)
    )
  }
  function toggleAll() {
    setSelected((selection) =>
      allSelected
        ? selection.filter((id) => !results.some((order) => order.id === id))
        : [...new Set([...selection, ...results.map((order) => order.id)])]
    )
  }
  const tableNavigation = useResponsiveTableNavigation({
    firstRow: visible[0]?.id,
    rowIds: visible.map((order) => order.id),
    columnIds: mainColumns,
    open: onOpen,
    selectAll: toggleAll,
  })
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
    <div
      className="list-report"
      ref={reportRef}
      style={
        { "--list-header-height": `${headerHeight}px` } as React.CSSProperties
      }
    >
      <header className="list-page-header" ref={headerRef}>
        <div className="page-title-area">
          <div className="page-title-row">
            <h1>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" className="variant-trigger" />
                  }
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
                      <DropdownMenuItem
                        key={v.id}
                        onClick={() => chooseView(v)}
                      >
                        <span>{v.name}</span>
                        {activeView.id === v.id && <SapIcon name="accept" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={openSave}>
                      另存为
                    </DropdownMenuItem>
                    {activeView.id !== "standard" && (
                      <DropdownMenuItem
                        onClick={() => {
                          const next = views.filter(
                            (v) => v.id !== activeView.id
                          )
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
            </h1>
            {(!expanded || phone) && (
              <Button variant="ghost" onClick={openAdapt}>
                调整筛选 ({filterCount})
              </Button>
            )}
          </div>
          {(!expanded || phone) && (
            <p className="collapsed-summary">{summary}</p>
          )}
        </div>
        {expanded && !phone && (
          <form className="filter-bar" onSubmit={(e) => e.preventDefault()}>
            <FieldGroup className="filter-grid">
              <Field className="basic-search">
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
              </Field>
              {fields.map((field) => (
                <Field
                  key={field}
                  data-invalid={
                    (field === "from" || field === "to") &&
                    !!filters.from &&
                    !!filters.to &&
                    filters.from > filters.to
                  }
                >
                  <FieldLabel htmlFor={`筛选-${field}`}>
                    {FILTER_LABELS[field]}
                  </FieldLabel>
                  <FilterControl
                    field={field}
                    filters={filters}
                    prefix="筛选"
                    onChange={setFilter}
                  />
                </Field>
              ))}
              <div className="filter-actions">
                <Button variant="ghost" type="button" onClick={openAdapt}>
                  调整筛选 ({filterCount})
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
        {!phone && (
          <div className="header-features">
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={expanded ? "收起筛选栏" : "展开筛选栏"}
              aria-expanded={expanded}
              title={expanded ? "收起筛选栏" : "展开筛选栏"}
              onClick={() => {
                setExpanded((e) => !e)
                if (expanded) setPinned(false)
              }}
            >
              <SapIcon name={expanded ? "slim-arrow-up" : "slim-arrow-down"} />
            </Button>
            {expanded && (
              <Button
                variant="outline"
                size="icon-xs"
                aria-label={pinned ? "取消固定页头" : "固定页头"}
                title={pinned ? "取消固定页头" : "固定页头"}
                aria-pressed={pinned}
                onClick={() => setPinned((p) => !p)}
              >
                <SapIcon name={pinned ? "pushpin-on" : "pushpin-off"} />
              </Button>
            )}
          </div>
        )}
      </header>
      <section className="list-content" aria-label="Purchase Orders">
        <div className="order-worklist">
          <div
            className="table-toolbar"
            role="toolbar"
            aria-label="Purchase Order Actions"
          >
            <h2>Purchase Orders</h2>
            <span className="flex-spacer" />
            <Button
              variant="ghost"
              size="icon"
              className="toolbar-wide"
              title="设置"
              aria-label="打开表格设置"
              onClick={openSettings}
            >
              <SapIcon name="action-settings" />
            </Button>
            <Separator
              orientation="vertical"
              className="toolbar-separator toolbar-wide"
            />
            <Button
              variant="ghost"
              size="icon"
              className="toolbar-wide"
              title="导出"
              aria-label="导出订单 CSV"
              disabled={results.length === 0}
              onClick={exportResults}
            >
              <SapIcon name="excel-attachment" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="toolbar-overflow"
                  />
                }
                aria-label="更多表格操作"
                title="更多"
              >
                <SapIcon name="overflow" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={openSettings}>
                    <SapIcon name="action-settings" />
                    设置
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={exportResults}
                    disabled={results.length === 0}
                  >
                    <SapIcon name="excel-attachment" />
                    导出
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <span className="sr-only" role="status">
            共 {results.length} 条采购订单，已加载 {visible.length} 条，已选择{" "}
            {selected.length} 条
          </span>
          <Table
            className="orders-table"
            role="grid"
            aria-label="Purchase Orders"
            aria-multiselectable="true"
            onFocusCapture={tableNavigation.onFocusCapture}
            onBlurCapture={tableNavigation.onBlurCapture}
            onKeyDown={tableNavigation.onKeyDown}
          >
            <TableHeader>
              <TableRow
                data-grid-row="header"
                data-grid-key="header:row"
                tabIndex={tableNavigation.tabIndex("header:row")}
                aria-label="列标题"
              >
                <TableHead
                  className="checkbox-column"
                  data-grid-cell="selection"
                  data-grid-key="header:selection"
                  tabIndex={tableNavigation.tabIndex("header:selection")}
                >
                  <Checkbox
                    aria-label="选择全部订单"
                    tabIndex={tableNavigation.contentTabIndex}
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onCheckedChange={(checked) =>
                      setSelected((s) =>
                        checked
                          ? [...new Set([...s, ...results.map((o) => o.id)])]
                          : s.filter((id) => !results.some((o) => o.id === id))
                      )
                    }
                  />
                </TableHead>
                {mainColumns.map((c) => (
                  <TableHead
                    key={c}
                    data-grid-cell={c}
                    data-grid-key={`header:${c}`}
                    tabIndex={tableNavigation.tabIndex(`header:${c}`)}
                    className={c === "amount" ? "numeric-column" : `col-${c}`}
                    aria-sort={
                      sort.key === c
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <span className="column-label">
                      {COLUMN_LABELS[c]}
                      {sort.key === c && (
                        <SapIcon
                          name={
                            sort.direction === "asc"
                              ? "slim-arrow-up"
                              : "slim-arrow-down"
                          }
                        />
                      )}
                    </span>
                  </TableHead>
                ))}
                <TableHead
                  className="navigation-column"
                  data-grid-cell="navigation"
                  data-grid-key="header:navigation"
                  tabIndex={tableNavigation.tabIndex("header:navigation")}
                >
                  <span className="sr-only">查看详情</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((o, rowIndex) => (
                <Fragment key={o.id}>
                  <TableRow
                    tabIndex={tableNavigation.tabIndex(`${o.id}:row`)}
                    data-grid-row={o.id}
                    data-grid-key={`${o.id}:row`}
                    aria-selected={selected.includes(o.id)}
                    aria-rowindex={rowIndex + 2}
                    aria-describedby={
                      popinColumns.length ? `purchase-popin-${o.id}` : undefined
                    }
                    aria-label={`Purchase Order ${o.id}`}
                    data-state={
                      selected.includes(o.id) ? "selected" : undefined
                    }
                    onClick={(e) => {
                      if (
                        !(e.target as HTMLElement).closest(
                          "button,a,input,[role=checkbox]"
                        )
                      )
                        onOpen(o.id)
                    }}
                    className={
                      popinColumns.length ? "order-row has-popin" : "order-row"
                    }
                  >
                    <TableCell
                      className="checkbox-column"
                      role="gridcell"
                      data-grid-cell="selection"
                      data-grid-key={`${o.id}:selection`}
                      tabIndex={tableNavigation.tabIndex(`${o.id}:selection`)}
                      rowSpan={popinColumns.length ? 2 : 1}
                    >
                      <Checkbox
                        aria-label={`选择订单 ${o.id}`}
                        tabIndex={tableNavigation.contentTabIndex}
                        checked={selected.includes(o.id)}
                        onCheckedChange={(checked) => toggle(o.id, checked)}
                      />
                    </TableCell>
                    {mainColumns.map((c) => (
                      <TableCell
                        key={c}
                        role="gridcell"
                        data-grid-cell={c}
                        data-grid-key={`${o.id}:${c}`}
                        tabIndex={tableNavigation.tabIndex(`${o.id}:${c}`)}
                        className={
                          c === "amount" ? "numeric-column" : `col-${c}`
                        }
                      >
                        <OrderValue order={o} column={c} />
                      </TableCell>
                    ))}
                    <TableCell
                      className="navigation-column"
                      role="gridcell"
                      data-grid-cell="navigation"
                      data-grid-key={`${o.id}:navigation`}
                      tabIndex={tableNavigation.tabIndex(`${o.id}:navigation`)}
                      rowSpan={popinColumns.length ? 2 : 1}
                    >
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`查看订单 ${o.id}`}
                        tabIndex={tableNavigation.contentTabIndex}
                        title="查看订单"
                        onClick={() => onOpen(o.id)}
                      >
                        <SapIcon name="navigation-right-arrow" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {popinColumns.length > 0 && (
                    <TableRow
                      className="popin-row"
                      id={`purchase-popin-${o.id}`}
                      aria-hidden="true"
                      data-state={
                        selected.includes(o.id) ? "selected" : undefined
                      }
                      onClick={() => onOpen(o.id)}
                    >
                      <TableCell colSpan={mainColumns.length}>
                        <dl className="popin-fields">
                          {popinColumns.map((c) => (
                            <div key={c}>
                              <dt>{COLUMN_LABELS[c]}</dt>
                              <dd>
                                <OrderValue order={o} column={c} />
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
              {results.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={mainColumns.length + 2}
                    className="table-no-data"
                  >
                    未找到数据。请调整筛选条件。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {loaded < results.length && (
            <div ref={loadRef} className="load-sentinel" aria-hidden="true" />
          )}
        </div>
      </section>
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
                setLoaded(LOAD_SIZE)
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
                setLoaded(LOAD_SIZE)
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
    </div>
  )
}
