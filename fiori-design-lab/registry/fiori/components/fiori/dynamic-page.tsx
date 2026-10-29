"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react"
import { Button } from "@/components/fiori/ui/button"
import { cn } from "@/lib/fiori/utils"
import { SapIcon } from "./sap-icon"
import "./list-report.css"

export type DynamicPageState = {
  expanded: boolean
  pinned: boolean
  phone: boolean
}

export type DynamicPageProps = Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode
  header?: ReactNode
  summary?: ReactNode
  titleActions?: ReactNode | ((state: DynamicPageState) => ReactNode)
  expanded: boolean
  pinned: boolean
  onExpandedChange: (expanded: boolean) => void
  onPinnedChange: (pinned: boolean) => void
  onWidthChange?: (width: number) => void
  scrollContainerRef?: RefObject<HTMLElement | null>
  labels?: { expand?: string; collapse?: string; pin?: string; unpin?: string }
}

/** Resolve page scrolling; responsive tables do not add a second scrollbar. */
export function findPageScrollContainer(
  node: HTMLElement,
  explicit?: RefObject<HTMLElement | null>
) {
  return (
    explicit?.current ??
    node.closest<HTMLElement>("[data-fiori-scroll], .page-scroll")
  )
}

export function DynamicPage({
  title,
  header,
  summary,
  titleActions,
  expanded,
  pinned,
  onExpandedChange,
  onPinnedChange,
  onWidthChange,
  scrollContainerRef,
  labels,
  children,
  className,
  style,
  ref,
  ...props
}: DynamicPageProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const headerContentRef = useRef<HTMLDivElement>(null)
  const pendingScrollRef = useRef<number | null>(null)
  const suppressedScrollPositionRef = useRef<number | null>(null)
  const [geometry, setGeometry] = useState({
    width: 1024,
    headerHeight: 96,
    headerContentHeight: 0,
    rootRem: 16,
    viewportHeight: 720,
    canScroll: true,
  })
  const phone = geometry.width < 600
  // SAPUI5 1.151 DynamicPage: ceil(DynamicPageHeader height) - 1rem.
  // Keep this content measurement when collapsed; the title is not part of it.
  const snapThreshold = Math.max(
    Math.ceil(geometry.headerContentHeight) - geometry.rootRem,
    0
  )
  const shownExpanded = expanded && !phone && header != null
  const pinAvailable =
    shownExpanded &&
    geometry.canScroll &&
    geometry.headerHeight < geometry.viewportHeight * 0.6
  const effectivePinned = pinned && pinAvailable
  const state = { expanded: shownExpanded, pinned: effectivePinned, phone }
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  useEffect(() => {
    const root = rootRef.current,
      heading = headerRef.current
    if (!root || !heading) return
    const measure = () => {
      if (root.closest("[hidden]")) return
      const scroll = findPageScrollContainer(root, scrollContainerRef)
      const width = root.clientWidth
      const contentHeight =
        headerContentRef.current?.getBoundingClientRect().height ?? 0
      const rootRem =
        parseFloat(
          getComputedStyle(root.ownerDocument.documentElement).fontSize
        ) || 16
      setGeometry((previous) => ({
        width,
        headerHeight: heading.getBoundingClientRect().height,
        headerContentHeight:
          contentHeight > 0 ? contentHeight : previous.headerContentHeight,
        rootRem,
        viewportHeight: scroll?.clientHeight ?? window.innerHeight,
        canScroll: scroll
          ? scroll.scrollHeight > scroll.clientHeight + 1
          : document.documentElement.scrollHeight > window.innerHeight + 1,
      }))
      onWidthChange?.(
        root.querySelector<HTMLElement>(".order-worklist")?.clientWidth ?? width
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(heading)
    if (headerContentRef.current) observer.observe(headerContentRef.current)
    const scroll = findPageScrollContainer(root, scrollContainerRef)
    if (scroll) observer.observe(scroll)
    measure()
    return () => observer.disconnect()
  }, [onWidthChange, scrollContainerRef])

  useLayoutEffect(() => {
    const requestedPosition = pendingScrollRef.current,
      root = rootRef.current
    if (requestedPosition == null || !root) return
    const scroll = findPageScrollContainer(root, scrollContainerRef)
    const before = scroll?.scrollTop ?? window.scrollY
    if (scroll) scroll.scrollTop = requestedPosition
    else window.scrollTo({ top: requestedPosition, behavior: "instant" })
    const after = scroll?.scrollTop ?? window.scrollY
    // Ignore only a scroll at the compensated position, never a later user scroll.
    suppressedScrollPositionRef.current = after !== before ? after : null
    pendingScrollRef.current = null
  }, [expanded, scrollContainerRef])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const scroll = findPageScrollContainer(root, scrollContainerRef)
    const target = scroll ?? window
    const onScroll = () => {
      const y = scroll?.scrollTop ?? window.scrollY
      const suppressedPosition = suppressedScrollPositionRef.current
      suppressedScrollPositionRef.current = null
      if (
        effectivePinned ||
        phone ||
        header == null ||
        root.closest("[hidden]") ||
        pendingScrollRef.current != null ||
        (suppressedPosition != null && y === suppressedPosition)
      )
        return
      if (y >= snapThreshold && expanded) {
        onExpandedChange(false)
      } else if (
        (y === 0 || y < snapThreshold) &&
        !expanded &&
        geometry.canScroll
      ) {
        onExpandedChange(true)
      }
    }
    target.addEventListener("scroll", onScroll, { passive: true })
    return () => target.removeEventListener("scroll", onScroll)
  }, [
    expanded,
    effectivePinned,
    phone,
    header,
    snapThreshold,
    geometry.canScroll,
    onExpandedChange,
    scrollContainerRef,
  ])

  useEffect(() => {
    if (pinned && !pinAvailable) onPinnedChange(false)
  }, [pinned, pinAvailable, onPinnedChange])

  const toggleHeader = () => {
    if (phone || header == null) return
    const root = rootRef.current
    if (root && geometry.canScroll) {
      const scroll = findPageScrollContainer(root, scrollContainerRef)
      const y = scroll?.scrollTop ?? window.scrollY
      // UI5's unpinned top collapse moves to ceil(H); collapsing a pinned header
      // releases it at T. Preserve the position for other manual toggles because
      // this layout keeps its sticky header in normal flow rather than moving it.
      pendingScrollRef.current = shownExpanded
        ? effectivePinned
          ? snapThreshold
          : Math.max(y, Math.ceil(geometry.headerContentHeight))
        : y
    }
    onExpandedChange(!shownExpanded)
    if (shownExpanded) onPinnedChange(false)
  }
  const expandLabel = shownExpanded
    ? (labels?.collapse ?? "收起筛选栏")
    : (labels?.expand ?? "展开筛选栏")
  const pinLabel = pinned
    ? (labels?.unpin ?? "取消固定页头")
    : (labels?.pin ?? "固定页头")

  return (
    <div
      {...props}
      ref={setRoot}
      className={cn("list-report", className)}
      data-header-expanded={shownExpanded}
      data-header-pinned={effectivePinned}
      data-header-snap-threshold={snapThreshold}
      style={
        {
          "--list-header-height": `${geometry.headerHeight}px`,
          ...style,
        } as CSSProperties
      }
    >
      <header className="list-page-header" ref={headerRef}>
        <div
          className="page-title-area"
          data-can-snap={!phone && header != null}
          onClick={(event) => {
            if (
              !(event.target as HTMLElement).closest(
                "button,a,input,select,[role=button]"
              )
            )
              toggleHeader()
          }}
        >
          <div className="page-title-row">
            <h1>{title}</h1>
            {typeof titleActions === "function"
              ? titleActions(state)
              : titleActions}
          </div>
          {!shownExpanded && summary != null && (
            <p className="collapsed-summary">{summary}</p>
          )}
        </div>
        <div ref={headerContentRef} hidden={!shownExpanded}>
          {header}
        </div>
        {!phone && header != null && (
          <div className="header-features">
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={expandLabel}
              aria-expanded={shownExpanded}
              title={expandLabel}
              onClick={toggleHeader}
            >
              <SapIcon
                name={shownExpanded ? "slim-arrow-up" : "slim-arrow-down"}
              />
            </Button>
            {pinAvailable && (
              <Button
                variant="outline"
                size="icon-xs"
                aria-label={pinLabel}
                aria-pressed={pinned}
                title={pinLabel}
                onClick={() => onPinnedChange(!pinned)}
              >
                <SapIcon name={pinned ? "pushpin-on" : "pushpin-off"} />
              </Button>
            )}
          </div>
        )}
      </header>
      {children}
    </div>
  )
}
