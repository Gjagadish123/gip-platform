"use client"

import * as React from "react"

import { AREA_UNIT_LABEL } from "@/lib/constants"
import { formatLandArea } from "@/lib/format"
import type { AreaUnit, LandArea } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { FieldMessage } from "./field-row"

function toNumber(s: string) {
  return s.trim() === "" ? undefined : Number(s)
}

/** Number with a muted unit suffix. Empty → undefined. */
export function AreaInput({
  value,
  onChange,
  unit,
  id,
  min = 0,
  step = "any",
  placeholder,
  invalid,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: {
  value: number | undefined
  onChange: (next: number | undefined) => void
  unit: AreaUnit
  id?: string
  min?: number
  step?: number | "any"
  placeholder?: string
  invalid?: boolean
  "aria-label"?: string
  "aria-describedby"?: string
}) {
  return (
    <InputGroup className="h-9">
      <InputGroupInput
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        className="tabular-nums"
        value={value ?? ""}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        onChange={(e) => {
          const n = toNumber(e.target.value)
          onChange(n === undefined || Number.isNaN(n) ? undefined : n)
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{AREA_UNIT_LABEL[unit]}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}

/** Land parcel: acres (decimals allowed) + guntas (0–39) + "approximate" (shows "16+ acres"). */
export function LandAreaInput({
  value,
  onChange,
  id,
}: {
  value: LandArea | undefined
  onChange: (next: LandArea | undefined) => void
  /** Goes on the acres input. */
  id?: string
}) {
  const autoId = React.useId()
  const baseId = id ?? autoId
  const acres = value?.acres
  const guntas = value?.guntas
  const guntaError = guntas !== undefined && (guntas < 0 || guntas > 39 || !Number.isInteger(guntas))

  function set(next: Partial<LandArea>) {
    const merged = { acres: acres ?? 0, guntas, approx: value?.approx, ...next }
    if (!merged.acres && !merged.guntas) return onChange(undefined)
    onChange({
      acres: merged.acres,
      ...(merged.guntas ? { guntas: merged.guntas } : {}),
      ...(merged.approx ? { approx: true } : {}),
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-2">
        <AreaInput id={baseId} unit="acre" value={acres} aria-label="Acres" onChange={(n) => set({ acres: n ?? 0 })} />
        <AreaInput
          id={`${baseId}-guntas`}
          unit="gunta"
          step={1}
          value={guntas}
          aria-label="Guntas"
          invalid={guntaError}
          aria-describedby={guntaError ? `${baseId}-guntas-error` : undefined}
          onChange={(n) => set({ guntas: n })}
        />
      </div>
      <label className="flex w-fit items-center gap-2 text-sm">
        <Checkbox checked={!!value?.approx} disabled={!value} onCheckedChange={(c) => set({ approx: c === true })} />
        Approximate (shows &ldquo;+&rdquo;)
      </label>
      {guntaError ? (
        <FieldMessage id={`${baseId}-guntas-error`} kind="error">
          Guntas run 0–39 (40 guntas make 1 acre).
        </FieldMessage>
      ) : (
        value && (
          <p className="text-xs text-muted-foreground">
            Website shows <span className="text-foreground tabular-nums">{formatLandArea(value)}</span>
          </p>
        )
      )}
    </div>
  )
}
