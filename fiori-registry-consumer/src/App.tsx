import { useEffect, useMemo, useRef, useState } from "react"
import { Button as HostButton } from "~/components/ui/button"
import { FioriProvider } from "~/components/fiori/fiori-provider"
import { Button } from "~/components/fiori/ui/button"
import { Input } from "~/components/fiori/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/fiori/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/fiori/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "~/components/fiori/ui/toggle-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/fiori/ui/table"
import {
  ValueHelpField,
  type ValueHelpColumn,
  type ValueHelpItem,
} from "~/components/fiori/value-help"
import {
  ValueHelpConditionsField,
  type ValueHelpCondition,
} from "~/components/fiori/value-help-conditions-field"
import {
  formatValueHelpCondition,
  matchesValueHelpConditions,
} from "~/lib/fiori/value-help-conditions"
import {
  getMessageSummary,
  MessagePopover,
  type FioriMessage,
} from "~/components/fiori/message-popover"
import {
  MessageStrip,
  type MessageStripTone,
} from "~/components/fiori/message-strip"
import "./App.css"
import { InventoryDemo } from "./inventory/InventoryDemo"

const warehouses: ValueHelpItem[] = [
  {
    id: "wh-hz-01",
    label: "杭州成品仓",
    attributes: { region: "east", capacity: "2,400 托盘" },
  },
  {
    id: "wh-sh-02",
    label: "上海备件仓",
    attributes: { region: "east", capacity: "1,200 托盘" },
  },
  {
    id: "wh-nj-03",
    label: "南京中转仓",
    attributes: { region: "east", capacity: "900 托盘" },
  },
  {
    id: "wh-cd-04",
    label: "成都成品仓",
    attributes: { region: "west", capacity: "1,600 托盘" },
  },
  {
    id: "wh-cq-05",
    label: "重庆备件仓",
    attributes: { region: "west", capacity: "800 托盘" },
  },
  {
    id: "wh-sz-06",
    label: "深圳出口仓",
    attributes: { region: "south", capacity: "3,200 托盘" },
  },
]
const warehouseColumns: ValueHelpColumn[] = [
  { key: "label", label: "仓库名称", filter: "text", showOnPhone: true },
  {
    key: "region",
    label: "区域",
    width: 140,
    filter: "select",
    filterOptions: [
      { value: "east", label: "华东" },
      { value: "west", label: "西南" },
      { value: "south", label: "华南" },
    ],
    showOnPhone: false,
  },
  {
    key: "id",
    label: "仓库编码",
    width: 150,
    filter: "text",
    showOnPhone: true,
  },
  {
    key: "capacity",
    label: "容量",
    width: 140,
    filter: false,
    searchable: false,
    showOnPhone: false,
  },
]
const materials: ValueHelpItem[] = [
  {
    id: "mat-a01",
    label: "不锈钢紧固件",
    attributes: { category: "part", unit: "盒" },
  },
  {
    id: "mat-a02",
    label: "工业密封圈",
    attributes: { category: "part", unit: "包" },
  },
  {
    id: "mat-a03",
    label: "电机安装支架",
    attributes: { category: "part", unit: "件" },
  },
  {
    id: "mat-a04",
    label: "传动轴套",
    attributes: { category: "part", unit: "件" },
  },
  {
    id: "mat-b01",
    label: "瓦楞包装箱",
    attributes: { category: "pack", unit: "个" },
  },
  {
    id: "mat-b02",
    label: "防静电包装袋",
    attributes: { category: "pack", unit: "包" },
  },
  {
    id: "mat-b03",
    label: "运输缓冲垫",
    attributes: { category: "pack", unit: "套" },
  },
  {
    id: "mat-b04",
    label: "出口标识标签",
    attributes: { category: "pack", unit: "卷" },
  },
  {
    id: "mat-c01",
    label: "设备维护油",
    attributes: { category: "care", unit: "桶" },
  },
  {
    id: "mat-c02",
    label: "无尘清洁布",
    attributes: { category: "care", unit: "包" },
  },
  {
    id: "mat-c03",
    label: "防锈保护剂",
    attributes: { category: "care", unit: "罐" },
  },
  {
    id: "mat-c04",
    label: "检修工具套装",
    attributes: { category: "care", unit: "套" },
  },
]
const materialColumns: ValueHelpColumn[] = [
  { key: "id", label: "物料编码", width: 140, filter: "text" },
  { key: "label", label: "物料名称", filter: "text" },
  {
    key: "category",
    label: "类别",
    width: 160,
    filter: "select",
    filterOptions: [
      { value: "part", label: "装配零件" },
      { value: "pack", label: "包装材料" },
      { value: "care", label: "维护用品" },
    ],
  },
  { key: "unit", label: "单位", width: 100, filter: false },
]
const batches = ["lot-a1", "lot-a2", "lot-b1", "lot-b2", "lot-c1", "LOT-A1"]
const initialConditions: ValueHelpCondition[] = [
  {
    id: "include-lot",
    operation: "StartsWith",
    exclude: false,
    value1: "lot-",
    value2: "",
  },
  {
    id: "exclude-b2",
    operation: "EQ",
    exclude: true,
    value1: "lot-b2",
    value2: "",
  },
]
const stripMessages: { tone: MessageStripTone; text: string }[] = [
  { tone: "information", text: "库存数据为独立消费项目提供的本地样本。" },
  { tone: "positive", text: "数据源已装载，可以验证选择回填。" },
  { tone: "critical", text: "补货数量超过建议值时，仍可继续保存。" },
  { tone: "negative", text: "缺少必填物料或库位时，保存会被阻止。" },
]

