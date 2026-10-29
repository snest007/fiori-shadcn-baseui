# Fiori v1-148 Value Help Usage notes

Source: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/value-help-dialog

Retrieved through the official page's search index on 2026-10-29. The search query was `site:sap.com/design-system/fiori-design-web/v1-148/ui-elements/value-help-dialog "Filters (9)"`. Live `open` returns only the wrapper, so these are focused paraphrases of indexed official Usage content. **This is v1-148 evidence, not v1-151.**

- Usage: large datasets, finding objects by several attributes, or defining conditions. Prefer a simpler selection control for a short simple list; this gallery can demonstrate a complex pattern with reduced fixture data.
- Mandatory basic search and optional filters run on Go. Basic search covers the offered filter/result attributes. Free text already typed in the source input passes to basic search; suggestions do not replace that text. Opening automatically runs that initial search.
- Result list starts populated; ID and description come first, with a recommended maximum of five columns.
- Filter area starts hidden, with a Show/Hide Filters toggle. All offered fields exist in the advanced area; there is no separate Adapt Filters flow. Default-expanded filters are an exception when basic search cannot be supplied.
- Single item selection closes immediately on every form factor. Desktop/tablet hides tabs and the selected-token area.
- Multi-selection supports OK/Cancel and a counted removable-token area. Items and conditions use a shared tokenizer; exclusion is represented by operators, not a separate visual band.
- When both selection and conditions exist, phone starts with navigable Search and Select / Define Conditions rows. Tokens appear at the bottom of that start screen. Phone filters are a separate Show Filters screen.
- Desktop single-selection title uses `Select: [Object]`; multi-selection title uses the object name. Phone start title uses the object name, with child screens named Search and Select, Show Filters and Define Conditions.

These notes summarize only the implementation-relevant portions; they do not reproduce the complete copyrighted guideline body.
