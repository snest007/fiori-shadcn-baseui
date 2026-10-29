# Conditions-only Value Help · 1.151.0

Independent preview: `ValueHelpConditionPreview` in the component gallery. It uses the existing fictional 36-model catalogue and does not change the List Report or Object Page.

## Primary sources

- [Value Help Dialog with conditions tab only](https://ui5.sap.com/1.151.0/#/entity/sap.ui.comp.valuehelpdialog.ValueHelpDialog/sample/sap.ui.comp.sample.valuehelpdialog.conditionsOnly), sample ID `sap.ui.comp.sample.valuehelpdialog.conditionsOnly`. The multiple-conditions fragment sets `supportRanges=true` and `supportRangesOnly=true`. Its source MultiInput sets `valueHelpOnly=true`.
- `ValueHelpDialog-v1-151-dbg.js` in the parent references directory: `_updateNavigationControl`, `_updateDlgTitle`, `_createRanges` and `_validateRanges` determine navigation, desktop/phone titles and the Warning confirmation.
- `P13nConditionPanel-v1-151-dbg.js`: operation ComboBox, Include/Exclude groups, single-key layout, last-row Add Condition, remove and focus behavior.
- `P13nConditionPanelBase-v1-151-dbg.js`: string formatting, UpperCase display formatting and `_checkCondition` for partially entered intervals. Empty rows are ignored; string endpoints are not validated as a numerical ordering.
- `P13nOperationsHelper*` and the `sap.m` message bundle: string operators and English labels.

Downloaded official files and their source URLs, sizes and SHA256 hashes are in `source-index.json`. They are evidence only; no UI5 runtime code is imported into the application.

## Prototype configuration

- The input represents one fixed `Model ID` key, so it omits the key selector, as UI5 does for a single key.
- Source behavior follows `valueHelpOnly`: clicking the input, Enter, F4 or Alt+Down opens Define Conditions. Individual source tokens remain removable.
- The editable operation picker adapts the [shadcn Base UI Combobox source](https://ui.shadcn.com/code/apps/v4/registry/bases/base/ui/combobox.tsx) and reuses the project's shadcn InputGroup. Base UI handles the popup, keyboard navigation and listbox semantics. Its fields are editable, filter by typed operator labels, retain Include/Exclude groups and reject unknown operator text.
- String includes use Contains, EQ, BT, StartsWith, EndsWith, LT, LE, GT, GE and Empty. The prototype explicitly enables the corresponding extended exclusions via the configuration equivalent to `setExcludeRangeOperations`. UI5's default exclusion list contains only NotEQ; the extra exclusions are an intentional supported configuration.
- `displayFormat="UpperCase"` is the configured format for model IDs. Unlike the official product sample, this preview does not set a seven-character String type constraint.
- Token text follows the official formatter: `=RA09-01`, `RA09-01...RA09-04`, `RA11*`, `!(=RA09-02)`, and `!(<empty>)`.
- A partially filled BT/NotBT raises Warning with the official message and OK/Cancel. OK commits complete valid rows and omits incomplete/unknown-operator rows. Cancel returns focus to the first affected field. Outside presses keep the dialog open, following UI5 modal Dialog without `autoClose`. Main Cancel/Escape preserve committed conditions, discard the draft when closing and restore source focus.
- The local table evaluates the union of included conditions, then removes matches for every exclusion. An exclusion-only set starts from all 36 models. These are local feasibility results; no OData query or service is connected.

## Verification

Source/type validation: `npx tsc -b` and targeted ESLint. Semantic validation: `node scripts/verify-value-help-conditions.mjs`; four tests cover inclusive range boundaries, include union plus exclusion, exclusion-only, Empty/NotEmpty, UpperCase, reversed string intervals and ignoring incomplete rows. Browser verification is recorded separately in the main QA document after the parent agent runs it.

Suggested browser sequence:

1. Start from no committed conditions: source click/F4/Alt+Down opens `Define Conditions: Model IDs`; there are no list tabs. A phone goes directly to `Define Conditions (0)`.
2. Choose `between`; fill `ra09-01` and `ra09-04`. Blur uppercases the values. Selected Conditions shows `RA09-01...RA09-04`. Add Condition creates a blank row with the preceding operator and focuses its operator input.
3. In that new row, choose `not equal to` in Exclude and enter `RA09-02`. OK returns two source tokens and three matched models: RA09-01, RA09-03, RA09-04.
4. Reopen, add `starts with` RA11 and OK. The include union minus the existing exclusion yields nine models. Removing the exclusion source token yields ten and returns source focus.
5. Reopen and edit a condition; outside presses keep the dialog and draft open. Main Cancel/Escape preserve the committed tokens and results when closing. Escape while the operation popup is open closes that popup first.
6. Add a `between` row with only `from=RA09-01`; OK opens Warning. Warning Cancel restores focus to its `to` input. Warning OK omits that incomplete row and commits valid ones.
7. Type `between` in the editable operator input, or filter with `not eq`; select via keyboard. An unknown label loses selection and shows the official `Value "…" does not exist.` error when blurred/validated; it cannot commit the previous operator silently.
8. Remove All clears draft conditions; cancelling restores the committed set, while OK clears it and restores all 36 results. On phone remove rows individually; one empty editable row remains.
9. With source tokens present, empty-source Backspace/Left focuses the last token removal control. Left/Right/Home/End navigate removal controls and return to the source at the end; Backspace/Delete removes the focused token.

The demonstration does not claim full ValueHelpDialog equivalence: no condition paging/search, multiple key fields, typed date/number conditions, default-value templates, service-backed conditions, or full tokenizer text-selection behavior. Token keyboard navigation focuses accessible removal controls, rather than implementing UI5's separate token text-selection model.
