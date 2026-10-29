# Value Help reference verification

Verified on 2026-10-29. This folder is read-only research for a React + shadcn / Base UI implementation. No UI5 runtime is proposed.

## Version boundary

- The requested [Fiori guideline v1-151 page](https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/value-help-dialog) is reachable through the search service, but its live extraction contains only the title, control name and Usage wrapper (11 lines). Direct HTTP requests return 403. The guessed `/usage`, `/usage.plain.html`, `.plain.html`, `/usage.html`, `-usage`, and `/usage.content.html` paths did not expose the body. No fragment URL was verified. **Do not label the older guideline body as v1-151.**
- The official [Fiori guideline v1-148 page](https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/value-help-dialog) has a complete Usage body in the search index. Focused paraphrases are in `guideline-v1-148-usage-notes.md`; this is an explicitly earlier version and a search-index readback, not a successful live fragment download.
- Exact **SAPUI5 1.151.0** controller, XML, control implementation and API were downloaded from `https://ui5.sap.com/1.151.0/`. `sapui5-v1-151-version.json` independently confirms `version: 1.151.0`. This verifies behavior of the 1.151.0 implementation; it does not prove that the unavailable design-guideline body is identical.

## Official sample and source URLs

- [Recommended sample, SAPUI5 1.151.0](https://ui5.sap.com/1.151.0/#/entity/sap.ui.comp.valuehelpdialog.ValueHelpDialog/sample/sap.ui.comp.sample.valuehelpdialog.recommended)
- [Conditions-only sample, SAPUI5 1.151.0](https://ui5.sap.com/1.151.0/#/entity/sap.ui.comp.valuehelpdialog.ValueHelpDialog/sample/sap.ui.comp.sample.valuehelpdialog.conditionsOnly)
- [Sample controller](https://ui5.sap.com/1.151.0/test-resources/sap/ui/comp/demokit/sample/valuehelpdialog/recommended/ValueHelpDialog.controller.js)
- [Sample filter-bar fragment](https://ui5.sap.com/1.151.0/test-resources/sap/ui/comp/demokit/sample/valuehelpdialog/recommended/ValueHelpDialogFilterbar.fragment.xml)
- [Sample view](https://ui5.sap.com/1.151.0/test-resources/sap/ui/comp/demokit/sample/valuehelpdialog/recommended/ValueHelpDialog.view.xml)
- [ValueHelpDialog 1.151.0 source](https://ui5.sap.com/1.151.0/resources/sap/ui/comp/valuehelpdialog/ValueHelpDialog-dbg.js)
- [FilterBar 1.151.0 source](https://ui5.sap.com/1.151.0/resources/sap/ui/comp/filterbar/FilterBar-dbg.js)
- [ValueHelpDialog API, 1.151.0](https://ui5.sap.com/1.151.0/#/api/sap.ui.comp.valuehelpdialog.ValueHelpDialog)

`source-index.json` lists the downloaded files, their URLs and SHA256 checksums.

## Current preview coverage

The component gallery now provides separate items-only single/multiple selection and conditions-only range/exclusion previews. The conditions preview uses the official `supportRangesOnly` pattern, an editable operation ComboBox composed from shadcn/Base UI, UpperCase string conditions, the official token formatter and the Warning confirmation for incomplete intervals. It deliberately enables extended exclusion operators; the default UI5 exclusion list is only NotEQ.

The shared modal Dialog follows UI5's default without `autoClose`: outside presses keep the dialog open. Cancel/Escape preserve committed values and discard the dialog draft when closing. SearchField Escape may first restore or clear its own query.

The 36-model result table evaluates the include union minus matching exclusions locally. No OData service, suggestions, condition paging, date/number condition types, or complete combined selection/conditions variant is connected. The existing items-only examples remain independent.

See [conditions/IMPLEMENTATION.md](./conditions/IMPLEMENTATION.md) for exact configuration, source evidence, behavior and reproducible browser steps. `conditions/source-index.json` lists the downloaded official conditions sample, operation helpers and formatter sources with their URLs and SHA256 hashes. `node --experimental-strip-types scripts/verify-value-help-conditions.mjs`, run from the project root, verifies four meaningful condition-semantic cases.

The integrating browser pass confirmed 3 matching rows after range plus exclusion, 9 after a second include, 10 after removing the exclusion token, Warning Cancel focus restoration and OK omission of partial ranges, typed ComboBox filtering retained with ArrowDown, 390px phone layout and source-token Backspace/Delete. Detailed browser evidence belongs in the project QA record.

## Implementation facts confirmed in SAPUI5 1.151.0

1. **Existing values and draft changes are distinct from search text.** Sample controller lines 24/30 initializes outer MultiInput tokens. On opening, lines 123/222 pass its existing tokens with `setTokens`. On OK, lines 128-132 writes returned tokens to the outer input and closes. Cancel at 134-136 only closes; after-close destroys the dialog. Do not commit checkbox or token edits to the field before OK in multi selection.
2. **Single item selection has no OK step.** `setSupportMultiselect` in control lines 575-582 hides both tokenizer and OK when false. Desktop selection/cell handlers at 3153-3167 invoke take-over; phone selection at 3362-3365 does the same. Take-over validates any supported conditions before `fireOk` at 3499 sends the chosen token to the application handler, which closes the dialog. An items-only scenario has no condition validation to block that action. Cancel remains available.
3. **Multi selection stays open.** Checkboxes and token deletion update dialog selection. Footer OK is emphasized; Cancel is secondary (`_createFooterControls`, lines 1827-1844). OK returns selected tokens; the sample then applies them. Token remove and Remove All also clear corresponding table selection (lines 1974-2027).
4. **Search is manual, with shared search dispatch.** Sample lines 68-75 creates basic SearchField, collapses the filter area, and routes SearchField `search` into `FilterBar.search()`. Fragment links FilterBar `search` to `onFilterBarSearch`. That controller handler at 389-416 combines nonempty per-column filters with AND and basic text across code/name with OR. Typing into a field does not itself filter results.
5. **Basic search text has a dedicated property.** Control `setBasicSearchText` at 735-743 fills the basic SearchField. Transfer the uncommitted input text here; do not turn existing selected tokens into the search query. The recommended multi-input sample itself does not demonstrate propagating partially typed outer-input text, so that requirement comes from the explicitly older guideline body.
6. **Filters start collapsed.** Sample line 68 calls `setFilterBarExpanded(false)`; line 166 repeats it for the suggestions variant. The fragment uses `advancedMode="true"` and contains Product Code and Product Name filters. Avoid an Adapt Filters dialog for this advanced value-help filter area.
7. **Initial result load is populated.** The sample immediately binds rows or items to the OData set on opening; `dataReceived` calls `update` to reapply token selection. After later filtering, `_filterTable` filters the binding and updates the dialog. Selection can remain selected even if search temporarily hides its row.
8. **Desktop/tablet and phone result structures differ.** Sample lines 83-101 uses `sap.ui.table.Table` rows; lines 104-119 uses `sap.m.Table` items on phone. Control line 1117 stretches the phone dialog; 1118-1119 disables resizing/dragging there. This is behavior evidence for a full-screen phone variant, not a license to use UI5 components.
9. **Phone items-only opens directly into results.** In control `PHONE_MAIN_VIEW` (1273-1322), a start menu appears only when both selection and conditions entries exist. If only selection exists, it forwards directly to `PHONE_LIST_VIEW`.
10. **Phone result and filter views are separate.** `PHONE_LIST_VIEW` (1324-1353) shows basic search, Show Filters and the responsive table; hides tokenizer and separate Go when basic search exists; shows OK only for multi selection and Cancel. `PHONE_SEARCH_VIEW` (1355-1382) shows expanded filters, hides the result table and tokenizer, and exposes footer Go + Cancel and Back. Go searches and returns to the result view via the filter-bar search handler at 677-680. Do not model this as a desktop dialog merely narrowed to 390px.
11. **Token region location depends on phone view.** Desktop content includes tokenizer under the main layout. On phone `PHONE_MAIN_VIEW` shows it only when `supportMultiselect` is true, `maxIncludeRanges` is `-1`, `maxExcludeRanges` is not `0`, and `filterMode` is false (1289-1292); list/filter/conditions subviews hide it. With selection-only phone mode there is no start-menu tokenizer region. In the current code the old panel has `expandable: false` (2057); do not infer the old v1-38 expanded/collapsed-token-panel behavior from comments.
12. **Conditions are configurable.** The recommended fragment has `supportRanges="true"`; it demonstrates more than an items-only scenario. Control supports `supportRanges=false` and `supportMultiselect=false`; a focused items-only demo can omit condition tabs deliberately. It must not advertise unimplemented range/condition capabilities.
13. **Titles also depend on configured content.** `ValueHelpDialog-v1-151-dbg.js` 3636-3655 uses `VALUEHELPDLG_TITLE` for desktop list view with hidden tab bar, including an items-only multi-selection configuration. That exact version's message bundle line 399 is `Select: {0}`. Its phone filter view uses `FILTER_BAR_ADV_FILTERS_DIALOG` (3656), resolved to `Filters` by bundle line 41. The earlier v1-148 guideline names that child screen `Show Filters`; retain this explicit wording/version difference.
14. **Go is emphasized when displayed.** `FilterBar-v1-151-dbg.js` 4815-4819 creates an emphasized Go. Phone filter footer Go is emphasized as well (`ValueHelpDialog-v1-151-dbg.js` 1847-1854). The phone list does not add Go beside a working basic-search icon.
15. **Clear search also submits.** `SearchField-v1-151-dbg.js` 473-493 calls `clear({clearButton:true})`; 391-417 emits the `search` event with empty query and `clearButtonPressed:true`. The recommended sample's basic-search listener then invokes `FilterBar.search`, so results refresh using empty basic query and current filters. See `searchfield-clear-v1-151.md` for the focused evidence chain.
16. **Search Escape restores or clears before dismissing.** `SearchField-v1-151-dbg.js` 681-707 uses the original value captured on focus at 731-735. A changed query triggers search and prevents parent-dialog dismissal; an unchanged empty query permits dismissal. The React demo follows this local SearchField behavior and preserves the selection draft during query restoration.

## Independent review checklist for this prototype

- Open by field value-help button. Keep existing committed values and the free-text input distinct.
- Reopening multi selection seeds a fresh draft from the field. OK commits; Cancel/Escape preserve committed values and discard the draft when closing. Outside presses keep the dialog open. SearchField Escape may first restore/clear the query while keeping the dialog open.
- Single row selection updates the field and closes; no multi-selection tokenizer or OK action.
- Search/Enter and Go share one committed-search handler. Do not update results on each keystroke.
- Search matches displayed ID/name and the offered filter fields; multiple explicit filters compose with AND.
- Keep filters hidden initially. Provide only supported filters and matching result columns.
- Keep selection when a search hides its rows, and synchronize token remove/all-remove with checkbox selection.
- For multi selection, show clear count and removable tokens in the supported desktop selection region.
- Use a full-screen phone variant. For items-only phone mode, direct result view is supported; filter view uses its own result-free screen and Go/Back behavior.
- Keep items-only selection and conditions-only previews explicit; neither implies all combined ValueHelpDialog variants are implemented. Distinguish v1-151 guideline-wrapper verification from exact SAPUI5 1.151.0 behavior verification.

Cancel/Escape draft semantics in the React checklist are an application integration requirement inferred from the sample's transactional OK/Cancel handlers. Outside presses retain the modal, following UI5 Dialog without `autoClose`. SearchField-local Escape behavior was read from the exact 1.151.0 source. The numbered implementation facts above are source research; the current official/local browser comparisons are recorded separately in [../../QA.md](../../QA.md).
