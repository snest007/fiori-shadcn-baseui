export type ValueHelpItem = {
  /** Unique, stable selection key. It need not be the displayed label. */
  id: string
  label: string
  attributes?: Readonly<Record<string, string>>
}

export type ValueHelpColumn = {
  /** "id" and "label" address built-in fields; other keys address attributes. */
  key: string
  label: string
  width?: number
  /** Defaults to text for id/label, select for attributes. */
  filter?: "text" | "select" | false
  /** Defaults to unique values in the supplied items. */
  filterOptions?: readonly { value: string; label: string }[]
  /** Set false to omit this column from Basic Search. */
  searchable?: boolean
  /** Defaults to the first two columns; remaining columns become phone pop-ins. */
  showOnPhone?: boolean
}

export type ValueHelpSearchState = {
  search: string
  filters: Readonly<Record<string, string>>
}

export function getValueHelpColumnValue(item: ValueHelpItem, key: string) {
  if (key === "id") return item.id
  if (key === "label") return item.label
  return item.attributes?.[key] ?? ""
}

export function getValueHelpFilterKind(column: ValueHelpColumn) {
  return (
    column.filter ??
    (column.key === "id" || column.key === "label" ? "text" : "select")
  )
}

/** Client-side Basic Search and AND-combined property filters. No fixture data. */
export function filterValueHelpItems(
  items: readonly ValueHelpItem[],
  columns: readonly ValueHelpColumn[],
  state: ValueHelpSearchState
) {
  const searchableKeys = [
    ...new Set(["id", "label", ...columns.map((column) => column.key)]),
  ].filter(
    (key) => columns.find((column) => column.key === key)?.searchable !== false
  )
  const query = state.search.trim().toLocaleLowerCase()
  const filterColumns = columns.filter(
    (column) => getValueHelpFilterKind(column) !== false
  )
  return items.filter((item) => {
    const searchable = searchableKeys
      .map((key) => getValueHelpColumnValue(item, key))
      .join(" ")
      .toLocaleLowerCase()
    return (
      searchable.includes(query) &&
      filterColumns.every((column) => {
        const filter = state.filters[column.key] ?? ""
        if (!filter) return true
        const value = getValueHelpColumnValue(item, column.key)
        return getValueHelpFilterKind(column) === "text"
          ? value
              .toLocaleLowerCase()
              .includes(filter.trim().toLocaleLowerCase())
          : value === filter
      })
    )
  })
}
