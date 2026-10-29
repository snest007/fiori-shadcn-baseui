export type OrderStatus = "待审批" | "处理中" | "已完成" | "已取消"
export type Priority = "标准" | "高"
export type Product = {
  id: string
  name: string
  category: string
  unit: string
  price: number
  stock: number
}
export type OrderItem = {
  id: string
  productId: string
  name: string
  quantity: number
  unit: string
  unitPrice: number
}
export type Order = {
  id: string
  customer: string
  customerId: string
  contact: string
  city: string
  address: string
  salesOrg: string
  owner: string
  created: string
  deliveryDate: string
  status: OrderStatus
  priority: Priority
  payment: string
  note: string
  items: OrderItem[]
}
export type Filters = {
  search: string
  customer: string
  status: string
  salesOrg: string
  from: string
  to: string
}
export const EMPTY_FILTERS: Filters = {
  search: "",
  customer: "",
  status: "全部",
  salesOrg: "全部",
  from: "",
  to: "",
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}
function isDate(value: unknown, optional = false): value is string {
  if (typeof value !== "string") return false
  if (optional && value === "") return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}
export function isFilters(value: unknown): value is Filters {
  return (
    isRecord(value) &&
    typeof value.search === "string" &&
    typeof value.customer === "string" &&
    typeof value.status === "string" &&
    ["全部", "待审批", "处理中", "已完成", "已取消"].includes(value.status) &&
    typeof value.salesOrg === "string" &&
    ["全部", "华东销售组织", "华南销售组织"].includes(value.salesOrg) &&
    isDate(value.from, true) &&
    isDate(value.to, true) &&
    (!value.from || !value.to || value.from <= value.to)
  )
}
function isOrderItem(value: unknown): value is OrderItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.productId === "string" &&
    value.productId.length > 0 &&
    typeof value.name === "string" &&
    typeof value.unit === "string" &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    typeof value.unitPrice === "number" &&
    Number.isFinite(value.unitPrice) &&
    value.unitPrice >= 0
  )
}
export function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    /^SO-\d+$/.test(value.id) &&
    Number.isSafeInteger(Number(value.id.slice(3))) &&
    [
      "customer",
      "customerId",
      "contact",
      "city",
      "address",
      "salesOrg",
      "owner",
      "payment",
      "note",
    ].every((key) => typeof value[key] === "string") &&
    typeof value.status === "string" &&
    ["待审批", "处理中", "已完成", "已取消"].includes(value.status) &&
    typeof value.priority === "string" &&
    ["标准", "高"].includes(value.priority) &&
    isDate(value.created) &&
    isDate(value.deliveryDate) &&
    value.deliveryDate >= value.created &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(isOrderItem) &&
    new Set(value.items.map((item) => item.id)).size === value.items.length
  )
}
export function isOrders(value: unknown): value is Order[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isOrder) &&
    new Set(value.map((order) => order.id)).size === value.length
  )
}
export const products: Product[] = [
  {
    id: "P-1001",
    name: "工业传感器 · S200",
    category: "自动化设备",
    unit: "件",
    price: 1280,
    stock: 860,
  },
  {
    id: "P-1002",
    name: "智能控制模块 · C400",
    category: "自动化设备",
    unit: "件",
    price: 3560,
    stock: 320,
  },
  {
    id: "P-1003",
    name: "精密连接器 · M12",
    category: "电气配件",
    unit: "件",
    price: 85,
    stock: 4200,
  },
  {
    id: "P-1004",
    name: "伺服驱动器 · D750",
    category: "驱动设备",
    unit: "台",
    price: 6800,
    stock: 145,
  },
  {
    id: "P-1005",
    name: "工业电源 · PS24",
    category: "电气配件",
    unit: "件",
    price: 420,
    stock: 1260,
  },
  {
    id: "P-1006",
    name: "触摸显示屏 · HMI10",
    category: "人机界面",
    unit: "台",
    price: 2450,
    stock: 208,
  },
  {
    id: "P-1007",
    name: "温度变送器 · T100",
    category: "自动化设备",
    unit: "件",
    price: 760,
    stock: 540,
  },
  {
    id: "P-1008",
    name: "线性导轨 · L600",
    category: "机械部件",
    unit: "套",
    price: 1890,
    stock: 176,
  },
]
const customers = [
  [
    "华东精密制造有限公司",
    "C-10028",
    "上海",
    "张明",
    "上海市浦东新区金桥路 1688 号",
  ],
  [
    "苏州新瑞自动化科技",
    "C-10036",
    "苏州",
    "陈洁",
    "苏州市工业园区星湖街 58 号",
  ],
  ["杭州远景工业技术", "C-10045", "杭州", "李帆", "杭州市滨江区江陵路 290 号"],
  [
    "南京智联装备有限公司",
    "C-10052",
    "南京",
    "王磊",
    "南京市江宁区天元东路 99 号",
  ],
  [
    "深圳科创电子有限公司",
    "C-10067",
    "深圳",
    "赵宁",
    "深圳市南山区科技南路 108 号",
  ],
  [
    "广州南方机电集团",
    "C-10073",
    "广州",
    "刘悦",
    "广州市黄埔区科学大道 188 号",
  ],
]
const statusSequence: OrderStatus[] = [
  "待审批",
  "处理中",
  "已完成",
  "待审批",
  "处理中",
  "已完成",
  "待审批",
  "处理中",
  "已取消",
]
export function createOrderItem(p: Product, quantity = 1): OrderItem {
  return {
    id: crypto.randomUUID(),
    productId: p.id,
    name: p.name,
    quantity,
    unit: p.unit,
    unitPrice: p.price,
  }
}
export const initialOrders: Order[] = Array.from({ length: 24 }, (_, i) => {
  const c = customers[i % customers.length]
  const p1 = products[i % products.length],
    p2 = products[(i + 2) % products.length]
  return {
    id: `SO-${100428 - i}`,
    customer: c[0],
    customerId: c[1],
    city: c[2],
    contact: c[3],
    address: c[4],
    salesOrg: i % 6 < 4 ? "华东销售组织" : "华南销售组织",
    owner: ["林晓", "周予", "许安"][i % 3],
    created: `2026-10-${String(28 - Math.floor(i / 3)).padStart(2, "0")}`,
    deliveryDate: `2026-11-${String(5 + (i % 18)).padStart(2, "0")}`,
    status: statusSequence[i % statusSequence.length],
    priority: i % 5 === 0 ? "高" : "标准",
    payment: "月结 30 天",
    note: i === 0 ? "请在发货前联系收货人，优先安排第一批传感器交付。" : "",
    items: [
      {
        id: `L-${i}-1`,
        productId: p1.id,
        name: p1.name,
        quantity: i === 0 ? 40 : 10 + i * 2,
        unit: p1.unit,
        unitPrice: p1.price,
      },
      {
        id: `L-${i}-2`,
        productId: p2.id,
        name: p2.name,
        quantity: i === 0 ? 120 : 20 + i * 3,
        unit: p2.unit,
        unitPrice: p2.price,
      },
    ],
  }
})
export const statusTone: Record<
  OrderStatus,
  "critical" | "information" | "positive" | "neutral"