type StockValues = {
  material: string
  bin: string
  quantity: string
  note: string
}
const initialStock: StockValues = {
  material: "",
  bin: "",
  quantity: "125",
  note: "",
}

function StockValidation() {
  const [values, setValues] = useState<StockValues>(initialStock)
  const [validated, setValidated] = useState(false)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)
  const [lastTarget, setLastTarget] = useState("尚未定位")
  const materialRef = useRef<HTMLInputElement>(null)
  const binRef = useRef<HTMLInputElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLInputElement>(null)
  const messageData = useMemo(() => {
    if (!validated) return []
    const result: FioriMessage[] = [
      ...(!values.material.trim()
        ? [
            {
              id: "material-required",
              type: "error" as const,
              title: "请输入物料编码。",
              subtitle: "物料编码",
              description: "物料编码为必填项。填写后重新保存库存。",
            },
          ]
        : []),
      ...(!values.bin.trim()
        ? [
            {
              id: "bin-required",
              type: "error" as const,
              title: "请输入库位。",
              subtitle: "库位",
              description: "请指定库位，例如 A-03。库位由消费项目负责校验。",
            },
          ]
        : []),
      ...(!/^\d+$/.test(values.quantity) || Number(values.quantity) < 1
        ? [
            {
              id: "quantity-invalid",
              type: "error" as const,
              title: "补货数量必须是正整数。",
              subtitle: "补货数量",
              description: "输入大于零的整数后重新保存。",
            },
          ]
        : Number(values.quantity) > 100
          ? [
              {
                id: "quantity-high",
                type: "warning" as const,
                title: "补货数量超过建议值。",
                subtitle: "补货数量",
                description: "建议单次补货不超过100件；确认数量后仍可保存。",
              },
            ]
          : []),
      ...(!values.note.trim()
        ? [
            {
              id: "note-empty",
              type: "information" as const,
              title: "未填写补货备注。",
              subtitle: "补货备注",
              description: "备注为选填项，可补充本次库存调整原因。",
            },
          ]
        : []),
      ...(saved
        ? [
            {
              id: "stock-saved",
              type: "success" as const,
              title: "库存调整已保存。",
              description:
                "消费项目完成本地校验并更新保存状态；没有调用后端服务。",
            },
          ]
        : []),
    ]
    return result
  }, [values, validated, saved])
  const errors = messageData.filter((message) => message.type === "error")
  const summary = getMessageSummary(messageData)
  const hasQuantityWarning = messageData.some(
    (message) => message.id === "quantity-high"
  )
  const materialMessage = messageData.find(
    (message) => message.id === "material-required"
  )
  const binMessage = messageData.find(
    (message) => message.id === "bin-required"
  )
  const quantityMessage = messageData.find(
    (message) =>
      message.id === "quantity-invalid" || message.id === "quantity-high"
  )
  const noteMessage = messageData.find((message) => message.id === "note-empty")
  const successMessage = messageData.find(
    (message) => message.id === "stock-saved"
  )
  const messages: FioriMessage[] = [
    ...(materialMessage
      ? [{ ...materialMessage, targetRef: materialRef }]
      : []),
    ...(binMessage ? [{ ...binMessage, targetRef: binRef }] : []),
    ...(quantityMessage
      ? [{ ...quantityMessage, targetRef: quantityRef }]
      : []),
    ...(noteMessage ? [{ ...noteMessage, targetRef: noteRef }] : []),
    ...(successMessage ? [successMessage] : []),
  ]

  function submit() {
    setValidated(true)
    setSaved(
      !!values.material.trim() &&
        !!values.bin.trim() &&
        /^\d+$/.test(values.quantity) &&
        Number(values.quantity) > 0
    )
    setOpen(true)
  }
  function update(key: keyof StockValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  return (
    <section className="consumer-section" aria-labelledby="stock-title">
      <h2 id="stock-title">库存表单 · 消息与字段引用</h2>
      <p>校验规则在宿主表单中执行；消息组件只接收消息与字段 ref。</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <FieldGroup className="consumer-field-grid">
          <Field
            data-invalid={!!errors.find((m) => m.id === "material-required")}
          >
            <FieldLabel htmlFor="consumer-stock-material">
              物料编码 <span aria-hidden="true">*</span>
            </FieldLabel>
            <Input
              id="consumer-stock-material"
              ref={materialRef}
              value={values.material}
              onChange={(event) => update("material", event.target.value)}
              required
              aria-invalid={!!errors.find((m) => m.id === "material-required")}
              aria-describedby={
                errors.find((m) => m.id === "material-required")
                  ? "consumer-stock-material-error"
                  : undefined
              }
            />
            {errors.find((m) => m.id === "material-required") && (
              <FieldError id="consumer-stock-material-error">
                请输入物料编码。
              </FieldError>
            )}
          </Field>
          <Field data-invalid={!!errors.find((m) => m.id === "bin-required")}>
            <FieldLabel htmlFor="consumer-stock-bin">
              库位 <span aria-hidden="true">*</span>
            </FieldLabel>
            <Input
              id="consumer-stock-bin"
              ref={binRef}
              value={values.bin}
              onChange={(event) => update("bin", event.target.value)}
              required
              aria-invalid={!!errors.find((m) => m.id === "bin-required")}
              aria-describedby={
                errors.find((m) => m.id === "bin-required")
                  ? "consumer-stock-bin-error"
                  : undefined
              }
            />
            {errors.find((m) => m.id === "bin-required") && (
              <FieldError id="consumer-stock-bin-error">
                请输入库位。
              </FieldError>
            )}
          </Field>
          <Field
            data-invalid={!!errors.find((m) => m.id === "quantity-invalid")}
          >
            <FieldLabel htmlFor="consumer-stock-quantity">
              补货数量 <span aria-hidden="true">*</span>
            </FieldLabel>
            <Input
              id="consumer-stock-quantity"
              ref={quantityRef}
              value={values.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              inputMode="numeric"
              required
              aria-invalid={!!errors.find((m) => m.id === "quantity-invalid")}
              data-value-state={hasQuantityWarning ? "warning" : undefined}
              aria-describedby={
                errors.find((m) => m.id === "quantity-invalid")
                  ? "consumer-stock-quantity-error"
                  : undefined
              }
            />
            {errors.find((m) => m.id === "quantity-invalid") && (
              <FieldError id="consumer-stock-quantity-error">
                补货数量必须是正整数。
              </FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="consumer-stock-note">补货备注</FieldLabel>
            <Input
              id="consumer-stock-note"
              ref={noteRef}
              value={values.note}
              onChange={(event) => update("note", event.target.value)}
            />
          </Field>
        </FieldGroup>
        <div className="consumer-action-row">
          <MessagePopover
            messages={messages}
            open={open}
            onOpenChange={setOpen}
            onActiveTitle={(message) => setLastTarget(message.id)}
            triggerProps={{ id: "stock-message-trigger" }}
          />
          <output data-testid="stock-message-state">
            消息 {summary.total} 条 · 保存状态：{saved ? "已保存" : "未保存"}
          </output>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false)
              setValidated(false)
              setSaved(false)
              setValues(initialStock)
              setLastTarget("尚未定位")
            }}
          >
            重置库存表单
          </Button>
          <Button type="submit">保存库存</Button>
        </div>
        <p className="consumer-readout" data-testid="stock-target-readout">
          标题回调：{lastTarget}
        </p>
      </form>
    </section>
  )
}

