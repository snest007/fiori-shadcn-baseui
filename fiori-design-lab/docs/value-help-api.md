# Value Help public contract · pilot 0.1

This is editable React/shadcn source with Base UI behavior and SAP Horizon styling. It does not import the robot catalogue, purchase records or UI5 control runtime. `ValueHelpField` remains the items-only pattern; `ValueHelpConditionsField` is an independent conditions-only pattern. A combined items-and-conditions dialog is outside this pilot.

## ValueHelpField

```tsx
import { ValueHelpField, type ValueHelpItem, type ValueHelpColumn } from "@/components/fiori/value-help"

const locations: readonly ValueHelpItem[] = [
  { id: "WH-BER", label: "Berlin warehouse", attributes: { region: "EU", city: "Berlin" } },
  { id: "WH-PAR", label: "Paris warehouse", attributes: { region: "EU", city: "Paris" } },
  { id: "WH-SHA", label: "Shanghai warehouse", attributes: { region: "APAC", city: "Shanghai" } },
]
const columns: readonly ValueHelpColumn[] = [
  { key: "id", label: "Warehouse ID", width: 144 },
  { key: "label", label: "Warehouse" },
  { key: "region", label: "Region", filter: "select", width: 120 },
  { key: "city", label: "City", filter: "text", width: 160 },
]

<ValueHelpField
  id="warehouse"
  label="Warehouses"
  objectLabel="Warehouses"
  items={locations}
  columns={columns}
  selectionMode="multiple"
  value={warehouseIds}
  onValueChange={setWarehouseIds}
/>
```

| Prop                              | Contract                                                                                                                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `label`                     | Required source-control DOM ID and visible accessible label. `id` must be unique within the page.                                                                                                                                       |
| `items`                           | Readonly catalogue. Each item requires a unique stable `id` and `label`; optional string `attributes` are addressed by column keys. No application data is built in.                                                                    |
| `columns`                         | Readonly display/filter definitions with unique keys. `id` and `label` refer to built-ins; other keys refer to `attributes`. Empty columns fall back to the object label column.                                                        |
| `value`                           | Required controlled readonly array of selected IDs. Single mode displays at most the first unique ID; multiple mode preserves all unique IDs. Unknown IDs remain visible as their key, so late catalogue arrival does not erase values. |
| `onValueChange(ids)`              | Required committed-value callback. Single row selection commits immediately. Multiple selection emits on OK; source token removal also emits. Cancel and Escape do not emit a committed value. The consumer must update `value`.        |
| `selectionMode`                   | Required `single` or `multiple`. One component should keep its mode stable during an open session.                                                                                                                                      |
| `disabled`                        | Native source input and trigger are disabled; source removal buttons are omitted. Opening and changes are blocked. A later disabled transition closes/discards the open draft.                                                          |
| `readOnly`                        | Source input remains focusable; opening and source token removal are blocked. A later readonly transition closes/discards the open draft.                                                                                               |
| `placeholder`                     | Source-field placeholder. Source typing is a query used when opening the dialog, not a free-form selected value.                                                                                                                        |
| `objectLabel`                     | Object name for dialog and selection labels; defaults to `label`.                                                                                                                                                                       |
| `dialogTitle`, `phoneDialogTitle` | Optional desktop/phone dialog headings. Desktop default is `Select: {objectLabel}`; phone default is `Search and Select`.                                                                                                               |
| `className`                       | Optional layout class on the outer Field. It should not override semantic colors, font or control state styling.                                                                                                                        |
| `onOpenChange(open)`              | Optional observation callback for open/close events. It does not make popup visibility controlled. Selection values are controlled; the popup draft and search session remain internal.                                                 |

