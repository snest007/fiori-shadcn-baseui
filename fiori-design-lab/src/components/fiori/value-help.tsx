import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SapIcon } from "@/components/fiori/sap-icon"
import { cn } from "cn"
import "./value-help.css"

import {
  filterValueHelpItems,
  getValueHelpColumnValue,
  getValueHelpFilterKind,
  type ValueHelpColumn,
  type ValueHelpItem,
  type ValueHelpSearchState,
} from "@/lib/value-help-query"
export type {
  ValueHelpColumn,
  ValueHelpItem,
  ValueHelpSearchState,
} from "@/lib/value-help-query"

export type ValueHelpFieldProps = {
  id: string
  label: string
  objectLabel?: string
  items: readonly ValueHelpItem[]
  columns: readonly ValueHelpColumn[]
  value: readonly string[]
  onValueChange: (ids: string[]) => void
  selectionMode: "single" | "multiple"
  placeholder?: string
  /** Prevents opening or changing the selection; removes the field from Tab order. */
  disabled?: boolean
  /** Keeps the source field focusable while preventing opening/removal. */
  readOnly?: boolean
  className?: string
  dialogTitle?: string
  phoneDialogTitle?: string
  onOpenChange?: (open: boolean) => void
}

// shadcn/Base UI composition of Fiori's selection-only value-help pattern.
// Single selection commits a row immediately; multiple selection remains local
// until OK. Conditions, variants, remote queries and business handlers are out
// of scope. Base UI owns the modal focus trap and Escape dismissal. Pointer dismissal is disabled.
export function ValueHelpField({
  id,
  label,
  objectLabel = label,
  items,
  columns,
  value,
  onValueChange,
  selectionMode,
  placeholder,
  disabled = false,
  readOnly = false,
  className,
  dialogTitle,
  phoneDialogTitle = "Search and Select",
  onOpenChange,
}: ValueHelpFieldProps) {
  const multiple = selectionMode === "multiple"
  const sourceRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchOriginalRef = useRef("")
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())
  const [phone, setPhone] = useState(
    () =>
      typeof window !== "undefined" && matchMedia("(max-width: 599px)").matches
  )
  const [open, setOpen] = useState(false)
  const [phoneView, setPhoneView] = useState<"list" | "filters">("list")
  const [showFilters, setShowFilters] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [typing, setTyping] = useState(false)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState<ValueHelpSearchState>({
    search: "",
    filters: {},
  })
  const [selection, setSelection] = useState<string[]>([])
  const [activeRow, setActiveRow] = useState<string | null>(null)
  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items]
  )
  const effectiveColumns: readonly ValueHelpColumn[] = columns.length
    ? columns
    : [{ key: "label", label: objectLabel }]
  const filterColumns = effectiveColumns.filter(
    (column) => getValueHelpFilterKind(column) !== false
  )
  const committedIds = [...new Set(value)].slice(0, multiple ? undefined : 1)
  const phoneFilters = phone && phoneView === "filters"
  const phoneColumns = effectiveColumns.filter(
    (column, index) => column.showOnPhone ?? index < 2
  )
  const displayedColumns = phone
    ? phoneColumns.length
      ? phoneColumns
      : effectiveColumns.slice(0, 1)
    : effectiveColumns
  const popinColumns = phone
    ? effectiveColumns.filter((column) => !displayedColumns.includes(column))
    : []
  const results = filterValueHelpItems(items, effectiveColumns, applied)
  const selected = new Set(selection)
  const visibleSelected = results.filter((item) => selected.has(item.id)).length
  const allSelected = results.length > 0 && visibleSelected === results.length
  const tabStop = results.some((item) => item.id === activeRow)
    ? activeRow
    : results[0]?.id
  const searchFormId = `${id}-value-help-search-form`
  const tableHeadingId = `${id}-value-help-items-heading`

  useEffect(() => {
    const media = matchMedia("(max-width: 599px)")
    const change = () => {
      setPhone(media.matches)
      if (!media.matches) setPhoneView("list")
    }
    media.addEventListener("change", change)
    return () => media.removeEventListener("change", change)
  }, [])

  // A later permission/state change closes and discards the draft. It must not
  // reopen the old popup when the consumer makes the field editable again.
  useEffect(() => {
    if (!open || (!disabled && !readOnly)) return
    const frame = requestAnimationFrame(() => {
      setOpen(false)
      setTyping(false)
      setTypedText("")
      onOpenChange?.(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [disabled, readOnly, open, onOpenChange])

  function changeOpen(next: boolean) {
    if (next && (disabled || readOnly)) return
    if (next) {
      const nextSearch = typing ? typedText : ""
      setSearch(nextSearch)
      setFilters({})
      setApplied({ search: nextSearch, filters: {} })
      setSelection(committedIds)
      setActiveRow(committedIds[0] ?? items[0]?.id ?? null)
      setShowFilters(false)
      setPhoneView("list")
    } else {
      setTyping(false)
      setTypedText("")
    }
    setOpen(next)
    onOpenChange?.(next)
  }

  function commit(ids: string[]) {
    if (disabled || readOnly) return
    onValueChange([...new Set(ids)].slice(0, multiple ? undefined : 1))
    changeOpen(false)
  }

  function selectItem(itemId: string) {
    if (disabled || readOnly) return
    if (!multiple) {
      commit([itemId])
      return
    }
    setSelection((current) =>
      current.includes(itemId)
        ? current.filter((selectedId) => selectedId !== itemId)
        : [...current, itemId]
    )
  }

  function setItemChecked(itemId: string, checked: boolean) {
    if (disabled || readOnly) return
    setSelection((current) =>
      checked
        ? [...new Set([...current, itemId])]
        : current.filter((selectedId) => selectedId !== itemId)
    )
  }

  function applySearch(nextSearch: string) {
    setApplied({ search: nextSearch, filters: { ...filters } })
    setActiveRow(null)
    if (phoneFilters) {
      setPhoneView("list")
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }

  function submitSearch() {
    applySearch(search)
  }

  function showPhoneFilters() {
    setPhoneView("filters")
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  function leavePhoneFilters() {
    setPhoneView("list")
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  function focusRow(index: number) {
    const item = results[Math.max(0, Math.min(index, results.length - 1))]
    if (!item) return
    setActiveRow(item.id)
    const row = rowRefs.current.get(item.id)
    row?.focus()
    row?.scrollIntoView({ block: "nearest" })
  }

  function rowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    itemId: string,
    index: number
  ) {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault()
      event.stopPropagation()
      focusRow(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? results.length - 1
            : index + (event.key === "ArrowDown" ? 1 : -1)
      )
      return
    }
    // A focused Base UI checkbox already handles Space; do not toggle its row
    // again when the key event bubbles to the table row.
    if ((event.target as HTMLElement).closest('[data-slot="checkbox"]')) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      event.stopPropagation()
      selectItem(itemId)
    }
  }

  function token(itemId: string, insideDialog: boolean) {
    const text = itemMap.get(itemId)?.label ?? itemId
    return (
      <Badge key={itemId} variant="outline" className="value-help-token">
        <span className="value-help-token-label" title={text}>
          {text}
        </span>
        {(insideDialog || (!disabled && !readOnly)) && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="value-help-token-remove"
            aria-label={`Remove ${text}`}
            title={`Remove ${text}`}
            onClick={() => {
              if (insideDialog)
                setSelection((current) =>
                  current.filter((selectedId) => selectedId !== itemId)
                )
              else {
                onValueChange(
                  committedIds.filter((selectedId) => selectedId !== itemId)
                )
                setTyping(false)
                setTypedText("")
              }
              requestAnimationFrame(() =>
                (insideDialog ? searchRef : sourceRef).current?.focus()
              )
            }}
          >
            <SapIcon name="decline" />
          </Button>
        )}
      </Badge>
    )
  }

  return (
    <Dialog
      open={open && !disabled && !readOnly}
      onOpenChange={changeOpen}
      modal
    >
      <Field
        className={cn("value-help-field", className)}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
      >
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <InputGroup
          className={cn(
            "value-help-source-input",
            multiple && "value-help-source-input-multiple"
          )}
        >
          <InputGroupInput
            id={id}
            ref={sourceRef}
            autoComplete="off"
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            value={
              typing
                ? typedText
                : multiple
                  ? ""
                  : (itemMap.get(committedIds[0])?.label ??
                    committedIds[0] ??
                    "")
            }
            aria-haspopup="dialog"
            onChange={(event) => {
              if (disabled || readOnly) return
              setTypedText(event.target.value)
              setTyping(true)
            }}
            onKeyDown={(event) => {
              if (
                event.key === "F4" ||
                (event.altKey && event.key === "ArrowDown")
              ) {
                event.preventDefault()
                changeOpen(true)
              }
            }}
          />
          {multiple && committedIds.length > 0 && (
            <InputGroupAddon
              align="inline-start"
              className="value-help-source-tokenizer"
              aria-label={`Selected ${objectLabel}`}
            >
              {committedIds.map((itemId) => token(itemId, false))}
            </InputGroupAddon>
          )}
          <InputGroupAddon
            align="inline-end"
            className="value-help-source-trigger"
          >
            <DialogTrigger
              render={<InputGroupButton size="icon-xs" />}
              disabled={disabled || readOnly}
              aria-label={`Select ${objectLabel}`}
              title={`Select ${objectLabel}`}
            >
              <SapIcon name="value-help" />
            </DialogTrigger>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <DialogContent
        className="value-help-dialog"
        data-phone={phone}
        data-phone-view={phoneView}
        data-selection-mode={selectionMode}
        showCloseButton={false}
        initialFocus={searchRef}
        finalFocus={sourceRef}
      >
        <DialogHeader className="value-help-dialog-header">
          {phoneFilters && (
            <Button
              variant="ghost"
              size="icon"
              className="value-help-phone-back"
              aria-label="Back"
              title="Back"
              onClick={leavePhoneFilters}
            >
              <SapIcon name="nav-back" />
            </Button>
          )}
          <DialogTitle>
            {phoneFilters
              ? "Filters"
              : phone
                ? phoneDialogTitle
                : (dialogTitle ?? `Select: ${objectLabel}`)}
          </DialogTitle>
        </DialogHeader>
        <form
          id={searchFormId}
          className="value-help-search-form"
          onSubmit={(event) => {
            event.preventDefault()
            submitSearch()
          }}
        >
          <div className="value-help-basic-search-row">
            <Field className="value-help-basic-search">
              <FieldLabel htmlFor={`${id}-basic-search`} className="sr-only">
                Basic Search
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={`${id}-basic-search`}
                  ref={searchRef}
                  autoComplete="off"
                  value={search}
                  placeholder="Search"
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={(event) => {
                    searchOriginalRef.current = event.target.value
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      if (search === searchOriginalRef.current) {
                        searchOriginalRef.current = ""
                      }
                      const restoredSearch = searchOriginalRef.current
                      if (search !== restoredSearch) {
                        event.preventDefault()
                        event.stopPropagation()
                        setSearch(restoredSearch)
                        applySearch(restoredSearch)
                      }
                      return
                    }
                    if (
                      event.key === "ArrowDown" &&
                      !phoneFilters &&
                      results.length
                    ) {
                      event.preventDefault()
                      focusRow(0)
                    }
                  }}
                />
                <InputGroupAddon align="inline-end">
                  {search && (
                    <InputGroupButton
                      size="icon-xs"
                      aria-label="Clear search"
                      title="Clear search"
                      onClick={() => {
                        setSearch("")
                        applySearch("")
                        requestAnimationFrame(() => searchRef.current?.focus())
                      }}
                    >
                      <SapIcon name="decline" />
                    </InputGroupButton>
                  )}
                  <InputGroupButton
                    size="icon-xs"
                    type="submit"
                    aria-label="Search"
                    title="Search"
                  >
                    <SapIcon name="search" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            {!phoneFilters && (
              <div className="value-help-search-actions">
                {filterColumns.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      phone
                        ? showPhoneFilters()
                        : setShowFilters((current) => !current)
                    }
                    aria-expanded={phone ? phoneFilters : showFilters}
                  >
                    {phone || !showFilters ? "Show Filters" : "Hide Filters"}
                  </Button>
                )}
                {!phone && <Button type="submit">Go</Button>}
              </div>
            )}
          </div>
          {(phoneFilters || (!phone && showFilters)) && (
            <FieldGroup className="value-help-attribute-filters">
              {filterColumns.map((column) => {
                const options = [
                  { value: "", label: "All" },
                  ...(column.filterOptions ??
                    [...new Set(items.map((item) => getValueHelpColumnValue(item, column.key)))]
                      .filter(Boolean)
                      .map((value) => ({ value, label: value }))),
                ]
                return (
                <Field key={column.key}>
                  <FieldLabel htmlFor={`${id}-filter-${column.key}`}>
                    {column.label}
                  </FieldLabel>
                  {getValueHelpFilterKind(column) === "text" ? (
                    <Input
                      id={`${id}-filter-${column.key}`}
                      autoComplete="off"
                      value={filters[column.key] ?? ""}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          [column.key]: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <Select
                      items={options}
                      value={filters[column.key] ?? ""}
                      onValueChange={(next) =>
                        setFilters((current) => ({
                          ...current,
                          [column.key]: next ?? "",
                        }))
                      }
                    >
                      <SelectTrigger
                        id={`${id}-filter-${column.key}`}
                        className="value-help-filter-select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                )
              })}
            </FieldGroup>
          )}
        </form>
        {!phoneFilters && (
          <>
            <div className="value-help-result-heading">
              <h2 id={tableHeadingId}>Items ({results.length})</h2>
              <span className="sr-only" role="status">
                {results.length} items found
              </span>
            </div>
            <div className="value-help-results">
              <Table
                className="value-help-table"
                aria-labelledby={tableHeadingId}
              >
                <TableHeader>
                  <TableRow>
                    {multiple && (
                      <TableHead className="value-help-checkbox-column">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={!allSelected && visibleSelected > 0}
                          disabled={results.length === 0}
                          aria-label="Select all visible items"
                          onCheckedChange={(checked) =>
                            setSelection((current) =>
                              checked
                                ? [
                                    ...new Set([
                                      ...current,
                                      ...results.map((item) => item.id),
                                    ]),
                                  ]
                                : current.filter(
                                    (itemId) =>
                                      !results.some(
                                        (item) => item.id === itemId
                                      )
                                  )
                            )
                          }
                        />
                      </TableHead>
                    )}
                    {displayedColumns.map((column) => (
                      <TableHead
                        key={column.key}
                        style={phone ? undefined : { width: column.width }}
                        className={
                          column.key === "id"
                            ? "value-help-id-column"
                            : undefined
                        }
                      >
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item, index) => (
                    <Fragment key={item.id}>
                      <TableRow
                        ref={(row) => {
                          if (row) rowRefs.current.set(item.id, row)
                          else rowRefs.current.delete(item.id)
                        }}
                        className="value-help-result-row"
                        data-state={
                          selected.has(item.id) ? "selected" : undefined
                        }
                        aria-selected={selected.has(item.id)}
                        aria-describedby={
                          popinColumns.length
                            ? `${id}-popin-${encodeURIComponent(item.id)}`
                            : undefined
                        }
                        tabIndex={item.id === tabStop ? 0 : -1}
                        onFocus={() => setActiveRow(item.id)}
                        onKeyDown={(event) => rowKeyDown(event, item.id, index)}
                        onClick={(event) => {
                          if (
                            !(event.target as HTMLElement).closest(
                              '[data-slot="checkbox"]'
                            )
                          )
                            selectItem(item.id)
                        }}
                      >
                        {multiple && (
                          <TableCell className="value-help-checkbox-column">
                            <Checkbox
                              checked={selected.has(item.id)}
                              aria-label={`Select ${item.label}`}
                              onCheckedChange={(checked) =>
                                setItemChecked(item.id, checked)
                              }
                            />
                          </TableCell>
                        )}
                        {displayedColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={
                              column.key === "id"
                                ? "value-help-id-column"
                                : undefined
                            }
                          >
                            {getValueHelpColumnValue(item, column.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                      {popinColumns.length > 0 && (
                        <TableRow
                          id={`${id}-popin-${encodeURIComponent(item.id)}`}
                          aria-hidden="true"
                          className="value-help-popin-row"
                          data-state={
                            selected.has(item.id) ? "selected" : undefined
                          }
                          onClick={() => selectItem(item.id)}
                        >
                          <TableCell
                            colSpan={
                              displayedColumns.length + (multiple ? 1 : 0)
                            }
                          >
                            <dl className="value-help-popin-fields">
                              {popinColumns.map((column) => (
                                <div key={column.key}>
                                  <dt>{column.label}</dt>
                                  <dd>
                                    {getValueHelpColumnValue(item, column.key)}
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
                        colSpan={displayedColumns.length + (multiple ? 1 : 0)}
                        className="value-help-no-data"
                      >
                        No items found. Adjust your search or filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {multiple && !phone && (
              <div className="value-help-selected-items" aria-live="polite">
                <div className="value-help-selected-heading">
                  <h2>Selected Items ({selection.length})</h2>
                  <Button
                    variant="ghost"
                    disabled={selection.length === 0}
                    onClick={() => {
                      setSelection([])
                      searchRef.current?.focus()
                    }}
                  >
                    Remove All
                  </Button>
                </div>
                <div className="value-help-selected-tokenizer">
                  {selection.map((itemId) => token(itemId, true))}
                </div>
              </div>
            )}
          </>
        )}
        <DialogFooter className="value-help-dialog-footer">
          {phoneFilters ? (
            <Button type="submit" form={searchFormId}>
              Go
            </Button>
          ) : (
            multiple && <Button onClick={() => commit(selection)}>OK</Button>
          )}
          <Button variant="ghost" onClick={() => changeOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
