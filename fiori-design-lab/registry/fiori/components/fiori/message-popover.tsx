"use client"

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
} from "react"
import { cn } from "cn"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { Button } from "@/components/fiori/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/fiori/ui/popover"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/fiori/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/fiori/ui/toggle-group"
import { SapIcon } from "@/components/fiori/sap-icon"
import "./message-popover.css"

export type MessageType = "error" | "warning" | "success" | "information"
export type FioriMessage = {
  id: string
  type: MessageType
  title: string
  subtitle?: string
  description?: string
  /** DOM id used for a title link; ids must be unique in the document. */
  target?: string
  /** Prefer a direct reference when consumers render more than one form. */
  targetRef?: RefObject<HTMLElement | null>
  /** Enable title activation for a consumer callback without a local field. */
  activeTitle?: boolean
}

const types: MessageType[] = ["error", "warning", "success", "information"]
const typeLabels: Record<MessageType, string> = {
  error: "错误",
  warning: "警告",
  success: "成功",
  information: "信息",
}
const icons: Record<MessageType, string> = {
  error: "status-negative",
  warning: "status-critical",
  success: "status-positive",
  information: "information",
}

export type MessageSummary = {
  severity: MessageType
  count: number
  total: number
}

export function getMessageSummary(
  messages: readonly FioriMessage[]
): MessageSummary {
  const severity =
    types.find((type) => messages.some((message) => message.type === type)) ||
    "information"
  return {
    severity,
    count: messages.filter((message) => message.type === severity).length,
    total: messages.length,
  }
}

export type MessagePopoverLabels = {
  title: string
  detailTitle: string
  close: string
  back: string
  all: string
  allLabel: string
  filterLabel: string
  listLabel: string
  empty: string
  showMessages: string
  shortcut: string
  types: Record<MessageType, string>
  detailButton: (message: FioriMessage) => string
  trigger: (summary: MessageSummary) => string
}

const defaultLabels: MessagePopoverLabels = {
  title: "消息",
  detailTitle: "消息详情",
  close: "关闭消息",
  back: "返回消息列表",
  all: "全部",
  allLabel: "全部消息",
  filterLabel: "消息类型",
  listLabel: "消息列表",
  empty: "没有消息",
  showMessages: "显示消息",
  shortcut: "按 Alt+Enter 定位消息对应的字段。",
  types: typeLabels,
  detailButton: (message) => `查看详情：${message.title}`,
  trigger: ({ severity, count, total }) =>
    `消息：${count}个${typeLabels[severity]}，共${total}条消息`,
}

