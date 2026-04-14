import { formatYMD, normalizeEntryDate, parseYMD, todayYMD } from './dates'

export function completedDatesSet(entries) {
  const set = new Set()
  for (const e of entries) {
    const d = normalizeEntryDate(e.entry_date)
    if (d) set.add(d)
  }
  return set
}

export function firstEntryYmd(entries) {
  if (!entries.length) return null
  let min = null
  for (const e of entries) {
    const d = normalizeEntryDate(e.entry_date)
    if (!d) continue
    if (min === null || d < min) min = d
  }
  return min
}

export function averageAlignment(entries) {
  if (!entries.length) return 0
  const sum = entries.reduce((acc, e) => acc + Number(e.alignment_score), 0)
  return Math.round((sum / entries.length) * 10) / 10
}

/**
 * Consecutive days with at least one entry, ending today if possible else from yesterday backward.
 */
export function currentStreak(completedSet) {
  if (!completedSet.size) return 0
  const today = todayYMD()
  let cursor = parseYMD(today)
  if (!cursor) return 0

  if (!completedSet.has(today)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (completedSet.has(formatYMD(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function progressPercent(entries, completedSet) {
  const first = firstEntryYmd(entries)
  if (!first || !completedSet.size) return 0

  const start = parseYMD(first)
  const end = parseYMD(todayYMD())
  if (!start || !end) return 0

  const spanDays = Math.floor((end - start) / 86400000) + 1
  const denom = Math.max(1, spanDays)
  const pct = (completedSet.size / denom) * 100
  return Math.min(100, Math.round(pct))
}

export function scoresByDayForChart(entries) {
  const buckets = new Map()
  for (const e of entries) {
    const day = normalizeEntryDate(e.entry_date)
    if (!day) continue
    if (!buckets.has(day)) buckets.set(day, [])
    buckets.get(day).push(Number(e.alignment_score))
  }
  return [...buckets.keys()]
    .sort()
    .map((date) => {
      const scores = buckets.get(date)
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return { date, alignment: Math.round(avg * 10) / 10 }
    })
}

export function streakLast7Days(completedSet) {
  const days = []
  const cursor = parseYMD(todayYMD())
  if (!cursor) return days

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(cursor)
    d.setDate(cursor.getDate() - i)
    const ymd = formatYMD(d)
    days.push({
      date: ymd,
      done: completedSet.has(ymd),
    })
  }
  return days
}

export function sparklineLast14(entries) {
  const byDay = new Map(scoresByDayForChart(entries).map((r) => [r.date, r.alignment]))
  const out = []
  const cursor = parseYMD(todayYMD())
  if (!cursor) return out

  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(cursor)
    d.setDate(cursor.getDate() - i)
    const ymd = formatYMD(d)
    out.push({
      date: ymd,
      alignment: byDay.get(ymd) ?? null,
    })
  }
  return out
}
