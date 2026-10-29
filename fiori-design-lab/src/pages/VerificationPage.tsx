import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SapIcon } from "@/components/fiori/sap-icon"
import { ObjectStatus } from "@/components/fiori/object-status"
import "./verification.css"

type Capability = {
  name: string
  state: "代码覆盖" | "部分覆盖" | "未接入"
  current: string
  boundary: string
}
const groups: { title: string; subtitle: string; rows: Capability[] }[] = [
  {
    title: "视觉 Visual",
    subtitle:
      "以官方 ObjectPageSectionShowTitle 快照为对象页基准，保留明确内容与标题层级。",
    rows: [
      {
        name: "Morning Horizon 主题",
        state: "代码覆盖",
        current:
          "使用 SAP 主题 11.36.5 参数映射到 shadcn，并保留 Compact / Cozy 密度。",
        boundary: "仅覆盖明亮主题；密度、焦点和窄屏状态按本轮实际检查验收。",
      },
      {
        name: "字体、图标与 Robot 图片",
        state: "代码覆盖",
        current:
          "本地 72 字体、SAP-icons 2.28.0 和官方 sample 的 Robot Arm 静态图片。",
        boundary:
          "SAP/UI5 仅作为静态资源来源，没有导入 UI5 组件运行时；全量逐像素对照仍需专项验收。",
      },
      {
        name: "两大 Section 与表单层级",
        state: "代码覆盖",
        current:
          "General Information 和 Contact Information；保留 Order Details、Configuration Accounts、Products 及联系方式表单组。",
        boundary:
          "以 sample 的 showTitle 与英文文案为准，单一样本不能代表全部 Object Page 变体。",
      },
      {
        name: "基础控件状态",
        state: "代码覆盖",
        current:
          "补充 Button、Input、Checkbox、RadioButton、Select、Dialog、MessageStrip 与 ObjectStatus 的可操作状态预览；按 SAPUI5 1.151.0 Horizon 源码调整尺寸、语义色、焦点和只读样式。",
        boundary:
          "覆盖本页列出的状态与预览变体；不代表全部控件 API、输入值状态消息弹层、暗色或高对比度主题已实现。浏览器对照结果另记于 QA。",
      },
    ],
  },
  {
    title: "交互 Interaction",
    subtitle:
      "对照 expanded / snapped、pin、anchor 和 overflow；代码覆盖与实际验收结果分开记录。",
    rows: [
      {
        name: "动态页头与固定",
        state: "代码覆盖",
        current: "对照滚动收缩、展开/收起标题和内容、手动控制及 pin 固定状态。",
        boundary:
          "行为由 React 本地代码实现；本轮逐状态浏览器验证由 QA 记录，不由此表推定通过。",
      },
      {
        name: "Anchor 与 Overflow",
        state: "代码覆盖",
        current: "两大分区定位、滚动同步与窄屏操作溢出排布。",
        boundary:
          "需按宽度、密度和焦点路径核对，尚不能据此宣称完整 UI5 行为等价。",
      },
      {
        name: "Sample 操作控件",
        state: "部分覆盖",
        current:
          "显示 Edit、Delete、Simulate Assembly，以及 Products 工具栏 Search、Sort、Filter、Group、Settings。",
        boundary:
          "官方 XML 没有相关业务 handlers，也没有 Controller；不附加编辑、删除、保存、模拟装配或表格业务操作结果。",
      },
      {
        name: "Purchase Orders 列表入口",
        state: "代码覆盖",
        current:
          "32 条采购演示记录的本地筛选、行选择、列设置、排序、自定义视图与 CSV 导出；列表与对应详情共享数据。",
        boundary:
          "列表是本地对照入口；不等于官方对象页 XML 自带 List Report，也不覆盖完整 UI5 P13n、服务端查询或导出服务。",
      },
      {
        name: "只读表格键盘导航",
        state: "部分覆盖",
        current:
          "采购列表接入共享导航 hook：行与单元格方向键、Home/End、PageUp/PageDown、选择、行打开，以及 F2/F7 在导航和单元格内容之间切换。",
        boundary:
          "面向当前只读 Responsive Table；未实现完整 Edit 模式，全部表格变体与屏幕阅读器尚未验收，不宣称与 UI5 键盘引擎完全等价。",
      },
      {
        name: "Value Help 单选与多选",
        state: "代码覆盖",
        current:
          "组件预览提供独立型号目录的单选回填、多选确认/取消、搜索与属性筛选，以及手机选择视图。",
        boundary:
          "使用 shadcn/Base UI 组合；建议列表、服务端查询和完整 UI5 单元格键盘模式未接入。示例不修改采购列表或官方对象页。",
      },
      {
        name: "Value Help 范围与排除",
        state: "代码覆盖",
        current:
          "独立 Define Conditions 示例支持包含与排除、等于、区间、比较、文本匹配和空值条件；确定提交、取消保留原条件，并按条件过滤型号目录。",
        boundary:
          "当前为独立 conditions-only 模式，未合并为同时选行与定义条件的完整 Value Help Dialog；使用本地字符串目录，不接入后端条件服务。",
      },
      {
        name: "消息汇总与错误定位",
        state: "代码覆盖",
        current:
          "独立表单预览提供错误、警告、信息和成功消息；支持类型筛选、详情与返回、定位关联字段、修正输入和重新保存，并提供手机消息视图。",
        boundary:
          "校验与保存反馈由本地 React 状态实现，未连接业务保存服务；消息预览不为官方对象页增加业务 handlers。读屏效果需专项验收。",
      },
    ],
  },
  {
    title: "数据 Data",
    subtitle:
      "保留官方采购单与5条重复文档行，补充31条同结构演示记录，共享静态数据。",
    rows: [
      {
        name: "采购单与 Products",
        state: "代码覆盖",
        current:
          "Robot Arm Series 9 / PO-48865；Products 保留 5 条 10223882001820 / Jologa / Denise Smith / 12,897.00 EUR 重复行。",
        boundary:
          "原始 PO-48865 的重复行来自 sample XML；新增31条为虚构演示记录，列表与详情对应，数据不写入浏览器订单存储。",
      },
      {
        name: "本地视图与偏好",
        state: "代码覆盖",
        current:
          "浏览器保存采购列表的自定义视图与密度偏好；恢复会清除本地视图并重置列表状态。",
        boundary:
          "仅当前 origin 有效，不跨浏览器或设备同步；固定样本和密度偏好不随视图恢复而改写。",
      },
      {
        name: "业务服务与数据引擎",
        state: "未接入",
        current:
          "使用共享 TypeScript 样本数据及 React / shadcn / Base UI 组合实现。",
        boundary:
          "未接入后端、OData、Fiori Elements 元数据页面或 SAP Launchpad。",
      },
    ],
  },
]
const sources = [
  {
    label: "ObjectPageSectionShowTitle · nightly sample",
    url: "https://openui5nightly.hana.ondemand.com/#/entity/sap.uxap.HeaderFacetPattern/sample/sap.uxap.sample.ObjectPageSectionShowTitle",
  },
  {
    label: "Fiori v1-151 设计规范",
    url: "https://www.sap.com/design-system/fiori-design-web/v1-151/discover/get-started",
  },
  {
    label: "List Report v1-151",
    url: "https://www.sap.com/design-system/fiori-design-web/v1-151/page-types/floorplans/list-report-floorplan-sap-fiori-element",
  },
  {
    label: "Responsive Table v1-151",
    url: "https://www.sap.com/design-system/fiori-design-web/v1-151/ui-elements/responsive-table",
  },
  {
    label: "基础控件 · SAPUI5 1.151.0",
    url: "https://ui5.sap.com/1.151.0/#/entity/sap.m.Button",
  },
  {
    label: "Value Help Dialog · SAPUI5 1.151.0",
    url: "https://ui5.sap.com/1.151.0/#/entity/sap.ui.comp.valuehelpdialog.ValueHelpDialog",
  },
  {
    label: "Message Popover · SAPUI5 1.151.0",
    url: "https://ui5.sap.com/1.151.0/#/entity/sap.m.MessagePopover",
  },
  {
    label: "SAP Fiori Community UI Kit",
    url: "https://www.figma.com/community/file/1494295794601744471",
  },
  {
    label: "SAP Theming Base Content",
    url: "https://github.com/SAP/theming-base-content",
  },
  { label: "shadcn Registry", url: "https://ui.shadcn.com/docs/registry" },
]
const roadmap = [
  {
    number: "01",
    title: "完成设备专项验收",
    text: "在独立消费项目上补充真实触屏、软键盘、Safari / VoiceOver 与完整设备矩阵，记录实际动作、焦点和朗读结果。",
  },
  {
    number: "02",
    title: "扩展主题与控件变体",
    text: "在当前 Morning Horizon 明亮主题基础上逐项补充暗色、高对比度和更多控件状态，完成各自的视觉、键盘与密度对照。",
  },
  {
    number: "03",
    title: "提炼页面模板",
    text: "将动态页头、AnchorBar、响应式表格与 List Report / Object Page 提炼为复用模板，明确受控状态、数据适配和版本升级方式。",
  },
]
const pilot = [
  {
    name: "组件契约",
    state: "已记录",
    current:
      "第一批 API 已记录公开 props、调用方数据、受控提交/取消，以及键盘、焦点和密度边界。",
    boundary:
      "范围为 Foundation、Button、Input、Select、MessageStrip、Value Help、独立条件字段与 MessagePopover；当前仅明亮主题。",
  },
  {
    name: "公共 React 源码",
    state: "已提炼",
    current:
      "复杂组件接收调用方数据与回调；样本数据和业务校验留在预览适配中。FioriProvider、专用 color utilities 与弹层容器提供区域隔离。",
    boundary:
      "源码使用 shadcn / Base UI，没有 UI5 控件运行时；并列 Provider 支持不同密度，嵌套 Provider 暂不支持。",
  },
  {
    name: "独立 Registry 消费",
    state: "已验收",
    current:
      "10 个本地标准条目、37 个安装文件；独立 React 项目使用自己的数据和 ~/ 别名。构建、源码闭包、桌面与390px选择/条件/消息路径、主题和密度隔离已验证。",
    boundary:
      "axe 复扫未报告违规；扫描未判定项另有颜色与键盘复核记录。真实触屏、软键盘和原生读屏未执行；本轮为本地试产，详细证据见 QA。",
  },
]

