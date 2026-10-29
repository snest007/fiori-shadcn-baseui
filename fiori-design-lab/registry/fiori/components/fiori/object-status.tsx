import type { ReactNode } from "react"
import { cn } from "cn"
import { SapIcon } from "./sap-icon"

export type StatusTone =
  "positive" | "critical" | "negative" | "information" | "neutral"
const icons: Record<StatusTone, string> = {
  positive: "status-positive",
  critical: "status-critical",
  negative: "status-negative",
  information: "information",
  neutral: "history",
}
export function ObjectStatus({
  tone = "neutral",
  children,
  icon = false,
  className,
}: {
  tone?: StatusTone
  children: ReactNode
  icon?: boolean
  className?: string
}) {
  return (
    <span className={cn("object-status", className)} data-tone={tone}>
      {icon && <SapIcon name={icons[tone]} />}
      {children}
    </span>
  )
}
