import { useRef, useState, type KeyboardEvent, type FocusEvent } from "react"

// Read-only sap.m.Table navigation, based on the 1.151.0 ListBase/Table
// behavior captured in references/table-keyboard. This does not implement Edit mode.
export function useResponsiveTableNavigation({
  firstRow,
  rowIds,
  columnIds,
  open,
  selectAll,
  pageSize = 20,
}: {
  firstRow?: string
  rowIds: string[]
  columnIds: string[]
  open?: (id: string) => void
  selectAll: () => void
  pageSize?: number
}) {
  const [active, setActive] = useState<string>()
  const [contentMode, setContentMode] = useState(false)
  const previousControl = useRef(new Map<string, HTMLElement>())
  const delimiter = active?.lastIndexOf(":") ?? -1
  const activeRow = delimiter >= 0 ? active?.slice(0, delimiter) : undefined
  const existingRow = activeRow === "header" || rowIds.includes(activeRow ?? "")
  const activeColumn = delimiter >= 0 ? active?.slice(delimiter + 1) : undefined
  const existingColumn = [
    "row",
    "selection",
    "navigation",
    ...columnIds,
  ].includes(activeColumn ?? "")
  const current = existingRow
    ? existingColumn
      ? active
      : `${activeRow}:row`
    : `${firstRow ?? "header"}:row`

  function onFocusCapture(event: FocusEvent<HTMLTableElement>) {
    const target = event.target as HTMLElement
    if (target.hasAttribute("data-grid-key")) {
      setActive(target.dataset.gridKey)
      setContentMode(false)
    } else {
      const row = target.closest<HTMLElement>("[data-grid-row]")
      if (row) {
        setActive(`${row.dataset.gridRow}:row`)
        previousControl.current.set(row.dataset.gridRow!, target)
        setContentMode(true)
      }
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const target = event.target as HTMLElement
    const row = target.closest<HTMLElement>("[data-grid-row]")
    if (!row) return
    const isNode = target.hasAttribute("data-grid-key")
    const cell = target.closest<HTMLElement>("[data-grid-cell]")
    const controls = (node: HTMLElement) =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]):not([aria-hidden="true"]),[role="checkbox"]:not([aria-disabled="true"])'
        )
      )
    const focus = (node?: HTMLElement | null) => {
      if (node) {
        event.preventDefault()
        node.focus()
      }
    }
    if (!isNode) {
      if (event.key === "F2") focus(cell ?? row)
      if (event.key === "F7") focus(row)
      return
    }
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "a" &&
      !cell
    ) {
      event.preventDefault()
      if (!event.shiftKey) selectAll()
      return
    }
    if (
      cell &&
      ["selection", "navigation"].includes(cell.dataset.gridCell ?? "") &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault()
      controls(cell)[0]?.click()
      return
    }
    if (
      event.key === "F2" ||
      event.key === "F7" ||
      (cell && event.key === "Enter")
    ) {
      event.preventDefault()
      if (event.shiftKey) return
      const remembered =
        event.key === "F7" && !cell
          ? previousControl.current.get(row.dataset.gridRow!)
          : undefined
      focus(remembered?.isConnected ? remembered : controls(cell ?? row)[0])
      return
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      if (!cell && event.key === "Enter" && row.dataset.gridRow !== "header")
        open?.(row.dataset.gridRow!)
      else if (!cell || cell.dataset.gridCell === "selection")
        controls(cell ?? row)[0]?.click()
      return
    }
    const rows = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("[data-grid-row]")
    )
    const rowIndex = rows.indexOf(row)
    const cells = Array.from(
      row.querySelectorAll<HTMLElement>(":scope > [data-grid-cell]")
    )
    const cellIndex = cell ? cells.indexOf(cell) : -1
    if (
      (event.altKey || event.metaKey || event.ctrlKey) &&
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
      ].includes(event.key)
    )
      return
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const delta = event.key === "ArrowRight" ? 1 : -1
      focus(
        cellIndex + delta < 0
          ? row
          : cells[Math.min(cells.length - 1, cellIndex + delta)]
      )
    } else if (
      ["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(event.key)
    ) {
      const delta =
        event.key === "ArrowUp"
          ? -1
          : event.key === "ArrowDown"
            ? 1
            : event.key === "PageUp"
              ? -pageSize
              : pageSize
      const destination =
        rows[Math.max(0, Math.min(rows.length - 1, rowIndex + delta))]
      focus(
        cell
          ? destination?.querySelectorAll<HTMLElement>(
              ":scope > [data-grid-cell]"
            )[cellIndex]
          : destination
      )
    } else if (event.key === "Home" || event.key === "End") {
      if (cell && !event.ctrlKey && !event.metaKey)
        focus(event.key === "Home" ? cells[0] : cells.at(-1))
      else {
        const destination = event.key === "Home" ? rows[0] : rows.at(-1)
        focus(
          cell
            ? destination?.querySelectorAll<HTMLElement>(
                ":scope > [data-grid-cell]"
              )[cellIndex]
            : destination
        )
      }
    }
  }

  return {
    onKeyDown,
    onFocusCapture,
    onBlurCapture: (event: FocusEvent<HTMLTableElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null))
        setContentMode(false)
    },
    tabIndex: (key: string) => (current === key ? 0 : -1),
    contentTabIndex: contentMode ? 0 : -1,
  }
}
