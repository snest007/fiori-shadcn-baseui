# SearchField Clear behavior, SAPUI5 1.151.0

Source: https://ui5.sap.com/1.151.0/resources/sap/m/SearchField-dbg.js

Downloaded on 2026-10-29 as `SearchField-v1-151-dbg.js`; exact library version is independently verified by `sapui5-v1-151-version.json`.

## Confirmed event path

1. `ontouchend`, lines 473-493: the reset icon calls `clear({ clearButton: true })`.
2. `clear`, lines 391-417: if the current value changes, it sets the value to an empty string, emits live-change/change, then emits `search` with `query: ""`, `refreshButtonPressed: false`, `clearButtonPressed: true`, `searchButtonPressed: false`.
3. The official recommended ValueHelpDialog controller, lines 72-74, listens to every basic-search `search` event and calls `FilterBar.search()` without excluding clear-button events.
4. The phone-specific ValueHelpDialog listener, lines 657-660, checks that `refreshButtonPressed !== undefined`; the Clear event supplies `false`, so it also passes this check and calls the filter-bar search.

Therefore the value-help Clear search action **clears and runs the search again**, using the current filter field values. Merely clearing the text input while retaining the previous results does not match this sample.

For React, submit the explicit new query `""` with a copy of current draft filters. Calling `setSearch("")` and immediately calling a callback that captures the old `search` value would submit stale text. Typing ordinary characters remains manual and does not itself submit.

This finding is an exact SAPUI5 1.151.0 implementation readback. No browser interactions were performed for this focused verification.

## Escape behavior

`onFocus`, lines 731-735, remembers the value when the search input receives focus.
The Escape handler, lines 681-707, restores that value if the user has changed it;
if the current value already equals the original, it clears the original value
and the field. A changed value runs the same `clear` / `search` path and marks
the event so the parent dialog remains open. Only an Escape that leaves the
query unchanged can reach parent-dialog dismissal.

The React input keeps this original query in a ref. When Escape changes the
query, it prevents modal dismissal, applies the restored query with the current
filters, and retains the selection draft. Browser verification is recorded in
`../../QA.md`.