function ComparisonRegion({ density }: { density: "compact" | "cozy" }) {
  const [value, setValue] = useState("normal")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messages: FioriMessage[] = [
    {
      id: "comparison-note",
      type: "information",
      title: "定位到对照输入。",
      description: "这条消息属于右侧 Provider，目标和弹层都应保留在本区域。",
      targetRef: inputRef,
    },
  ]
  return (
    <FioriProvider
      density={density}
      className="consumer-comparison"
      id="comparison-provider"
    >
      <h2>并列 Provider</h2>
      <p>独立 {density} 密度</p>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="comparison-input">对照输入</FieldLabel>
          <Input id="comparison-input" ref={inputRef} defaultValue="独立区域" />
        </Field>
        <Field>
          <FieldLabel htmlFor="comparison-select">对照优先级</FieldLabel>
          <Select
            value={value}
            items={[
              { value: "normal", label: "标准" },
              { value: "urgent", label: "加急" },
            ]}
            onValueChange={(next) => setValue(next || "normal")}
          >
            <SelectTrigger id="comparison-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent mobileTitle="对照优先级">
              <SelectGroup>
                <SelectItem value="normal">标准</SelectItem>
                <SelectItem value="urgent">加急</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <div className="consumer-action-row">
        <Button variant="outline" id="comparison-button">
          对照按钮
        </Button>
        <MessagePopover
          messages={messages}
          open={open}
          onOpenChange={setOpen}
          triggerProps={{ id: "comparison-message-trigger" }}
        />
      </div>
      <output data-testid="comparison-selection">当前优先级：{value}</output>
    </FioriProvider>
  )
}