export type MessagePopoverProps = {
  messages: readonly FioriMessage[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Resolve a consumer field first; targetRef and target DOM id are fallbacks. */
  resolveTarget?: (message: FioriMessage) => HTMLElement | null
  /** Notified when an active title is used. The component owns close/focus. */
  onActiveTitle?: (message: FioriMessage, target: HTMLElement | null) => void
  disabled?: boolean
  className?: string
  triggerProps?: Pick<
    ComponentProps<typeof Button>,
    | "id"
    | "className"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "title"
  >
  labels?: Partial<Omit<MessagePopoverLabels, "types">> & {
    types?: Partial<Record<MessageType, string>>
  }
}

function hasActiveTitle(message: FioriMessage) {
  return !!(message.target || message.targetRef || message.activeTitle)
}

function subscribePhone(callback: () => void) {
  const query = window.matchMedia("(max-width: 599px)")
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}
function isPhone() {
  return window.matchMedia("(max-width: 599px)").matches
}

function MessageSurface({
  messages,
  phone,
  onClose,
  onActiveTitle,
  labels,
}: {
  messages: readonly FioriMessage[]
  phone: boolean
  onClose: () => void
  onActiveTitle: (message: FioriMessage) => void
  labels: MessagePopoverLabels
}) {
  const titleShortcutId = useId()
  const [filter, setFilter] = useState<MessageType | "all">("all")
  const [detailId, setDetailId] = useState<string | null>(() =>
    messages.length === 1 && messages[0].description ? messages[0].id : null
  )
  const [activeId, setActiveId] = useState<string | null>(
    messages[0]?.id || null
  )
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const listRef = useRef<HTMLUListElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const previousDetailId = useRef<string | null | undefined>(undefined)
  const detail = messages.find((message) => message.id === detailId)
  const counts = Object.fromEntries(
    types.map((type) => [
      type,
      messages.filter((message) => message.type === type).length,
    ])
  ) as Record<MessageType, number>
  const showFilters = types.filter((type) => counts[type] > 0).length > 1
  const currentFilter =
    showFilters && (filter === "all" || counts[filter]) ? filter : "all"
  const visibleMessages =
    currentFilter === "all"
      ? messages
      : messages.filter((message) => message.type === currentFilter)
  const currentActiveId = visibleMessages.some(
    (message) => message.id === activeId
  )
    ? activeId
    : visibleMessages[0]?.id
  const visibleDetailId = detail?.id || null

  useLayoutEffect(() => {
    if (previousDetailId.current === visibleDetailId) return
    previousDetailId.current = visibleDetailId
    if (visibleDetailId) backRef.current?.focus({ preventScroll: true })
    else
      (rowRefs.current.get(currentActiveId || "") || listRef.current)?.focus({
        preventScroll: true,
      })
  }, [visibleDetailId, currentActiveId])

  function selectFilter(next: string[]) {
    if (!next.length) return
    const type = next[0] as MessageType | "all"
    setFilter(type)
    const first =
      type === "all"
        ? messages[0]
        : messages.find((message) => message.type === type)
    setActiveId(first?.id || null)
  }

  function rowKeyDown(
    event: KeyboardEvent<HTMLLIElement>,
    message: FioriMessage
  ) {
    if (event.altKey && event.key === "Enter") {
      if (hasActiveTitle(message)) {
        event.preventDefault()
        onActiveTitle(message)
      }
      return
    }
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault()
      const index = visibleMessages.findIndex(
        (entry) => entry.id === message.id
      )
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? visibleMessages.length - 1
            : Math.min(
                visibleMessages.length - 1,
                Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1))
              )
      const id = visibleMessages[next]?.id
      if (id) {
        setActiveId(id)
        rowRefs.current.get(id)?.focus()
      }
    } else if (
      event.target === event.currentTarget &&
      (event.key === "Enter" || event.key === " ") &&
      message.description
    ) {
      event.preventDefault()
      setDetailId(message.id)
    }
  }

  const close = phone ? (
    <DialogClose
      render={
        <Button
          variant="ghost"
          size="icon"
          aria-label={labels.close}
          title={labels.close}
        />
      }
    >
      <SapIcon name="decline" />
    </DialogClose>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      aria-label={labels.close}
      title={labels.close}
      onClick={onClose}
    >
      <SapIcon name="decline" />
    </Button>
  )
  const filters = showFilters && !detail && (
    <ToggleGroup
      className="message-type-filters"
      aria-label={labels.filterLabel}
      value={[currentFilter]}
      onValueChange={selectFilter}
    >
      <ToggleGroupItem value="all" aria-label={labels.allLabel}>
        {labels.all}
      </ToggleGroupItem>
      {types
        .filter((type) => counts[type] > 0)
        .map((type) => (
          <ToggleGroupItem
            key={type}
            value={type}
            data-message-type={type}
            aria-label={`${labels.types[type]} (${counts[type]})`}
            title={labels.types[type]}
          >
            <SapIcon name={icons[type]} data-icon="inline-start" />
            {counts[type]}
          </ToggleGroupItem>
        ))}
    </ToggleGroup>
  )

  return (
    <div
      className="message-view"
      onKeyDown={(event) => {
        if (
          event.altKey &&
          event.key === "Enter" &&
          detail &&
          hasActiveTitle(detail)
        ) {
          event.preventDefault()
          onActiveTitle(detail)
        }
        if (event.shiftKey && event.key === "Enter" && detail) {
          event.preventDefault()
          setDetailId(null)
        }
      }}
    >
      <div className="message-view-header">
        {detail && (
          <Button
            ref={backRef}
            variant="ghost"
            size="icon"
            aria-label={labels.back}
            title={labels.back}
            onClick={() => setDetailId(null)}
          >
            <SapIcon name="nav-back" />
          </Button>
        )}
        {phone ? (
          <DialogTitle>
            {detail ? labels.detailTitle : labels.title}
          </DialogTitle>
        ) : (
          <span className="message-view-heading">
            {detail ? labels.detailTitle : labels.title}
          </span>
        )}
        <span className="message-view-spacer" />
        {close}
      </div>
      {filters && <div className="message-view-filterbar">{filters}</div>}
      <p id={titleShortcutId} className="sr-only">
        {labels.shortcut}
      </p>
      {detail ? (
        <div className="message-view-details" data-message-type={detail.type}>
          <SapIcon name={icons[detail.type]} className="message-detail-icon" />
          {hasActiveTitle(detail) ? (
            <a
              href={detail.target ? `#${detail.target}` : "#"}
              className="message-detail-title"
              aria-keyshortcuts="Alt+Enter"
              aria-describedby={titleShortcutId}
              onClick={(event) => {
                event.preventDefault()
                onActiveTitle(detail)
              }}
            >
              {detail.title}
            </a>
          ) : (
            <p className="message-detail-title">{detail.title}</p>
          )}
          {detail.subtitle && (
            <p className="message-detail-subtitle">{detail.subtitle}</p>
          )}
          <p className="message-detail-description">{detail.description}</p>
        </div>
      ) : (
        <ul
          className="message-view-list"
          aria-label={labels.listLabel}
          tabIndex={-1}
          ref={listRef}
        >
          {visibleMessages.map((message) => (
            <li
              key={message.id}
              ref={(element) => {
                if (element) rowRefs.current.set(message.id, element)
                else rowRefs.current.delete(message.id)
              }}
              tabIndex={message.id === currentActiveId ? 0 : -1}
              className="message-view-item"
              data-message-type={message.type}
              aria-label={`${labels.types[message.type]}：${message.title}`}
              aria-keyshortcuts={
                hasActiveTitle(message) ? "Alt+Enter" : undefined
              }
              aria-describedby={
                hasActiveTitle(message) ? titleShortcutId : undefined
              }
              onFocus={() => setActiveId(message.id)}
              onKeyDown={(event) => rowKeyDown(event, message)}
              onClick={(event) => {
                if (
                  !(event.target as HTMLElement).closest("a,button") &&
                  message.description
                )
                  setDetailId(message.id)
              }}
            >
              <SapIcon
                name={icons[message.type]}
                className="message-item-icon"
              />
              <div className="message-item-content">
                {hasActiveTitle(message) ? (
                  <a
                    href={message.target ? `#${message.target}` : "#"}
                    tabIndex={message.id === currentActiveId ? 0 : -1}
                    aria-keyshortcuts="Alt+Enter"
                    aria-describedby={titleShortcutId}
                    onClick={(event) => {
                      event.preventDefault()
                      onActiveTitle(message)
                    }}
                  >
                    {message.title}
                  </a>
                ) : (
                  <span>{message.title}</span>
                )}
                {message.subtitle && <small>{message.subtitle}</small>}
              </div>
              {message.description && (
                <Button
                  variant="ghost"
                  size="icon"
                  tabIndex={message.id === currentActiveId ? 0 : -1}
                  aria-label={labels.detailButton(message)}
                  title={labels.detailTitle}
                  onClick={() => {
                    setActiveId(message.id)
                    setDetailId(message.id)
                  }}
                >
                  <SapIcon name="navigation-right-arrow" />
                </Button>
              )}
            </li>
          ))}
          {!visibleMessages.length && (
            <li className="message-view-empty">{labels.empty}</li>
          )}
        </ul>
      )}
    </div>
  )
}

