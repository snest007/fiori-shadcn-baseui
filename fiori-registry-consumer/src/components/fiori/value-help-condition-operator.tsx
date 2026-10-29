import { useState, type Ref } from "react"
import { Combobox } from "@base-ui/react/combobox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/fiori/ui/input-group"
import { SapIcon } from "~/components/fiori/sap-icon"
import { useFioriPortalContainer } from "./fiori-context"
import {
  valueHelpOperations,
  type ValueHelpOperation,
} from "~/lib/fiori/value-help-conditions"

type OperationItem = {
  value: string
  label: string
  operation: ValueHelpOperation
  exclude: boolean
}
const operationGroups = [false, true].map((exclude) => ({
  value: exclude ? "Exclude" : "Include",
  items: valueHelpOperations.map((entry): OperationItem => ({
    value: `${exclude ? "Not" : ""}${entry.operation}`,
    label: exclude ? entry.excludeLabel : entry.includeLabel,
    operation: entry.operation,
    exclude,
  })),
}))
const operationItems = operationGroups.flatMap((group) => group.items)

// Adapted from shadcn's Base UI ComboboxInput/Content/List/Group composition:
// https://ui.shadcn.com/code/apps/v4/registry/bases/base/ui/combobox.tsx
// The operation field in UI5's P13nConditionPanel is an editable ComboBox.
export function ValueHelpConditionOperator({
  operation,
  exclude,
  inputRef,
  label,
  validated,
  onValueChange,
  onValidityChange,
}: {
  operation: ValueHelpOperation
  exclude: boolean
  inputRef?: Ref<HTMLInputElement>
  label: string
  validated: boolean
  onValueChange: (operation: ValueHelpOperation, exclude: boolean) => void
  onValidityChange: (valid: boolean) => void
}) {
  const portalContainer = useFioriPortalContainer()
  const selected = operationItems.find(
    (item) => item.operation === operation && item.exclude === exclude
  )!
  const [input, setInput] = useState({
    selectedKey: selected.value,
    text: selected.label,
  })
  const [filtering, setFiltering] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [blurred, setBlurred] = useState(false)
  const text =
    input.selectedKey === selected.value ? input.text : selected.label
  const exactItem = operationItems.find(
    (item) => item.label.toLowerCase() === text.toLowerCase()
  )
  const invalid = !exactItem && (blurred || validated)
  const errorMessage = `Value "${text}" does not exist.`

  function choose(item: OperationItem) {
    setInput({ selectedKey: item.value, text: item.label })
    setFiltering(false)
    setBlurred(false)
    onValidityChange(true)
    onValueChange(item.operation, item.exclude)
  }

  return (
    <Combobox.Root<OperationItem>
      items={operationGroups}
      value={exactItem ?? null}
      inputValue={text}
      open={popupOpen}
      openOnInputClick
      autoHighlight
      isItemEqualToValue={(item, value) => item.value === value.value}
      filter={(item, query) =>
        !filtering || item.label.toLowerCase().startsWith(query.toLowerCase())
      }
      onInputValueChange={(next, details) => {
        setInput({ selectedKey: selected.value, text: next })
        if (details.reason === "input-change") {
          setFiltering(true)
          setPopupOpen(true)
          onValidityChange(
            operationItems.some(
              (item) => item.label.toLowerCase() === next.toLowerCase()
            )
          )
        }
      }}
      onValueChange={(next) => {
        if (next) choose(next)
      }}
      onOpenChange={(next) => {
        setPopupOpen(next)
      }}
    >
      <InputGroup
        className="value-help-condition-operation"
        data-value-state={invalid ? "error" : undefined}
      >
        <Combobox.Input
          render={<InputGroupInput />}
          ref={inputRef}
          data-condition-operator-input
          aria-label={label}
          aria-invalid={invalid || undefined}
          title={invalid ? errorMessage : selected.label}
          autoComplete="off"
          onBlur={() => {
            setBlurred(true)
            if (exactItem) choose(exactItem)
          }}
          onKeyDown={(event) => {
            if (event.key === "F4") {
              event.preventDefault()
              setFiltering(false)
              setPopupOpen((current) => !current)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Combobox.Trigger
            render={<InputGroupButton size="icon-xs" />}
            aria-label={`Open ${label}`}
            title="Select Operator"
            onClick={() => setFiltering(false)}
          >
            <SapIcon name="slim-arrow-down" />
          </Combobox.Trigger>
        </InputGroupAddon>
        {invalid && <span className="sr-only">{errorMessage}</span>}
      </InputGroup>
      <Combobox.Portal container={portalContainer}>
        <Combobox.Positioner
          className="value-help-condition-operator-positioner"
          sideOffset={4}
          align="start"
        >
          <Combobox.Popup
            className="value-help-condition-operator-popup"
            data-slot="combobox-content"
          >
            <Combobox.Empty className="value-help-condition-operator-empty">
              No data
            </Combobox.Empty>
            <Combobox.List
              className="value-help-condition-operator-list"
              data-slot="combobox-list"
            >
              {(group: (typeof operationGroups)[number]) => (
                <Combobox.Group
                  key={group.value}
                  items={group.items}
                  data-slot="combobox-group"
                >
                  <Combobox.GroupLabel className="value-help-condition-operator-label">
                    {group.value}
                  </Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(item: OperationItem) => (
                      <Combobox.Item
                        key={item.value}
                        value={item}
                        className="value-help-condition-operator-item"
                        data-slot="combobox-item"
                      >
                        {item.label}
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
