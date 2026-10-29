import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SapIcon } from "@/components/fiori/sap-icon"
import { SampleProductsTable } from "@/components/fiori/sample-products-table"
import {
  purchaseOrderStatusTone,
  type PurchaseOrderSample,
} from "@/lib/purchase-order-sample"
import { cn } from "@/lib/utils"
import "./detail.css"

const anchors = [
  { id: "general", label: "General Information" },
  { id: "contact", label: "Contact Information" },
]
type HeaderMode = "expanded" | "collapsed" | null
type Metrics = {
  title: number
  content: number
  nav: number
  tail: number
  pinnable: boolean
}

function RobotAvatar({
  model,
  small = false,
}: {
  model: string
  small?: boolean
}) {
  return (
    <Avatar
      className={cn(
        "object-robot-avatar",
        small && "object-robot-avatar-small"
      )}
    >
      <AvatarImage src="/images/robot.png" alt={model} />
      <AvatarFallback>
        <SapIcon name="product" />
      </AvatarFallback>
    </Avatar>
  )
}

function SampleField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Field>
      <FieldLabel>{label}:</FieldLabel>
      <div className="object-field-value">{children}</div>
    </Field>
  )
}

function SampleLink({ children }: { children: ReactNode }) {
  // The reference XML's links have neither href nor a press handler.
  return (
    <a className="object-sample-link" role="link" tabIndex={0}>
      {children}
    </a>
  )
}

