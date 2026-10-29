import { lazy, Suspense, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { SapIcon } from "@/components/fiori/sap-icon"
import { OrderList } from "@/pages/OrderList"
import {
  purchaseOrders,
  purchaseOrderSample,
  filterPurchaseOrders,
  EMPTY_PURCHASE_ORDER_FILTERS,
} from "@/lib/purchase-order-sample"
import "./layout.css"

const OrderDetail = lazy(() =>
  import("@/pages/OrderDetail").then((module) => ({
    default: module.OrderDetail,
  }))
)
const ComponentGallery = lazy(() =>
  import("@/pages/ComponentGallery").then((module) => ({
    default: module.ComponentGallery,
  }))
)
const VerificationPage = lazy(() =>
  import("@/pages/VerificationPage").then((module) => ({
    default: module.VerificationPage,
  }))
)

const routeFromHash = () => window.location.hash.slice(1) || "/orders"
function readDensity(): "compact" | "cozy" {
  try {
    return localStorage.getItem("fiori-lab:density") === "cozy"
      ? "cozy"
      : "compact"
  } catch {
    return "compact"
  }
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash)
  const orders = purchaseOrders
  const [density, setDensity] = useState<"compact" | "cozy">(readDensity)
  const [small, setSmall] = useState(
    () => window.matchMedia("(max-width: 599px)").matches
  )
  const [navExpanded, setNavExpanded] = useState(
    () => !window.matchMedia("(max-width: 1023px)").matches
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState("")
  const [resetOpen, setResetOpen] = useState(false)
  const [listVersion, setListVersion] = useState(0)
  useEffect(() => {
    const handler = () => {
      setRoute(routeFromHash())
      document
        .querySelector(".page-scroll")
        ?.scrollTo({ top: 0, behavior: "instant" })
    }
    window.addEventListener("hashchange", handler)
    return () => window.removeEventListener("hashchange", handler)
  }, [])
  useEffect(() => {
    const media = window.matchMedia("(max-width: 599px)"),
      onChange = () => setSmall(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.density = small ? "cozy" : density
    try {
      localStorage.setItem("fiori-lab:density", density)
    } catch {
      /* Session preference still works. */
    }
  }, [density, small])
  function navigate(target: string) {
    window.location.hash = target
    if (small) setNavExpanded(false)
  }
  const isList = route === "/orders",
    isComponents = route === "/components",
    isVerification = route === "/verification"
  const selectedId = route.startsWith("/orders/")
    ? route.slice("/orders/".length)
    : null
  const selectedOrder =
    selectedId === "SO-100428" || selectedId === "SO100428"
      ? purchaseOrderSample
      : orders.find((order) => order.id === selectedId)
  const isDetail = Boolean(selectedOrder)
  const matches = filterPurchaseOrders(orders, {
    ...EMPTY_PURCHASE_ORDER_FILTERS,
    search: globalSearch,
  })
  return (
    <TooltipProvider>
      <div className="lab-shell">
        <a
          href="#main-content"
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById("main-content")?.focus()
          }}
        >
          跳转到主内容
        </a>
        <header className="shellbar">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNavExpanded((v) => !v)}
            aria-label={navExpanded ? "收起导航" : "展开导航"}
            title={navExpanded ? "收起导航" : "展开导航"}
          >
            <SapIcon name="menu2" />
          </Button>
          <button
            className="lab-brand"
            onClick={() => navigate("/orders")}
            aria-label="Fiori Design Lab 首页"
          >
            <span className="brand-mark">f</span>
            <strong>Fiori</strong>
            <span className="brand-divider" />
            <span>Design Lab</span>
          </button>
          <span className="shell-app-title">
            {isComponents
              ? "组件预览"
              : isVerification
                ? "验证记录"
                : isDetail
                  ? selectedOrder?.model
                  : "Purchase Orders"}
          </span>
          <div className="shell-spacer" />
          <div className="density-control">
            <span>内容密度</span>
            <ToggleGroup
              multiple={false}
              value={[small ? "cozy" : density]}
              onValueChange={(values) => {
                if (values[0]) setDensity(values[0] as "compact" | "cozy")
              }}
              disabled={small}
              spacing={0}
              variant="outline"
              aria-label="内容密度"
            >
              <ToggleGroupItem value="compact" aria-label="Compact 密度">
                Compact
              </ToggleGroupItem>
              <ToggleGroupItem value="cozy" aria-label="Cozy 密度">
                Cozy
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger
              render={<Button variant="ghost" size="icon" />}
              title="搜索订单"
              aria-label="全局搜索"
            >
              <SapIcon name="search" />
            </PopoverTrigger>
            <PopoverContent className="global-search" align="end">
              <PopoverTitle>Search Purchase Orders</PopoverTitle>
              <Input
                aria-label="全局订单搜索词"
                autoFocus
                placeholder="Purchase Order, Model, Supplier"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              <span className="global-search-caption">
                {globalSearch ? `匹配结果 (${matches.length})` : "采购订单"}
              </span>
              <div className="search-results">
                {matches.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setSearchOpen(false)
                      navigate(`/orders/${o.id}`)
                    }}
                  >
                    <SapIcon name="sales-order" />
                    <span>
                      <strong>{o.id}</strong>
                      <small>{o.model}</small>
                    </span>
                    <SapIcon name="navigation-right-arrow" />
                  </button>
                ))}
                {matches.length === 0 && <p>没有找到匹配订单。</p>}
              </div>
            </PopoverContent>
          </Popover>
          <a
            className="shell-icon-link"
            title="SAP Fiori 设计规范"
            aria-label="打开 SAP Fiori 设计规范"
            href="https://www.sap.com/design-system/fiori-design-web/v1-151/discover/get-started"
            target="_blank"
            rel="noreferrer"
          >
            <SapIcon name="sys-help" />
          </a>
          <Popover>
            <PopoverTrigger
              render={<button className="user-avatar" />}
              title="账户信息"
              aria-label="用户账户"
            >
              林
            </PopoverTrigger>
            <PopoverContent align="end">
              <PopoverTitle>林晓</PopoverTitle>
              <PopoverDescription>演示账户</PopoverDescription>
            </PopoverContent>
          </Popover>
        </header>
        <div className="shell-body">
          {small && navExpanded && (
            <button
              className="nav-backdrop"
              aria-label="关闭导航"
              onClick={() => setNavExpanded(false)}
            />
          )}
          <aside
            className={
              navExpanded
                ? "side-navigation expanded"
                : "side-navigation collapsed"
            }
            aria-label="主导航"
          >
            <div className="nav-group-title">工作区</div>
            <nav>
              <button
                className={
                  !isComponents && !isVerification
                    ? "nav-item active"
                    : "nav-item"
                }
                title="Purchase Orders"
                aria-current={
                  !isComponents && !isVerification ? "page" : undefined
                }
                onClick={() => navigate("/orders")}
              >
                <SapIcon name="sales-order" />
                <span>Purchase Orders</span>
              </button>
              <div className="nav-separator" />
              <div className="nav-group-title">设计系统</div>
              <button
                className={isComponents ? "nav-item active" : "nav-item"}
                title="组件预览"
                aria-current={isComponents ? "page" : undefined}
                onClick={() => navigate("/components")}
              >
                <SapIcon name="palette" />
                <span>组件预览</span>
              </button>
              <button
                className={isVerification ? "nav-item active" : "nav-item"}
                title="验证记录"
                aria-current={isVerification ? "page" : undefined}
                onClick={() => navigate("/verification")}
              >
                <SapIcon name="document-text" />
                <span>验证记录</span>
              </button>
            </nav>
            <div className="nav-bottom">
              <span className="theme-indicator" />
              <span>
                Morning Horizon<small>原型 v0.1</small>
              </span>
            </div>
          </aside>
          <main id="main-content" className="page-scroll" tabIndex={-1}>
            <div hidden={!isList}>
              <OrderList
                key={listVersion}
                orders={orders}
                onOpen={(id) => navigate(`/orders/${id}`)}
              />
            </div>
            <Suspense
              fallback={
                <div className="missing-page" role="status">
                  正在加载页面…
                </div>
              }
            >
              {selectedOrder && (
                <OrderDetail key={selectedOrder.id} order={selectedOrder} />
              )}
              {selectedId && !isDetail && (
                <div className="missing-page">
                  <SapIcon name="sales-order" />
                  <h1>未找到采购订单</h1>
                  <Button onClick={() => navigate("/orders")}>
                    返回采购订单列表
                  </Button>
                </div>
              )}
              {isComponents && <ComponentGallery />}
              {isVerification && (
                <VerificationPage onReset={() => setResetOpen(true)} />
              )}
            </Suspense>
            {!isList && !isComponents && !isVerification && !selectedId && (
              <div className="missing-page">
                <h1>页面不存在</h1>
                <Button onClick={() => navigate("/orders")}>
                  返回订单列表
                </Button>
              </div>
            )}
          </main>
        </div>
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>恢复演示数据</DialogTitle>
              <DialogDescription>
                清除当前浏览器中的采购订单自定义视图，并恢复列表的默认筛选和列设置。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setResetOpen(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  try {
                    localStorage.removeItem("fiori-lab:purchase-views:v1")
                  } catch {
                    /* Session still works. */
                  }
                  setListVersion((v) => v + 1)
                  setGlobalSearch("")
                  setSearchOpen(false)
                  setResetOpen(false)
                  toast.success("演示数据已恢复。")
                }}
              >
                恢复
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Toaster position="bottom-center" richColors closeButton />
      </div>
    </TooltipProvider>
  )
}