function ComponentDemo() {
  const [density, setDensity] = useState<"compact" | "cozy">("compact")
  const [warehouseIds, setWarehouseIds] = useState<string[]>(["wh-hz-01"])
  const [materialIds, setMaterialIds] = useState<string[]>(["mat-a01"])
  const [conditions, setConditions] =
    useState<ValueHelpCondition[]>(initialConditions)
  const [blockedChanges, setBlockedChanges] = useState(0)
  const [lastValueHelpEvent, setLastValueHelpEvent] = useState("尚未打开")
  const [dismissed, setDismissed] = useState<MessageStripTone[]>([])
  const [hostClicks, setHostClicks] = useState(0)
  const [hostValue, setHostValue] = useState("原生输入保持宿主样式")
  const [delivery, setDelivery] = useState("normal")
  const [selectReadOnly, setSelectReadOnly] = useState(true)
  const matchingBatches = batches.filter((batch) =>
    matchesValueHelpConditions(batch, conditions, "Preserve")
  )

  return (
    <div className="consumer-page">
      <header className="consumer-page-header">
        <div>
          <p className="consumer-eyebrow">本地 Registry 消费验证</p>
          <h1>Fiori 组件独立使用示例</h1>
          <p>
            React 项目通过 shadcn CLI 安装源码，使用自己的仓库、物料与库存数据。
          </p>
        </div>
        <nav className="consumer-header-links" aria-label="消费示例导航">
          <a href="#/inventory">物料库存列表</a>
          <a href="http://127.0.0.1:4178/#/components">返回作者预览</a>
        </nav>
      </header>
      <section className="consumer-host" aria-labelledby="host-title">
        <div>
          <h2 id="host-title">Fiori 区域外的宿主控件</h2>
          <p>原 shadcn Button 与原生输入用于检查字体、颜色、尺寸和变量隔离。</p>
        </div>
        <div className="consumer-host-controls">
          <HostButton
            id="host-shadcn-button"
            onClick={() => setHostClicks((count) => count + 1)}
          >
            宿主按钮
          </HostButton>
          <label htmlFor="host-native-input">
            宿主输入
            <input
              id="host-native-input"
              value={hostValue}
              onChange={(event) => setHostValue(event.target.value)}
            />
          </label>
          <output data-testid="host-click-count">点击 {hostClicks} 次</output>
          <label
            className="consumer-native-toggle"
            htmlFor="host-select-readonly"
          >
            <input
              id="host-select-readonly"
              type="checkbox"
              checked={selectReadOnly}
              onChange={(event) => setSelectReadOnly(event.target.checked)}
            />
            Select 只读
          </label>
          <HostButton
            id="host-lock-select"
            variant="outline"
            onClick={() => setSelectReadOnly(true)}
          >
            锁定 Select
          </HostButton>
        </div>
      </section>
      <div className="consumer-provider-grid">
        <FioriProvider
          density={density}
          className="consumer-primary"
          id="primary-provider"
        >
          <div className="consumer-primary-heading">
            <div>
              <h2>外部数据与受控状态</h2>
              <p>Morning Horizon · {density}</p>
            </div>
            <ToggleGroup
              aria-label="消费项目密度"
              value={[density]}
              onValueChange={(next) => {
                if (next[0] === "compact" || next[0] === "cozy")
                  setDensity(next[0])
              }}
            >
              <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
              <ToggleGroupItem value="cozy">Cozy</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <section
            className="consumer-section"
            aria-labelledby="value-help-title"
          >
            <h2 id="value-help-title">单选仓库与多选物料</h2>
            <p>列顺序、列标题、属性、筛选类型和下拉选项由消费项目定义。</p>
            <FieldGroup className="consumer-field-grid">
              <ValueHelpField
                id="consumer-warehouse"
                label="仓库"
                objectLabel="Warehouse"
                items={warehouses}
                columns={warehouseColumns}
                value={warehouseIds}
                onValueChange={setWarehouseIds}
                selectionMode="single"
                dialogTitle="选择仓库"
                placeholder="输入仓库名称或打开值帮助"
                onOpenChange={(next) =>
                  setLastValueHelpEvent(`仓库${next ? "打开" : "关闭"}`)
                }
              />
              <ValueHelpField
                id="consumer-material"
                label="物料"
                objectLabel="Materials"
                items={materials}
                columns={materialColumns}
                value={materialIds}
                onValueChange={setMaterialIds}
                selectionMode="multiple"
                dialogTitle="选择物料"
                placeholder="选择多项物料"
                onOpenChange={(next) =>
                  setLastValueHelpEvent(`物料${next ? "打开" : "关闭"}`)
                }
              />
            </FieldGroup>
            <div className="consumer-controlled-values">
              <output data-testid="warehouse-value">
                warehouseIds = {JSON.stringify(warehouseIds)}
              </output>
              <output data-testid="material-value">
                materialIds = {JSON.stringify(materialIds)}
              </output>
            </div>
            <div className="consumer-action-row">
              <Button
                variant="outline"
                onClick={() => {
                  setWarehouseIds(["wh-cd-04"])
                  setMaterialIds(["mat-b01", "mat-b02"])
                }}
              >
                宿主设置选择
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setWarehouseIds([])
                  setMaterialIds([])
                }}
              >
                清空选择
              </Button>
              <output data-testid="value-help-open-state">
                回调：{lastValueHelpEvent}
              </output>
            </div>
          </section>
          <section className="consumer-section" aria-labelledby="state-title">
            <h2 id="state-title">禁用、只读与普通 Select</h2>
            <FieldGroup className="consumer-field-grid">
              <ValueHelpField
                id="consumer-readonly"
                label="只读仓库"
                objectLabel="Read-only warehouse"
                items={warehouses}
                columns={warehouseColumns}
                value={["wh-sh-02"]}
                onValueChange={() => setBlockedChanges((count) => count + 1)}
                selectionMode="single"
                readOnly
              />
              <ValueHelpField
                id="consumer-disabled"
                label="禁用仓库"
                objectLabel="Disabled warehouse"
                items={warehouses}
                columns={warehouseColumns}
                value={["wh-cq-05"]}
                onValueChange={() => setBlockedChanges((count) => count + 1)}
                selectionMode="single"
                disabled
              />
              <Field>
                <FieldLabel htmlFor="consumer-priority">补货优先级</FieldLabel>
                <Select
                  value={delivery}
                  items={[
                    { value: "normal", label: "标准" },
                    { value: "urgent", label: "加急" },
                  ]}
                  readOnly={selectReadOnly}
                  onValueChange={(next) => setDelivery(next || "normal")}
                >
                  <SelectTrigger id="consumer-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent mobileTitle="补货优先级">
                    <SelectGroup>
                      <SelectItem value="normal">标准</SelectItem>
                      <SelectItem value="urgent">加急</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="consumer-readonly-input">
                  只读 Input
                </FieldLabel>
                <Input
                  id="consumer-readonly-input"
                  value="系统分配的库存组织"
                  readOnly
                />
              </Field>
            </FieldGroup>
            <p
              className="consumer-readout"
              data-testid="blocked-callback-count"
            >
              只读/禁用修改回调：{blockedChanges} 次 · 优先级：{delivery} ·
              Select只读：{selectReadOnly ? "是" : "否"}
            </p>
          </section>
          <section
            className="consumer-section"
            aria-labelledby="condition-title"
          >
            <h2 id="condition-title">批次范围与排除 · Preserve</h2>
            <p>
              保留大小写；lot-* 与 LOT-* 是不同批次。打开条件框可检查 between
              只填一端时的 Warning。
            </p>
            <ValueHelpConditionsField
              id="consumer-conditions"
              label="批次编码条件"
              objectLabel="Batch codes"
              value={conditions}
              onValueChange={setConditions}
              displayFormat="Preserve"
              placeholder="定义批次范围或排除条件"
            />
            <div className="consumer-controlled-values">
              <output data-testid="condition-value">
                conditions = {JSON.stringify(conditions)}
              </output>
              <output data-testid="condition-tokens">
                条件显示：
                {conditions
                  .map((condition) =>
                    formatValueHelpCondition(condition, "Preserve")
                  )
                  .join("；") || "无"}
              </output>
            </div>
            <div className="consumer-action-row">
              <Button
                variant="outline"
                onClick={() => setConditions(initialConditions)}
              >
                恢复批次条件
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setConditions(
                    initialConditions.filter((condition) => condition.exclude)
                  )
                }
              >
                仅保留排除
              </Button>
            </div>
            <div className="consumer-result-table">
              <Table aria-label="匹配批次">
                <TableHeader>
                  <TableRow>
                    <TableHead>批次编码</TableHead>
                    <TableHead>匹配结果</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch}>
                      <TableCell>{batch}</TableCell>
                      <TableCell>
                        {matchingBatches.includes(batch) ? "包含" : "排除"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <output className="consumer-readout" data-testid="matching-batches">
              匹配 {matchingBatches.length} 条：{matchingBatches.join("、")}
            </output>
          </section>
          <section className="consumer-section" aria-labelledby="strip-title">
            <h2 id="strip-title">四种 MessageStrip</h2>
            <div className="consumer-strip-stack">
              {stripMessages
                .filter((message) => !dismissed.includes(message.tone))
                .map((message) => (
                  <MessageStrip
                    key={message.tone}
                    tone={message.tone}
                    onDismiss={() =>
                      setDismissed((current) => [...current, message.tone])
                    }
                    dismissLabel={`关闭${message.tone}消费消息`}
                  >
                    {message.text}
                  </MessageStrip>
                ))}
            </div>
            {dismissed.length > 0 && (
              <Button variant="ghost" onClick={() => setDismissed([])}>
                恢复消息条
              </Button>
            )}
          </section>
          <StockValidation />
        </FioriProvider>
        <ComparisonRegion
          density={density === "compact" ? "cozy" : "compact"}
        />
      </div>
    </div>
  )
}

export function App() {
  const [path, setPath] = useState(
    () => window.location.hash.slice(1) || "/components"
  )
  useEffect(() => {
    const update = () => setPath(window.location.hash.slice(1) || "/components")
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  return path === "/inventory" || path.startsWith("/inventory/") ? (
    <InventoryDemo
      path={path}
      onNavigate={(next) => {
        window.location.hash = next
      }}
    />
  ) : (
    <ComponentDemo />
  )
}

export default App
