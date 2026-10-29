export type StockState = "available" | "low" | "empty"

export type InventoryRecord = {
  id: string
  materialCode: string
  material: string
  warehouseId: string
  warehouse: string
  available: number
  unit: string
  status: StockState
  counted: boolean
  updated: string
}

export type InventoryFilters = {
  search: string
  warehouse: string
  status: string
}

export const EMPTY_INVENTORY_FILTERS: InventoryFilters = {
  search: "",
  warehouse: "all",
  status: "all",
}

export const inventoryWarehouses = [
  { value: "hz", label: "杭州成品仓" },
  { value: "sh", label: "上海备件仓" },
  { value: "nj", label: "南京中转仓" },
  { value: "cd", label: "成都成品仓" },
  { value: "cq", label: "重庆备件仓" },
  { value: "sz", label: "深圳出口仓" },
]

export const inventoryStates = [
  { value: "available", label: "正常" },
  { value: "low", label: "低库存" },
  { value: "empty", label: "缺货" },
]

export const stockStateLabels: Record<StockState, string> = {
  available: "正常",
  low: "低库存",
  empty: "缺货",
}

const catalogue = [
  { name: "不锈钢紧固件", unit: "盒" },
  { name: "工业密封圈", unit: "包" },
  { name: "电机安装支架", unit: "件" },
  { name: "传动轴套", unit: "件" },
  { name: "瓦楞包装箱", unit: "个" },
  { name: "防静电包装袋", unit: "包" },
  { name: "运输缓冲垫", unit: "套" },
  { name: "出口标识标签", unit: "卷" },
  { name: "设备维护油", unit: "桶" },
  { name: "无尘清洁布", unit: "包" },
  { name: "防锈保护剂", unit: "罐" },
  { name: "检修工具套装", unit: "套" },
]

// Stable consumer-owned data: one stock record for each material/warehouse pair.
export const initialInventory: InventoryRecord[] = catalogue.flatMap(
  (material, materialIndex) =>
    inventoryWarehouses.map((warehouse, warehouseIndex) => {
      const index = materialIndex * inventoryWarehouses.length + warehouseIndex
      const available = index % 11 === 0 ? 0 : (index * 37 + 9) % 480
      return {
        id: `INV-${String(index + 1).padStart(4, "0")}`,
        materialCode: `MAT-${String(1001 + materialIndex)}`,
        material: material.name,
        warehouseId: warehouse.value,
        warehouse: warehouse.label,
        available,
        unit: material.unit,
        status:
          available === 0 ? "empty" : available < 50 ? "low" : "available",
        counted: index % 5 === 0,
        updated: `2026-10-${String(23 + (index % 6)).padStart(2, "0")}`,
      }
    })
)

export function filterInventory(
  records: InventoryRecord[],
  filters: InventoryFilters
) {
  const query = filters.search.trim().toLocaleLowerCase()
  return records.filter(
    (record) =>
      (!query ||
        [record.id, record.materialCode, record.material, record.warehouse]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query)) &&
      (filters.warehouse === "all" ||
        record.warehouseId === filters.warehouse) &&
      (filters.status === "all" || record.status === filters.status)
  )
}
