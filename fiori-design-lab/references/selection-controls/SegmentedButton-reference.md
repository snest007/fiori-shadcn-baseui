# SegmentedButton source reference · SAPUI5 1.151.0

Retrieved 2026-10-29 for the React / shadcn / Base UI implementation. These sources are reference evidence only and are not imported by the application.

| File | Official source | SHA256 |
| --- | --- | --- |
| `SegmentedButton-v1-151-dbg.js` | https://ui5.sap.com/1.151.0/resources/sap/m/SegmentedButton-dbg.js | `b00b937a740b18057c73c00c555d6d0cd529539516bdea06a30e82be14416481` |
| `SegmentedButtonRenderer-v1-151-dbg.js` | https://ui5.sap.com/1.151.0/resources/sap/m/SegmentedButtonRenderer-dbg.js | `03d385c98f4eb4955e00f8b684d01d7dfda8f0c9ace276d790130850726ac80b` |
| `SegmentedButton-sap-m-horizon-v1-151.css` | https://ui5.sap.com/1.151.0/resources/sap/m/themes/sap_horizon/library.css | `4cc54a4c9af0117d8c6932f7b577193f1cacb72951ee5eeac4638dab0a2d7064` |

## Confirmed Horizon styling

The full library CSS includes base styles followed by Horizon overrides. Use the later overrides, rather than the earlier blue selected background.

- Compact layout/hit height 2rem (32px), visible surface 1.625rem (26px), vertical padding 0.1875rem (3px).
- Cozy layout/hit height 2.75rem (44px), visible surface 2.25rem (36px), vertical padding 0.25rem (4px).
- The group has no standalone outer border; joined segment inner wrappers produce the outline, with no unused full-width track beyond the content.
- Inner content is centered, font size .875rem (14px), `sapFontBoldFamily`; both unselected and selected segments use the same bold font. Icons are 1rem (16px), mixed text/icon gap .375rem (6px).
- Inner horizontal padding: Compact .4375rem (7px), Cozy .5625rem (9px).
- Selection uses `sapButton_Selected_Background`, `sapButton_Selected_TextColor`, `sapButton_Selected_BorderColor` and `sapButton_Segment_BorderCornerRadius` (8px in this theme). There is no arbitrary 2px selection border.
- Hover and selected hover use the corresponding official SAP button parameters. The keyboard focus indicator sits inside the visible segment, using 2px `sapContent_FocusColor` and 6px radius.
- `SegmentedButton` defaults to EqualSized content mode; an explicit width can distribute segments, while the intrinsic mode follows content. The present two-item preview has no width and must not inherit the form Field's full width.
- `SegmentedButton` source creates `ItemNavigation` with cycling=false. Arrow keys move focus; activation selects a segment. Re-activating the selected item does not remove selection (`_buttonPressed` only updates when IDs differ).
- The official renderer uses listbox / option semantics; this prototype retains the Base UI ToggleGroup group / toggle semantics and its accessible keyboard focus management.

`SegmentedButton-css-extract-v1-151.txt` is a derived readable extraction of selectors from the unchanged full library CSS. It includes base and Horizon rules in original order.

## Local changes and validation boundary

The shared ToggleGroup retains its Base UI primitives and receives an inner visible surface. Global CSS constrains the group to its content width, uses equal grid columns and draws the joined track only under its items. It separates layout/hit height from visible surface height. Selection, hover and focus use SAP tokens. `loopFocus=false` matches the official non-cycling navigation.

The Gallery's text/icon selection keeps its existing business data and state binding. Clicking the selected item keeps the controlled value. Static source readback does not replace browser verification: the parent task must compare default, selected, keyboard-focus, Compact and Cozy states, and audit the shell density ToggleGroup consumer as well.
