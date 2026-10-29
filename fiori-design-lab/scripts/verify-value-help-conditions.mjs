import assert from "node:assert/strict"
import { test } from "node:test"
import {
  formatValueHelpCondition,
  isCompleteValueHelpCondition,
  matchesValueHelpConditions,
  missingValueHelpOperands,
  normalizeValueHelpCondition,
} from "../src/lib/value-help-conditions.ts"
import { valueHelpModels } from "../src/lib/value-help-models.ts"

const condition = (operation, value1 = "", value2 = "", exclude = false) => ({
  id: `${operation}-${value1}-${value2}-${exclude}`,
  operation,
  exclude,
  value1,
  value2,
})
const matchedIds = (conditions) =>
  valueHelpModels
    .filter((model) => matchesValueHelpConditions(model.id, conditions))
    .map((model) => model.id)

test("included ranges form a union, then exclusions remove matching values", () => {
  const conditions = [
    condition("BT", "RA09-01", "RA09-04"),
    condition("StartsWith", "RA11"),
    condition("EQ", "RA09-02", "", true),
  ]
  assert.deepEqual(matchedIds(conditions), [
    "RA09-01",
    "RA09-03",
    "RA09-04",
    "RA11-01",
    "RA11-02",
    "RA11-03",
    "RA11-04",
    "RA11-05",
    "RA11-06",
  ])
  assert.equal(formatValueHelpCondition(conditions[0]), "RA09-01...RA09-04")
  assert.equal(formatValueHelpCondition(conditions[2]), "!(=RA09-02)")
})

test("exclusion-only, Empty and NotEmpty conditions preserve set semantics", () => {
  assert.equal(
    matchedIds([condition("StartsWith", "RA09", "", true)]).length,
    30
  )
  assert.equal(matchedIds([condition("Empty")]).length, 0)
  assert.equal(matchedIds([condition("Empty", "", "", true)]).length, 36)
  assert.equal(
    formatValueHelpCondition(condition("Empty", "", "", true)),
    "!(<empty>)"
  )
})

test("uppercase string comparison has inclusive boundaries and no numerical range-order validation", () => {
  const range = condition("BT", "ra09-01", "ra09-04")
  assert.equal(matchedIds([range]).length, 4)
  assert.equal(normalizeValueHelpCondition(range).value1, "RA09-01")
  const reversed = condition("BT", "RA09-04", "RA09-01")
  assert.deepEqual(missingValueHelpOperands(reversed), [])
  assert.deepEqual(matchedIds([reversed]), [])
  assert.equal(matchedIds([condition("LT", "RA09-03")]).length, 26)
  assert.equal(matchedIds([condition("LE", "RA09-03")]).length, 27)
  assert.equal(matchedIds([condition("GT", "RA09-03")]).length, 9)
  assert.equal(matchedIds([condition("GE", "RA09-03")]).length, 10)
})

test("partial intervals warn and are omitted, while wholly empty rows are ignored", () => {
  const partial = condition("BT", "RA09-01")
  assert.equal(isCompleteValueHelpCondition(partial), false)
  assert.deepEqual(missingValueHelpOperands(partial), ["value2"])
  assert.deepEqual(missingValueHelpOperands(condition("BT", "", "RA09-04")), [
    "value1",
  ])
  assert.deepEqual(missingValueHelpOperands(condition("BT")), [])
  assert.equal(formatValueHelpCondition(partial), "")
  assert.deepEqual(matchedIds([condition("EQ", "RA11-01"), partial]), [
    "RA11-01",
  ])
})
