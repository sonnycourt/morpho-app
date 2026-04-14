import { useEffect, useId, useState } from 'react'
import AlignmentSphere from './AlignmentSphere'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { parseYMD } from '../../lib/dates'
import { premiumDashboardCardStyle } from '../../lib/premiumDashboardCard'

const CARD_LABEL = 'text-xs font-medium uppercase tracking-[0.14em] text-blue-300/90'

function weekdayLetterFr(ymd) {
  const d = parseYMD(ymd)
  if (!d) return ''
  return ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()]
}

/* ─── Jours Pratiqués : clean minimal ─── */

function PracticedDisplay({ animatedDays }) {
  const gid = useId().replace(/:/g, '')
  const displayDays = Math.round(animatedDays)
  const cx = 100
  const cy = 100
  const r = 72

  return (
    <div className="relative flex flex-1 items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-full w-full max-h-[190px] max-w-[190px]">
        <defs>
          <linearGradient id={`pd-ring-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.12)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.06)" />
          </linearGradient>
          <filter id={`pd-glow-${gid}`}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#pd-ring-${gid})`}
          strokeWidth="1"
        />

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(59,130,246,0.08)"
          strokeWidth="4"
          filter={`url(#pd-glow-${gid})`}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[52px] font-semibold leading-none tabular-nums tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
          {displayDays}
        </span>
        <span className="mt-2 text-base font-medium text-blue-300/50">jours</span>
      </div>
    </div>
  )
}

/* ─── Streak : flame bars ─── */

function StreakBars({ streakDays, animatedStreak, shownCircles }) {
  const gid = useId().replace(/:/g, '')
  const displayStreak = Math.round(animatedStreak)
  const barWidth = 18
  const barGap = 8
  const totalW = 7 * barWidth + 6 * barGap
  const maxBarH = 80

  return (
    <div className="flex flex-1 flex-col items-center justify-end pb-2">
      {/* Streak number */}
      <div className="mb-5 flex items-end gap-1.5 leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        <span className="text-[48px] font-semibold tabular-nums tracking-tight text-white">
          {displayStreak}
        </span>
        <span className="mb-1.5 text-lg font-medium text-white/45">jours</span>
      </div>

      {/* Bars */}
      <svg
        viewBox={`0 0 ${totalW} ${maxBarH + 30}`}
        className="w-full max-w-[220px]"
        style={{ height: maxBarH + 30 }}
      >
        <defs>
          <linearGradient id={`sk-bar-${gid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id={`sk-bar-off-${gid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(30,64,175,0.12)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.08)" />
          </linearGradient>
          <filter id={`sk-glow-${gid}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {streakDays.map((d, idx) => {
          const x = idx * (barWidth + barGap)
          const active = d.done
          const barH = active ? maxBarH * (0.55 + idx * 0.065) : 18
          const clampedH = Math.min(maxBarH, barH)
          const y = maxBarH - clampedH
          const visible = idx < shownCircles

          return (
            <g key={d.date} style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={clampedH}
                rx={barWidth / 2}
                fill={active ? `url(#sk-bar-${gid})` : `url(#sk-bar-off-${gid})`}
                filter={active ? `url(#sk-glow-${gid})` : undefined}
              />

              {/* Top cap glow for active */}
              {active && (
                <circle
                  cx={x + barWidth / 2}
                  cy={y + barWidth / 2}
                  r={barWidth / 2 + 2}
                  fill="rgba(96, 165, 250, 0.25)"
                  filter={`url(#sk-glow-${gid})`}
                />
              )}

              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={maxBarH + 18}
                textAnchor="middle"
                fill={active ? 'rgba(148, 197, 253, 0.8)' : 'rgba(100, 116, 139, 0.5)'}
                fontSize="10"
                fontWeight="500"
              >
                {weekdayLetterFr(d.date)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ─── Main Stats Grid ─── */

export default function DashboardStats({
  completedDays,
  avgAlignment,
  streak,
  streakDays,
  alignmentRange = '30d',
  onAlignmentRangeChange,
  alignmentSphere,
}) {
  const practicedAnim = useAnimatedNumber(completedDays, 800)
  const streakAnim = useAnimatedNumber(streak, 800)

  const streakKey = streakDays.map((d) => d.date).join(',')
  const [shownCircles, setShownCircles] = useState(0)

  useEffect(() => {
    let cancelled = false
    const timers = []
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) setShownCircles(0)
      }, 0),
    )
    for (let i = 0; i < 7; i += 1) {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setShownCircles(i + 1)
        }, 16 + 50 * i),
      )
    }
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [streakKey])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ── Jours pratiqués ── */}
      <div style={premiumDashboardCardStyle} className="flex h-[300px] flex-col">
        <p className={CARD_LABEL}>Jours pratiqués</p>
        <PracticedDisplay animatedDays={practicedAnim} />
        <p className="mt-2 text-center text-xs text-white/30">depuis ton premier jour</p>
      </div>

      {/* ── Streak ── */}
      <div style={premiumDashboardCardStyle} className="flex h-[300px] flex-col">
        <p className={CARD_LABEL}>Streak</p>
        <StreakBars
          streakDays={streakDays}
          animatedStreak={streakAnim}
          shownCircles={shownCircles}
        />
      </div>

      {/* ── Alignement ── */}
      <div style={{ ...premiumDashboardCardStyle, overflow: 'hidden' }} className="flex h-[300px] flex-col">
        <div className="flex items-start justify-between gap-2" style={{ position: 'relative', zIndex: 20 }}>
          <p className={CARD_LABEL}>Alignement</p>
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-900/15 p-1">
            {[
              { id: '7d', label: '7j' },
              { id: '30d', label: '30j' },
              { id: '90d', label: '90j' },
              { id: 'all', label: 'Tout' },
            ].map((btn) => {
              const active = alignmentRange === btn.id
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => onAlignmentRangeChange?.(btn.id)}
                  className={[
                    'rounded-full px-2 py-1 text-[10px] font-medium transition sm:px-2.5',
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
        <div className="relative mt-1 flex-1">
          {alignmentSphere ?? <AlignmentSphere score={avgAlignment || 5} />}
        </div>
      </div>
    </div>
  )
}
