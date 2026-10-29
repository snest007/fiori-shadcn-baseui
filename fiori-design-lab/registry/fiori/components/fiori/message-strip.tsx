"use client"

import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"
import { Alert, AlertAction, AlertTitle } from "@/components/fiori/ui/alert"
import { Button } from "@/components/fiori/ui/button"
import { SapIcon } from "./sap-icon"

export type MessageStripTone =
  "information" | "positive" | "critical" | "negative"

export type MessageStripProps = Omit<
  ComponentProps<typeof Alert>,
  "children" | "variant"
> & {
  tone?: MessageStripTone
  children: ReactNode
  showIcon?: boolean
  link?: Omit<ComponentProps<"a">, "children"> & { children: ReactNode }
  /** The consumer controls visibility; dismissing never deletes message data. */
  onDismiss?: () => void
  dismissLabel?: string
}

const icons: Record<MessageStripTone, string> = {
  information: "information",
  positive: "sys-enter-2",
  critical: "alert",
  negative: "error",
}

export function MessageStrip({
  tone = "information",
  children,
  showIcon = true,
  link,
  onDismiss,
  dismissLabel = "关闭消息",
  role = "note",
  className,
  ...props
}: MessageStripProps) {
  return (
    <Alert
      {...props}
      className={cn("fiori-message-strip", className)}
      data-tone={tone}
      role={role}
      aria-roledescription={props["aria-roledescription"] || "消息条"}
    >
      {showIcon && <SapIcon name={icons[tone]} />}
      <AlertTitle>
        {children}
        {link && <> {<a {...link} />}</>}
      </AlertTitle>
      {onDismiss && (
        <AlertAction>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={dismissLabel}
            title={dismissLabel}
            onClick={onDismiss}
          >
            <SapIcon name="decline" />
          </Button>
        </AlertAction>
      )}
    </Alert>
  )
}
