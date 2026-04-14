export function normalizeEntryDate(raw) {
  if (raw == null) return ''
  const s = String(raw)
  return s.length >= 10 ? s.slice(0, 10) : s
}

/** Local calendar date as YYYY-MM-DD (no UTC shift). */
export function formatYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayYMD() {
  return formatYMD(new Date())
}

export function parseYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

export function isValidRouteDateParam(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return parseYMD(s) !== null
}

export function capitalizeFrMonthLabel(date) {
  const raw = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Monday = 0 ... Sunday = 6 */
export function mondayIndexFromDate(date) {
  return (date.getDay() + 6) % 7
}

/** e.g. "lundi 6 avril 2026" → capitalize first letter */
export function formatLongFrenchDate(ymd) {
  const d = parseYMD(ymd)
  if (!d) return ymd
  const raw = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/** Inclusive day index from first calendar day to selected (1-based). Same day → 1. */
export function dayIndexFromFirst(firstYmd, selectedYmd) {
  if (!firstYmd || !selectedYmd) return 1
  const a = parseYMD(firstYmd)
  const b = parseYMD(selectedYmd)
  if (!a || !b) return 1
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000)
  return Math.max(1, diff + 1)
}
