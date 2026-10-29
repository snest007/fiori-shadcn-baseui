"use client"

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { Button } from "~/components/fiori/ui/button"
import { Checkbox } from "~/components/fiori/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/fiori/ui/table"
import { cn } from "~/lib/fiori/utils"
import { findPageScrollContainer } from "./dynamic-page"
import { SapIcon } from "./sap-icon"
import { useResponsiveTableNavigation } from "./use-responsive-table-navigation"
import "./list-report.css"

export type ResponsiveTableColumn<T> = {
  id: string
  label: ReactNode
  render: (row: T) => ReactNode
  /** Container width below which this column moves to label/value pop-in. */
  minWidth?: number
  align?: "start" | "end"
  className?: string
}
export type ResponsiveTableCounts = {
  total: number
  loaded: number
  selected: number
}
export type ResponsiveTableProps<T> = {
  rows: T[]
  columns: ResponsiveTableColumn<T>[]
  getRowId: (row: T) => string
  getRowLabel?: (row: T) => string
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  onRowNavigate?: (id: string) => void
  sort?: { key: string; direction: "asc" | "desc" }
  growingPageSize?: number
  scrollContainerRef?: RefObject<HTMLElement | null>
  labels: {
    table: string
    selectAll?: string
    selectRow?: (row: T) => string
    navigateRow?: (row: T) => string
    noData?: string
    columnHeaders?: string
    navigation?: string
    status?: (counts: ResponsiveTableCounts) => string
  }
}

