import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-fiori-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fiori-foreground placeholder:text-fiori-muted-foreground focus-visible:border-fiori-ring focus-visible:ring-3 focus-visible:ring-fiori-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-fiori-input/50 disabled:opacity-50 aria-invalid:border-fiori-destructive aria-invalid:ring-3 aria-invalid:ring-fiori-destructive/20 md:text-sm dark:bg-fiori-input/30 dark:disabled:bg-fiori-input/80 dark:aria-invalid:border-fiori-destructive/50 dark:aria-invalid:ring-fiori-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
