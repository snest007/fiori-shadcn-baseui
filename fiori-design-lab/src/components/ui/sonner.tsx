import { Toaster as Sonner, type ToasterProps } from "sonner"
import type { CSSProperties } from "react"
import { SapIcon } from "@/components/fiori/sap-icon"

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    icons={{
      success: <SapIcon name="status-positive" />,
      info: <SapIcon name="information" />,
      warning: <SapIcon name="status-critical" />,
      error: <SapIcon name="status-negative" />,
      loading: <SapIcon name="refresh" className="animate-spin" />,
    }}
    style={
      {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      } as CSSProperties
    }
    toastOptions={{
      classNames: { toast: "cn-toast" },
      closeButtonAriaLabel: "关闭消息",
    }}
    containerAriaLabel="通知"
    {...props}
  />
)
export { Toaster }
