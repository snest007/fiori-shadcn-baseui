import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ObjectStatus, type StatusTone } from "./object-status"
import { MessageStrip } from "./message-strip"
import "./basic-state-preview.css"

type ValueState = "error" | "warning" | "success" | "information"
const states: {
  label: string
  state?: ValueState
  disabled?: boolean
  readOnly?: boolean
}[] = [
  { label: "标准" },
  { label: "只读", readOnly: true },
  { label: "禁用", disabled: true },
  { label: "错误", state: "error" },
  { label: "警告", state: "warning" },
  { label: "成功", state: "success" },
  { label: "信息", state: "information" },
]
const options = [
  { value: "standard", label: "标准" },
  { value: "express", label: "加急" },
  { value: "unavailable", label: "不可用" },
]

function StateSelect({
  label,
  state,
  disabled,
  readOnly,
}: (typeof states)[number]) {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        defaultValue="standard"
        items={options}
        disabled={disabled}
        readOnly={readOnly}
      >
        <SelectTrigger
          id={id}
          aria-label={`Select ${label}`}
          data-value-state={state}
          aria-invalid={state === "error" || undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent mobileTitle="选择处理方式" alignItemWithTrigger={false}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.value === "unavailable"}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function DialogStatePreview() {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState("标准")
  const [draft, setDraft] = useState(saved)
  return (
    <div className="basic-dialog-preview">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(saved)
          setOpen(next)
        }}
      >
        <DialogTrigger render={<Button variant="outline" />}>
          打开标准 Dialog
        </DialogTrigger>
        <DialogContent
          className="basic-standard-dialog"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>编辑名称</DialogTitle>
          </DialogHeader>
          <form
            id="basic-dialog-form"
            className="basic-dialog-body"
            onSubmit={(event) => {
              event.preventDefault()
              setSaved(draft.trim())
              setOpen(false)
            }}
          >
            <DialogDescription>
              输入名称，然后选择保存或取消。
            </DialogDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="basic-dialog-name">名称</FieldLabel>
                <Input
                  id="basic-dialog-name"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  required
                  pattern=".*\S.*"
                />
              </Field>
              <StateSelect label="标准" />
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="submit" form="basic-dialog-form">
              保存
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <span role="status" data-testid="basic-dialog-saved">
        已保存：{saved}
      </span>
    </div>
  )
}

const messages: {
  tone: Exclude<StatusTone, "neutral">
  label: string
  icon: string
  text: string
}[] = [
  {
    tone: "information",
    label: "信息",
    icon: "information",
    text: "这是一条信息。",
  },
  {
    tone: "positive",
    label: "成功",
    icon: "sys-enter-2",
    text: "更改已保存。",
  },
  { tone: "critical", label: "警告", icon: "alert", text: "请检查输入值。" },
  { tone: "negative", label: "错误", icon: "error", text: "无法保存更改。" },
]

function MessageStripStatePreview() {
  const [dismissed, setDismissed] = useState<StatusTone[]>([])
  return (
    <div className="basic-message-strips">
      {messages
        .filter((message) => !dismissed.includes(message.tone))
        .map((message) => (
          <MessageStrip
            key={message.tone}
            tone={message.tone}
            aria-label={`${message.label}，可关闭。${message.text}`}
            data-testid={`basic-strip-${message.tone}`}
            dismissLabel={`关闭${message.label}消息`}
            onDismiss={() =>
              setDismissed((previous) => [...previous, message.tone])
            }
            link={
              message.tone === "information"
                ? {
                    "aria-label": "这是一条信息。了解更多",
                    href: "https://ui5.sap.com/1.151.0/#/entity/sap.m.MessageStrip",
                    target: "_blank",
                    rel: "noreferrer",
                    children: "了解更多",
                  }
                : undefined
            }
          >
            {message.text}
          </MessageStrip>
        ))}
      {dismissed.length > 0 && (
        <Button variant="outline" onClick={() => setDismissed([])}>
          恢复消息
        </Button>
      )}
    </div>
  )
}

