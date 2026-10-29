import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-fiori-ring focus-visible:ring-[3px] focus-visible:ring-fiori-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-fiori-destructive aria-invalid:ring-fiori-destructive/20 dark:aria-invalid:ring-fiori-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-fiori-primary text-fiori-primary-foreground [a]:hover:bg-fiori-primary/80",
        secondary:
          "bg-fiori-secondary text-fiori-secondary-foreground [a]:hover:bg-fiori-secondary/80",
        destructive:
          "bg-fiori-destructive/10 text-fiori-destructive focus-visible:ring-fiori-destructive/20 dark:bg-fiori-destructive/20 dark:focus-visible:ring-fiori-destructive/40 [a]:hover:bg-fiori-destructive/20",
        outline:
          "border-fiori-border text-fiori-foreground [a]:hover:bg-fiori-muted [a]:hover:text-fiori-muted-foreground",
        ghost:
          "hover:bg-fiori-muted hover:text-fiori-muted-foreground dark:hover:bg-fiori-muted/50",
        link: "text-fiori-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
