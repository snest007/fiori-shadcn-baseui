import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SapIcon } from "@/components/fiori/sap-icon"
import { ObjectStatus } from "@/components/fiori/object-status"
import { BasicStatePreview } from "@/components/fiori/basic-state-preview"
import { ValueHelpConditionPreview } from "@/components/fiori/value-help-condition-preview"
import { MessageValidationPreview } from "@/components/fiori/message-preview"
import { ValueHelpField } from "@/components/fiori/value-help"
import { valueHelpModels, valueHelpModelColumns } from "@/lib/value-help-models"
import "./gallery.css"

const buttonTypes = [
  { name: "强调", code: "Emphasized", variant: "default", label: "保存" },
  { name: "标准", code: "Standard", variant: "outline", label: "编辑" },
  { name: "透明", code: "Transparent", variant: "ghost", label: "取消" },
  { name: "接受", code: "Accept", variant: "accept", label: "批准" },
  { name: "拒绝", code: "Reject", variant: "reject", label: "拒绝" },
] as const
const tones = [
  {
    tone: "positive",
    name: "成功",
    label: "已完成",
    icon: "status-positive",
    token: "sapPositiveTextColor",
    color: "#256f3a",
  },
  {
    tone: "critical",
    name: "警告",
    label: "待审批",
    icon: "status-critical",
    token: "sapCriticalTextColor",
    color: "#b44f00",
  },
  {
    tone: "negative",
    name: "错误",
    label: "校验失败",
    icon: "status-negative",
    token: "sapNegativeTextColor",
    color: "#aa0808",
  },
  {
    tone: "information",
    name: "信息",
    label: "处理中",
    icon: "information",
    token: "sapInformationColor",
    color: "#0070f2",
  },
  {
    tone: "neutral",
    name: "中性",
    label: "已取消",
    icon: "history",
    token: "sapContent_LabelColor",
    color: "#556b82",
  },
] as const
function SectionHeading({
  title,
  text,
  reference,
}: {
  title: string
  text: string
  reference: string
}) {
  return (
    <div className="gallery-section-heading">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <a
        href={`https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/${reference}`}
        target="_blank"
        rel="noreferrer"
      >
        设计规范 <SapIcon name="navigation-right-arrow" />
      </a>
    </div>
  )
}
function ButtonSpecimens() {
  return (
    <section className="gallery-panel">
      <SectionHeading
        title="按钮 Button"
        text="不同强调级别与语义操作。点击按钮可体验反馈，Tab 可检查焦点状态。"
        reference="button"
      />
      <div className="gallery-button-table">
        <div className="gallery-button-table-head">
          <span>类型</span>
          <span>默认</span>
          <span>悬停</span>
          <span>按下</span>
          <span>禁用</span>
        </div>
        {buttonTypes.map((t) => (
          <div className="gallery-button-table-row" key={t.variant}>
            <div className="gallery-component-label">
              <strong>{t.name}</strong>
              <small>{t.code}</small>
            </div>
            {["regular", "hover", "pressed", "disabled"].map((state) => (
              <div className="state-sample" data-demo-state={state} key={state}>
                <Button
                  variant={t.variant}
                  disabled={state === "disabled"}
                  onClick={() => toast.success(`${t.label}操作已触发`)}
                >
                  {t.label}
                </Button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="gallery-inline-demos">
        <div>
          <small>文本与图标</small>
          <Button
            variant="outline"
            onClick={() => toast.success("已创建演示条目")}
          >
            <SapIcon name="add" data-icon="inline-start" />
            创建
          </Button>
        </div>
        <div>
          <small>图标按钮</small>
          <Button
            variant="ghost"
            size="icon"
            aria-label="设置"
            title="设置"
            onClick={() => toast("设置按钮已触发")}
          >
            <SapIcon name="action-settings" />
          </Button>
        </div>
        <div>
          <small>菜单按钮</small>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>
              更多操作
              <SapIcon name="slim-arrow-down" data-icon="inline-end" />
            </PopoverTrigger>
            <PopoverContent>
              <div className="gallery-menu">
                <Button
                  variant="ghost"
                  onClick={() => toast.success("已复制演示内容")}
                >
                  <SapIcon name="copy" data-icon="inline-start" />
                  复制
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => toast("请在订单列表体验导出")}
                >
                  <SapIcon name="excel-attachment" data-icon="inline-start" />
                  导出
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </section>
  )
}
function InputSpecimens() {
  const [value, setValue] = useState("SO-100428")
  const [model, setModel] = useState<string[]>([])
  return (
    <section className="gallery-panel">
      <SectionHeading
        title="输入框 Input"
        text="统一字段状态、可访问标签与错误提示。所有可编辑状态都支持真实输入。"
        reference="input-field"
      />
      <FieldGroup className="gallery-field-grid">
        <Field>
          <FieldLabel htmlFor="demo-placeholder">默认 · Placeholder</FieldLabel>
          <Input id="demo-placeholder" placeholder="请输入订单编号" />
        </Field>
        <Field>
          <FieldLabel htmlFor="demo-typed">已输入 · Typed</FieldLabel>
          <Input
            id="demo-typed"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <ValueHelpField
          id="demo-valuehelp"
          label="值帮助 · Value Help"
          objectLabel="型号"
          placeholder="输入型号或打开值帮助"
          items={valueHelpModels}
          columns={valueHelpModelColumns}
          selectionMode="single"
          value={model}
          onValueChange={setModel}
        />
        <Field data-invalid>
          <FieldLabel htmlFor="demo-error">
            错误 · Error <span aria-hidden="true">*</span>
          </FieldLabel>
          <Input
            id="demo-error"
            placeholder="请输入客户名称"
            aria-invalid="true"
            aria-describedby="demo-error-message"
            data-value-state="error"
          />
          <FieldError id="demo-error-message">客户名称为必填项</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="demo-warning">警告 · Warning</FieldLabel>
          <Input
            id="demo-warning"
            defaultValue="2026-11-05"
            data-value-state="warning"
          />
          <FieldDescription>交付日期临近，请确认库存</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="demo-success">成功 · Success</FieldLabel>
          <Input
            id="demo-success"
            defaultValue="校验通过"
            data-value-state="success"
          />
          <FieldDescription>客户编号已验证</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="demo-information">信息 · Information</FieldLabel>
          <Input
            id="demo-information"
            defaultValue="华东销售组织"
            data-value-state="information"
          />
          <FieldDescription>可根据业务需要调整</FieldDescription>
        </Field>
        <Field data-disabled>
          <FieldLabel htmlFor="demo-disabled">禁用 · Disabled</FieldLabel>
          <Input id="demo-disabled" defaultValue="不可用字段" disabled />
        </Field>
        <Field>
          <FieldLabel htmlFor="demo-readonly">只读 · Read Only</FieldLabel>
          <Input id="demo-readonly" value="系统自动生成" readOnly />
        </Field>
      </FieldGroup>
    </section>
  )
}
function SelectionSpecimens() {
  const [auto, setAuto] = useState(true)
  const [checked, setChecked] = useState(true)
  const [delivery, setDelivery] = useState("standard")
  const [segments, setSegments] = useState<string[]>(["list"])
  const [region, setRegion] = useState("华东销售组织")
  return (
    <section className="gallery-panel">
      <SectionHeading
        title="选择与切换 Selection"
        text="选择状态、键盘导航与触摸热区沿用 Base UI 行为，并使用 Fiori 视觉。"
        reference="selection-controls"
      />
      <div className="gallery-selection-grid">
        <FieldSet>
          <FieldLegend>复选框 Checkbox</FieldLegend>
          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox
                id="demo-checkbox"
                checked={checked}
                onCheckedChange={setChecked}
              />
              <FieldLabel htmlFor="demo-checkbox">包含待审批订单</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="demo-unchecked" />
              <FieldLabel htmlFor="demo-unchecked">包含已完成订单</FieldLabel>
            </Field>
            <Field orientation="horizontal" data-disabled>
              <Checkbox id="demo-disabled-check" disabled />
              <FieldLabel htmlFor="demo-disabled-check">已取消订单</FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>单选框 Radio</FieldLegend>
          <RadioGroup
            value={delivery}
            onValueChange={setDelivery}
            aria-label="配送方式"
          >
            <Field orientation="horizontal">
              <RadioGroupItem id="delivery-standard" value="standard" />
              <FieldLabel htmlFor="delivery-standard">标准配送</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem id="delivery-express" value="express" />
              <FieldLabel htmlFor="delivery-express">优先配送</FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="demo-switch">自动发送交付提醒</FieldLabel>
            <Switch id="demo-switch" checked={auto} onCheckedChange={setAuto} />
          </Field>
          <FieldDescription>
            {auto ? "将在交付前 3 天发送提醒" : "交付提醒已关闭"}
          </FieldDescription>
          <Field>
            <FieldLabel htmlFor="demo-select">销售组织</FieldLabel>
            <Select value={region} onValueChange={(v) => v && setRegion(v)}>
              <SelectTrigger id="demo-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {["华东销售组织", "华南销售组织", "华北销售组织"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <FieldGroup>
          <Field>
            <FieldLabel>分段按钮 Segmented Button</FieldLabel>
            <ToggleGroup
              value={segments}
              onValueChange={(v) => v.length && setSegments(v)}
              aria-label="展示方式"
            >
              <ToggleGroupItem value="list">
                <SapIcon name="detail-view" data-icon="inline-start" />
                列表
              </ToggleGroupItem>
              <ToggleGroupItem value="grid">
                <SapIcon name="grid" data-icon="inline-start" />
                网格
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <FieldDescription>
            当前：{segments[0] === "list" ? "列表视图" : "网格视图"}
          </FieldDescription>
        </FieldGroup>
      </div>
    </section>
  )
}
function MessageSpecimens() {
  return (
    <section className="gallery-panel">
      <SectionHeading
        title="消息与状态 Messaging"
        text="用语义颜色表达状态，避免只依赖颜色传达信息。"
        reference="message-strip"
      />
      <div className="gallery-status-row">
        {tones.map((t) => (
          <div key={t.tone}>
            <small>{t.name}</small>
            <ObjectStatus tone={t.tone} icon>
              {t.label}
            </ObjectStatus>
          </div>
        ))}
      </div>
      <div className="gallery-messages">
        {tones
          .filter((t) => t.tone !== "neutral")
          .map((t) => (
            <Alert key={t.tone} data-tone={t.tone}>
              <SapIcon name={t.icon} />
              <AlertTitle>
                {
                  {
                    positive: "订单已保存，可以继续处理其他订单。",
                    critical: "部分产品库存不足，请确认交付计划。",
                    negative: "无法保存，请补充客户名称和交付日期。",
                    information: "筛选条件已修改，请点击「执行」刷新结果。",
                  }[t.tone]
                }
              </AlertTitle>
            </Alert>
          ))}
      </div>
      <div className="gallery-inline-demos">
        <div>
          <small>短暂反馈 Toast</small>
          <Button variant="outline" onClick={() => toast.success("订单已保存")}>
            <SapIcon name="accept" data-icon="inline-start" />
            显示成功消息
          </Button>
        </div>
        <div>
          <small>对话框 Dialog</small>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              打开对话框
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认提交订单</DialogTitle>
                <DialogDescription>
                  提交后，订单将进入审批流程。
                </DialogDescription>
              </DialogHeader>
              <div className="gallery-dialog-body">
                请确认订单的客户、产品与交付日期。此操作用于交互演示。
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" />}>
                  取消
                </DialogClose>
                <DialogClose
                  render={<Button />}
                  onClick={() => toast.success("订单已提交")}
                >
                  提交
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
function FoundationSpecimens() {
  return (
    <section className="gallery-panel">
      <SectionHeading
        title="设计基础 Foundations"
        text="Morning Horizon 语义参数与 SAP 72 字体。中文使用系统字体回退。"
        reference="text"
      />
      <div className="gallery-foundation-grid">
        <div className="gallery-type-scale">
          <div>
            <small>页面标题 · 24 / Black</small>
            <h1>销售订单 Sales Orders</h1>
          </div>
          <div>
            <small>分区标题 · 20 / Bold</small>
            <h2>基本信息 General Information</h2>
          </div>
          <div>
            <small>正文 · 14 / Regular</small>
            <p>一致的外观与交互，让业务操作更清晰。</p>
            <p>Coherent experiences for everyday business.</p>
          </div>
          <div>
            <small>标签 · 14 / Regular</small>
            <label>销售组织 Sales Organization</label>
          </div>
        </div>
        <div className="gallery-swatches">
          {[
            {
              name: "交互蓝",
              token: "sapButton_Emphasized_Background",
              color: "#0070f2",
            },
            { name: "页面背景", token: "sapBackgroundColor", color: "#f5f6f7" },
            {
              name: "内容表面",
              token: "sapGroup_ContentBackground",
              color: "#ffffff",
            },
            ...tones.slice(0, 3),
          ].map((t) => (
            <div className="gallery-swatch" key={t.token}>
              <span style={{ background: t.color }} />
              <div>
                <strong>{t.name}</strong>
                <code>{t.token}</code>
              </div>
              <small>{t.color.toUpperCase()}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
function ValueHelpSpecimens() {
  const [model, setModel] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  return (
    <section className="gallery-panel">
      <SectionHeading
        title="值帮助 Value Help"
        text="36条虚构型号目录，支持按编号、名称、制造商与轴数查找。"
        reference="value-help-dialog"
      />
      <FieldGroup className="gallery-value-help-grid">
        <FieldSet>
          <FieldLegend>单选 · Single Selection</FieldLegend>
          <ValueHelpField
            id="value-help-single"
            label="型号"
            placeholder="输入型号或打开值帮助"
            items={valueHelpModels}
            columns={valueHelpModelColumns}
            selectionMode="single"
            value={model}
            onValueChange={setModel}
          />
          <FieldDescription>选择一行后直接回填并关闭弹窗。</FieldDescription>
        </FieldSet>
        <FieldSet>
          <FieldLegend>多选 · Multiple Selection</FieldLegend>
          <ValueHelpField
            id="value-help-multiple"
            label="型号"
            placeholder="输入型号或打开值帮助"
            items={valueHelpModels}
            columns={valueHelpModelColumns}
            selectionMode="multiple"
            value={models}
            onValueChange={setModels}
          />
          <FieldDescription>确定后回填所选值；取消保留原值。</FieldDescription>
        </FieldSet>
      </FieldGroup>
      <ValueHelpConditionPreview />
      <p className="gallery-value-help-boundary">
        支持单选、多选、独立范围与排除条件；服务端查询尚未接入。
      </p>
    </section>
  )
}

export function ComponentGallery() {
  return (
    <div className="component-gallery">
      <div className="gallery-page-header">
        <div className="gallery-breadcrumb">
          <span>设计实验室</span>
          <span>/</span>
          <span>组件与状态</span>
        </div>
        <div className="gallery-title-row">
          <div>
            <h1>组件与状态</h1>
            <p>探索 Fiori 基础组件的外观、交互与设计参数</p>
          </div>
          <Badge variant="outline">Morning Horizon</Badge>
        </div>
      </div>
      <Tabs defaultValue="controls" className="gallery-tabs">
        <div className="gallery-navigation">
          <TabsList variant="line">
            <TabsTrigger value="controls">基础控件</TabsTrigger>
            <TabsTrigger value="value-help">值帮助</TabsTrigger>
            <TabsTrigger value="messaging">消息与反馈</TabsTrigger>
            <TabsTrigger value="foundations">设计基础</TabsTrigger>
          </TabsList>
          <span>shadcn / Base UI</span>
        </div>
        <TabsContent value="controls">
          <div className="gallery-content">
            <ButtonSpecimens />
            <InputSpecimens />
            <SelectionSpecimens />
            <BasicStatePreview />
          </div>
        </TabsContent>
        <TabsContent value="value-help">
          <div className="gallery-content">
            <ValueHelpSpecimens />
          </div>
        </TabsContent>
        <TabsContent value="messaging">
          <div className="gallery-content">
            <MessageSpecimens />
            <MessageValidationPreview />
          </div>
        </TabsContent>
        <TabsContent value="foundations">
          <div className="gallery-content">
            <FoundationSpecimens />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
