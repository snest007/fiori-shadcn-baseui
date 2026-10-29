import { Fragment, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SapIcon } from "@/components/fiori/sap-icon"
import {
  purchaseOrderSample,
  type PurchaseOrderDocument,
} from "@/lib/purchase-order-sample"
import "./sample-products-table.css"

const ACTIONS = [
  { label: "Sort", icon: "sort" },
  { label: "Filter", icon: "filter" },
  { label: "Group", icon: "group-2" },
  { label: "Settings", icon: "action-settings" },
] as const

// The reference XML has no search/action handlers, selection, or row navigation.
// The default keeps its literal content; additional orders bind their documents.
export function SampleProductsTable({
  documents = purchaseOrderSample.documents,
}: {
  documents?: PurchaseOrderDocument[]
}) {
  const products = documents.map((row) => ({
    key: row.key,
    document: row.documentNumber,
    company: row.company,
    contact: row.contactPerson,
    posting: row.postingDate,
    amount: `${row.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.currency}`,
  }))
  const toolbarRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")
  const [visibleActions, setVisibleActions] = useState<number>(ACTIONS.length)

  useEffect(() => {
    const toolbar = toolbarRef.current
    const title = titleRef.current
    if (!toolbar || !title) return
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(toolbar)
      const available = toolbar.clientWidth
      const padding =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      const gap = parseFloat(style.columnGap) || 0
      const button = parseFloat(
        style.getPropertyValue("--sample-products-action-width")
      )
      const preferredSearch =
        17.5 * parseFloat(getComputedStyle(document.documentElement).fontSize)
      for (let count: number = ACTIONS.length; count >= 0; count--) {
        const overflow = count < ACTIONS.length ? 1 : 0
        const required =
          padding +
          title.offsetWidth +
          preferredSearch +
          (count + overflow) * button +
          (1 + count + overflow) * gap
        if (required <= available || count === 0) {
          setVisibleActions(count)
          break
        }
      }
    })
    observer.observe(toolbar)
    observer.observe(title)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="sample-products">
      <div
        ref={toolbarRef}
        className="sample-products-toolbar"
        role="toolbar"
        aria-label="Products table actions"
      >
        <h2 ref={titleRef} id="sample-products-title">
          Products
        </h2>
        <InputGroup className="sample-products-search">
          <InputGroupInput
            ref={searchRef}
            aria-label="Search products"
            placeholder="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault()
            }}
          />
          <InputGroupAddon align="inline-end">
            {search && (
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear search"
                title="Clear"
                onClick={() => {
                  setSearch("")
                  searchRef.current?.focus()
                }}
              >
                <SapIcon name="decline" />
              </InputGroupButton>
            )}
            <InputGroupButton
              size="icon-xs"
              aria-label="Search"
              title="Search"
              onClick={() => searchRef.current?.focus()}
            >
              <SapIcon name="search" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {ACTIONS.slice(0, visibleActions).map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="icon"
            aria-label={action.label}
            title={action.label}
          >
            <SapIcon name={action.icon} />
          </Button>
        ))}
        {visibleActions < ACTIONS.length && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
              aria-label="More table actions"
              title="More"
            >
              <SapIcon name="overflow" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {ACTIONS.slice(visibleActions).map((action) => (
                  <DropdownMenuItem key={action.label}>
                    <SapIcon name={action.icon} data-icon="inline-start" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <Table
        className="sample-products-table"
        aria-labelledby="sample-products-title"
      >
        <TableHeader>
          <TableRow>
            <TableHead>Document Number</TableHead>
            <TableHead className="sample-products-tablet-column">
              Company
            </TableHead>
            <TableHead className="sample-products-tablet-column">
              Contact Person
            </TableHead>
            <TableHead className="sample-products-tablet-column">
              Posting Date
            </TableHead>
            <TableHead className="sample-products-amount">
              Amount (Local Currency)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <Fragment key={product.key}>
              <TableRow className="sample-products-main-row">
                <TableCell>
                  <a
                    role="link"
                    tabIndex={0}
                    className="sample-product-document"
                  >
                    {product.document}
                  </a>
                </TableCell>
                <TableCell className="sample-products-tablet-column">
                  {product.company}
                </TableCell>
                <TableCell className="sample-products-tablet-column">
                  {product.contact}
                </TableCell>
                <TableCell className="sample-products-tablet-column">
                  {product.posting}
                </TableCell>
                <TableCell className="sample-products-amount">
                  {product.amount}
                </TableCell>
              </TableRow>
              <TableRow className="sample-products-popin-row">
                <TableCell colSpan={2}>
                  <dl className="sample-products-popin-fields">
                    <div>
                      <dt>Company</dt>
                      <dd>{product.company}</dd>
                    </div>
                    <div>
                      <dt>Contact Person</dt>
                      <dd>{product.contact}</dd>
                    </div>
                    <div>
                      <dt>Posting Date</dt>
                      <dd>{product.posting}</dd>
                    </div>
                  </dl>
                </TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
