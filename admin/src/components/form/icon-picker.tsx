"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Check, ChevronDown, CircleOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { ICONS, ICON_GROUPS, ICON_LABELS } from "@/lib/constants"
import type { IconKey } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const tile =
  "relative flex cursor-default flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-xs leading-tight text-muted-foreground outline-none select-none data-[checked=true]:bg-accent data-[checked=true]:text-accent-foreground data-[checked=true]:ring-2 data-[checked=true]:ring-ring data-[selected=true]:bg-muted data-[selected=true]:text-foreground"

/** The current choice: ring plus a check, so it doesn't rely on the accent fill. */
const current = <Check aria-hidden className="absolute top-1 right-1 size-3 text-foreground" />

/** The one icon registry, as a searchable grid in a popover. `compact` renders a square icon-only trigger. */
export function IconPicker({
  value,
  onChange,
  onClear,
  id,
  compact,
  "aria-label": ariaLabel = "Icon",
}: {
  value: IconKey | undefined
  onChange: (key: IconKey) => void
  /** Shows a "No icon" option. */
  onClear?: () => void
  id?: string
  compact?: boolean
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  // Close when the route is hidden (Activity) or unmounted.
  React.useEffect(() => () => setOpen(false), [])

  const Icon = value ? ICONS[value] : null
  const label = value ? ICON_LABELS[value] : "Choose icon"

  function pick(key: IconKey | null) {
    if (key) onChange(key)
    else onClear?.()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={`${ariaLabel}: ${label}`}
          className={cn(compact ? "size-9 px-0" : "h-9 w-full justify-start font-normal")}
        >
          {Icon ? <Icon aria-hidden /> : <CircleOff aria-hidden className="text-muted-foreground" />}
          {!compact && (
            <>
              <span className={cn("truncate", !value && "text-muted-foreground")}>{label}</span>
              <ChevronDown aria-hidden className="ml-auto text-muted-foreground" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search icons" />
          <CommandList className="max-h-80">
            <CommandEmpty>No icon matches.</CommandEmpty>
            {onClear && (
              <CommandGroup>
                <CommandPrimitive.Item
                  value="none no icon"
                  data-checked={!value}
                  onSelect={() => pick(null)}
                  className={cn(tile, "flex-row justify-start gap-2 px-2")}
                >
                  <CircleOff aria-hidden className="size-4" />
                  No icon
                  {!value && current}
                </CommandPrimitive.Item>
              </CommandGroup>
            )}
            {ICON_GROUPS.map((group) => (
              <CommandGroup
                key={group.label}
                heading={group.label}
                className="**:[[cmdk-group-items]]:grid **:[[cmdk-group-items]]:grid-cols-4 **:[[cmdk-group-items]]:gap-1"
              >
                {group.keys.map((key) => {
                  const ItemIcon = ICONS[key]
                  return (
                    <CommandPrimitive.Item
                      key={key}
                      value={`${key} ${ICON_LABELS[key]} ${group.label}`}
                      data-checked={key === value}
                      onSelect={() => pick(key)}
                      className={tile}
                    >
                      <ItemIcon aria-hidden className="size-4 text-foreground" />
                      <span className="line-clamp-2">{ICON_LABELS[key]}</span>
                      {key === value && current}
                    </CommandPrimitive.Item>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
