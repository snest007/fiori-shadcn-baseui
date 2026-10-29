"use client"

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SapIcon } from "./sap-icon"
import "./list-report.css"

export type TableToolbarGroup =
  "business" | "personalization" | "export" | "view"
export type TableToolbarAction = {
  id: string
  label: string
  ariaLabel?: string
  icon?: ComponentProps<typeof SapIcon>["name"]
  group?: TableToolbarGroup
  onAction: () => void
  disabled?: boolean
  overflow?: "never" | "auto"
  iconOnly?: boolean
}
export type TableToolbarProps = {
  title: ReactNode
  count?: number
  actions: TableToolbarAction[]
  label?: string
  overflowLabel?: string
}
const groupOrder: TableToolbarGroup[] = [
  "business",
  "personalization",
  "export",
  "view",
]

/** Fiori action-group order with caller-declared actions that must remain visible. */
export function TableToolbar({
  title,
  count,
  actions,
  label = "表格操作",
  overflowLabel = "更多表格操作",
}: TableToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [geometry, setGeometry] = useState<{
    width: number
    titleWidth: number
    widths: Record<string, number>
  }>({ width: 1024, titleWidth: 200, widths: {} })
  useEffect(() => {
    const toolbar = toolbarRef.current,
      heading = titleRef.current
    if (!toolbar || !heading) return
    const measure = () => {
      if (toolbar.closest("[hidden]")) return
      const measured: Record<string, number> = {}
      for (const button of toolbar.querySelectorAll<HTMLElement>(
        "[data-toolbar-action]"
      )) {
        measured[button.dataset.toolbarAction!] =
          button.getBoundingClientRect().width
      }
      const width = toolbar.clientWidth,
        titleWidth = heading.scrollWidth
      setGeometry((current) =>
        current.width === width &&
        current.titleWidth === titleWidth &&
        Object.entries(measured).every(
          ([id, value]) => current.widths[id] === value
        )
          ? current
          : { width, titleWidth, widths: { ...current.widths, ...measured } }
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(toolbar)
    observer.observe(heading)
    measure()
    return () => observer.disconnect()
  }, [actions])

  const ordered = groupOrder.flatMap((group) =>
    actions.filter((action) => (action.group ?? "business") === group)
  )
  const visibleIds = new Set(ordered.map((action) => action.id))
  const estimates = (action: TableToolbarAction) =>
    geometry.widths[action.id] ??
    (action.iconOnly ? 32 : action.label.length * 8 + (action.icon ? 42 : 26))
  const required =
    ordered.reduce((sum, action) => sum + estimates(action) + 8, 0) +
    Math.max(
      0,
      new Set(ordered.map((action) => action.group ?? "business")).size - 1
    ) *
      17
  const available = Math.max(0, geometry.width - geometry.titleWidth - 48)
  let remaining = required
  if (required > available) {
    for (const action of [...ordered].reverse()) {
      if (action.overflow === "never") continue
      if (remaining > available - 40) {
        visibleIds.delete(action.id)
        remaining -= estimates(action) + 8
      }
    }
  }
  const visibleGroups = groupOrder
    .map((group) => ({
      group,
      actions: ordered.filter(
        (action) =>
          (action.group ?? "business") === group && visibleIds.has(action.id)
      ),
    }))
    .filter((group) => group.actions.length)
  const overflowGroups = groupOrder
    .map((group) => ({
      group,
      actions: ordered.filter(
        (action) =>
          (action.group ?? "business") === group && !visibleIds.has(action.id)
      ),
    }))
    .filter((group) => group.actions.length)

  return (
    <div
      ref={toolbarRef}
      className="table-toolbar"
      role="toolbar"
      aria-label={label}
      onKeyDown={(event) => {
        if (
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
        )
          return
        const buttons = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not([disabled])"
          )
        ).filter((button) => button.getClientRects().length)
        const index = buttons.indexOf(event.target as HTMLElement)
        if (index < 0) return
        const target =
          event.key === "Home"
            ? buttons[0]
            : event.key === "End"
              ? buttons.at(-1)
              : buttons[
                  (index +
                    (event.key === "ArrowLeft" ? -1 : 1) +
                    buttons.length) %
                    buttons.length
                ]
        event.preventDefault()
        target?.focus()
      }}
    >
      <h2 ref={titleRef}>
        {title}
        {count != null && count > 0 && <> ({count})</>}
      </h2>
      <span className="flex-spacer" />
      {visibleGroups.map(({ group, actions: groupActions }, index) => (
        <Fragment key={group}>
          {index > 0 && (
            <Separator orientation="vertical" className="toolbar-separator" />
          )}
          {groupActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size={action.iconOnly ? "icon" : "default"}
              data-toolbar-action={action.id}
              aria-label={action.ariaLabel ?? action.label}
              title={action.iconOnly ? action.label : undefined}
              disabled={action.disabled}
              onClick={action.onAction}
            >
              {action.icon && (
                <SapIcon
                  name={action.icon}
                  data-icon={action.iconOnly ? undefined : "inline-start"}
                />
              )}
              {!action.iconOnly && action.label}
            </Button>
          ))}
        </Fragment>
      ))}
      {overflowGroups.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" />}
            aria-label={overflowLabel}
            title={overflowLabel}
            data-toolbar-overflow=""
          >
            <SapIcon name="overflow" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflowGroups.map(({ group, actions: groupActions }, index) => (
              <Fragment key={group}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuGroup>
                  {groupActions.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={action.disabled}
                      onClick={action.onAction}
                      aria-label={action.ariaLabel ?? action.label}
                    >
                      {action.icon && <SapIcon name={action.icon} />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