export function OrderDetail({ order: sample }: { order: PurchaseOrderSample }) {
  const statusTone = purchaseOrderStatusTone[sample.status]
  const [scrollTop, setScrollTop] = useState(0)
  const [manual, setManual] = useState<HeaderMode>(null)
  const [pinned, setPinned] = useState(false)
  const [activeAnchor, setActiveAnchor] = useState("general")
  const [activeNavigation, setActiveNavigation] = useState("general")
  const [phone, setPhone] = useState(
    () => matchMedia("(max-width: 599px)").matches
  )
  const [metrics, setMetrics] = useState<Metrics>({
    title: 80,
    content: 116,
    nav: 44,
    tail: 0,
    pinnable: true,
  })
  const pageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const contactRef = useRef<HTMLElement>(null)
  const modeScrollRef = useRef(0)
  const previousScrollRef = useRef(0)
  const userScrollIntentRef = useRef<{ top: number; time: number } | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const scrollbarDragRef = useRef(false)
  const anchorCleanupRef = useRef<(() => void) | null>(null)
  const docked = pinned || manual === "expanded"
  const collapsed =
    manual === "collapsed" || (!docked && scrollTop >= metrics.content)
  const stickyHeight =
    metrics.title + (docked && !collapsed ? metrics.content : 0)

  useEffect(() => {
    const media = matchMedia("(max-width: 599px)")
    const update = () => setPhone(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const page = pageRef.current
    const scroller = page?.closest<HTMLElement>(".page-scroll")
    if (!page || !scroller) return
    const measure = () => {
      const title = titleRef.current?.offsetHeight ?? 80
      const content = contentRef.current?.offsetHeight || metrics.content
      const nav = navRef.current?.offsetHeight ?? 44
      const contact = contactRef.current?.offsetHeight ?? 0
      const fixed = title + (docked ? content : 0) + nav
      const tail = Math.max(0, scroller.clientHeight - fixed - contact)
      // Pinning is unavailable on phones or when the expanded header consumes
      // more than 60% of the available page height (Object Page guideline).
      const pinnable = !phone && title + content <= scroller.clientHeight * 0.6
      setMetrics((current) => {
        if (
          current.title === title &&
          current.content === content &&
          current.nav === nav &&
          current.tail === tail &&
          current.pinnable === pinnable
        )
          return current
        return { title, content, nav, tail, pinnable }
      })
      if (!pinnable && pinned) {
        setPinned(false)
        setManual(null)
      }
      if (title + content >= scroller.clientHeight && manual === "expanded")
        setManual(null)
    }
    const observer = new ResizeObserver(measure)
    for (const element of [
      scroller,
      titleRef.current,
      contentRef.current,
      navRef.current,
      contactRef.current,
    ]) {
      if (element) observer.observe(element)
    }
    measure()
    return () => observer.disconnect()
  }, [docked, phone, pinned, metrics.content, manual])

  useLayoutEffect(() => {
    if (manual !== "expanded" || pinned) return
    const scroller = pageRef.current?.closest<HTMLElement>(".page-scroll")
    if (!scroller) return
    // Expanding changes header geometry and tail padding. Reading after the
    // commit includes any scrollTop clamp caused by the new scroll height.
    modeScrollRef.current = scroller.scrollTop
    previousScrollRef.current = modeScrollRef.current
  }, [
    manual,
    pinned,
    phone,
    metrics.title,
    metrics.content,
    metrics.nav,
    metrics.tail,
  ])

  useEffect(() => {
    const scroller = pageRef.current?.closest<HTMLElement>(".page-scroll")
    if (!scroller) return
    const markUserScroll = () => {
      if (manual === "expanded" && !pinned)
        userScrollIntentRef.current = {
          top: scroller.scrollTop,
          time: performance.now(),
        }
    }
    const wheel = (event: WheelEvent) => {
      if (event.deltaY !== 0) markUserScroll()
    }
    const touchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null
    }
    const touchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY
      if (
        y !== undefined &&
        touchStartYRef.current !== null &&
        Math.abs(y - touchStartYRef.current) > 1
      )
        markUserScroll()
    }
    const keyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        ![
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        return
      const target = event.target as HTMLElement
      if (
        target.closest(
          "input,textarea,select,[contenteditable=true],[role=combobox],[role=listbox],[role=menu],[role=menubar]"
        ) ||
        (event.key === " " &&
          target.closest("button,[role=button],[role=checkbox],[role=radio]"))
      )
        return
      markUserScroll()
    }
    const pointerDown = (event: PointerEvent) => {
      const rect = scroller.getBoundingClientRect()
      const gutter = Math.max(16, scroller.offsetWidth - scroller.clientWidth)
      scrollbarDragRef.current =
        event.target === scroller && event.clientX >= rect.right - gutter
      if (scrollbarDragRef.current) markUserScroll()
    }
    const pointerMove = () => {
      if (scrollbarDragRef.current) markUserScroll()
    }
    const pointerUp = () => {
      scrollbarDragRef.current = false
    }
    const scrollEnd = () => {
      userScrollIntentRef.current = null
    }
    const update = (event?: Event) => {
      const top = scroller.scrollTop
      setScrollTop(top)
      if (manual === "collapsed" && top <= 1 && previousScrollRef.current > 1)
        setManual(null)
      previousScrollRef.current = top
      const intent = userScrollIntentRef.current
      if (
        manual === "expanded" &&
        !pinned &&
        event &&
        intent &&
        performance.now() - intent.time < 1500 &&
        Math.abs(top - intent.top) > 1
      ) {
        userScrollIntentRef.current = null
        setManual(null)
      } else if (manual === "expanded") {
        // Native layout clamping/anchoring can emit a trusted scroll event too.
        // Only an actual scroll input ends a manually expanded header.
        modeScrollRef.current = top
      }
      const line =
        (navRef.current?.getBoundingClientRect().bottom ??
          scroller.getBoundingClientRect().top + stickyHeight + metrics.nav) +
        18
      const contact =
        contactRef.current?.getBoundingClientRect().top ?? Infinity
      const products =
        document.getElementById("object-products")?.getBoundingClientRect()
          .top ?? Infinity
      const details =
        document.getElementById("object-order-details")?.getBoundingClientRect()
          .top ?? Infinity
      setActiveAnchor(contact <= line ? "contact" : "general")
      setActiveNavigation(
        contact <= line
          ? "contact"
          : products <= line
            ? "products"
            : details <= line
              ? "order-details"
              : "general"
      )
    }
    scroller.addEventListener("scroll", update, { passive: true })
    scroller.addEventListener("wheel", wheel, { passive: true })
    scroller.addEventListener("touchstart", touchStart, { passive: true })
    scroller.addEventListener("touchmove", touchMove, { passive: true })
    scroller.addEventListener("keydown", keyDown)
    scroller.addEventListener("pointerdown", pointerDown, { passive: true })
    scroller.addEventListener("scrollend", scrollEnd, { passive: true })
    document.addEventListener("pointermove", pointerMove, { passive: true })
    document.addEventListener("pointerup", pointerUp, { passive: true })
    update()
    return () => {
      scroller.removeEventListener("scroll", update)
      scroller.removeEventListener("wheel", wheel)
      scroller.removeEventListener("touchstart", touchStart)
      scroller.removeEventListener("touchmove", touchMove)
      scroller.removeEventListener("keydown", keyDown)
      scroller.removeEventListener("pointerdown", pointerDown)
      scroller.removeEventListener("scrollend", scrollEnd)
      document.removeEventListener("pointermove", pointerMove)
      document.removeEventListener("pointerup", pointerUp)
    }
  }, [manual, pinned, stickyHeight, metrics.nav])

  useEffect(() => () => anchorCleanupRef.current?.(), [])

  function toggleHeader() {
    const scroller = pageRef.current?.closest<HTMLElement>(".page-scroll")
    modeScrollRef.current = scroller?.scrollTop ?? 0
    previousScrollRef.current = modeScrollRef.current
    userScrollIntentRef.current = null
    anchorCleanupRef.current?.()
    anchorCleanupRef.current = null
    scroller?.scrollTo({ top: modeScrollRef.current, behavior: "instant" })
    if (collapsed) {
      if (
        scroller &&
        metrics.title + metrics.content >= scroller.clientHeight
      ) {
        setManual(null)
        scroller.scrollTo({ top: 0, behavior: "instant" })
      } else setManual("expanded")
    } else {
      setManual("collapsed")
      setPinned(false)
    }
  }

  function togglePin() {
    const scroller = pageRef.current?.closest<HTMLElement>(".page-scroll")
    modeScrollRef.current = scroller?.scrollTop ?? 0
    userScrollIntentRef.current = null
    anchorCleanupRef.current?.()
    anchorCleanupRef.current = null
    scroller?.scrollTo({ top: modeScrollRef.current, behavior: "instant" })
    setManual("expanded")
    setPinned((current) => !current)
  }

  function goTo(id: string) {
    const scroller = pageRef.current?.closest<HTMLElement>(".page-scroll")
    const target = document.getElementById(id)
    if (!scroller || !target) return
    anchorCleanupRef.current?.()
    setActiveNavigation(id.replace("object-", ""))
    userScrollIntentRef.current = null
    if (!pinned) setManual(null)
    setActiveAnchor(id === "object-contact" ? "contact" : "general")
    requestAnimationFrame(() => {
      const fixed = metrics.title + metrics.nav + (pinned ? metrics.content : 0)
      const top =
        scroller.scrollTop +
        target.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top -
        fixed
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
      const align = () => {
        const edge = navRef.current?.getBoundingClientRect().bottom
        if (edge === undefined || !target.isConnected) return
        const delta = target.getBoundingClientRect().top - edge
        if (Math.abs(delta) > 1)
          scroller.scrollTo({
            top: scroller.scrollTop + delta,
            behavior: "instant",
          })
      }
      if (!reduce) {
        scroller.addEventListener("scrollend", align, { once: true })
        anchorCleanupRef.current = () =>
          scroller.removeEventListener("scrollend", align)
      }
      scroller.scrollTo({
        top: Math.max(0, top),
        behavior: reduce ? "instant" : "smooth",
      })
      if (reduce) requestAnimationFrame(align)
    })
  }

  const activeLabel = (
    {
      ...Object.fromEntries(anchors.map(({ id, label }) => [id, label])),
      "order-details": "Order Details",
      products: "Products",
    } as Record<string, string>
  )[activeNavigation]
  return (
    <div
      className="object-page"
      ref={pageRef}
      lang="en"
      data-header-collapsed={collapsed}
      data-header-pinned={pinned}
      data-header-docked={docked}
      style={
        {
          "--object-title-height": `${metrics.title}px`,
          "--object-sticky-height": `${stickyHeight}px`,
          "--object-tail-height": `${metrics.tail}px`,
        } as CSSProperties
      }
    >
      <header className="object-header-title" ref={titleRef}>
        <Button
          variant="ghost"
          className="object-heading-toggle"
          aria-label={`${collapsed ? "Expand" : "Collapse"} header`}
          aria-expanded={!collapsed}
          onClick={toggleHeader}
        >
          {collapsed && !phone && <RobotAvatar model={sample.model} small />}
          <span className="object-heading-text">
            <h1>{sample.model}</h1>
            {(!collapsed || !phone) && (
              <span className="object-subtitle">{sample.id}</span>
            )}
          </span>
        </Button>
        <div
          className="object-header-actions"
          role="toolbar"
          aria-label={`${sample.model} header actions`}
        >
          <Button>Edit</Button>
          <Button variant="ghost" className="object-secondary-action">
            Delete
          </Button>
          <Button variant="ghost" className="object-secondary-action">
            Simulate Assembly
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="object-actions-overflow"
                />
              }
              aria-label="More header actions"
              title="More header actions"
            >
              <SapIcon name="overflow" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem>Delete</DropdownMenuItem>
                <DropdownMenuItem>Simulate Assembly</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {collapsed && (
          <div className="object-header-controls object-header-controls-snapped">
            <Button
              variant="outline"
              size="icon-xs"
              aria-label="Expand header"
              title="Expand header"
              aria-expanded={false}
              onClick={toggleHeader}
            >
              <SapIcon name="slim-arrow-down" />
            </Button>
          </div>
        )}
      </header>
      <div
        className="object-header-content"
        ref={contentRef}
        hidden={manual === "collapsed"}
        aria-hidden={collapsed}
        inert={collapsed || undefined}
      >
        <div className="object-header-facets">
          <RobotAvatar model={sample.model} />
          <div className="object-header-identifiers">
            <p>
              <span>Manufacturer:</span> {sample.manufacturer}
            </p>
            <p>
              <span>Factory:</span> {sample.factory}
            </p>
            <p>
              <span>Supplier:</span>{" "}
              <SampleLink>
                {sample.supplier} ({sample.supplierId})
              </SampleLink>
            </p>
          </div>
          <div className="object-facet">
            <h2>Status</h2>
            <span
              className={cn(
                "object-facet-value",
                statusTone === "positive" && "object-positive",
                statusTone === "information" &&
                  "text-[var(--fiori-information)]",
                statusTone === "neutral" && "text-muted-foreground"
              )}
              data-tone={statusTone}
            >
              {sample.status}
            </span>
          </div>
          <div className="object-facet">
            <h2>Delivery Time</h2>
            <span className="object-facet-value">
              <SapIcon name="shipping-status" />
              {sample.deliveryTime}
            </span>
          </div>
          <div className="object-facet">
            <h2>Assembly Option</h2>
            <span
              className={cn(
                "object-facet-value",
                sample.assemblyOption === "To Be Selected" && "object-negative"
              )}
            >
              {sample.assemblyOption}
            </span>
          </div>
          <div className="object-facet">
            <h2>Monthly Leasing Instalment</h2>
            <span className="object-facet-value">
              <span className="object-facet-number">
                {sample.monthlyLeasingInstalment.toFixed(2)}
              </span>{" "}
              {sample.currency}
            </span>
          </div>
        </div>
        {!collapsed && (
          <div className="object-header-controls">
            <Button
              variant="outline"
              size="icon-xs"
              aria-label="Collapse header"
              title="Collapse header"
              aria-expanded={true}
              onClick={toggleHeader}
            >
              <SapIcon name="slim-arrow-up" />
            </Button>
            {metrics.pinnable && (
              <Button
                variant="outline"
                size="icon-xs"
                role="checkbox"
                aria-checked={pinned}
                aria-label={pinned ? "Unpin header" : "Pin header"}
                title={pinned ? "Unpin header" : "Pin header"}
                onClick={togglePin}
              >
                <SapIcon name={pinned ? "pushpin-on" : "pushpin-off"} />
              </Button>
            )}
          </div>
        )}
      </div>
      <nav className="object-anchor-nav" ref={navRef} aria-label="Sections">
        <div
          className="object-anchor-tabs"
          role="tablist"
          aria-label="Sections"
        >
          <div
            className={cn(
              "object-anchor-item",
              activeAnchor === "general" && "object-anchor-selected"
            )}
          >
            <Button
              variant="ghost"
              role="tab"
              aria-selected={activeAnchor === "general"}
              aria-controls="object-general"
              onClick={() => goTo("object-general")}
            >
              General Information
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-xs" />}
                aria-label="General Information subsections"
                title="General Information subsections"
              >
                <SapIcon name="slim-arrow-down" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => goTo("object-order-details")}
                  >
                    Order Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => goTo("object-products")}>
                    Products
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div
            className={cn(
              "object-anchor-item",
              activeAnchor === "contact" && "object-anchor-selected"
            )}
          >
            <Button
              variant="ghost"
              role="tab"
              aria-selected={activeAnchor === "contact"}
              aria-controls="object-contact"
              onClick={() => goTo("object-contact")}
            >
              Contact Information
            </Button>
          </div>
        </div>
        <Select
          value={activeNavigation}
          onValueChange={(value) => {
            if (value) goTo(`object-${value}`)
          }}
        >
          <SelectTrigger className="object-anchor-mobile" aria-label="Sections">
            <SelectValue>{activeLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="general">General Information</SelectItem>
              <SelectItem
                value="order-details"
                className="object-select-subsection"
              >
                Order Details
              </SelectItem>
              <SelectItem value="products" className="object-select-subsection">
                Products
              </SelectItem>
              <SelectItem value="contact">Contact Information</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </nav>
      <div className="object-content">
        <section
          className="object-section"
          id="object-general"
          aria-labelledby="object-general-heading"
        >
          <h2 id="object-general-heading" className="object-section-heading">
            General Information
          </h2>
          <div
            className="object-subsection object-form-surface"
            id="object-order-details"
          >
            <div className="object-form-group object-order-group">
              <h3>Order Details</h3>
              <FieldGroup className="object-sample-fields">
                <SampleField label="Order ID">
                  {sample.orderDetails.orderId}
                </SampleField>
                <SampleField label="Cotract">
                  <SampleLink>{sample.orderDetails.contract}</SampleLink>
                </SampleField>
                <SampleField label="Transaction Date:">
                  {sample.orderDetails.transactionDate}
                </SampleField>
                <SampleField label="Expected Delivery Date">
                  {sample.orderDetails.expectedDeliveryDate}
                </SampleField>
                <SampleField label="Factory">
                  {sample.orderDetails.factory}
                </SampleField>
                <SampleField label="Supplier">
                  {sample.orderDetails.supplier}
                </SampleField>
              </FieldGroup>
            </div>
            <div className="object-form-group object-configuration-group">
              <h3>Configuration Accounts</h3>
              <FieldGroup className="object-sample-fields">
                <SampleField label="Model">
                  {sample.configuration.model}
                </SampleField>
                <SampleField label="Color">
                  {sample.configuration.color}
                </SampleField>
                <SampleField label="Socket">
                  {sample.configuration.socket}
                </SampleField>
                <SampleField label="Leasing Instalment">
                  {sample.configuration.leasingInstalment}
                </SampleField>
                <SampleField label="Axis">
                  {sample.configuration.axis}
                </SampleField>
              </FieldGroup>
            </div>
          </div>
          <div
            className="object-subsection object-table-surface"
            id="object-products"
          >
            <SampleProductsTable documents={sample.documents} />
          </div>
        </section>
        <section
          className="object-section"
          id="object-contact"
          ref={contactRef}
          aria-labelledby="object-contact-heading"
        >
          <h2 id="object-contact-heading" className="object-section-heading">
            Contact Information
          </h2>
          <div className="object-subsection object-contact-surface">
            <div className="object-form-group">
              <h3>Phone Numbers</h3>
              <FieldGroup className="object-sample-fields">
                <SampleField label="Home">
                  {sample.contacts.homePhone}
                </SampleField>
                <SampleField label="Office phone">
                  {sample.contacts.officePhone}
                </SampleField>
              </FieldGroup>
            </div>
            <div className="object-form-group">
              <h3>Social Accounts</h3>
              <FieldGroup className="object-sample-fields">
                <SampleField label="LinkedIn">
                  {sample.contacts.linkedIn}
                </SampleField>
                <SampleField label="Twitter">
                  {sample.contacts.twitter}
                </SampleField>
              </FieldGroup>
            </div>
            <div className="object-form-group">
              <h3>Addresses</h3>
              <FieldGroup className="object-sample-fields">
                <SampleField label="Home Address">
                  {sample.contacts.homeAddress}
                </SampleField>
                <SampleField label="Mailing Address">
                  {sample.contacts.mailingAddress}
                </SampleField>
              </FieldGroup>
            </div>
            <div className="object-form-group">
              <h3>Mailing Address</h3>
              <FieldGroup className="object-sample-fields">
                <SampleField label="Work">
                  {sample.contacts.workEmail}
                </SampleField>
              </FieldGroup>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
