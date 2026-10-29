export type ValueHelpOperation =
  | "Contains"
  | "EQ"
  | "BT"
  | "StartsWith"
  | "EndsWith"
  | "LT"
  | "LE"
  | "GT"
  | "GE"
  | "Empty"

export type ValueHelpDisplayFormat = "UpperCase" | "Preserve"

export type ValueHelpCondition = {
  id: string
  operation: ValueHelpOperation
  exclude: boolean
  value1: string
  value2: string
}

// String operators and labels from SAPUI5 1.151 P13nOperationsHelper and
// sap.m messagebundle. This string-field contract exposes extended exclusion
// operators. It is not a claim that UI5 enables all of them by default.
export const valueHelpOperations: {
  operation: ValueHelpOperation
  includeLabel: string
  excludeLabel: string
}[] = [
  {
    operation: "Contains",
    includeLabel: "contains",
    excludeLabel: "does not contain",
  },
  { operation: "EQ", includeLabel: "equal to", excludeLabel: "not equal to" },
  { operation: "BT", includeLabel: "between", excludeLabel: "not between" },
  {
    operation: "StartsWith",
    includeLabel: "starts with",
    excludeLabel: "does not start with",
  },
  {
    operation: "EndsWith",
    includeLabel: "ends with",
    excludeLabel: "does not end with",
  },
  { operation: "LT", includeLabel: "less than", excludeLabel: "not less than" },
  {
    operation: "LE",
    includeLabel: "less than or equal to",
    excludeLabel: "not less than or equal to",
  },
  {
    operation: "GT",
    includeLabel: "greater than",
    excludeLabel: "not greater than",
  },
  {
    operation: "GE",
    includeLabel: "greater than or equal to",
    excludeLabel: "not greater than or equal to",
  },
  { operation: "Empty", includeLabel: "empty", excludeLabel: "not empty" },
]

export function normalizeValueHelpOperand(
  value: string,
  displayFormat: ValueHelpDisplayFormat = "UpperCase"
) {
  return displayFormat === "UpperCase" ? value.toUpperCase() : value
}

export function normalizeValueHelpCondition(
  condition: ValueHelpCondition,
  displayFormat: ValueHelpDisplayFormat = "UpperCase"
): ValueHelpCondition {
  // String conditions use lexicographic boundaries, not numerical ordering.
  // Consumers must use the same format for field display and result matching.
  return {
    ...condition,
    value1:
      condition.operation === "Empty"
        ? ""
        : normalizeValueHelpOperand(condition.value1, displayFormat),
    value2:
      condition.operation === "BT"
        ? normalizeValueHelpOperand(condition.value2, displayFormat)
        : "",
  }
}

export function isCompleteValueHelpCondition(condition: ValueHelpCondition) {
  return (
    condition.operation === "Empty" ||
    (condition.value1 !== "" &&
      (condition.operation !== "BT" || condition.value2 !== ""))
  )
}

export function missingValueHelpOperands(
  condition: ValueHelpCondition
): ("value1" | "value2")[] {
  // A wholly empty row is ignored. Only a partially entered interval produces
  // the missing-value warning in P13nConditionPanelBase._checkCondition.
  if (condition.operation !== "BT" || (!condition.value1 && !condition.value2))
    return []
  return condition.value1 && condition.value2
    ? []
    : condition.value1
      ? ["value2"]
      : ["value1"]
}

export function formatValueHelpCondition(
  condition: ValueHelpCondition,
  displayFormat: ValueHelpDisplayFormat = "UpperCase"
) {
  if (!isCompleteValueHelpCondition(condition)) return ""
  const { operation, value1, value2, exclude } = normalizeValueHelpCondition(
    condition,
    displayFormat
  )
  const text = {
    EQ: `=${value1}`,
    GT: `>${value1}`,
    GE: `>=${value1}`,
    LT: `<${value1}`,
    LE: `<=${value1}`,
    Contains: `*${value1}*`,
    StartsWith: `${value1}*`,
    EndsWith: `*${value1}`,
    BT: `${value1}...${value2}`,
    Empty: "<empty>",
  }[operation]
  return exclude ? `!(${text})` : text
}

function matchesOperation(
  id: string,
  condition: ValueHelpCondition,
  displayFormat: ValueHelpDisplayFormat
) {
  const { operation, value1, value2 } = normalizeValueHelpCondition(
    condition,
    displayFormat
  )
  const value = normalizeValueHelpOperand(id, displayFormat)
  switch (operation) {
    case "EQ":
      return value === value1
    case "BT":
      return value >= value1 && value <= value2
    case "Contains":
      return value.includes(value1)
    case "StartsWith":
      return value.startsWith(value1)
    case "EndsWith":
      return value.endsWith(value1)
    case "LT":
      return value < value1
    case "LE":
      return value <= value1
    case "GT":
      return value > value1
    case "GE":
      return value >= value1
    case "Empty":
      return value === ""
  }
}

export function matchesValueHelpConditions(
  id: string,
  conditions: readonly ValueHelpCondition[],
  displayFormat: ValueHelpDisplayFormat = "UpperCase"
) {
  const complete = conditions.filter(isCompleteValueHelpCondition)
  const includes = complete.filter((condition) => !condition.exclude)
  const excludes = complete.filter((condition) => condition.exclude)
  // Equivalent selection-option set semantics: union of included ranges,
  // intersected with the complement of every excluded range. Exclusion-only
  // conditions start from the entire local catalogue.
  return (
    (includes.length === 0 ||
      includes.some((condition) =>
        matchesOperation(id, condition, displayFormat)
      )) &&
    excludes.every(
      (condition) => !matchesOperation(id, condition, displayFormat)
    )
  )
}
