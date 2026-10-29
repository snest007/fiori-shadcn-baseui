export type PurchaseOrderDocument = {
  key: string
  documentNumber: string
  company: string
  contactPerson: string
  postingDate: string
  amount: number
  currency: "EUR"
}

export type PurchaseOrderStatus =
  "Delivery" | "In Production" | "Ready for Delivery" | "Delivered"

export const purchaseOrderStatusTone: Record<
  PurchaseOrderStatus,
  "neutral" | "information" | "positive"
> = {
  Delivery: "positive",
  "In Production": "neutral",
  "Ready for Delivery": "information",
  Delivered: "positive",
}

export type PurchaseOrderSample = {
  id: string
  model: string
  manufacturer: string
  supplier: string
  supplierId: string
  factory: string
  status: PurchaseOrderStatus
  deliveryTime: string
  assemblyOption: string
  monthlyLeasingInstalment: number
  currency: "USD"
  orderDetails: {
    orderId: string
    contract: string
    transactionDate: string
    transactionDateISO: string
    expectedDeliveryDate: string
    expectedDeliveryDateISO: string
    factory: string
    supplier: string
  }
  configuration: {
    model: string
    color: string
    socket: string
    leasingInstalment: string
    axis: string
  }
  contacts: {
    homePhone: string
    officePhone: string
    linkedIn: string
    twitter: string
    homeAddress: string
    mailingAddress: string
    workEmail: string
  }
  documents: PurchaseOrderDocument[]
}

// Content from the official ObjectPageSectionShowTitle sample. The five document
// entries are repeated in that sample; their keys are React identity only.
export const purchaseOrderSample: PurchaseOrderSample = {
  id: "PO-48865",
  model: "Robot Arm Series 9",
  manufacturer: "Robotech",
  supplier: "Robotech",
  supplierId: "234242343",
  factory: "Orlando, Florida",
  status: "Delivery",
  deliveryTime: "12 Days",
  assemblyOption: "To Be Selected",
  monthlyLeasingInstalment: 379.99,
  currency: "USD",
  orderDetails: {
    orderId: "589946637",
    contract: "10045876",
    transactionDate: "May 6, 2018",
    transactionDateISO: "2018-05-06",
    expectedDeliveryDate: "June 23, 2018",
    expectedDeliveryDateISO: "2018-06-23",
    factory: "Orlando, FL",
    supplier: "Robotech",
  },
  configuration: {
    model: "Robot Arm Series 9",
    color: "White (default)",
    socket: "Default Socket 10",
    leasingInstalment: "379.99 USD per month",
    axis: "6 Axis",
  },
  contacts: {
    homePhone: "+ 1 415-321-1234",
    officePhone: "+ 1 415-321-5555",
    linkedIn: "/DeniseSmith",
    twitter: "@DeniseSmith",
    homeAddress: "2096 Mission Street",
    mailingAddress: "PO Box 32114",
    workEmail: "DeniseSmith@sap.com",
  },
  documents: Array.from({ length: 5 }, (_, index) => ({
    key: `document-${index + 1}`,
    documentNumber: "10223882001820",
    company: "Jologa",
    contactPerson: "Denise Smith",
    postingDate: "11/15/19",
    amount: 12897,
    currency: "EUR",
  })),
}