export function MessagePopover({
  messages,
  open,
  onOpenChange,
  resolveTarget,
  onActiveTitle,
  disabled = false,
  className,
  triggerProps,
  labels: labelOverrides,
}: MessagePopoverProps) {
  const labels = {
    ...defaultLabels,
    ...labelOverrides,
    types: { ...typeLabels, ...labelOverrides?.types },
  }
  const phone = useSyncExternalStore(subscribePhone, isPhone, () => false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const summary = getMessageSummary(messages)
  const { severity, count } = summary
  function changeOpen(next: boolean) {
    if (next) targetRef.current = null
    onOpenChange(next)
  }
  function activeTitle(message: FioriMessage) {
    const target =
      resolveTarget?.(message) ||
      message.targetRef?.current ||
      (message.target ? document.getElementById(message.target) : null)
    if (!target && !onActiveTitle) return
    targetRef.current = target
    onOpenChange(false)
    onActiveTitle?.(message, target)
  }
  function afterClose(next: boolean) {
    if (!next && targetRef.current) {
      targetRef.current.scrollIntoView({ block: "center", behavior: "auto" })
      targetRef.current.focus({ preventScroll: true })
    }
  }
  const finalFocus = () => targetRef.current || triggerRef.current
  const trigger = (
    <Button
      ref={triggerRef}
      variant="outline"
      disabled={disabled || !messages.length}
      {...triggerProps}
      className={cn("message-indicator", triggerProps?.className)}
      data-message-type={severity}
      aria-label={triggerProps?.["aria-label"] || labels.trigger(summary)}
      title={triggerProps?.title || labels.showMessages}
    >
      <SapIcon name={icons[severity]} data-icon="inline-start" />
      {count}
    </Button>
  )
  const view = (
    <MessageSurface
      messages={messages}
      phone={phone}
      onClose={() => changeOpen(false)}
      onActiveTitle={activeTitle}
      labels={labels}
    />
  )

  return phone ? (
    <Dialog
      open={open}
      onOpenChange={changeOpen}
      onOpenChangeComplete={afterClose}
    >
      <DialogTrigger render={trigger} />
      <DialogContent
        className={cn("message-popover-dialog", className)}
        showCloseButton={false}
        initialFocus={false}
        finalFocus={finalFocus}
      >
        {view}
      </DialogContent>
    </Dialog>
  ) : (
    <Popover
      open={open}
      onOpenChange={changeOpen}
      onOpenChangeComplete={afterClose}
    >
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className={cn("message-popover-popup", className)}
        align="start"
        side="top"
        sideOffset={8}
        initialFocus={false}
        finalFocus={finalFocus}
      >
        <PopoverPrimitive.Arrow className="message-popover-arrow" />
        <PopoverTitle className="sr-only">{labels.title}</PopoverTitle>
        {view}
      </PopoverContent>
    </Popover>
  )
}
