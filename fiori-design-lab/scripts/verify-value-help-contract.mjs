import assert from "node:assert/strict"
import { test } from "node:test"
import {
  filterValueHelpItems,
  getValueHelpColumnValue,
} from "../src/lib/value-help-query.ts"
import {
  formatValueHelpCondition,
  matchesValueHelpConditions,
  normalizeValueHelpCondition,
} from "../src/lib/value-help-conditions.ts"

const items = Object.freeze([
  Object.freeze({
    id: "WH-BER",
    label: "Berlin warehouse",
    attributes: Object.freeze({
      region: "EU",
      city: "Berlin",
      hidden: "private-tag",
    }),
  }),
  Object.freeze({
    id: "WH-PAR",
    label: "Paris warehouse",
    attributes: Object.freeze({
      region: "EU",
      city: "Paris",
      hidden: "private-tag",
    }),
  }),
  Object.freeze({
    id: "WH-SHA",
    label: "Shanghai warehouse",
    attributes: Object.freeze({ region: "APAC", city: "Shanghai" }),
  }),
  Object.freeze({ id: "NONE", label: "Unassigned" }),
])
const columns = Object.freeze([
  { key: "id", label: "ID" },
  { key: "label", label: "Location" },
  { key: "region", label: "Region", filter: "select" },
  { key: "city", label: "City", filter: "text" },
  { key: "hidden", label: "Hidden", searchable: false, filter: false },
])
const ids = (state) =>
  filterValueHelpItems(items, columns, state).map((item) => item.id)
const condition = (operation, value1, value2 = "", exclude = false) =>
  Object.freeze({ id: "condition-1", operation, value1, value2, exclude })

test("external attributes and missing optional attributes resolve without changing catalogue", () => {
  assert.equal(getValueHelpColumnValue(items[0], "city"), "Berlin")
  assert.equal(getValueHelpColumnValue(items[3], "city"), "")
  assert.deepEqual(ids({ search: "", filters: {} }), [
    "WH-BER",
    "WH-PAR",
    "WH-SHA",
    "NONE",
  ])
  assert.equal(items[0].attributes.hidden, "private-tag")
})

test("text filters can address arbitrary external columns while select filters use exact values", () => {
  assert.deepEqual(ids({ search: "", filters: { city: "a" } }), [
    "WH-PAR",
    "WH-SHA",
  ])
  assert.deepEqual(ids({ search: "", filters: { region: "EU", city: "a" } }), [
    "WH-PAR",
  ])
  assert.deepEqual(ids({ search: "", filters: { region: "eu" } }), [])
})

test("Basic Search combines with filters and disabled search/filter columns do not leak data", () => {
  assert.deepEqual(ids({ search: "WAREHOUSE", filters: { region: "APAC" } }), [
    "WH-SHA",
  ])
  assert.deepEqual(ids({ search: "private-tag", filters: {} }), [])
  assert.deepEqual(
    ids({ search: "", filters: { hidden: "impossible", region: "EU" } }),
    ["WH-BER", "WH-PAR"]
  )
  assert.deepEqual(
    filterValueHelpItems(items, [], { search: "Unassigned", filters: {} }).map(
      (item) => item.id
    ),
    ["NONE"]
  )
})

test("Preserve string conditions retain case in normalized values, tokens and matching", () => {
  const rule = condition("EQ", "Ab-01")
  assert.equal(normalizeValueHelpCondition(rule, "Preserve").value1, "Ab-01")
  assert.equal(formatValueHelpCondition(rule, "Preserve"), "=Ab-01")
  assert.equal(matchesValueHelpConditions("Ab-01", [rule], "Preserve"), true)
  assert.equal(matchesValueHelpConditions("AB-01", [rule], "Preserve"), false)
  assert.equal(matchesValueHelpConditions("AB-01", [rule], "UpperCase"), true)
  assert.equal(rule.value1, "Ab-01")
})

test("different catalogues obey include union followed by exclusions without fixture assumptions", () => {
  const rules = [
    condition("StartsWith", "WH"),
    { ...condition("EQ", "WH-PAR", "", true), id: "condition-2" },
  ]
  assert.deepEqual(
    items
      .filter((item) => matchesValueHelpConditions(item.id, rules))
      .map((item) => item.id),
    ["WH-BER", "WH-SHA"]
  )
  assert.deepEqual(
    items
      .filter((item) =>
        matchesValueHelpConditions(item.id, [
          condition("StartsWith", "WH", "", true),
        ])
      )
      .map((item) => item.id),
    ["NONE"]
  )
})
