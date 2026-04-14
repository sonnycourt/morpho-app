import { capitalizeFrMonthLabel, daysInMonth, formatYMD, mondayIndexFromDate, todayYMD } from '../../lib/dates'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-[var(--accent-blue)]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.005 7a1 1 0 01-1.414 0l-3.995-4a1 1 0 111.414-1.42l3.288 3.29 6.298-6.29a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function MonthCalendar({
  visibleMonth,
  onPrevMonth,
  onNextMonth,
  completedSet,
  firstEntryYmd,
  onSelectDay,
}) {
  const y = visibleMonth.getFullYear()
  const m = visibleMonth.getMonth()
  const first = new Date(y, m, 1)
  const lead = mondayIndexFromDate(first)
  const dim = daysInMonth(y, m)
  const today = todayYMD()

  const cells = []
  for (let i = 0; i < lead; i += 1) cells.push({ type: 'pad' })
  for (let d = 1; d <= dim; d += 1) {
    const date = new Date(y, m, d)
    cells.push({ type: 'day', date, ymd: formatYMD(date) })
  }
  while (cells.length % 7 !== 0) cells.push({ type: 'pad' })

  const beforeJourney = (ymd) => firstEntryYmd && ymd < firstEntryYmd

  return (
    <section className="rounded-[22px] border border-[var(--border-soft)] bg-[#0d1f38]/80 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-500/30 text-slate-200 transition hover:border-blue-400/50 hover:text-white"
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <h2 className="text-center text-base font-semibold tracking-tight text-slate-100 sm:text-lg">
          {capitalizeFrMonthLabel(visibleMonth)}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-500/30 text-slate-200 transition hover:border-blue-400/50 hover:text-white"
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-blue-300/70 sm:text-xs">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.type === 'pad') {
            return <div key={`p-${idx}`} className="aspect-square rounded-2xl" />
          }

          const { ymd } = cell
          const done = completedSet.has(ymd)
          const isToday = ymd === today
          const locked = beforeJourney(ymd)

          const base =
            'relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-sm font-medium transition'
          const state = locked
            ? 'cursor-default border-transparent bg-slate-950/20 text-slate-600'
            : 'cursor-pointer border-transparent bg-slate-950/25 text-slate-200 hover:border-blue-500/25 hover:bg-blue-600/10'

          const todayRing = isToday ? ' ring-2 ring-[var(--accent-blue)] ring-offset-2 ring-offset-[#0d1f38]' : ''

          return (
            <button
              key={ymd}
              type="button"
              disabled={locked}
              onClick={() => !locked && onSelectDay(ymd)}
              className={`${base} ${state}${todayRing}`}
            >
              <span className="tabular-nums">{cell.date.getDate()}</span>
              {done && !locked ? (
                <span className="absolute bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/15">
                  <CheckIcon />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
        Les jours avant ta première entrée sont neutres et non cliquables.
      </p>
    </section>
  )
}