Column options are `width` (desktop px), `filter: "text" | "select" | false`, `filterOptions`, `searchable`, and `showOnPhone`. The default filter is text for `id`/`label` and select for attributes. Text filters match a case-insensitive substring; select filters use exact values. Filters combine with AND and Basic Search. `filterOptions` accepts nonempty unique `{value,label}` pairs; an empty selected value means All. Basic Search includes `id`, `label` and configured columns unless a column explicitly sets `searchable:false`. Phone defaults to the first two visible columns; other columns become associated pop-in descriptions. If all columns are hidden on phone, the first column remains visible.

`filterValueHelpItems`, `getValueHelpColumnValue`, `getValueHelpFilterKind` and their types are standalone pure helpers in `lib/value-help-query.ts`. They accept external data and do not mutate it. This client-side API is intended for modest catalogues; there is no asynchronous/OData fetch adapter, remote paging, virtualization or complete UI5 grid keyboard engine.

## ValueHelpConditionsField

```tsx
import { ValueHelpConditionsField, type ValueHelpCondition } from "@/components/fiori/value-help-conditions-field"
import { matchesValueHelpConditions } from "@/lib/value-help-conditions"

const [conditions, setConditions] = useState<ValueHelpCondition[]>([])
const matches = locations.filter(location => matchesValueHelpConditions(location.id, conditions, "UpperCase"))

<ValueHelpConditionsField
  id="warehouse-conditions"
  label="Warehouse IDs"
  value={conditions}
  onValueChange={setConditions}
  displayFormat="UpperCase"
  placeholder="Define warehouse ID conditions"
/>
```

Required props are `id`, `label`, controlled readonly `value` and `onValueChange`. Optional props are `objectLabel`, `placeholder`, `displayFormat`, `disabled`, `readOnly`, `className` and `onOpenChange`; the last four follow the same field/visibility contracts as items-only. The source field is selection-only: click, Enter, F4 or Alt+Down opens the condition dialog; it does not permit typing a condition string directly.

A condition has a stable unique `id`, `operation`, `exclude`, `value1` and `value2`. Operations are `Contains`, `EQ`, `BT`, `StartsWith`, `EndsWith`, `LT`, `LE`, `GT`, `GE` and `Empty`. Both include and exclude variants are exposed explicitly. Generated condition IDs include the React instance namespace to avoid collisions between independent fields.

`displayFormat` defaults to `UpperCase`, preserving the validated ID sample. `Preserve` retains exact operand case. Pass the same format to `formatValueHelpCondition`, `normalizeValueHelpCondition` and `matchesValueHelpConditions` when evaluating/rendering outside the field. Preserve matching is case-sensitive. These are string predicates with lexicographic range/comparison boundaries; do not use them for numeric/date business conditions.

Complete includes form a union, then exclusions remove matches. Exclusion-only starts from all items. Empty rows are ignored. A half-complete between interval opens Warning: Cancel returns focus to the missing operand; OK discards incomplete rows and commits complete ones. Wholly empty between rows do not warn. Cancel/Escape preserves committed conditions; source token removal commits immediately. Tokens have keyboard navigation and removal; readonly/disabled fields omit removal controls.

## Focus, theme and verification

Source opening shortcuts, row ArrowUp/ArrowDown/Home/End and row Enter/Space preserve the existing validated behavior. Dialogs trap Tab; ordinary Cancel/Escape closes to the source field; phone Filters and nested Select return to their prior fields. Pointer dismissal is disabled. Conditions Warning is an alertdialog. Base UI portals use the surrounding Fiori provider's portal container, keeping theme/density and focus scope within the consumer boundary.

The authoring preview imports its 36-row robot catalogue only in `value-help-condition-preview.tsx` and `lib/value-help-models.ts`. Public field sources and pure helpers have no preview import. Registry entries must include the public source/CSS/primitive closure and exclude both fixtures and preview CSS.

Pure contracts are checked by `node scripts/verify-value-help-contract.mjs`; existing sample-specific predicates remain checked by `node scripts/verify-value-help-conditions.mjs`. Browser and assistive-technology validation must be recorded separately; these pure tests do not prove focus, rendering, real touch or screen reader behavior.