export function BasicStatePreview() {
  const [presses, setPresses] = useState(0)
  const [checked, setChecked] = useState(false)
  const [choice, setChoice] = useState("a")
  const [partial, setPartial] = useState(true)
  const [partialChecked, setPartialChecked] = useState(false)
  return (
    <div className="basic-state-preview" data-testid="basic-state-preview">
      <section
        className="basic-state-section"
        aria-labelledby="basic-action-title"
      >
        <h3 id="basic-action-title">Button 与 Input 状态</h3>
        <div className="basic-action-row">
          <Button
            variant="outline"
            onClick={() => setPresses((value) => value + 1)}
          >
            标准按钮
          </Button>
          <Button onClick={() => setPresses((value) => value + 1)}>
            强调按钮
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPresses((value) => value + 1)}
          >
            透明按钮
          </Button>
          <Button variant="outline" disabled>
            禁用按钮
          </Button>
          <span role="status">触发 {presses} 次</span>
        </div>
        <FieldGroup className="basic-state-fields">
          {states.map(({ label, state, disabled, readOnly }) => (
            <Field key={label}>
              <FieldLabel htmlFor={`basic-input-${label}`}>
                Input {label}
              </FieldLabel>
              <Input
                id={`basic-input-${label}`}
                aria-label={`Input ${label}`}
                defaultValue="示例文本"
                data-value-state={state}
                aria-invalid={state === "error" || undefined}
                disabled={disabled}
                readOnly={readOnly}
              />
            </Field>
          ))}
        </FieldGroup>
      </section>
      <section
        className="basic-state-section"
        aria-labelledby="basic-selection-title"
      >
        <h3 id="basic-selection-title">Checkbox 与 RadioButton 状态</h3>
        <div className="basic-selection-matrix">
          <FieldSet>
            <FieldLegend variant="label">Checkbox</FieldLegend>
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox
                  id="basic-checkbox-standard"
                  checked={checked}
                  onCheckedChange={setChecked}
                />
                <FieldLabel htmlFor="basic-checkbox-standard">标准</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="basic-checkbox-indeterminate"
                  checked={partialChecked}
                  indeterminate={partial}
                  onCheckedChange={(next) => {
                    setPartial(false)
                    setPartialChecked(next)
                  }}
                />
                <FieldLabel htmlFor="basic-checkbox-indeterminate">
                  部分选中
                </FieldLabel>
              </Field>
              {states.slice(1).map(({ label, state, disabled, readOnly }) => (
                <Field key={label} orientation="horizontal">
                  <Checkbox
                    id={`basic-checkbox-${label}`}
                    defaultChecked
                    disabled={disabled}
                    readOnly={readOnly}
                    data-value-state={state}
                    aria-invalid={state === "error" || undefined}
                  />
                  <FieldLabel htmlFor={`basic-checkbox-${label}`}>
                    {label}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend variant="label">RadioButton</FieldLegend>
            <FieldGroup>
              {states.map(({ label, state, disabled, readOnly }) => (
                <FieldSet key={label} className="basic-radio-state">
                  <FieldLegend variant="label">{label}</FieldLegend>
                  <RadioGroup
                    className="basic-radio-pair"
                    aria-label={`RadioButton ${label}`}
                    value={label === "标准" ? choice : undefined}
                    defaultValue={label === "标准" ? undefined : "a"}
                    onValueChange={label === "标准" ? setChoice : undefined}
                    disabled={disabled}
                    readOnly={readOnly}
                  >
                    {["a", "b"].map((value, index) => (
                      <Field key={value} orientation="horizontal">
                        <RadioGroupItem
                          id={`basic-radio-${label}-${value}`}
                          value={value}
                          data-value-state={state}
                          aria-invalid={state === "error" || undefined}
                        />
                        <FieldLabel htmlFor={`basic-radio-${label}-${value}`}>
                          选项 {index + 1}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
                </FieldSet>
              ))}
            </FieldGroup>
          </FieldSet>
        </div>
        <FieldDescription role="status">
          Checkbox：{checked ? "选中" : "未选中"}；RadioButton：选项{" "}
          {choice === "a" ? 1 : 2}
        </FieldDescription>
      </section>
      <section
        className="basic-state-section"
        aria-labelledby="basic-select-title"
      >
        <h3 id="basic-select-title">Select 状态</h3>
        <FieldGroup className="basic-state-fields">
          {states.map((state) => (
            <StateSelect key={state.label} {...state} />
          ))}
        </FieldGroup>
      </section>
      <section
        className="basic-state-section"
        aria-labelledby="basic-dialog-title"
      >
        <h3 id="basic-dialog-title">Dialog</h3>
        <DialogStatePreview />
      </section>
      <section
        className="basic-state-section"
        aria-labelledby="basic-feedback-title"
      >
        <h3 id="basic-feedback-title">MessageStrip 与 ObjectStatus</h3>
        <MessageStripStatePreview />
        <div className="basic-status-row">
          <ObjectStatus tone="neutral">无状态</ObjectStatus>
          {messages.map((message) => (
            <ObjectStatus key={message.tone} tone={message.tone} icon>
              {message.label}
            </ObjectStatus>
          ))}
        </div>
      </section>
    </div>
  )
}
