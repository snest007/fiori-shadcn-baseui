import { useState } from "react"
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ValueHelpConditionsField } from "./value-help-conditions-field"
import {
  matchesValueHelpConditions,
  type ValueHelpCondition,
} from "@/lib/value-help-conditions"
import { valueHelpModels } from "@/lib/value-help-models"
import "./value-help-condition-preview.css"

export function ValueHelpConditionPreview() {
  const [conditions, setConditions] = useState<ValueHelpCondition[]>([])
  const results = valueHelpModels.filter((model) =>
    matchesValueHelpConditions(model.id, conditions)
  )
  return (
    <FieldSet className="value-help-condition-preview">
      <FieldLegend>范围与排除 · Define Conditions</FieldLegend>
      <ValueHelpConditionsField
        id="value-help-conditions"
        label="型号编号"
        objectLabel="Model IDs"
        placeholder="定义范围或排除条件"
        displayFormat="UpperCase"
        value={conditions}
        onValueChange={setConditions}
      />
      <FieldDescription>
        对型号编号定义条件。包含条件取并集，排除条件移除匹配值；确定后更新下表。
      </FieldDescription>
      <div className="value-help-condition-preview-table">
        <div className="value-help-result-heading">
          <h2 id="value-help-condition-results-heading">
            匹配型号 ({results.length})
          </h2>
          <span className="sr-only" role="status">
            {results.length} matching models
          </span>
        </div>
        <Table
          aria-labelledby="value-help-condition-results-heading"
          className="value-help-table"
        >
          <TableHeader>
            <TableRow>
              <TableHead className="value-help-condition-preview-id">
                型号编号
              </TableHead>
              <TableHead>型号名称</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length ? (
              results.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>{model.id}</TableCell>
                  <TableCell>{model.label}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="value-help-no-data">
                  No data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </FieldSet>
  )
}
