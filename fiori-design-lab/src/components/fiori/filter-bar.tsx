"use client"

import type { FormEventHandler, ReactNode } from "react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import "./list-report.css"

export type FilterBarField = {
  id: string
  label: ReactNode
  control: ReactNode
  invalid?: boolean
}
export type FilterBarProps = {
  fields: FilterBarField[]
  search?: ReactNode
  actions?: ReactNode
  label?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
}

/** Field values, update mode, validation and query execution belong to the caller. */
export function FilterBar({
  fields,
  search,
  actions,
  label = "筛选器",
  onSubmit,
}: FilterBarProps) {
  return (
    <form
      className="filter-bar"
      aria-label={label}
      onSubmit={onSubmit ?? ((event) => event.preventDefault())}
    >
      <FieldGroup className="filter-grid">
        {search != null && <Field className="basic-search">{search}</Field>}
        {fields.map(({ id, label: fieldLabel, control, invalid }) => (
          <Field key={id} data-invalid={invalid || undefined}>
            <FieldLabel htmlFor={id}>{fieldLabel}</FieldLabel>
            {control}
          </Field>
        ))}
        {actions != null && <div className="filter-actions">{actions}</div>}
      </FieldGroup>
    </form>
  )
}
