import { useEffect, useMemo, useRef, useState } from "react"
import { FioriProvider } from "~/components/fiori/fiori-provider"
import { ListReport } from "~/components/fiori/list-report"
import { FilterBar } from "~/components/fiori/filter-bar"
import { TableToolbar } from "~/components/fiori/table-toolbar"
import {
  ResponsiveTable,
  type ResponsiveTableColumn,
} from "~/components/fiori/responsive-table"
import { ObjectStatus } from "~/components/fiori/object-status"
import { MessageStrip } from "~/components/fiori/message-strip"
import { SapIcon } from "~/components/fiori/sap-icon"
import { Button } from "~/components/fiori/ui/button"
import { Checkbox } from "~/components/fiori/ui/checkbox"
import { Input } from "~/components/fiori/ui/input"
import { Field, FieldGroup, FieldLabel } from "~/components/fiori/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/fiori/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/fiori/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/fiori/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/fiori/ui/tabs"
import {
  EMPTY_INVENTORY_FILTERS,
  filterInventory,
  initialInventory,
  inventoryStates,
  inventoryWarehouses,
  stockStateLabels,
  type InventoryFilters,
  type InventoryRecord,
} from "./data"
import "./inventory.css"

type ColumnId =
  "material" | "warehouse" | "available" | "status" | "counted" | "updated"
type InventorySort = { key: ColumnId; direction: "asc" | "desc" }

const columnLabels: Record<ColumnId, string> = {
  material: "物料",
  warehouse: "仓库",
  available: "可用库存",
  status: "库存状态",
  counted: "盘点状态",
  updated: "更新日期",
}
const defaultColumns: ColumnId[] = [
  "material",
  "warehouse",
  "available",
  "status",
  "counted",
  "updated",
]
const defaultSort: InventorySort = { key: "material", direction: "asc" }

function sortValue(record: InventoryRecord, key: ColumnId): string | number {
  if (key === "material") return record.materialCode
  if (key === "status") return stockStateLabels[record.status]
  if (key === "counted") return Number(record.counted)
  return record[key]
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onValueChange,
}: {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onValueChange: (value: string) => void
}) {
  const items = [{ value: "all", label: "全部" }, ...options]
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(next ?? "all")}
    >
      <SelectTrigger id={id} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent mobileTitle={label}>
        <SelectGroup>
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function InventoryDetail({
  record,
  onBack,
}: {
  record: InventoryRecord
  onBack: () => void
}) {
  const values = [
    { label: "库存记录", value: record.id },
    { label: "物料编码", value: record.materialCode },
    { label: "物料名称", value: record.material },
    { label: "仓库", value: record.warehouse },
    {
      label: "可用库存",
      value: `${record.available.toLocaleString("zh-CN")} ${record.unit}`,
    },
    { label: "库存状态", value: stockStateLabels[record.status] },
    { label: "盘点状态", value: record.counted ? "已盘点" : "未盘点" },
    { label: "更新日期", value: record.updated },
  ]
  return (
    <section
      className="inventory-detail"
      aria-labelledby="inventory-detail-title"
    >
      <header className="inventory-detail-header">
        <Button id="inventory-detail-back" variant="ghost" onClick={onBack}>
          <SapIcon name="nav-back" data-icon="inline-start" />
          返回物料库存
        </Button>
        <h1 id="inventory-detail-title">
          {record.materialCode} · {record.material}
        </h1>
      </header>
      <FieldGroup className="inventory-detail-fields">
        {values.map((field, index) => (
          <Field key={field.label}>
            <FieldLabel htmlFor={`inventory-detail-field-${index}`}>
              {field.label}
            </FieldLabel>
            <Input
              id={`inventory-detail-field-${index}`}
              value={field.value}
              readOnly
            />
          </Field>
        ))}
      </FieldGroup>
    </section>
  )
}

