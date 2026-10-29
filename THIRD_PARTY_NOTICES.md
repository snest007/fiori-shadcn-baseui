# Third-party notices

This repository is an independent React prototype and component-library trial. It is not an official SAP distribution. SAP Fiori, SAPUI5, OpenUI5 and related names identify the design references and resource sources.

The application does not load UI5/SAPUI5 control runtime code. The following SAP resources are included as static assets or generated theme data; their existing copyright and license notices are retained.

| Resource | Source | Retained notices |
| --- | --- | --- |
| SAP 72 fonts | [`@sap-theming/theming-base-content@11.36.5`](https://github.com/SAP/theming-base-content), `content/Base/baseLib/baseTheme/fonts/` | [Font source](./fiori-design-lab/public/fonts/SOURCES.md), [Apache-2.0 license](./fiori-design-lab/public/fonts/LICENSE.txt) |
| SAP-icons v5 SVG paths | [`@ui5/webcomponents-icons@2.28.0`](https://github.com/UI5/webcomponents/tree/main/packages/icons), `dist/v5/` | [Icon source](./fiori-design-lab/public/icons/SOURCES.md), [Apache-2.0 license](./fiori-design-lab/public/icons/LICENSE.txt) |
| Morning Horizon theme parameter subset | [`@sap-theming/theming-base-content@11.36.5`](https://github.com/SAP/theming-base-content), `sap_horizon` | [Apache-2.0 license](./fiori-design-lab/registry/fiori/lib/fiori/styles/SAP-THEME-LICENSE.txt), [extraction script](./fiori-design-lab/scripts/extract-sap-theme.mjs) |
| Robot Arm sample image | [OpenUI5 ObjectPageSectionShowTitle sample asset](https://openui5nightly.hana.ondemand.com/test-resources/sap/uxap/images/robot.png) | [Image source and OpenUI5 Apache-2.0 notice](./fiori-design-lab/public/images/SOURCES.md) |

Copyright SAP SE and contributors applies as stated in the original notices. The fonts and SVG path data retain their original sources. Registry foundation files include the font, icon and theme notices alongside the copied component files; the independent consumer retains these notices in `src/lib/fiori/`.

Reference indexes and implementation notes in `fiori-design-lab/references/` link to official documentation and samples. Complete downloaded UI5 JavaScript, CSS, HTML and XML snapshots are not included in this public source copy.

Other JavaScript and build dependencies are identified in each subproject's `package.json` and `package-lock.json`; their upstream licenses remain applicable. This notice documents third-party resources and does not assign a license to the repository's original code.

Copies of notices for copied shadcn source and selected UI dependencies are retained below:

- [shadcn](./third-party-licenses/shadcn-MIT.txt) (MIT)
- [Base UI](./third-party-licenses/base-ui-MIT.txt) and [Base UI utils](./third-party-licenses/base-ui-utils-MIT.txt) (MIT)
- [cn](./third-party-licenses/cn-MIT.txt) (MIT)
- [class-variance-authority](./third-party-licenses/class-variance-authority-Apache-2.0.txt) (Apache-2.0)
- [Geist](./third-party-licenses/geist-OFL-1.1.txt) (SIL Open Font License 1.1; consumer default font)
- [Lucide](./third-party-licenses/lucide-ISC-MIT.txt) (ISC and retained Feather MIT notices; consumer icons)
