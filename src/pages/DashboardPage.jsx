import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardStats from '../components/dashboard/DashboardStats'
import AlignmentSphere from '../components/dashboard/AlignmentSphere'
import AlignmentChart from '../components/dashboard/AlignmentChart'
import MonthCalendar from '../components/dashboard/MonthCalendar'
import WishBanner from '../components/dashboard/WishBanner'
import WishModal from '../components/dashboard/WishModal'
import Footer from '../components/Footer'
import { useAuth } from '../context/useAuth'
import {
  averageAlignment,
  completedDatesSet,
  currentStreak,
  firstEntryYmd,
  scoresByDayForChart,
  streakLast7Days,
} from '../lib/dashboardStats'
import { addMonths, startOfMonth } from '../lib/dates'
import { supabase } from '../lib/supabaseClient'

function getFirstName(profile, user) {
  const fn = profile?.first_name?.trim()
  if (fn) return fn
  return user?.email?.split('@')[0] ?? 'Profil'
}

function needsWish(profile) {
  if (!profile) return false
  const w = profile.wish
  return w == null || String(w).trim() === ''
}

function filterChartByRange(data, range) {
  if (!data.length || range === 'all') return data

  const latest = data[data.length - 1]?.date
  if (!latest) return data

  const latestDate = new Date(`${latest}T00:00:00`)
  if (Number.isNaN(latestDate.getTime())) return data

  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const from = new Date(latestDate)
  from.setDate(from.getDate() - (days - 1))
  const fromTime = from.getTime()

  return data.filter((row) => {
    const d = new Date(`${row.date}T00:00:00`)
    if (Number.isNaN(d.getTime())) return false
    return d.getTime() >= fromTime
  })
}