// Fictional fixtures supplement the official sample for list filtering, sorting,
// responsive tables and navigation. Every fixture has its own detail data.
const fixtureSuppliers = [
  {
    name: "Robotech",
    id: "234242343",
    contact: "Alex Morgan",
    address: "180 Innovation Drive",
    mailbox: "PO Box 41001",
  },
  {
    name: "Automation Dynamics",
    id: "234242344",
    contact: "Jordan Lee",
    address: "240 Automation Way",
    mailbox: "PO Box 41002",
  },
  {
    name: "Precision Robotics",
    id: "234242345",
    contact: "Taylor Brooks",
    address: "360 Precision Avenue",
    mailbox: "PO Box 41003",
  },
  {
    name: "MotionWorks",
    id: "234242346",
    contact: "Casey Rivera",
    address: "480 Motion Boulevard",
    mailbox: "PO Box 41004",
  },
]
const fixtureModels = [
  {
    name: "Robot Arm Series 9",
    supplier: 0,
    axis: 6,
    socket: 10,
    lease: 379.99,
  },
  {
    name: "Robot Arm Series 7",
    supplier: 0,
    axis: 6,
    socket: 8,
    lease: 249.99,
  },
  {
    name: "Robot Arm Series 11",
    supplier: 1,
    axis: 7,
    socket: 12,
    lease: 599.5,
  },
  { name: "Collaborative Arm C6", supplier: 2, axis: 6, socket: 6, lease: 429 },
  { name: "Precision Arm P4", supplier: 2, axis: 4, socket: 4, lease: 329.75 },
  {
    name: "Heavy Duty Arm H12",
    supplier: 3,
    axis: 6,
    socket: 16,
    lease: 899.99,
  },
]
const fixtureFactories = [
  { name: "Orlando, Florida", short: "Orlando, FL" },
  { name: "Austin, Texas", short: "Austin, TX" },
  { name: "Detroit, Michigan", short: "Detroit, MI" },
  { name: "San Diego, California", short: "San Diego, CA" },
  { name: "Munich, Germany", short: "Munich, Germany" },
  { name: "Brno, Czech Republic", short: "Brno, Czech Republic" },
]
const fixtureStatuses: PurchaseOrderStatus[] = [
  "In Production",
  "Ready for Delivery",
  "Delivery",
  "Delivered",
]
const DAY_MS = 24 * 60 * 60 * 1000
function displayDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}
function documentDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    timeZone: "UTC",
  })
}
function isoDate(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}
const purchaseOrderFixtures: PurchaseOrderSample[] = Array.from(
  { length: 31 },
  (_, index) => {
    const id = `PO-${48866 + index}`,
      model = fixtureModels[(index + 1) % fixtureModels.length],
      supplier = fixtureSuppliers[model.supplier],
      factory = fixtureFactories[index % fixtureFactories.length],
      status = fixtureStatuses[index % fixtureStatuses.length],
      transaction =
        status === "Delivered"
          ? Date.UTC(2026, 8, 1 + (index % 20))
          : status === "Delivery"
            ? Date.UTC(2026, 8, 20 + (index % 20))
            : Date.UTC(2026, 9, 1 + (index % 20)),
      expected =
        status === "Delivered"
          ? transaction + (12 + (index % 10)) * DAY_MS
          : status === "Delivery"
            ? Date.UTC(2026, 9, 30 + (index % 7))
            : status === "Ready for Delivery"
              ? Date.UTC(2026, 10, 1 + (index % 5))
              : Date.UTC(2026, 10, 12 + (index % 14)),
      monthly = Math.round((model.lease + (index % 7) * 17.25) * 100) / 100,
      contactHandle = supplier.contact.replaceAll(" ", ""),
      remainingDays = Math.ceil((expected - Date.UTC(2026, 9, 29)) / DAY_MS)
    return {
      id,
      model: model.name,
      manufacturer: supplier.name,
      supplier: supplier.name,
      supplierId: supplier.id,
      factory: factory.name,
      status,
      deliveryTime:
        status === "Delivered" ? "Completed" : `${remainingDays} Days`,
      assemblyOption:
        status === "In Production" ? "To Be Selected" : "Standard Assembly",
      monthlyLeasingInstalment: monthly,
      currency: "USD",
      orderDetails: {
        orderId: String(589946638 + index),
        contract: String(10045877 + index),
        transactionDate: displayDate(transaction),
        transactionDateISO: isoDate(transaction),
        expectedDeliveryDate: displayDate(expected),
        expectedDeliveryDateISO: isoDate(expected),
        factory: factory.short,
        supplier: supplier.name,
      },
      configuration: {
        model: model.name,
        color: ["White (default)", "Graphite", "Blue"][index % 3],
        socket: `Default Socket ${model.socket}`,
        leasingInstalment: `${monthly.toFixed(2)} USD per month`,
        axis: `${model.axis} Axis`,
      },
      contacts: {
        homePhone: `+ 1 415-555-${String(1000 + index).padStart(4, "0")}`,
        officePhone: `+ 1 415-555-${String(2000 + index).padStart(4, "0")}`,
        linkedIn: `/${contactHandle}`,
        twitter: `@${contactHandle}`,
        homeAddress: supplier.address,
        mailingAddress: supplier.mailbox,
        workEmail: `${contactHandle.toLowerCase()}@example.com`,
      },
      documents: Array.from(
        { length: 3 + (index % 3) },
        (_, documentIndex) => ({
          key: `${id}-document-${documentIndex + 1}`,
          documentNumber: String(
            10223882001820 + (index + 1) * 10 + documentIndex
          ),
          company: supplier.name,
          contactPerson: supplier.contact,
          postingDate: documentDate(transaction + documentIndex * DAY_MS),
          amount:
            Math.round(
              (monthly * (12 + documentIndex * 3) + (index + 1) * 47.85) * 100
            ) / 100,
          currency: "EUR",
        })
      ),
    }
  }
)

