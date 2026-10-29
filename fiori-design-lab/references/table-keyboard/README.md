# Responsive Table keyboard reference

Baseline: SAPUI5 1.151.0, `sap.m.Table` Navigate mode, Horizon. `source-index.json` records the downloaded original sources and documentation. They are reference files only and are never imported by the application.

The real [MultiSelectMode sample](https://ui5.sap.com/1.151.0/#/entity/sap.m.Table) was opened through the Demo Kit Table entity. Browser operation confirmed row → selection cell with ArrowRight, Space selection, F2 into a checkbox, Tab to the row action and next row control, F7 back to the row, and End to the last loaded row.

`Table.js` sets up row and cell navigation and defines Home/End and page navigation. `ListBase.js` defines Ctrl/Meta+A, F2/F7, content/container transitions and modifier-key exclusions. `ColumnListItem.js` defines Enter/Space selection and navigation cell actions.

`src/components/fiori/use-responsive-table-navigation.ts` implements the read-only purchase table's row/cell focus, Arrow keys, Home/End, PageUp/PageDown, Enter/Space, Ctrl/Meta+A and F2/F7. A normal Tab enters the remembered navigation node; F2 enters the controls. Leaving the table restores navigation mode. A hidden column falls back to its row, and empty results retain a header entry point. Phone pop-in text is associated with its logical row through `aria-describedby`.

This is a bounded feasibility implementation. It does not reproduce UI5 Edit mode, range selection, editable cells, all nested-content shortcuts, virtualized navigation, or the full token and screen-reader announcement engine. Pop-in values are row descriptions, rather than independently navigable grid cells. Browser evidence and screenshots are recorded in the current section of `QA.md`.