export function InventoryDemo({
  path,
  onNavigate,
}: {
  path: string
  onNavigate: (path: string) => void
}) {
  const [density, setDensity] = useState<"compact" | "cozy">("compact")
  const [records, setRecords] = useState(() =>
    initialInventory.map((record) => ({ ...record }))
  )
  const [filters, setFilters] = useState<InventoryFilters>({
    ...EMPTY_INVENTORY_FILTERS,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expanded, setExpanded] = useState(true)
  const [pinned, setPinned] = useState(false)
  const [columns, setColumns] = useState<ColumnId[]>(defaultColumns)
  const [sort, setSort] = useState<InventorySort>(defaultSort)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState("columns")
  const [columnDraft, setColumnDraft] = useState<ColumnId[]>(defaultColumns)
  const [sortDraft, setSortDraft] = useState<InventorySort>(defaultSort)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterDraft, setFilterDraft] = useState<InventoryFilters>(
    EMPTY_INVENTORY_FILTERS
  )
  const [notice, setNotice] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastOpened = useRef<string | null>(null)
  const listScrollTop = useRef(0)

  const results = useMemo(
    () =>
      filterInventory(records, filters).sort((a, b) => {
        const av = sortValue(a, sort.key)
        const bv = sortValue(b, sort.key)
        const comparison =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "zh-CN", { numeric: true })
        return (
          (sort.direction === "asc" ? comparison : -comparison) ||
          a.id.localeCompare(b.id)
        )
      }),
    [records, filters, sort]
  )
  const detailId = path.split("/")[2] ?? ""
  const hasDetailRoute = path !== "/inventory"
  const selectedRecord = records.find((record) => record.id === detailId)
  const filterCount =
    Number(Boolean(filters.search.trim())) +
    Number(filters.warehouse !== "all") +
    Number(filters.status !== "all")
  const summaryParts = [
    filters.search.trim() ? `搜索：${filters.search.trim()}` : "",
    filters.warehouse !== "all"
      ? `仓库：${inventoryWarehouses.find((warehouse) => warehouse.value === filters.warehouse)?.label}`
      : "",
    filters.status !== "all"
      ? `库存状态：${inventoryStates.find((state) => state.value === filters.status)?.label}`
      : "",
  ].filter(Boolean)
  const summary = summaryParts.length
    ? `${filterCount} 个筛选器已激活：${summaryParts.join("，")}`
    : "没有激活的筛选器"
  const hasUncountedSelection = records.some(
    (record) => selectedIds.includes(record.id) && !record.counted
  )

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const scroll = scrollRef.current
      if (!scroll) return
      if (hasDetailRoute) {
        scroll.scrollTop = 0
        scroll
          .querySelector<HTMLElement>("#inventory-detail-back")
          ?.focus({ preventScroll: true })
      } else if (lastOpened.current) {
        scroll.scrollTop = listScrollTop.current
        scroll
          .querySelector<HTMLElement>(`[data-grid-row="${lastOpened.current}"]`)
          ?.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [path, hasDetailRoute])

  const tableColumns: ResponsiveTableColumn<InventoryRecord>[] = columns.map(
    (id) => ({
      id,
      label: columnLabels[id],
      minWidth: {
        material: 0,
        available: 0,
        warehouse: 580,
        status: 740,
        counted: 920,
        updated: 1080,
      }[id],
      align: id === "available" ? "end" : "start",
      render: (record) => {
        if (id === "material")
          return (
            <div className="object-identifier">
              <strong>{record.materialCode}</strong>
              <span>{record.material}</span>
            </div>
          )
        if (id === "available")
          return (
            <div className="object-number">
              <strong>{record.available.toLocaleString("zh-CN")}</strong>
              <span>{record.unit}</span>
            </div>
          )
        if (id === "status")
          return (
            <ObjectStatus
              tone={
                record.status === "available"
                  ? "positive"
                  : record.status === "low"
                    ? "critical"
                    : "negative"
              }
            >
              {stockStateLabels[record.status]}
            </ObjectStatus>
          )
        if (id === "counted")
          return (
            <ObjectStatus tone={record.counted ? "positive" : "neutral"}>
              {record.counted ? "已盘点" : "未盘点"}
            </ObjectStatus>
          )
        return record[id]
      },
    })
  )

  function updateFilters(next: InventoryFilters) {
    setFilters(next)
    setSelectedIds([])
    setNotice("")
    scrollRef.current?.scrollTo({ top: 0 })
  }
  function openFilters() {
    setFilterDraft({ ...filters })
    setFiltersOpen(true)
  }
  function openSettings() {
    setColumnDraft([...columns])
    setSortDraft({ ...sort })
    setSettingsTab("columns")
    setSettingsOpen(true)
  }
  function markCounted() {
    const changed = records.filter(
      (record) => selectedIds.includes(record.id) && !record.counted
    ).length
    setRecords((current) =>
      current.map((record) =>
        selectedIds.includes(record.id) && !record.counted
          ? { ...record, counted: true, updated: "2026-10-29" }
          : record
      )
    )
    setNotice(`已将 ${changed} 条库存记录标记为已盘点。`)
  }
  function exportInventory() {
    const csvCell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`
    const rows = [
      columns.map((id) => columnLabels[id]),
      ...results.map((record) =>
        columns.map((id) =>
          id === "material"
            ? `${record.materialCode} ${record.material}`
            : id === "available"
              ? `${record.available} ${record.unit}`
              : id === "status"
                ? stockStateLabels[record.status]
                : id === "counted"
                  ? record.counted
                    ? "已盘点"
                    : "未盘点"
                  : record[id]
        )
      ),
    ]
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" }
      )
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "物料库存.csv"
    link.click()
    URL.revokeObjectURL(url)
  }
  function openRecord(id: string) {
    lastOpened.current = id
    listScrollTop.current = scrollRef.current?.scrollTop ?? 0
    onNavigate(`/inventory/${encodeURIComponent(id)}`)
  }
  function backToList() {
    onNavigate("/inventory")
  }

  return (
    <div className="inventory-demo">
      <header className="inventory-host-bar">
        <nav aria-label="消费示例导航">
          <a href="#/inventory" aria-current="page">
            物料库存
          </a>
          <a href="#/components">组件验证</a>
          <a href="http://127.0.0.1:4178/#/orders">采购订单预览</a>
        </nav>
        <label htmlFor="inventory-density">
          密度
          <select
            id="inventory-density"
            value={density}
            onChange={(event) =>
              setDensity(event.target.value === "cozy" ? "cozy" : "compact")
            }
          >
            <option value="compact">Compact</option>
            <option value="cozy">Cozy</option>
          </select>
        </label>
      </header>
      <FioriProvider
        density={density}
        className="inventory-provider"
        id="inventory-provider"
      >
        <main
          ref={scrollRef}
          className="inventory-scroll"
          data-fiori-scroll
          tabIndex={-1}
        >
          <div hidden={hasDetailRoute}>
            <ListReport
              id="inventory-list-report"
              title="物料库存"
              contentLabel="物料库存列表"
              expanded={expanded}
              pinned={pinned}
              onExpandedChange={setExpanded}
              onPinnedChange={setPinned}
              scrollContainerRef={scrollRef}
              summary={summary}
              titleActions={({ expanded: isExpanded, phone }) =>
                !isExpanded || phone ? (
                  <Button variant="ghost" onClick={openFilters}>
                    调整筛选 ({filterCount})
                  </Button>
                ) : null
              }
              header={
                <FilterBar
                  label="物料库存筛选"
                  search={
                    <InputGroup>
                      <InputGroupInput
                        id="inventory-search"
                        aria-label="搜索物料库存"
                        placeholder="搜索"
                        value={filters.search}
                        onChange={(event) =>
                          updateFilters({
                            ...filters,
                            search: event.target.value,
                          })
                        }
                      />
                      <InputGroupAddon align="inline-end">
                        <SapIcon name="search" />
                      </InputGroupAddon>
                    </InputGroup>
                  }
                  fields={[
                    {
                      id: "inventory-warehouse-filter",
                      label: "仓库",
                      control: (
                        <FilterSelect
                          id="inventory-warehouse-filter"
                          label="仓库"
                          value={filters.warehouse}
                          options={inventoryWarehouses}
                          onValueChange={(value) =>
                            updateFilters({ ...filters, warehouse: value })
                          }
                        />
                      ),
                    },
                    {
                      id: "inventory-status-filter",
                      label: "库存状态",
                      control: (
                        <FilterSelect
                          id="inventory-status-filter"
                          label="库存状态"
                          value={filters.status}
                          options={inventoryStates}
                          onValueChange={(value) =>
                            updateFilters({ ...filters, status: value })
                          }
                        />
                      ),
                    },
                  ]}
                  actions={
                    <Button variant="ghost" onClick={openFilters}>
                      调整筛选 ({filterCount})
                    </Button>
                  }
                />
              }
              toolbar={
                <TableToolbar
                  title="物料库存"
                  count={results.length}
                  label="物料库存操作"
                  actions={[
                    {
                      id: "count-stock",
                      label: "标记已盘点",
                      icon: "accept",
                      group: "business",
                      overflow: "never",
                      disabled: !hasUncountedSelection,
                      onAction: markCounted,
                    },
                    {
                      id: "inventory-settings",
                      label: "设置",
                      ariaLabel: "打开库存表格设置",
                      icon: "action-settings",
                      group: "personalization",
                      iconOnly: true,
                      onAction: openSettings,
                    },
                    {
                      id: "inventory-export",
                      label: "导出",
                      ariaLabel: "导出物料库存 CSV",
                      icon: "excel-attachment",
                      group: "export",
                      iconOnly: true,
                      disabled: results.length === 0,
                      onAction: exportInventory,
                    },
                  ]}
                />
              }
            >
              {notice && (
                <div className="inventory-business-notice">
                  <MessageStrip
                    tone="positive"
                    role="status"
                    onDismiss={() => setNotice("")}
                  >
                    {notice}
                  </MessageStrip>
                </div>
              )}
              <ResponsiveTable
                rows={results}
                columns={tableColumns}
                getRowId={(record) => record.id}
                getRowLabel={(record) =>
                  `${record.materialCode} ${record.material}，${record.warehouse}`
                }
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowNavigate={openRecord}
                sort={sort}
                growingPageSize={20}
                scrollContainerRef={scrollRef}
                labels={{
                  table: "物料库存",
                  selectAll: "选择全部物料库存",
                  selectRow: (record) => `选择库存 ${record.id}`,
                  navigateRow: (record) => `查看库存 ${record.id}`,
                  noData: "未找到数据。请调整筛选条件。",
                  columnHeaders: "库存列标题",
                  navigation: "查看库存详情",
                  status: ({ total, loaded, selected }) =>
                    `共 ${total} 条库存记录，已加载 ${loaded} 条，已选择 ${selected} 条`,
                }}
              />
            </ListReport>
          </div>
          {selectedRecord && (
            <InventoryDetail record={selectedRecord} onBack={backToList} />
          )}
          {hasDetailRoute && !selectedRecord && (
            <section
              className="inventory-detail"
              aria-labelledby="inventory-missing-title"
            >
              <header className="inventory-detail-header">
                <Button
                  id="inventory-detail-back"
                  variant="ghost"
                  onClick={backToList}
                >
                  <SapIcon name="nav-back" data-icon="inline-start" />
                  返回物料库存
                </Button>
                <h1 id="inventory-missing-title">未找到库存记录</h1>
              </header>
            </section>
          )}
        </main>

        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent className="inventory-filters-dialog">
            <DialogHeader>
              <DialogTitle>调整筛选</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="inventory-draft-search">搜索</FieldLabel>
                <Input
                  id="inventory-draft-search"
                  value={filterDraft.search}
                  onChange={(event) =>
                    setFilterDraft((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="inventory-draft-warehouse">
                  仓库
                </FieldLabel>
                <FilterSelect
                  id="inventory-draft-warehouse"
                  label="调整仓库筛选"
                  value={filterDraft.warehouse}
                  options={inventoryWarehouses}
                  onValueChange={(value) =>
                    setFilterDraft((current) => ({
                      ...current,
                      warehouse: value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="inventory-draft-status">
                  库存状态
                </FieldLabel>
                <FilterSelect
                  id="inventory-draft-status"
                  label="调整库存状态筛选"
                  value={filterDraft.status}
                  options={inventoryStates}
                  onValueChange={(value) =>
                    setFilterDraft((current) => ({ ...current, status: value }))
                  }
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setFiltersOpen(false)}>
                取消
              </Button>
              <Button
                variant="ghost"
                onClick={() => setFilterDraft({ ...EMPTY_INVENTORY_FILTERS })}
              >
                重置
              </Button>
              <Button
                onClick={() => {
                  updateFilters({ ...filterDraft })
                  setFiltersOpen(false)
                }}
              >
                确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="table-settings-dialog">
            <DialogHeader>
              <DialogTitle>设置</DialogTitle>
            </DialogHeader>
            <Tabs value={settingsTab} onValueChange={setSettingsTab}>
              <TabsList variant="line" aria-label="库存表格设置">
                <TabsTrigger value="columns">列</TabsTrigger>
                <TabsTrigger value="sort">排序</TabsTrigger>
              </TabsList>
              <TabsContent value="columns">
                <div className="column-options">
                  {defaultColumns.map((id) => (
                    <label key={id} className="column-option">
                      <Checkbox
                        aria-label={`显示${columnLabels[id]}列`}
                        checked={columnDraft.includes(id)}
                        disabled={id === "material"}
                        onCheckedChange={(checked) =>
                          setColumnDraft((current) =>
                            checked
                              ? defaultColumns.filter(
                                  (column) =>
                                    column === id || current.includes(column)
                                )
                              : current.filter((column) => column !== id)
                          )
                        }
                      />
                      <span>{columnLabels[id]}</span>
                    </label>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="sort">
                <FieldGroup className="sort-fields">
                  <Field>
                    <FieldLabel htmlFor="inventory-sort-key">
                      排序字段
                    </FieldLabel>
                    <Select
                      items={defaultColumns.map((id) => ({
                        value: id,
                        label: columnLabels[id],
                      }))}
                      value={sortDraft.key}
                      onValueChange={(next) =>
                        setSortDraft((current) => ({
                          ...current,
                          key: (next ?? "material") as ColumnId,
                        }))
                      }
                    >
                      <SelectTrigger id="inventory-sort-key">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent mobileTitle="排序字段">
                        <SelectGroup>
                          {defaultColumns.map((id) => (
                            <SelectItem key={id} value={id}>
                              {columnLabels[id]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="inventory-sort-direction">
                      排序方向
                    </FieldLabel>
                    <Select
                      items={[
                        { value: "asc", label: "升序" },
                        { value: "desc", label: "降序" },
                      ]}
                      value={sortDraft.direction}
                      onValueChange={(next) =>
                        setSortDraft((current) => ({
                          ...current,
                          direction: next === "desc" ? "desc" : "asc",
                        }))
                      }
                    >
                      <SelectTrigger id="inventory-sort-direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent mobileTitle="排序方向">
                        <SelectGroup>
                          <SelectItem value="asc">升序</SelectItem>
                          <SelectItem value="desc">降序</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  setColumns([...columnDraft])
                  setSort({ ...sortDraft })
                  setSettingsOpen(false)
                }}
              >
                确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </FioriProvider>
    </div>
  )
}
