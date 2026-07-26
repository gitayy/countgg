import { useEffect, useRef, useState } from 'react'

// Monotonic ease-out (cubic-bezier(0.22, 1, 0.36, 1) approximated) — starts fast, settles
// smoothly, but never overshoots past the target. A count-up number shouldn't visibly go
// past its target and tick backwards, unlike the bouncy badge/checkmark pops elsewhere.
function easeOutCubicBezier(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Animates a displayed number from its previous value to `value` over `durationMs`,
// using a monotonic ease-out curve so it counts smoothly up (or down) to the target
// without overshooting past it.
export function useAnimatedNumber(value: number, durationMs = 700): number {
  const [displayed, setDisplayed] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return

    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / durationMs)
      const eased = easeOutCubicBezier(t)
      const current = Math.round(from + (to - from) * eased)
      setDisplayed(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setDisplayed(to)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      fromRef.current = to
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs])

  return displayed
}
