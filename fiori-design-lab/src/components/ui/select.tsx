import { SapIcon } from "@/components/fiori/sap-icon"
import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { useFioriPortalContainer } from "@/components/fiori/fiori-context"

const SelectActionsContext =
  React.createContext<React.RefObject<SelectPrimitive.Root.Actions | null> | null>(
    null
  )

function Select<Value, Multiple extends boolean | undefined = false>({
  actionsRef,
  highlightItemOnHover = false,
  readOnly,
  disabled,
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  const localActions = React.useRef<SelectPrimitive.Root.Actions | null>(null)
  const actions = actionsRef ?? localActions
  const locked = Boolean(readOnly || disabled)
  const [localState, setLocalState] = React.useState({
    locked,
    open: !locked && defaultOpen,
  })
  // Keep Base UI consistently controlled, including when readOnly changes.
  // Locking discards the uncontrolled popup state so unlocking stays closed.
  if (localState.locked !== locked) {
    setLocalState({ locked, open: locked ? false : localState.open })
  }
  return (
    <SelectActionsContext.Provider value={actions}>
      <SelectPrimitive.Root
        actionsRef={actions}
        highlightItemOnHover={highlightItemOnHover}
        readOnly={readOnly}
        disabled={disabled}
        open={locked ? false : (open ?? localState.open)}
        onOpenChange={(next, details) => {
          if (next && locked) {
            details.cancel()
            return
          }
          setLocalState((previous) => ({ ...previous, open: next }))
          onOpenChange?.(next, details)
        }}
        {...props}
      />
    </SelectActionsContext.Provider>
  )
}

function subscribeMobileSelect(callback: () => void) {
  const media = window.matchMedia("(max-width: 599px)")
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}
const getMobileSelectSnapshot = () =>
  window.matchMedia("(max-width: 599px)").matches
const getMobileSelectServerSnapshot = () => false

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "relative flex w-full items-center justify-between gap-1.5 text-sm whitespace-nowrap outline-none select-none data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        data-slot="select-icon"
        render={
          <SapIcon
            name="slim-arrow-down"
            className="pointer-events-none size-4 text-muted-foreground"
          />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  mobileTitle = "选择项目",
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  > & { mobileTitle?: string }) {
  const actions = React.useContext(SelectActionsContext)
  const container = useFioriPortalContainer()
  const mobile = React.useSyncExternalStore(
    subscribeMobileSelect,
    getMobileSelectSnapshot,
    getMobileSelectServerSnapshot
  )
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={mobile ? false : alignItemWithTrigger}
        data-slot="select-positioner"
        data-mobile={mobile || undefined}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          data-mobile={mobile || undefined}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {mobile && (
            <div data-slot="select-mobile-header">
              <span>{mobileTitle}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`关闭${mobileTitle}`}
                onClick={() => actions?.current?.close()}
              >
                <SapIcon name="decline" />
              </Button>
            </div>
          )}
          {!mobile && <SelectScrollUpButton />}
          <SelectPrimitive.List data-slot="select-list">
            {children}
          </SelectPrimitive.List>
          {!mobile && <SelectScrollDownButton />}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 py-1 text-sm outline-none select-none data-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <SapIcon name="slim-arrow-up" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <SapIcon name="slim-arrow-down" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