export const purchaseOrders: PurchaseOrderSample[] = [
  purchaseOrderSample,
  ...purchaseOrderFixtures,
]

export const purchaseOrderFilterOptions = {
  supplier: [...new Set(purchaseOrders.map((order) => order.supplier))],
  factory: [...new Set(purchaseOrders.map((order) => order.factory))],
  status: [...new Set(purchaseOrders.map((order) => order.status))],
}

export type PurchaseOrderFilters = {
  search: string
  model: string
  supplier: string
  factory: string
  status: string
  from: string
  to: string
}

export const EMPTY_PURCHASE_ORDER_FILTERS: PurchaseOrderFilters = {
  search: "",
  model: "",
  supplier: "All",
  factory: "All",
  status: "All",
  from: "",
  to: "",
}

function isISODate(value: string) {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

export function isPurchaseOrderFilters(
  value: unknown
): value is PurchaseOrderFilters {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const filters = value as Record<string, unknown>
  return (
    Object.keys(EMPTY_PURCHASE_ORDER_FILTERS).every(
      (key) => typeof filters[key] === "string"
    ) &&
    ["All", ...purchaseOrderFilterOptions.supplier].includes(
      filters.supplier as string
    ) &&
    ["All", ...purchaseOrderFilterOptions.factory].includes(
      filters.factory as string
    ) &&
    ["All", ...purchaseOrderFilterOptions.status].includes(
      filters.status as PurchaseOrderStatus | "All"
    ) &&
    isISODate(filters.from as string) &&
    isISODate(filters.to as string) &&
    (!filters.from || !filters.to || String(filters.from) <= String(filters.to))
  )
}

export function filterPurchaseOrders(
  orders: PurchaseOrderSample[],
  filters: PurchaseOrderFilters
) {
  const search = filters.search.trim().toLocaleLowerCase(),
    model = filters.model.trim().toLocaleLowerCase()
  return orders.filter((order) => {
    const searchable = [
      order.id,
      order.model,
      order.supplier,
      order.factory,
      order.status,
      order.orderDetails.expectedDeliveryDate,
      order.orderDetails.expectedDeliveryDateISO,
      String(order.monthlyLeasingInstalment),
      order.currency,
    ]
      .join(" ")
      .toLocaleLowerCase()
    return (
      (!search || searchable.includes(search)) &&
      (!model || order.model.toLocaleLowerCase().includes(model)) &&
      (filters.supplier === "All" || order.supplier === filters.supplier) &&
      (filters.factory === "All" || order.factory === filters.factory) &&
      (filters.status === "All" || order.status === filters.status) &&
      (!filters.from ||
        order.orderDetails.expectedDeliveryDateISO >= filters.from) &&
      (!filters.to || order.orderDetails.expectedDeliveryDateISO <= filters.to)
    )
  })
}
