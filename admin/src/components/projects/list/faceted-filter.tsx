// Adapted from 21st.dev: uniquesonu/data-table-filter (demo 8103)
// Restyled onto the installed DropdownMenu: multi-select checkbox items (role=menuitemcheckbox, so the checked state is
// announced), counts per option, selected values as chips in the trigger (max 2, then "N selected"), neutral
// "Clear filter" instead of red text. No search box: these facets have six options or fewer.
"use client"

import * as React from "react"
import { ListFilter } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { formatNumber } from "@/lib/format"

export interface FacetOption {
  value: string
  label: string
  count: number
}

export function FacetedFilter({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: FacetOption[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const picked = options.filter((o) => selected.includes(o.value))
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={picked.length ? `${title}: ${picked.map((o) => o.label).join(", ")}` : `Filter by ${title.toLowerCase()}`}
        >
          <ListFilter className="text-muted-foreground" />
          {title}
          {picked.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              {picked.length > 2 ? (
                <Chip>{picked.length} selected</Chip>
              ) : (
                picked.map((o) => <Chip key={o.value}>{o.label}</Chip>)
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start" aria-label={title}>
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={selected.includes(o.value)}
            onCheckedChange={() => toggle(o.value)}
            // Stay open: picking several values is the point.
            onSelect={(e) => e.preventDefault()}
          >
            <span className="truncate">{o.label}</span>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">{formatNumber(o.count)}</span>
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])} className="text-muted-foreground">
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-normal text-foreground">{children}</span>
}
