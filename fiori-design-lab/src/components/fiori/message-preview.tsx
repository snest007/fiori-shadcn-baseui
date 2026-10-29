import { useId, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { SapIcon } from "@/components/fiori/sap-icon"
import { MessagePopover, type FioriMessage } from "./message-popover"
import "./message-preview.css"

type FormValues = {
  customer: string
  email: string
  quantity: string
  note: string
}
const initialValues: FormValues = {
  customer: "",
  email: "sales@",
  quantity: "25",
  note: "",
}

export function MessageValidationPreview() {
  const prefix = useId().replace(/:/g, "")
  const [values, setValues] = useState<FormValues>(initialValues)
  const [validated, setValidated] = useState(false)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)
  const fields = useRef(new Map<string, HTMLInputElement>())
  const messages = useMemo(() => {
    if (!validated) return []
    const result: FioriMessage[] = []
    if (!values.customer.trim())
      result.push({
        id: "customer",
        type: "error",
        title: "请输入客户名称。",
        subtitle: "客户名称",
        description: "客户名称为必填项。输入客户名称后重新保存。",
        target: `${prefix}-customer`,
      })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      result.push({
        id: "email",
        type: "error",
        title: "请输入有效的电子邮件地址。",
        subtitle: "电子邮件",
        description:
          "电子邮件地址应包含收件人、@ 和域名，例如 sales@example.com。",
        target: `${prefix}-email`,
      })
    if (!/^\d+$/.test(values.quantity) || Number(values.quantity) < 1)
      result.push({
        id: "quantity",
        type: "error",
        title: "订购数量必须是正整数。",
        subtitle: "订购数量",
        description: "请输入大于或等于1的整数。",
        target: `${prefix}-quantity`,
      })
    else if (Number(values.quantity) > 10)
      result.push({
        id: "quantity",
        type: "warning",
        title: "订购数量超过建议数量。",
        subtitle: "订购数量",
        description: "建议单次订购不超过10件。确认数量后仍可保存。",
        target: `${prefix}-quantity`,
      })
    if (!values.note.trim())
      result.push({
        id: "note",
        type: "information",
        title: "未填写备注。",
        subtitle: "备注",
        description: "备注为选填项，可补充交付要求。",
        target: `${prefix}-note`,
      })
    if (saved)
      result.push({
        id: "saved",
        type: "success",
        title: "表单已保存。",
        description: "全部必填字段已通过校验。",
      })
    return result
  }, [values, validated, saved, prefix])
  const errors = messages.filter((message) => message.type === "error")
  const fieldLabels: Record<keyof FormValues, string> = {
    customer: "客户名称",
    email: "电子邮件",
    quantity: "订购数量",
    note: "备注",
  }

  function submit() {
    setValidated(true)
    const hasErrors =
      !values.customer.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ||
      !/^\d+$/.test(values.quantity) ||
      Number(values.quantity) < 1
    setSaved(!hasErrors)
    if (hasErrors) setOpen(true)
    else toast.success("表单已保存。")
  }

  return (
    <section
      className="gallery-panel message-validation-preview"
      aria-labelledby={`${prefix}-title`}
    >
      <div className="gallery-section-heading">
        <div>
          <h2 id={`${prefix}-title`}>消息汇总与错误定位 Message Popover</h2>
          <p>字段校验、消息分类、详情与错误字段定位。</p>
        </div>
        <a
          href="https://ui5.sap.com/1.151.0/#/entity/sap.m.MessagePopover/sample/sap.m.sample.MessagePopover"
          target="_blank"
          rel="noreferrer"
        >
          官方示例
          <SapIcon name="navigation-right-arrow" />
        </a>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <FieldGroup className="message-validation-fields">
          {(Object.keys(fieldLabels) as (keyof FormValues)[]).map((key) => {
            const error = errors.find((message) => message.id === key)
            const warning =
              key === "quantity" &&
              messages.find(
                (message) => message.id === key && message.type === "warning"
              )
            const id = `${prefix}-${key}`
            return (
              <Field key={key} data-invalid={!!error}>
                <FieldLabel htmlFor={id}>
                  {fieldLabels[key]}
                  {key !== "note" && <span aria-hidden="true">*</span>}
                </FieldLabel>
                <Input
                  id={id}
                  ref={(element) => {
                    if (element) fields.current.set(id, element)
                    else fields.current.delete(id)
                  }}
                  value={values[key]}
                  inputMode={
                    key === "quantity"
                      ? "numeric"
                      : key === "email"
                        ? "email"
                        : "text"
                  }
                  required={key !== "note"}
                  aria-invalid={!!error}
                  aria-describedby={
                    error
                      ? `${id}-error`
                      : warning
                        ? `${id}-warning`
                        : undefined
                  }
                  data-value-state={warning ? "warning" : undefined}
                  onChange={(event) => {
                    setValues((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                    setSaved(false)
                  }}
                />
                {error && (
                  <FieldError id={`${id}-error`}>{error.title}</FieldError>
                )}
                {warning && (
                  <p id={`${id}-warning`} className="message-field-warning">
                    {warning.title}
                  </p>
                )}
              </Field>
            )
          })}
        </FieldGroup>
        <div
          className="message-validation-footer"
          role="toolbar"
          aria-label="表单操作"
        >
          <MessagePopover
            messages={messages}
            open={open}
            onOpenChange={setOpen}
            resolveTarget={(message) =>
              fields.current.get(message.target || "") || null
            }
          />
          <span className="message-view-spacer" />
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setOpen(false)
              setValues(initialValues)
              setValidated(false)
              setSaved(false)
            }}
          >
            重置示例
          </Button>
          <Button type="submit">保存</Button>
        </div>
      </form>
    </section>
  )
}
