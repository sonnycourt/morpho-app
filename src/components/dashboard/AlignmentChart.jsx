import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo } from 'react'
import { premiumDashboardCardStyle } from '../../lib/premiumDashboardCard'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-xl border border-blue-500/25 bg-[#0a1628]/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <p className="font-medium text-slate-200">{label}</p>
      <p className="mt-1 tabular-nums text-blue-200">
        Alignement <span className="text-white">{p.value}</span> / 10
      </p>
    </div>
  )
}

export default function AlignmentChart({ data, range = '30d', onRangeChange }) {
  const rangeButtons = [
    { id: '7d', label: '7j' },
    { id: '30d', label: '30j' },
    { id: '90d', label: '90j' },
    { id: 'all', label: 'Tout' },
  ]
  const empty = !data.length
  const selectedLabel = rangeButtons.find((b) => b.id === range)?.label ?? '30j'
  const periodText = useMemo(() => {
    if (!data.length) return `Période: ${selectedLabel}`
    const first = String(data[0].date)
    const last = String(data[data.length - 1].date)
    const formatYmd = (ymd) => {
      const [, mm, dd] = ymd.split('-')
      return `${dd}/${mm}`
    }
    return `Période: ${selectedLabel} (${formatYmd(first)} -> ${formatYmd(last)})`
  }, [data, selectedLabel])

  return (
    <section style={premiumDashboardCardStyle}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">Évolution de mon alignement</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Moyenne par jour si plusieurs entrées</p>
          <p className="mt-1 text-xs font-medium text-blue-200/75">{periodText}</p>
        </div>
        <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-900/15 p-1">
          {rangeButtons.map((btn) => {
            const active = range === btn.id
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => onRangeChange?.(btn.id)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  active
                    ? 'bg-blue-500/30 text-blue-100'
                    : 'text-blue-200/80 hover:bg-blue-500/15 hover:text-blue-100',
                ].join(' ')}
              >
                {btn.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 h-[240px] w-full">
        {empty ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-600/35 text-sm text-[var(--text-muted)]">
            Aucune donnée pour l’instant
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(37, 99, 235, 0.12)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(148, 163, 184, 0.85)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(37, 99, 235, 0.2)' }}
                tickFormatter={(v) => {
                  const [, mm, dd] = String(v).split('-')
                  return `${dd}/${mm}`
                }}
              />
              <YAxis
                domain={[1, 10]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                width={28}
                tick={{ fill: 'rgba(148, 163, 184, 0.85)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(37, 99, 235, 0.2)' }}
              />
              <Tooltip
                content={(props) => <ChartTooltip {...props} />}
                cursor={{ stroke: 'rgba(37, 99, 235, 0.35)' }}
              />
              <Line
                type="monotone"
                dataKey="alignment"
                stroke="var(--accent-blue)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--accent-blue)', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'var(--accent-blue)', stroke: 'rgba(255,255,255,0.35)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
