import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { Badge } from "@/components/fiori/ui/badge"
import { Button } from "@/components/fiori/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/fiori/ui/dialog"
import { Field, FieldLabel } from "@/components/fiori/ui/field"
import { Input } from "@/components/fiori/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/fiori/ui/input-group"
import { SapIcon } from "@/components/fiori/sap-icon"
import { ValueHelpConditionOperator } from "./value-help-condition-operator"
import {
  formatValueHelpCondition,
  isCompleteValueHelpCondition,
  missingValueHelpOperands,
  normalizeValueHelpCondition,
  normalizeValueHelpOperand,
  type ValueHelpDisplayFormat,
  type ValueHelpCondition,
} from "@/lib/fiori/value-help-conditions"
export type {
  ValueHelpCondition,
  ValueHelpDisplayFormat,
  ValueHelpOperation,
} from "@/lib/fiori/value-help-conditions"
import "./value-help.css"
import "./value-help-conditions.css"
import { cn } from "cn"

export type ValueHelpConditionsFieldProps = {
  id: string
  label: string
  objectLabel?: string
  value: readonly ValueHelpCondition[]
  onValueChange: (conditions: ValueHelpCondition[]) => void
  displayFormat?: ValueHelpDisplayFormat
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
  onOpenChange?: (open: boolean) => void
}