export function VerificationPage({ onReset }: { onReset: () => void }) {
  return (
    <div className="verification-page">
      <header className="verification-page-header">
        <div className="verification-breadcrumb">
          <span>设计实验室</span>
          <span>/</span>
          <span>验证记录</span>
        </div>
        <div className="verification-title-row">
          <div>
            <h1>验证记录</h1>
            <p>官方样本、公共组件与本地 Registry 消费验证</p>
          </div>
          <ObjectStatus tone="information" icon>
            本地组件试产
          </ObjectStatus>
        </div>
      </header>
      <div className="verification-content">
        <section
          className="verification-baseline"
          aria-labelledby="verification-baseline-title"
        >
          <h2 id="verification-baseline-title">参考基线</h2>
          <dl>
            <div>
              <dt>对象页样本</dt>
              <dd>ObjectPageSectionShowTitle</dd>
            </div>
            <div>
              <dt>主题与密度</dt>
              <dd>Morning Horizon · Compact / Cozy</dd>
            </div>
            <div>
              <dt>版本基线</dt>
              <dd>
                对象页 nightly 1.155.0-SNAPSHOT · 控件 1.151.0 · guideline
                v1-151
              </dd>
            </div>
            <div>
              <dt>实现底座</dt>
              <dd>React · shadcn · Base UI</dd>
            </div>
          </dl>
          <p>
            “代码覆盖”描述实现范围，不表示已通过全部对照验收。nightly
            1.155.0-SNAPSHOT 是对象页样本快照，基础控件对照为 SAPUI5
            1.151.0，v1-151
            是设计规范版本；主题与图标版本分别记录。浏览器对照结果以 QA
            为准；完整设备矩阵与读屏尚未验收，完整编辑表格尚未实现，当前没有暗色主题或后端服务。
          </p>
        </section>
        <section
          className="verification-section"
          aria-labelledby="verification-pilot-title"
        >
          <div className="verification-section-heading">
            <h2 id="verification-pilot-title">React 组件试产</h2>
            <p>
              三项交付状态如下。源码与安装检查、独立消费浏览器结果和真实设备验收分别记录，详细证据见 QA.md 与组件契约文档。
            </p>
            <div className="verification-links">
              <a
                href="http://127.0.0.1:4188/"
                target="_blank"
                rel="noreferrer"
              >
                打开独立 React 消费页面
                <SapIcon name="navigation-right-arrow" />
              </a>
            </div>
          </div>
          <Table className="verification-table">
            <TableHeader>
              <TableRow>
                <TableHead>交付项</TableHead>
                <TableHead>当前状态</TableHead>
                <TableHead>实际交付</TableHead>
                <TableHead>验收边界</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pilot.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <strong>{item.name}</strong>
                  </TableCell>
                  <TableCell>
                    <ObjectStatus tone="information">{item.state}</ObjectStatus>
                  </TableCell>
                  <TableCell>{item.current}</TableCell>
                  <TableCell>{item.boundary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        <section className="verification-section">
          <div className="verification-section-heading">
            <h2>历史浏览器验证 · 2026-10-29</h2>
            <p>
              以下保留此前官方 sample
              与本地预览的操作结果，限于列出的路径；独立 React 消费项目的本轮结果另见 QA.md。
            </p>
          </div>
          <Table className="verification-table">
            <TableHeader>
              <TableRow>
                <TableHead>验证项</TableHead>
                <TableHead>实际结果</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                [
                  "采购表格与视图",
                  "32 条滚动加载与全选、行/单元格键盘导航、列设置、排序、视图刷新恢复和 CSV 下载解析通过。",
                ],
                [
                  "Value Help",
                  "单选/多选确认与取消、区间包含与排除、不完整区间 Warning、操作符过滤和 token 删除通过；手机嵌套 Select 关闭回到原字段。",
                ],
                [
                  "消息与错误定位",
                  "类型筛选、详情/返回、关联字段定位、重新校验、关闭焦点恢复通过；桌面弹层 440×320px，手机全屏。",
                ],
                [
                  "基础控件",
                  "可用/禁用/只读与语义状态、点击和键盘操作、Compact/Cozy 尺寸、Dialog 焦点循环和手机 Select/Dialog 通过。",
                ],
                [
                  "Object Page 回归",
                  "下方手动展开后保持 expanded，Pin 与 anchor 导航保持展开；取消 Pin 后继续滚动恢复 snapped。",
                ],
              ].map(([name, result]) => (
                <TableRow key={name}>
                  <TableCell>
                    <strong>{name}</strong>
                  </TableCell>
                  <TableCell>{result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        {groups.map((group) => (
          <section className="verification-section" key={group.title}>
            <div className="verification-section-heading">
              <h2>{group.title}</h2>
              <p>{group.subtitle}</p>
            </div>
            <Table className="verification-table">
              <TableHeader>
                <TableRow>
                  <TableHead>能力</TableHead>
                  <TableHead>覆盖状态</TableHead>
                  <TableHead>当前实现</TableHead>
                  <TableHead>简化边界 / 后续验证</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>
                      <strong>{row.name}</strong>
                    </TableCell>
                    <TableCell>
                      <ObjectStatus
                        tone={
                          row.state === "代码覆盖"
                            ? "information"
                            : row.state === "部分覆盖"
                              ? "critical"
                              : "neutral"
                        }
                      >
                        {row.state}
                      </ObjectStatus>
                    </TableCell>
                    <TableCell>{row.current}</TableCell>
                    <TableCell>{row.boundary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ))}
        <section className="verification-section">
          <div className="verification-section-heading">
            <h2>后续路线</h2>
            <p>
              本地 Registry 试产与独立安装已完成；以下是后续扩展，当前未公网发布，也未完成完整设备、主题和页面模板覆盖。
            </p>
          </div>
          <ol className="verification-roadmap">
            {roadmap.map((stage) => (
              <li key={stage.number}>
                <span>{stage.number}</span>
                <div>
                  <h3>{stage.title}</h3>
                  <p>{stage.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="verification-section verification-resources">
          <div>
            <h2>参考资源</h2>
            <div className="verification-links">
              {sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.label}
                  <SapIcon name="navigation-right-arrow" />
                </a>
              ))}
            </div>
          </div>
          <div className="verification-reset">
            <div>
              <h3>恢复列表状态</h3>
              <p>
                清除当前浏览器的采购自定义视图，重置列表与搜索；保留固定样本和密度偏好。
              </p>
            </div>
            <Button variant="outline" onClick={onReset}>
              <SapIcon name="refresh" data-icon="inline-start" />
              恢复列表状态
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