function averageFromChartRows(rows) {
  if (!rows.length) return 0
  const total = rows.reduce((sum, row) => sum + (Number(row.alignment) || 0), 0)
  return Number((total / rows.length).toFixed(1))
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [wishSaving, setWishSaving] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [alignmentRange, setAlignmentRange] = useState('30d')
  const [dailyMessage, setDailyMessage] = useState('Bonne journée.')
  const [dailyMessageVisible, setDailyMessageVisible] = useState(false)
  const requestedDailyMessageRef = useRef(false)

  useEffect(() => {
    requestedDailyMessageRef.current = false
  }, [user?.id])

  async function refreshData() {
    if (!user?.id) return
    setLoadError('')
    const [pRes, eRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, first_name, wish, secondary_wish, daily_message, daily_message_date')
        .eq('id', user.id)
        .maybeSingle(),
      supabase.from('entries').select('*').eq('user_id', user.id).order('entry_date', { ascending: true }),
    ])

    if (pRes.error) {
      setLoadError(pRes.error.message)
      setProfile(null)
    } else {
      setProfile(pRes.data)
    }

    if (eRes.error) {
      setLoadError(eRes.error.message)
      setEntries([])
    } else {
      setEntries(eRes.data ?? [])
    }
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      setLoading(true)
      await refreshData()
      if (alive) setLoading(false)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per authenticated user id
  }, [user?.id])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!user?.id || !profile?.id) return

      if (!requestedDailyMessageRef.current) {
        requestedDailyMessageRef.current = true
      } else {
        return
      }

      const today = new Date().toISOString().slice(0, 10)
      const existing = String(profile.daily_message ?? '').trim()
      if (profile.daily_message_date === today && existing) {
        if (!cancelled) {
          setDailyMessage(existing)
          setDailyMessageVisible(true)
        }
        return
      }

      if (!cancelled) {
        setDailyMessageVisible(false)
        setDailyMessage('Bonne journée.')
      }

      const { data, error } = await supabase.functions.invoke('generate-daily-message', {
        body: { user_id: user.id },
      })

      if (cancelled || error) {
        if (error) {
          console.error('[daily-message] invoke error', {
            message: error.message,
            name: error.name,
            context: error.context,
            userId: user.id,
            profileId: profile.id,
          })
        }
        if (!cancelled) setDailyMessageVisible(true)
        return
      }

      console.log('[daily-message] invoke success', {
        userId: user.id,
        profileId: profile.id,
        data,
      })

      const next = String(data?.message ?? '').trim()
      if (next) {
        setDailyMessage(next)
      }
      setDailyMessageVisible(true)
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, profile?.id, profile?.daily_message, profile?.daily_message_date])

  const showWishModal = Boolean(profile && needsWish(profile))

  const completedSet = useMemo(() => completedDatesSet(entries), [entries])
  const firstYmd = useMemo(() => firstEntryYmd(entries), [entries])
  const chartData = useMemo(() => scoresByDayForChart(entries), [entries])
  const filteredChartData = useMemo(
    () => filterChartByRange(chartData, alignmentRange),
    [chartData, alignmentRange],
  )

  const stats = useMemo(() => {
    const completedDays = completedSet.size
    const avgAlignment = averageFromChartRows(filteredChartData) || averageAlignment(entries)
    const streak = currentStreak(completedSet)
    const streakDays = streakLast7Days(completedSet)
    return { completedDays, avgAlignment, streak, streakDays }
  }, [entries, completedSet, filteredChartData])

  const firstName = profile?.first_name?.trim() || user?.email?.split('@')[0] || 'toi'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const saveWish = async (payload) => {
    if (!user?.id) return
    setWishSaving(true)
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select('id, email, first_name, wish, secondary_wish, daily_message, daily_message_date')
      .maybeSingle()
    setWishSaving(false)
    if (error) {
      setLoadError(error.message)
      return
    }
    if (data) setProfile(data)
  }

  if (loading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">
        Chargement du tableau de bord…
      </div>
    )
  }

  if (!loading && user?.id && !profile && !loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Ton profil n’est pas encore disponible. Réessaie dans un instant.</p>
        <button
          type="button"
          onClick={async () => {
            setLoading(true)
            await refreshData()
            setLoading(false)
          }}
          className="rounded-full bg-[var(--accent-blue)] px-5 py-2 text-sm font-semibold text-white"
        >
          Rafraîchir
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <WishModal open={showWishModal} onSave={saveWish} saving={wishSaving} />

      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(13,31,56,0.96)_0%,rgba(13,31,56,0.82)_100%)] p-5 shadow-[0_30px_80px_rgba(2,12,27,0.45)] backdrop-blur-xl sm:p-8">
          <DashboardHeader firstName={getFirstName(profile, user)} onLogout={handleLogout} activeTab="dashboard" />

          {loadError ? (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {loadError}
            </p>
          ) : null}

          <div className="mt-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Bienvenue {firstName}
            </h1>
            <p
              className={`mt-1 text-sm text-[#7a9cc4] transition-opacity duration-400 ${
                dailyMessageVisible ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {dailyMessage}
            </p>
          </div>

          <div className="mt-8">
            <DashboardStats
              completedDays={stats.completedDays}
              avgAlignment={stats.avgAlignment}
              streak={stats.streak}
              streakDays={stats.streakDays}
              alignmentRange={alignmentRange}
              onAlignmentRangeChange={setAlignmentRange}
              alignmentSphere={<AlignmentSphere score={stats.avgAlignment || 5} />}
            />
          </div>

          <div className="mt-6">
            <WishBanner
              wish={profile?.wish}
              secondaryWish={profile?.secondary_wish}
              onUpdateWish={saveWish}
              saving={wishSaving}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MonthCalendar
            visibleMonth={visibleMonth}
            onPrevMonth={() => setVisibleMonth((v) => addMonths(v, -1))}
            onNextMonth={() => setVisibleMonth((v) => addMonths(v, 1))}
            completedSet={completedSet}
            firstEntryYmd={firstYmd}
            onSelectDay={(ymd) => navigate(`/day/${ymd}`)}
          />
          <AlignmentChart
            data={filteredChartData}
            range={alignmentRange}
            onRangeChange={setAlignmentRange}
          />
        </div>
      </div>
      <Footer />
    </main>
  )
}