// An independent supportRangesOnly-style value help. Shadcn wrappers and
// Base UI own the modal/combobox semantics; no UI5 controls enter the app bundle.
export function ValueHelpConditionsField({
  id,
  label,
  objectLabel = label,
  value,
  onValueChange,
  displayFormat = "UpperCase",
  placeholder = "Define range or exclusion conditions",
  disabled = false,
  readOnly = false,
  className,
  onOpenChange,
}: ValueHelpConditionsFieldProps) {
  const conditionNamespace = useId()
  const sourceRef = useRef<HTMLInputElement>(null)
  const firstOperationRef = useRef<HTMLInputElement>(null)
  const warningOkRef = useRef<HTMLButtonElement>(null)
  const invalidOperandRef = useRef<HTMLInputElement | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const sourceTokenRefs = useRef(new Map<string, HTMLButtonElement>())
  const nextCondition = useRef(0)
  const [open, setOpen] = useState(false)
  const [warningOpen, setWarningOpen] = useState(false)
  const [draft, setDraft] = useState<ValueHelpCondition[]>([])
  const [validated, setValidated] = useState(false)
  const [invalidOperations, setInvalidOperations] = useState<Set<string>>(
    new Set()
  )
  const [announcement, setAnnouncement] = useState("")
  const [phone, setPhone] = useState(
    () =>
      typeof window !== "undefined" && matchMedia("(max-width: 599px)").matches
  )
  const committed = value.filter(isCompleteValueHelpCondition)
  const selectedDraft = draft.filter(
    (condition) =>
      isCompleteValueHelpCondition(condition) &&
      !invalidOperations.has(condition.id)
  )
  const formId = `${id}-condition-form`

  useEffect(() => {
    const media = matchMedia("(max-width: 599px)")
    const change = () => setPhone(media.matches)
    media.addEventListener("change", change)
    return () => media.removeEventListener("change", change)
  }, [])

  useEffect(() => {
    if (!open || (!disabled && !readOnly)) return
    const frame = requestAnimationFrame(() => {
      setOpen(false)
      setWarningOpen(false)
      onOpenChange?.(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [disabled, readOnly, open, onOpenChange])

  function emptyCondition(previous?: ValueHelpCondition): ValueHelpCondition {
    return {
      id: `${id}${conditionNamespace}-condition-${++nextCondition.current}`,
      operation: previous?.operation ?? "Contains",
      exclude: previous?.exclude ?? false,
      value1: "",
      value2: "",
    }
  }

  function changeOpen(next: boolean) {
    if (next && (disabled || readOnly)) return
    if (next) {
      const nextDraft = committed.map((condition) =>
        normalizeValueHelpCondition(condition, displayFormat)
      )
      setDraft(nextDraft.length ? nextDraft : [emptyCondition()])
      setValidated(false)
      setInvalidOperations(new Set())
      setAnnouncement("")
    } else {
      setWarningOpen(false)
    }
    setOpen(next)
    onOpenChange?.(next)
  }

  function commit() {
    if (disabled || readOnly) return
    onValueChange(
      draft
        .filter(
          (condition) =>
            isCompleteValueHelpCondition(condition) &&
            !invalidOperations.has(condition.id)
        )
        .map((condition) =>
          normalizeValueHelpCondition(condition, displayFormat)
        )
    )
    changeOpen(false)
  }

  function requestCommit() {
    setValidated(true)
    const incomplete = draft.find(
      (condition) =>
        missingValueHelpOperands(condition).length ||
        invalidOperations.has(condition.id)
    )
    if (incomplete) {
      const operand = missingValueHelpOperands(incomplete)[0]
      invalidOperandRef.current =
        rowRefs.current
          .get(incomplete.id)
          ?.querySelector<HTMLInputElement>(
            invalidOperations.has(incomplete.id)
              ? "[data-condition-operator-input]"
              : `[data-operand="${operand}"]`
          ) ?? null
      setWarningOpen(true)
      return
    }
    commit()
  }

  function updateCondition(
    conditionId: string,
    patch: Partial<ValueHelpCondition>
  ) {
    setDraft((current) =>
      current.map((condition) =>
        condition.id === conditionId ? { ...condition, ...patch } : condition
      )
    )
  }

  function removeCondition(conditionId: string) {
    const index = draft.findIndex((condition) => condition.id === conditionId)
    const remaining = draft.filter((condition) => condition.id !== conditionId)
    const next = remaining.length ? remaining : [emptyCondition(draft[index])]
    setDraft(next)
    setAnnouncement("Condition removed")
    requestAnimationFrame(() =>
      rowRefs.current
        .get(next[Math.min(index, next.length - 1)].id)
        ?.querySelector<HTMLButtonElement>("[data-condition-remove]")
        ?.focus()
    )
  }

  function addCondition() {
    const added = emptyCondition(draft.at(-1))
    setDraft((current) => [...current, added])
    setAnnouncement("Condition added")
    requestAnimationFrame(() =>
      rowRefs.current
        .get(added.id)
        ?.querySelector<HTMLInputElement>("[data-condition-operator-input]")
        ?.focus()
    )
  }

  function removeToken(conditionId: string, inside: boolean) {
    if (inside) {
      removeCondition(conditionId)
      return
    }
    if (disabled || readOnly) return
    onValueChange(committed.filter((condition) => condition.id !== conditionId))
    requestAnimationFrame(() => sourceRef.current?.focus())
  }

  function sourceTokenKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    const targetIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? committed.length - 1
          : event.key === "ArrowLeft"
            ? index - 1
            : event.key === "ArrowRight"
              ? index + 1
              : null
    if (targetIndex !== null) {
      event.preventDefault()
      if (targetIndex < 0) sourceTokenRefs.current.get(committed[0].id)?.focus()
      else if (targetIndex >= committed.length) sourceRef.current?.focus()
      else sourceTokenRefs.current.get(committed[targetIndex].id)?.focus()
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault()
      removeToken(committed[index].id, false)
    }
  }

  function token(
    condition: ValueHelpCondition,
    inside: boolean,
    index: number
  ) {
    const text = formatValueHelpCondition(condition, displayFormat)
    return (
      <Badge key={condition.id} variant="outline" className="value-help-token">
        <span className="value-help-token-label" title={text}>
          {text}
        </span>
        {(inside || (!disabled && !readOnly)) && (
          <Button
            ref={
              inside
                ? undefined
                : (button) => {
                    if (button)
                      sourceTokenRefs.current.set(condition.id, button)
                    else sourceTokenRefs.current.delete(condition.id)
                  }
            }
            variant="ghost"
            size="icon-xs"
            className="value-help-token-remove"
            aria-label={`Remove ${text}`}
            title={`Remove ${text}`}
            onClick={() => removeToken(condition.id, inside)}
            onKeyDown={
              inside ? undefined : (event) => sourceTokenKeyDown(event, index)
            }
          >
            <SapIcon name="decline" />
          </Button>
        )}
      </Badge>
    )
  }

  return (
    <Dialog
      open={open && !disabled && !readOnly}
      onOpenChange={changeOpen}
      modal
    >
      <Field
        className={cn("value-help-field", className)}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
      >
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <InputGroup className="value-help-source-input value-help-source-input-multiple">
          <InputGroupInput
            id={id}
            ref={sourceRef}
            value=""
            readOnly
            disabled={disabled}
            autoComplete="off"
            placeholder={committed.length ? "" : placeholder}
            aria-haspopup="dialog"
            onClick={() => changeOpen(true)}
            onKeyDown={(event) => {
              if (
                event.key === "F4" ||
                event.key === "Enter" ||
                (event.altKey && event.key === "ArrowDown")
              ) {
                event.preventDefault()
                changeOpen(true)
              } else if (
                !disabled &&
                !readOnly &&
                (event.key === "Backspace" || event.key === "ArrowLeft") &&
                committed.length
              ) {
                event.preventDefault()
                sourceTokenRefs.current.get(committed.at(-1)!.id)?.focus()
              }
            }}
          />
          {committed.length > 0 && (
            <InputGroupAddon
              align="inline-start"
              className="value-help-source-tokenizer"
              aria-label={`Selected conditions for ${objectLabel}`}
            >
              {committed.map((condition, index) =>
                token(condition, false, index)
              )}
            </InputGroupAddon>
          )}
          <InputGroupAddon
            align="inline-end"
            className="value-help-source-trigger"
          >
            <DialogTrigger
              render={<InputGroupButton size="icon-xs" />}
              disabled={disabled || readOnly}
              aria-label={`Define conditions for ${objectLabel}`}
              title={`Define conditions for ${objectLabel}`}
            >
              <SapIcon name="value-help" />
            </DialogTrigger>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <DialogContent
        className="value-help-dialog value-help-condition-dialog"
        data-phone={phone}
        showCloseButton={false}
        initialFocus={firstOperationRef}
        finalFocus={sourceRef}
      >
        <DialogHeader className="value-help-dialog-header">
          <DialogTitle>
            {phone
              ? `Define Conditions (${selectedDraft.length})`
              : `Define Conditions: ${objectLabel}`}
          </DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          className="value-help-condition-form"
          onSubmit={(event) => {
            event.preventDefault()
            requestCommit()
          }}
        >
          {draft.map((condition, index) => {
            const interval = condition.operation === "BT"
            const empty = condition.operation === "Empty"
            const missing = validated ? missingValueHelpOperands(condition) : []
            return (
              <div
                key={condition.id}
                className="value-help-condition-row"
                data-interval={interval}
                data-empty={empty}
                role="group"
                aria-label={`Condition ${index + 1}`}
                ref={(row) => {
                  if (row) rowRefs.current.set(condition.id, row)
                  else rowRefs.current.delete(condition.id)
                }}
              >
                <ValueHelpConditionOperator
                  inputRef={index === 0 ? firstOperationRef : undefined}
                  label={`Operator for condition ${index + 1}`}
                  operation={condition.operation}
                  exclude={condition.exclude}
                  validated={validated}
                  onValidityChange={(valid) =>
                    setInvalidOperations((current) => {
                      const next = new Set(current)
                      if (valid) next.delete(condition.id)
                      else next.add(condition.id)
                      return next
                    })
                  }
                  onValueChange={(operation, exclude) => {
                    updateCondition(condition.id, {
                      operation,
                      exclude,
                      value1: operation === "Empty" ? "" : condition.value1,
                      value2: operation === "BT" ? condition.value2 : "",
                    })
                  }}
                />
                {!empty && (
                  <div className="value-help-condition-operand">
                    <Input
                      value={condition.value1}
                      data-operand="value1"
                      data-value-state={
                        missing.includes("value1") ? "warning" : undefined
                      }
                      aria-label={`${interval ? "from" : "Value"} for condition ${index + 1}`}
                      aria-describedby={
                        missing.includes("value1")
                          ? `${condition.id}-value1-warning`
                          : undefined
                      }
                      title={
                        missing.includes("value1")
                          ? "Enter a valid value."
                          : undefined
                      }
                      autoComplete="off"
                      placeholder={interval ? "from" : "Value"}
                      onChange={(event) =>
                        updateCondition(condition.id, {
                          value1: event.target.value,
                        })
                      }
                      onBlur={() =>
                        updateCondition(condition.id, {
                          value1: normalizeValueHelpOperand(
                            condition.value1,
                            displayFormat
                          ),
                        })
                      }
                    />
                    {missing.includes("value1") && (
                      <span
                        id={`${condition.id}-value1-warning`}
                        className="sr-only"
                      >
                        Enter a valid value.
                      </span>
                    )}
                  </div>
                )}
                {interval && (
                  <div className="value-help-condition-operand">
                    <Input
                      value={condition.value2}
                      data-operand="value2"
                      data-value-state={
                        missing.includes("value2") ? "warning" : undefined
                      }
                      aria-label={`to for condition ${index + 1}`}
                      aria-describedby={
                        missing.includes("value2")
                          ? `${condition.id}-value2-warning`
                          : undefined
                      }
                      title={
                        missing.includes("value2")
                          ? "Enter a valid value."
                          : undefined
                      }
                      autoComplete="off"
                      placeholder="to"
                      onChange={(event) =>
                        updateCondition(condition.id, {
                          value2: event.target.value,
                        })
                      }
                      onBlur={() =>
                        updateCondition(condition.id, {
                          value2: normalizeValueHelpOperand(
                            condition.value2,
                            displayFormat
                          ),
                        })
                      }
                    />
                    {missing.includes("value2") && (
                      <span
                        id={`${condition.id}-value2-warning`}
                        className="sr-only"
                      >
                        Enter a valid value.
                      </span>
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="value-help-condition-remove"
                  data-condition-remove
                  aria-label={`Remove condition ${formatValueHelpCondition(condition, displayFormat) || index + 1}`}
                  title="Remove Condition"
                  onClick={() => removeCondition(condition.id)}
                >
                  <SapIcon name="decline" />
                </Button>
              </div>
            )
          })}
          <div className="value-help-condition-add-row">
            <Button type="button" variant="outline" onClick={addCondition}>
              Add Condition
            </Button>
          </div>
          <span className="sr-only" role="status">
            {announcement}
          </span>
        </form>
        {!phone && (
          <div className="value-help-selected-items">
            <div className="value-help-selected-heading">
              <h2>Selected Conditions ({selectedDraft.length})</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove All Conditions"
                title="Remove All"
                disabled={!selectedDraft.length}
                onClick={() => {
                  setDraft([emptyCondition()])
                  setValidated(false)
                  setAnnouncement("All conditions removed")
                  requestAnimationFrame(() =>
                    firstOperationRef.current?.focus()
                  )
                }}
              >
                <SapIcon name="decline" />
              </Button>
            </div>
            <div className="value-help-selected-tokenizer">
              {selectedDraft.length ? (
                selectedDraft.map((condition, index) =>
                  token(condition, true, index)
                )
              ) : (
                <span className="value-help-condition-none">
                  No Conditions Selected
                </span>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="value-help-dialog-footer">
          <Button type="submit" form={formId}>
            OK
          </Button>
          <Button variant="ghost" onClick={() => changeOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
        <Dialog open={warningOpen} onOpenChange={setWarningOpen} modal>
          <DialogContent
            className="value-help-condition-warning"
            role="alertdialog"
            showCloseButton={false}
            initialFocus={warningOkRef}
            finalFocus={invalidOperandRef}
          >
            <DialogHeader className="value-help-condition-warning-header">
              <SapIcon
                name="status-critical"
                className="value-help-condition-warning-icon"
              />
              <DialogTitle>Warning</DialogTitle>
            </DialogHeader>
            <DialogDescription className="value-help-condition-warning-message">
              Some condition values are missing.
              <br />
              Only complete entries will be added to the filter.
            </DialogDescription>
            <DialogFooter>
              <Button ref={warningOkRef} onClick={commit}>
                OK
              </Button>
              <Button variant="ghost" onClick={() => setWarningOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
