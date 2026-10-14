// Adapted from 21st.dev: uvain/command-menu-palette (demo 33510)
// Ported onto the installed shadcn Command: Ctrl K hook, icon + hint items, key-hint footer.
"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Building2, LayoutDashboard, LayoutGrid, Plus, RotateCcw, Search, SunMoon } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import { ResetDemoDialog } from "@/components/app/reset-demo-dialog"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { UNIT_STATUS_META, getProjectType, projectTypeLabel } from "@/lib/constants"
import { formatArea } from "@/lib/format"
import { canLeave } from "@/lib/leave-guard"
import { useDemo } from "@/lib/store"
import type { Project, Unit } from "@/lib/types"

/** "Global City VI" -> "GC VI", "Kompally County III" -> "KC III": initials, roman numerals and digits kept. */
function projectCode(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)
  let code = ""
  for (const w of words) {
    if (/^[IVXL]+$|^\d+$/.test(w)) code += ` ${w} `
    else code += w[0].toUpperCase()
  }
  return code.replace(/\s+/g, " ").trim()
}

type PlotHit = { project: Project; unit: Unit }

/** "142", "GC VI 142", "plot 142": the last token holding a digit is the unit number, the rest names the project. */
function findPlots(query: string, projects: Project[], units: Record<string, Unit[]>, limit = 8): PlotHit[] {
  const tokens = query
    .toLowerCase()
    .replace(/·/g, " ")
    .split(/\s+/)
    .filter((t) => t && !["plot", "plots", "villa", "flat", "unit", "no", "no."].includes(t))
  const num = tokens.at(-1)
  if (!num || !/\d/.test(num)) return []
  const prefix = tokens.slice(0, -1).join(" ")
  const exact: PlotHit[] = []
  const partial: PlotHit[] = []
  for (const project of projects) {
    if (prefix && !projectCode(project.name).toLowerCase().includes(prefix) && !project.name.toLowerCase().includes(prefix))
      continue
    for (const unit of units[project.id] ?? []) {
      const n = unit.number.toLowerCase()
      if (n === num) exact.push({ project, unit })
      else if (n.startsWith(num)) partial.push({ project, unit })
    }
  }
  // ponytail: linear scan over every unit per keystroke; fine for a few thousand units.
  return [...exact, ...partial].slice(0, limit)
}

function Item({
  icon,
  hint,
  children,
  ...props
}: React.ComponentProps<typeof CommandItem> & { icon: ReactNode; hint?: ReactNode }) {
  return (
    <CommandItem {...props}>
      {icon}
      <span className="grid min-w-0 flex-1">
        <span className="truncate">{children}</span>
        {hint ? <span className="truncate text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </CommandItem>
  )
}

function Palette({ close, onReset }: { close: () => void; onReset: () => void }) {
  const router = useRouter()
  const { state } = useDemo()
  const { resolvedTheme, setTheme } = useTheme()
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()

  const projects = useMemo(
    () =>
      state.projects
        .filter((p) => p.publishing.state !== "archived")
        .sort((a, b) => Number(b.lifecycle === "ongoing") - Number(a.lifecycle === "ongoing")),
    [state.projects],
  )
  const projectHits = q
    ? projects.filter((p) => p.name.toLowerCase().includes(q) || projectCode(p.name).toLowerCase().includes(q))
    : projects
  const plotHits = useMemo(() => findPlots(query, projects, state.units), [query, projects, state.units])

  const go = (href: string) => {
    close()
    if (canLeave(href)) router.push(href) // a dirty editor may prompt first, then navigate itself
  }
  const actions = [
    { id: "dashboard", label: "Go to dashboard", icon: <LayoutDashboard />, run: () => go("/dashboard") },
    { id: "new", label: "New project", icon: <Plus />, run: () => go("/projects/new") },
    {
      id: "theme",
      label: "Toggle theme",
      icon: <SunMoon />,
      run: () => {
        close()
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      },
    },
    { id: "reset", label: "Reset demo data", icon: <RotateCcw />, run: onReset },
  ].filter((a) => !q || a.label.toLowerCase().includes(q))

  return (
    // Filtering is ours (plot numbers need parsing); cmdk keeps the keyboard model.
    <Command shouldFilter={false} loop>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search projects, plots or actions…" />
      <CommandList className="max-h-[min(360px,60dvh)]">
        <CommandEmpty>No project, plot or action matches “{query}”.</CommandEmpty>
        {plotHits.length > 0 && (
          <CommandGroup heading="Plots">
            {plotHits.map(({ project, unit }) => {
              const type = getProjectType(project.typeId)
              return (
                <Item
                  key={unit.id}
                  value={`unit:${unit.id}`}
                  icon={<LayoutGrid />}
                  hint={[project.name, UNIT_STATUS_META[unit.status].label, formatArea(unit.area, type.areaUnit)]
                    .filter(Boolean)
                    .join(" · ")}
                  onSelect={() => go(`/projects/${project.id}/inventory?unit=${encodeURIComponent(unit.number)}`)}
                >
                  {projectCode(project.name)} · {type.unitNoun} {unit.number}
                </Item>
              )
            })}
          </CommandGroup>
        )}
        {projectHits.length > 0 && (
          <CommandGroup heading="Projects">
            {projectHits.map((p) => (
              <Item
                key={p.id}
                value={`project:${p.id}`}
                icon={<Building2 />}
                hint={[projectTypeLabel(p), p.location.short].filter(Boolean).join(" · ")}
                onSelect={() => go(`/projects/${p.id}`)}
              >
                {p.name}
              </Item>
            ))}
          </CommandGroup>
        )}
        {actions.length > 0 && (
          <CommandGroup heading="Actions">
            {actions.map((a) => (
              <Item key={a.id} value={`action:${a.id}`} icon={a.icon} onSelect={a.run}>
                {a.label}
              </Item>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      <div className="flex items-center gap-3 border-t px-3 pt-2 pb-1 text-xs text-muted-foreground">
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
        </span>
        <span>
          <Kbd>Enter</Kbd> to open
        </span>
        <span>
          <Kbd>Esc</Kbd> to close
        </span>
      </div>
    </Command>
  )
}

/** Header search button + Ctrl K palette. */
export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  // Registered in an effect so a hidden (Activity) route never keeps a stale listener.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // key is undefined on Chrome autofill keydowns
      if (e.key?.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <SearchButton onClick={() => setOpen(true)} />
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Find a project or plot, or run an action"
        className="shadow-overlay sm:max-w-[560px]"
      >
        <Palette
          close={() => setOpen(false)}
          onReset={() => {
            setOpen(false)
            setResetOpen(true)
          }}
        />
      </CommandDialog>
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  )
}

/** Also the Suspense fallback, so the header never shifts. */
export function SearchButton({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <Button
        variant="outline"
        onClick={onClick}
        disabled={!onClick}
        className="hidden w-40 justify-start gap-2 px-2.5 font-normal text-muted-foreground sm:inline-flex xl:w-64"
      >
        <Search />
        <span className="xl:hidden">Search</span>
        <span className="hidden xl:inline">Search projects, plots…</span>
        <Kbd className="ml-auto">Ctrl K</Kbd>
      </Button>
      <Button variant="ghost" size="icon" onClick={onClick} disabled={!onClick} aria-label="Search" className="sm:hidden">
        <Search />
      </Button>
    </>
  )
}