> = {
  待审批: "critical",
  处理中: "information",
  已完成: "positive",
  已取消: "neutral",
}
export const orderTotal = (order: Order) =>
  order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
export const money = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
export function filterOrders(orders: Order[], filters: Filters): Order[] {
  const q = filters.search.trim().toLowerCase()
  return orders.filter(
    (o) =>
      (!q ||
        `${o.id} ${o.created} ${o.customer} ${o.customerId} ${o.city} ${o.owner} ${o.status} ${o.salesOrg} ${o.deliveryDate} ${orderTotal(o)} ${money(orderTotal(o))} CNY`
          .toLowerCase()
          .includes(q)) &&
      (!filters.customer.trim() ||
        o.customer.includes(filters.customer.trim()) ||
        o.customerId
          .toLowerCase()
          .includes(filters.customer.trim().toLowerCase())) &&
      (filters.status === "全部" || o.status === filters.status) &&
      (filters.salesOrg === "全部" || o.salesOrg === filters.salesOrg) &&
      (!filters.from || o.created >= filters.from) &&
      (!filters.to || o.created <= filters.to)
  )
}
export function newOrder(orders: Order[]): Order {
  const next =
    Math.max(100428, ...orders.map((o) => Number(o.id.replace("SO-", "")))) + 1
  return {
    ...initialOrders[0],
    id: `SO-${next}`,
    customer: "",
    customerId: "",
    contact: "",
    address: "",
    city: "",
    created: "2026-10-28",
    deliveryDate: "",
    priority: "标准",
    status: "待审批",
    note: "",
    items: [],
  }
}
