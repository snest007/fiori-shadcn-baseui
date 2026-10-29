import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"
import { SapIcon } from "@/components/fiori/sap-icon"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn("peer group/switch", className)}
      {...props}
    >
      <span data-slot="switch-track" aria-hidden="true">
        <SwitchPrimitive.Thumb data-slot="switch-thumb">
          <SapIcon name="accept" data-slot="switch-icon-on" />
          <SapIcon name="less" data-slot="switch-icon-off" />
        </SwitchPrimitive.Thumb>
      </span>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
