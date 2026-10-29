import type {
  ValueHelpColumn,
  ValueHelpItem,
} from "@/components/fiori/value-help"

// Fictional robot catalogue for the independent Value Help demonstration only.
// These configurations do not alter the official sample or any purchase order.
const modelFamilies = [
  {
    prefix: "RA09",
    label: "Robot Arm Series 9",
    manufacturer: "Robotech",
    axis: "6 Axis",
  },
  {
    prefix: "RA07",
    label: "Robot Arm Series 7",
    manufacturer: "Robotech",
    axis: "6 Axis",
  },
  {
    prefix: "RA11",
    label: "Robot Arm Series 11",
    manufacturer: "Automation Dynamics",
    axis: "7 Axis",
  },
  {
    prefix: "CC06",
    label: "Collaborative Arm C6",
    manufacturer: "Precision Robotics",
    axis: "6 Axis",
  },
  {
    prefix: "PP04",
    label: "Precision Arm P4",
    manufacturer: "Precision Robotics",
    axis: "4 Axis",
  },
  {
    prefix: "HD12",
    label: "Heavy Duty Arm H12",
    manufacturer: "MotionWorks",
    axis: "6 Axis",
  },
]

const configurations = [
  "Standard",
  "Extended Reach",
  "High Payload",
  "Compact Mount",
  "Precision",
  "Dust Protected",
]

export const valueHelpModels: ValueHelpItem[] = modelFamilies.flatMap((model) =>
  configurations.map((configuration, index) => ({
    id: `${model.prefix}-${String(index + 1).padStart(2, "0")}`,
    label: `${model.label} · ${configuration}`,
    attributes: {
      manufacturer: model.manufacturer,
      axis: model.axis,
    },
  }))
)

export const valueHelpModelColumns: ValueHelpColumn[] = [
  { key: "id", label: "型号编号", width: 112 },
  { key: "label", label: "型号名称" },
  { key: "manufacturer", label: "制造商", width: 200 },
  { key: "axis", label: "轴数", width: 100 },
]
