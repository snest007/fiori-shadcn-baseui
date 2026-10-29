"use client"

import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { DynamicPage, type DynamicPageProps } from "./dynamic-page"

export type ListReportProps = DynamicPageProps & {
  contentLabel: string
  toolbar?: ReactNode
  /** Override floorplan focus for manual Go or an empty mandatory field. */
  initialFocusRef?: RefObject<HTMLElement | null>
}

/** A single-table List Report composition; data and business actions stay in the app. */
export function ListReport({
  contentLabel,
  toolbar,
  initialFocusRef,
  children,
  ref,
  ...props
}: ListReportProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root || root.closest("[hidden]")) return
    const frame = requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ??
        (props.expanded && root.clientWidth >= 600
          ? root.querySelector<HTMLElement>(
              ".filter-bar input:not([disabled]),.filter-bar button:not([disabled]),.filter-bar [tabindex='0']"
            )
          : root.querySelector<HTMLElement>(
              ".orders-table tbody [data-grid-row]"
            ))
      target?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
    // Initial focus is a mount-time floorplan decision, not a response to every query/header change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <DynamicPage
      {...props}
      ref={(node) => {
        rootRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      }}
    >
      <section className="list-content" aria-label={contentLabel}>
        <div className="order-worklist">
          {toolbar}
          {children}
        </div>
      </section>
    </DynamicPage>
  )
}
