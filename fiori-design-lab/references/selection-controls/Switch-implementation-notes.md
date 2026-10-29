# Switch implementation reference · SAPUI5 1.151.0

Official source downloads and SHA256 are recorded in `Switch-source-index.json`.
`Switch-styles-v1-151.txt` is a focused selector extraction from the unchanged
official Morning Horizon `library.css`. It contains both base and later Horizon
overrides; the later selectors define the final appearance.

The existing Gallery has a simple setting, not an accept/reject decision. The
standard no-label variant (`customTextOn=" "`, `customTextOff=" "` in UI5) uses
the selected blue track and check icon, and the off gray-blue track and horizontal
line (`less`) icon. Green/red track parameters belong to `SwitchType.AcceptReject`.
The Fiori skill's unified Switch Usage recommends standard icons and no internal
localized text; that skill text is guidance, not a successful live v1-151 body
download.

| Shape | Compact | Cozy |
| --- | --- | --- |
| Track | 32 × 20 px | 40 × 24 px |
| Handle | 20 × 16 px | 24 × 20 px |
| Container / hit area | 42 × 32 px | 50 × 44 px |
| Icon | 14 px | 16 px |
| Handle position | 2 px off / 10 px on | 2 px off / 14 px on |

The final compact selectors are `.sapUiSizeCompact .sapMSwtCont .sapMSwt.sapMSwtNoLabel`
(2rem × 1.25rem), its handle (1.25rem × 1rem), and container padding
(0.375rem vertically, 0.3125rem horizontally). Cozy no-label dimensions are
2.5rem × 1.5rem and handle 1.5rem × 1.25rem, with 0.625rem container vertical
padding. The switch inner offset and handle offset combine to produce the
positions listed above. Rectangles include 1px track borders and 2px handle borders.

Color parameters are `sapButton_Track_*` and `sapButton_Handle_*`, with separate
selected / unselected and hover values. The React component references these
official tokens rather than semantic success green. Base UI continues to own
checked state, accessible name, hidden input, disabled/read-only behavior and
click/keyboard toggling. It does not introduce UI5 runtime code.

The former CSS `transform: translateX(20px)` combined with the shadcn Thumb's
Tailwind `translate` utility; CSS transforms and individual translate properties
both apply, causing the handle to move beyond the track. The corrected component
removes the original visual Tailwind classes and uses one density-aware translate.

Hover, focus, disabled, and read-only appearance follow the exact CSS evidence.
The focus ring uses the outer container, not the handle. Drag-to-toggle requires
separate application behavior and is not added by this focused visual repair.
Official DOM/browser and React visual verification are recorded by the parent
agent separately; this source review itself did not operate the browser.
