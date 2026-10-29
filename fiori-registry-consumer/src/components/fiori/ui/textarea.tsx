import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-fiori-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-fiori-muted-foreground focus-visible:border-fiori-ring focus-visible:ring-3 focus-visible:ring-fiori-ring/50 disabled:cursor-not-allowed disabled:bg-fiori-input/50 disabled:opacity-50 aria-invalid:border-fiori-destructive aria-invalid:ring-3 aria-invalid:ring-fiori-destructive/20 md:text-sm dark:bg-fiori-input/30 dark:disabled:bg-fiori-input/80 dark:aria-invalid:border-fiori-destructive/50 dark:aria-invalid:ring-fiori-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