/** Read-only responsive rows, growing and navigation; query/sort/business state stay outside. */
export function ResponsiveTable<T>({
  rows,
  columns,
  getRowId,
  getRowLabel,
  selectedIds = [],
  onSelectionChange,
  onRowNavigate,
  sort,
  growingPageSize = 20,
  scrollContainerRef,
  labels,
}: ResponsiveTableProps<T>) {
  const instanceId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const loadRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1024)
  const batchSize = Math.max(1, Math.floor(growingPageSize))
  const [sourceRows, setSourceRows] = useState(rows)
  const [loaded, setLoaded] = useState(batchSize)
  if (sourceRows !== rows) {
    setSourceRows(rows)
    setLoaded(batchSize)
  }
  const visible = rows.slice(0, loaded)
  const eligibleColumns = columns.filter(
    (column) => width >= (column.minWidth ?? 0)
  )
  const mainColumns = eligibleColumns.length
    ? eligibleColumns
    : columns.slice(0, 1)
  const popinColumns = columns.filter((column) => !mainColumns.includes(column))
  const selectable = onSelectionChange != null
  const navigable = onRowNavigate != null
  const rowIds = rows.map(getRowId)
  const allSelected =
    rows.length > 0 && rowIds.every((id) => selectedIds.includes(id))
  const someSelected = rowIds.some((id) => selectedIds.includes(id))
  const selectAll = () => {
    onSelectionChange?.(
      allSelected
        ? selectedIds.filter((id) => !rowIds.includes(id))
        : [...new Set([...selectedIds, ...rowIds])]
    )
  }
  const navigation = useResponsiveTableNavigation({
    firstRow: visible[0] && getRowId(visible[0]),
    rowIds: visible.map(getRowId),
    columnIds: mainColumns.map((column) => column.id),
    open: onRowNavigate,
    selectAll,
    pageSize: batchSize,
  })

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const measure = () => {
      if (!wrapper.closest("[hidden]")) setWidth(wrapper.clientWidth)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    measure()
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const target = loadRef.current,
      wrapper = wrapperRef.current
    if (!target || !wrapper || loaded >= rows.length) return
    const root = findPageScrollContainer(wrapper, scrollContainerRef)
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting) &&
          !wrapper.closest("[hidden]")
        ) {
          setLoaded((current) => Math.min(current + batchSize, rows.length))
        }
      },
      { root, rootMargin: "0px 0px 100px 0px" }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [loaded, rows.length, batchSize, scrollContainerRef])

  const counts = {
    total: rows.length,
    loaded: visible.length,
    selected: rowIds.filter((id) => selectedIds.includes(id)).length,
  }
  const cellClass = (column: ResponsiveTableColumn<T>) =>
    cn(column.align === "end" && "numeric-column", column.className)
  const columnSpan =
    mainColumns.length + (selectable ? 1 : 0) + (navigable ? 1 : 0)
  const canNavigate = (target: EventTarget) =>
    !(target as HTMLElement).closest("button,a,input,[role=checkbox]")

  return (
    <div className="responsive-table" ref={wrapperRef}>
      <span className="sr-only" role="status">
        {labels.status?.(counts) ??
          `${labels.table}：共 ${counts.total} 条，已加载 ${counts.loaded} 条，已选择 ${counts.selected} 条`}
      </span>
      <Table
        className="orders-table"
        role="grid"
        aria-label={labels.table}
        aria-rowcount={rows.length + 1}
        aria-multiselectable={selectable || undefined}
        onFocusCapture={navigation.onFocusCapture}
        onBlurCapture={navigation.onBlurCapture}
        onKeyDown={navigation.onKeyDown}
      >
        <TableHeader>
          <TableRow
            data-grid-row="header"
            data-grid-key="header:row"
            tabIndex={navigation.tabIndex("header:row")}
            aria-label={labels.columnHeaders ?? "列标题"}
          >
            {selectable && (
              <TableHead
                className="checkbox-column"
                data-grid-cell="selection"
                data-grid-key="header:selection"
                tabIndex={navigation.tabIndex("header:selection")}
              >
                <Checkbox
                  aria-label={labels.selectAll ?? "选择全部行"}
                  tabIndex={navigation.contentTabIndex}
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onCheckedChange={selectAll}
                />
              </TableHead>
            )}
            {mainColumns.map((column) => (
              <TableHead
                key={column.id}
                data-grid-cell={column.id}
                data-grid-key={`header:${column.id}`}
                tabIndex={navigation.tabIndex(`header:${column.id}`)}
                className={cellClass(column)}
                aria-sort={
                  sort?.key === column.id
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <span className="column-label">
                  {column.label}
                  {sort?.key === column.id && (
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
            {navigable && (
              <TableHead
                className="navigation-column"
                data-grid-cell="navigation"
                data-grid-key="header:navigation"
                tabIndex={navigation.tabIndex("header:navigation")}
              >
                <span className="sr-only">
                  {labels.navigation ?? "查看详情"}
                </span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((row, index) => {
            const id = getRowId(row),
              selected = selectedIds.includes(id)
            const popinId = `${instanceId}-popin-${id}`
            return (
              <Fragment key={id}>
                <TableRow
                  className={cn(
                    "order-row",
                    popinColumns.length > 0 && "has-popin"
                  )}
                  data-navigable={navigable}
                  data-grid-row={id}
                  data-grid-key={`${id}:row`}
                  data-state={selected ? "selected" : undefined}
                  tabIndex={navigation.tabIndex(`${id}:row`)}
                  aria-selected={selectable ? selected : undefined}
                  aria-rowindex={index + 2}
                  aria-label={getRowLabel?.(row) ?? id}
                  aria-describedby={popinColumns.length ? popinId : undefined}
                  onClick={(event) => {
                    if (canNavigate(event.target)) onRowNavigate?.(id)
                  }}
                >
                  {selectable && (
                    <TableCell
                      className="checkbox-column"
                      role="gridcell"
                      data-grid-cell="selection"
                      data-grid-key={`${id}:selection`}
                      tabIndex={navigation.tabIndex(`${id}:selection`)}
                      rowSpan={popinColumns.length ? 2 : 1}
                    >
                      <Checkbox
                        aria-label={labels.selectRow?.(row) ?? `选择 ${id}`}
                        tabIndex={navigation.contentTabIndex}
                        checked={selected}
                        onCheckedChange={(checked) =>
                          onSelectionChange(
                            checked
                              ? [...new Set([...selectedIds, id])]
                              : selectedIds.filter(
                                  (selectedId) => selectedId !== id
                                )
                          )
                        }
                      />
                    </TableCell>
                  )}
                  {mainColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      role="gridcell"
                      data-grid-cell={column.id}
                      data-grid-key={`${id}:${column.id}`}
                      tabIndex={navigation.tabIndex(`${id}:${column.id}`)}
                      className={cellClass(column)}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                  {navigable && (
                    <TableCell
                      className="navigation-column"
                      role="gridcell"
                      data-grid-cell="navigation"
                      data-grid-key={`${id}:navigation`}
                      tabIndex={navigation.tabIndex(`${id}:navigation`)}
                      rowSpan={popinColumns.length ? 2 : 1}
                    >
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={labels.navigateRow?.(row) ?? `查看 ${id}`}
                        tabIndex={navigation.contentTabIndex}
                        title={labels.navigation ?? "查看详情"}
                        onClick={() => onRowNavigate(id)}
                      >
                        <SapIcon name="navigation-right-arrow" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
                {popinColumns.length > 0 && (
                  <TableRow
                    className="popin-row"
                    id={popinId}
                    data-state={selected ? "selected" : undefined}
                    aria-hidden="true"
                    onClick={(event) => {
                      if (canNavigate(event.target)) onRowNavigate?.(id)
                    }}
                  >
                    <TableCell colSpan={mainColumns.length}>
                      <dl className="popin-fields">
                        {popinColumns.map((column) => (
                          <div key={column.id}>
                            <dt>{column.label}</dt>
                            <dd>{column.render(row)}</dd>
                          </div>
                        ))}
                      </dl>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnSpan} className="table-no-data">
                {labels.noData ?? "未找到数据。请调整筛选条件。"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {loaded < rows.length && (
        <div ref={loadRef} className="load-sentinel" aria-hidden="true" />
      )}
    </div>
  )
}
