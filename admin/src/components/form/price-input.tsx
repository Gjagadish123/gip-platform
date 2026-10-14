"use client"

import * as React from "react"

import { formatINRCompact, formatNumber, formatPrice } from "@/lib/format"
import type { Price } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDigitCaret } from "./use-digit-caret"

type ModeKey = "per_sq_yd" | "per_sq_ft" | "total" | "on_request"

const MODES: { key: ModeKey; label: string }[] = [
  { key: "per_sq_yd", label: "Per sq yd" },
  { key: "per_sq_ft", label: "Per sq ft" },
  { key: "total", label: "Total price" },
  { key: "on_request", label: "On request" },
]

function modeKey(p: Price): ModeKey {
  return p.mode === "per_area" ? (p.per === "sq_yd" ? "per_sq_yd" : "per_sq_ft") : p.mode
}

function withMode(key: ModeKey, amount: number, from?: boolean): Price {
  if (key === "on_request") return { mode: "on_request" }
  if (key === "total") return { mode: "total", amount, from }
  return { mode: "per_area", amount, per: key === "per_sq_yd" ? "sq_yd" : "sq_ft" }
}

/** Rupees, integer. Digits grouped en-IN while typing; "= ₹1.69 Cr" preview for lakh-plus amounts. */
export function AmountInput({
  value,
  onChange,
  id,
  suffix,
  invalid,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: {
  value: number
  onChange: (n: number) => void
  id?: string
  suffix?: React.ReactNode
  invalid?: boolean
  "aria-label"?: string
  "aria-describedby"?: string
}) {
  const { ref, remember } = useDigitCaret()
  return (
    <InputGroup className="h-9">
      <InputGroupAddon>
        <InputGroupText className="text-foreground">₹</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        id={id}
        inputMode="numeric"
        autoComplete="off"
        className="tabular-nums"
        value={value ? formatNumber(value) : ""}
        placeholder="0"
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        onChange={(e) => {
          remember(e)
          const digits = e.target.value.replace(/\D/g, "").slice(0, 12)
          onChange(digits ? Number(digits) : 0)
        }}
      />
      {(suffix || value >= 100000) && (
        <InputGroupAddon align="inline-end">
          <InputGroupText className="tabular-nums">
            {suffix}
            {value >= 100000 && <span>= {formatINRCompact(value)}</span>}
          </InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

/** Price union editor: mode (per sq yd / per sq ft / total / on request) + amount + "From" flag. */
export function PriceInput({
  value,
  onChange,
  id,
  invalid,
}: {
  value: Price
  onChange: (next: Price) => void
  /** Goes on the amount input, so a FieldRow label targets it. */
  id?: string
  invalid?: boolean
}) {
  const autoId = React.useId()
  const baseId = id ?? autoId
  const key = modeKey(value)
  const amount = value.mode === "on_request" ? 0 : value.amount
  const from = value.mode === "total" ? value.from : undefined
  // Remember the amount across a detour through "On request" (event-time only).
  const lastAmount = React.useRef(amount)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Select
          value={key}
          onValueChange={(k) => onChange(withMode(k as ModeKey, amount || lastAmount.current, from))}
        >
          <SelectTrigger aria-label="Price type" className="w-full data-[size=default]:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {MODES.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {key === "on_request" ? (
          <p className="flex h-9 items-center text-sm text-muted-foreground">
            No amount. The website shows &ldquo;Contact for price&rdquo;.
          </p>
        ) : (
          <AmountInput
            id={baseId}
            value={amount}
            invalid={invalid}
            aria-describedby={`${baseId}-shows`}
            suffix={key === "per_sq_yd" ? "/ sq yd" : key === "per_sq_ft" ? "/ sq ft" : undefined}
            onChange={(n) => {
              if (n) lastAmount.current = n
              onChange(withMode(key, n, from))
            }}
          />
        )}
      </div>

      {key === "total" && (
        <label className="flex w-fit items-center gap-2 text-sm">
          <Checkbox checked={!!from} onCheckedChange={(c) => onChange(withMode(key, amount, c === true))} />
          Starting price (shows &ldquo;From&rdquo;)
        </label>
      )}
      {key !== "on_request" && amount > 0 && (
        <p id={`${baseId}-shows`} className="text-xs text-muted-foreground">
          Website shows <span className="text-foreground tabular-nums">{formatPrice(value)}</span>
        </p>
      )}
    </div>
  )
}
