"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { describeError } from "@/lib/supabase/data"
import { BACKEND, createClient, type Db } from "@/lib/supabase/client"

/**
 * Loads CRM rows and keeps them current: again every 30 s while the tab is visible and when it comes back into view,
 * so a website lead shows up without a reload. `reload` after a write. Supabase mode only (rows stay null in demo).
 * `load` must be stable (a module-level loader such as loadSheet).
 */
export function useCrm<T>(load: (db: Db) => Promise<T>) {
  const db = useMemo(() => (BACKEND ? createClient() : null), [])
  const [rows, setRows] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const seq = useRef(0)

  const reload = useCallback(async () => {
    if (!db) return
    const n = ++seq.current
    try {
      const next = await load(db)
      if (n === seq.current) {
        setRows(next)
        setError(null)
      }
    } catch (e) {
      if (n === seq.current) setError(describeError(e))
    }
  }, [db, load])

  useEffect(() => {
    const first = window.setTimeout(() => void reload(), 0)
    const tick = () => document.visibilityState === "visible" && void reload()
    const timer = window.setInterval(tick, 30_000)
    document.addEventListener("visibilitychange", tick)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [reload])

  return { db, rows, error, reload }
}
