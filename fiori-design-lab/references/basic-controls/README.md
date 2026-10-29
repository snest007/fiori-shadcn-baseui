# Basic control reference evidence

The checked-in reference is SAPUI5 **1.151.0**, **sap_horizon**. Original downloaded files are kept unchanged. `source-index.json` records their official URL, SHA-256, and byte count. `*-horizon-extract.txt` files are derived selector extracts for review; they are not runtime stylesheets. No file in this directory is imported by the application.

The implementation uses the project's shadcn components and Base UI behavior. Official SAP theme tokens, fonts, and static icons provide the visual source. UI5 constructors, controls, and bootstrap scripts are not used in the application.

| Control | Official reference | Rules addressed |
| --- | --- | --- |
| Button | [sap.m.Button](https://ui5.sap.com/1.151.0/#/entity/sap.m.Button) | 26px Compact / 36px Cozy visible height; normal text uses SemiboldDuplex and emphasized text uses Bold; internal 2px focus frame; 7px Compact / 9px Cozy text padding |
| Input | [sap.m.Input](https://ui5.sap.com/1.151.0/#/entity/sap.m.Input) | Semantic border/background/shadow tokens; internal focus frame; readonly background shorthand and dashed bottom line |
| Checkbox | [sap.m.CheckBox](https://ui5.sap.com/1.151.0/#/entity/sap.m.CheckBox) | 16px Compact / 22px Cozy visible box; normal checked border remains the field border; 12px / 16px tick; partially checked uses a filled inner square; readonly dashed border; semantic states |
| RadioButton | [sap.m.RadioButton](https://ui5.sap.com/1.151.0/#/entity/sap.m.RadioButton) | 16px / 22px outer circle; 55% selected inner diameter; readonly dashed outer circle; semantic states; focus inset differs from Checkbox |
| Select | [sap.m.Select](https://ui5.sap.com/1.151.0/#/entity/sap.m.Select) | Selected option background and bottom border; selected/focused option inset frame; no trailing selected tick; readonly; disabled option; mobile full-screen picker with title and close action |
| Dialog | [sap.m.Dialog](https://ui5.sap.com/1.151.0/#/entity/sap.m.Dialog) | 44px title/footer bars; Header5 title; form body outside the title bar; save/cancel; mobile full-screen example |
| MessageStrip | [sap.m.MessageStrip](https://ui5.sap.com/1.151.0/#/entity/sap.m.MessageStrip) | 32px minimum height; 7px / 16px padding; light semantic message borders; exact default icon names; close/link examples; `role=note` and semantic accessible description |
| ObjectStatus | [sap.m.ObjectStatus](https://ui5.sap.com/1.151.0/#/entity/sap.m.ObjectStatus) | Separate semantic text/icon tokens; 16px icon; neutral text token |

The reference methods worth inspecting are `MessageStripUtilities.getIconURI()` and `.getAccessibilityState()`; `Select` keyboard handlers; and the final Horizon overrides after base theme selectors. Earlier selectors in `library.css` are overridden later, so reviewing only the first match gives incorrect Horizon behavior.

## Repeatable local preview checks

`BasicStatePreview` exposes real controls inside `data-testid="basic-state-preview"`. These are steps for browser verification, not a claim that those browser checks have passed:

1. Capture Compact and Cozy at desktop width, then at 390px mobile width. Measure Checkbox/Radio visible sizes and Input/Button heights.
2. Use Tab and Space on Checkbox, including partially selected; verify it becomes a regular checked/unchecked control. Readonly and disabled values must remain unchanged.
3. Use arrow keys within the standard RadioButton group; verify only one option is checked and the live readout follows selection. Check the readonly/disabled pairs.
4. Open `Select 标准`, move with arrows, confirm with Enter, use typeahead, close with Escape, and verify focus returns to its trigger. The `不可用` option must remain disabled. Readonly/disabled Select must not open. Repeat the enabled semantic states.
5. At mobile width, open Select and verify it fills the viewport, the title is `选择处理方式`, choosing an option closes the picker, and `关闭选择处理方式` closes without changing the value. Repeat from the nested Select inside the Dialog.
6. Open `打开标准 Dialog`; Tab/Shift+Tab must remain in the dialog. Change the name and cancel: saved readout stays unchanged. Reopen: draft resets. Save: the readout changes. Escape must close and restore trigger focus. The empty/whitespace name cannot save.
7. Close each MessageStrip and restore them with `恢复消息`; compare border colors and icon shapes with the official reference. Review accessible `role=note`, semantic label, and named close button.

Base UI 1.9.0 `CheckboxRoot.js` already renders the native form input with `aria-hidden=true` and `tabIndex=-1`. A DOM inventory can include that input; an accessibility check should verify these attributes and the exposed Root before concluding that two accessible checkboxes exist.

## Validation boundaries

This work adds the state/behavior preview and applies source-backed shared styles. Scoped ESLint and `npm run typecheck` pass. Browser captures, native screen-reader behavior, touch-device checks, and pixel comparison must be recorded by the integrating agent in the project's QA record. The preview does not implement every SAPUI5 API variant, inverted ObjectStatus, full Input value-state message popovers, or all Select grouping/action-picker variants.
