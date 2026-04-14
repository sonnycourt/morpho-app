import { useEffect, useState } from 'react'

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

/**
 * Anime une valeur numérique de 0 à `target` sur `duration` ms (ease-out).
 */
export function useAnimatedNumber(target, duration = 800, run = true) {
  const [v, setV] = useState(0)

  useEffect(() => {
    let cancelled = false
    let raf = 0

    if (!run) {
      raf = requestAnimationFrame(() => {
        if (!cancelled) setV(target)
      })
      return () => {
        cancelled = true
        cancelAnimationFrame(raf)
      }
    }

    const t0 = performance.now()

    function frame(now) {
      if (cancelled) return
      const p = Math.min(1, (now - t0) / duration)
      setV(target * easeOutCubic(p))
      if (p < 1) raf = requestAnimationFrame(frame)
      else setV(target)
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [target, duration, run])

  return v
}
