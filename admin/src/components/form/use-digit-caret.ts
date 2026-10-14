"use client"

import * as React from "react"

/**
 * Keeps the caret beside the same digit when a controlled input re-formats its value
 * ("1690000" → "16,90,000"). Call `remember(e)` at the top of onChange; spread `ref` on the input.
 */
export function useDigitCaret() {
  const ref = React.useRef<HTMLInputElement>(null)
  const digitsRight = React.useRef<number | null>(null)

  React.useLayoutEffect(() => {
    const el = ref.current
    const n = digitsRight.current
    digitsRight.current = null
    if (!el || n === null || el.ownerDocument.activeElement !== el) return
    let pos = el.value.length
    for (let seen = 0; pos > 0 && seen < n; ) {
      pos -= 1
      if (/\d/.test(el.value[pos])) seen += 1
    }
    el.setSelectionRange(pos, pos)
  })

  const remember = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, selectionStart } = e.target
    digitsRight.current = value.slice(selectionStart ?? value.length).replace(/\D/g, "").length
  }, [])

  return { ref, remember }
}
