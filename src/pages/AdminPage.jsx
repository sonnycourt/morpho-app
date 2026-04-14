import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import Footer from '../components/Footer'
import { useAuth } from '../context/useAuth'
import { isAdmin } from '../lib/admin'
import { premiumDashboardCardStyle } from '../lib/premiumDashboardCard'
import { supabase } from '../lib/supabaseClient'

const PAGE_SIZE = 25

function formatDateFr(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR')
}

function formatDateTimeFr(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR')
}

function formatRelative(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  const days = Math.floor(diff / dayMs)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'il y a 1 jour'
  return `il y a ${days} jours`
}

function genderLabel(v) {
  if (v === 'female') return 'Femme'
  if (v === 'male') return 'Homme'
  if (v === 'other') return 'Autre'
  return '—'
}

function trunc(text, n = 40) {
  const t = String(text ?? '')
  if (t.length <= n) return t || '—'
  return `${t.slice(0, n - 3)}...`
}

function csvEscape(value) {
  const v = String(value ?? '')
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

function memoryDiffStatus(current, previous) {
  const nowValue = String(current ?? '').trim()
  const prevValue = String(previous ?? '').trim()
  if (!nowValue && !prevValue) return 'inchangé'
  if (nowValue && !prevValue) return 'ajouté'
  if (!nowValue && prevValue) return 'supprimé'
  if (nowValue === prevValue) return 'inchangé'
  return 'modifié'
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profiles, setProfiles] = useState([])
  const [entries, setEntries] = useState([])
  const [memories, setMemories] = useState([])
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('Tous')
  const [sourceFilter, setSourceFilter] = useState('Toutes')
  const [genderFilter, setGenderFilter] = useState('Toutes')
  const [ageFilter, setAgeFilter] = useState('Toutes')
  const [onboardingFilter, setOnboardingFilter] = useState('Tous')
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [memoryHistory, setMemoryHistory] = useState([])
  const [memorySnapshots, setMemorySnapshots] = useState([])
  const [currentMemories, setCurrentMemories] = useState([])
  const [compressionStatusFilter, setCompressionStatusFilter] = useState('all')
  const [compressionSearch, setCompressionSearch] = useState('')
  const [compressionSort, setCompressionSort] = useState({ key: 'created_at', direction: 'desc' })
  const [selectedCompressionId, setSelectedCompressionId] = useState('')
  const [nowTs, setNowTs] = useState(0)
  const [journalScope, setJournalScope] = useState('filtered')
  const [journalField, setJournalField] = useState('all')
  const [journalDateFrom, setJournalDateFrom] = useState('')
  const [journalDateTo, setJournalDateTo] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState('')
  const [auditDateFrom, setAuditDateFrom] = useState('')
  const [auditDateTo, setAuditDateTo] = useState('')
  const [auditOffset, setAuditOffset] = useState(0)
  const [auditLoaded, setAuditLoaded] = useState(false)
  const [selectedAuditId, setSelectedAuditId] = useState('')
  const AUDIT_PAGE_SIZE = 50
  const userIsAdmin = isAdmin(user)

  const firstName = user?.user_metadata?.first_name?.trim() || user?.email?.split('@')[0] || 'Profil'

  useEffect(() => {
    const tick = () => setNowTs(new Date().getTime())
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.id || !userIsAdmin) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const [dashboardRes, memoryMonitorRes] = await Promise.all([
        supabase.functions.invoke('admin-dashboard-data', { body: {} }),
        supabase.functions.invoke('admin-memory-monitor', { body: {} }),
      ])

      if (cancelled) return

      if (dashboardRes.error) {
        setError(dashboardRes.error.message)
      } else {
        setProfiles(dashboardRes.data?.profiles ?? [])
        setEntries(dashboardRes.data?.entries ?? [])
        setMemories(dashboardRes.data?.memories ?? [])
      }

      if (memoryMonitorRes.error) {
        setError((prev) => prev || memoryMonitorRes.error.message)
      } else {
        setMemoryHistory(memoryMonitorRes.data?.history ?? [])
        setMemorySnapshots(memoryMonitorRes.data?.snapshots ?? [])
        setCurrentMemories(memoryMonitorRes.data?.current_memory ?? [])
      }

      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, userIsAdmin])

  const onLogout = async () => {
    await supabase.auth.signOut()
  }

  const entriesByUser = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      const key = e.user_id
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    }
    return map
  }, [entries])

  const memoryByUser = useMemo(() => {
    const map = new Map()
    for (const m of memories) map.set(m.user_id, m)
    return map
  }, [memories])

  const enrichedUsers = useMemo(() => {
    return profiles.map((p) => {
      const userEntries = entriesByUser.get(p.id) ?? []
      const totalEntries = userEntries.length
      const avgAlignment =
        totalEntries > 0
          ? Number(
              (
                userEntries.reduce((sum, x) => sum + Number(x.alignment_score ?? 0), 0) / totalEntries
              ).toFixed(1),
            )
          : 0

      let streak = 0
      const doneDays = new Set(userEntries.map((x) => String(x.entry_date)))
      const cursor = new Date()
      while (true) {
        const ymd = cursor.toISOString().slice(0, 10)
        if (!doneDays.has(ymd)) break
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      }

      return {
        ...p,
        totalEntries,
        avgAlignment,
        streak,
        lastEntryDate: userEntries[0]?.entry_date ?? '',
        lastSignInAt: p.last_sign_in_at ?? null,
      }
    })
  }, [entriesByUser, profiles])

  const stats = useMemo(() => {
    const totalUsers = enrichedUsers.length
    const onboardingDone = enrichedUsers.filter((u) => u.onboarding_completed).length
    const onboardingPercent = totalUsers ? Math.round((onboardingDone / totalUsers) * 100) : 0
    const totalEntries = entries.length
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const ymd = sevenDaysAgo.toISOString().slice(0, 10)
    const activeSet = new Set(entries.filter((e) => String(e.entry_date) >= ymd).map((e) => e.user_id))
    return {
      totalUsers,
      onboardingDone,
      onboardingPercent,
      active7: activeSet.size,
      totalEntries,
    }
  }, [enrichedUsers, entries])

  const countries = useMemo(
    () => ['Tous', ...Array.from(new Set(enrichedUsers.map((u) => u.country).filter(Boolean)))],
    [enrichedUsers],
  )
  const sources = useMemo(
    () => ['Toutes', ...Array.from(new Set(enrichedUsers.map((u) => u.discovery_source).filter(Boolean)))],
    [enrichedUsers],
  )

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enrichedUsers.filter((u) => {
      if (q) {
        const hay = `${u.email ?? ''} ${u.first_name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (countryFilter !== 'Tous' && u.country !== countryFilter) return false
      if (sourceFilter !== 'Toutes' && u.discovery_source !== sourceFilter) return false
      if (genderFilter !== 'Toutes' && genderLabel(u.gender) !== genderFilter) return false
      if (ageFilter !== 'Toutes' && u.age_range !== ageFilter) return false
      if (onboardingFilter === 'Complété' && !u.onboarding_completed) return false
      if (onboardingFilter === 'Non complété' && u.onboarding_completed) return false
      return true
    })
  }, [ageFilter, countryFilter, enrichedUsers, genderFilter, onboardingFilter, search, sourceFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const chartDataCountry = useMemo(() => {
    const counts = new Map()
    for (const u of enrichedUsers) counts.set(u.country || 'Non défini', (counts.get(u.country || 'Non défini') ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [enrichedUsers])

  const chartDataSource = useMemo(() => {
    const counts = new Map()
    for (const u of enrichedUsers)
      counts.set(u.discovery_source || 'Non défini', (counts.get(u.discovery_source || 'Non défini') ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [enrichedUsers])

  const chartDataAge = useMemo(() => {
    const order = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
    const counts = new Map(order.map((o) => [o, 0]))
    for (const u of enrichedUsers) if (counts.has(u.age_range)) counts.set(u.age_range, counts.get(u.age_range) + 1)
    return order.map((name) => ({ name, value: counts.get(name) ?? 0 }))
  }, [enrichedUsers])

  const chartDataGender = useMemo(() => {
    const female = enrichedUsers.filter((u) => u.gender === 'female').length
    const male = enrichedUsers.filter((u) => u.gender === 'male').length
    const other = enrichedUsers.filter((u) => !['female', 'male'].includes(u.gender)).length
    return [
      { name: 'Femmes', value: female },
      { name: 'Hommes', value: male },
      { name: 'Autre', value: other },
    ]
  }, [enrichedUsers])

  const selectedUser = useMemo(
    () => enrichedUsers.find((u) => u.id === selectedUserId) ?? null,
    [enrichedUsers, selectedUserId],
  )
  const selectedEntries = useMemo(
    () => (selectedUser ? (entriesByUser.get(selectedUser.id) ?? []).slice(0, 5) : []),
    [entriesByUser, selectedUser],
  )
  const selectedMemory = selectedUser ? memoryByUser.get(selectedUser.id) : null

  const compressionRows = useMemo(() => {
    const emailByUser = new Map(profiles.map((p) => [p.id, p.email ?? '']))
    return memoryHistory.map((h) => ({
      ...h,
      email: emailByUser.get(h.user_id) ?? '',
    }))
  }, [memoryHistory, profiles])

  const compressionStats = useMemo(() => {
    const total = compressionRows.length
    const success = compressionRows.filter((r) => r.status === 'success').length
    const skippedRows = compressionRows.filter((r) => r.status === 'skipped')
    const skipped = skippedRows.length
    const errorRows = compressionRows.filter((r) => r.status === 'error')
    const errors = errorRows.length
    const costTotal = compressionRows.reduce((sum, r) => sum + Number(r.cost_cents ?? 0), 0)

    const since = new Date()
    since.setDate(since.getDate() - 30)
    const last30Rows = compressionRows.filter((r) => new Date(r.created_at) >= since)
    const cost30 = last30Rows.reduce((sum, r) => sum + Number(r.cost_cents ?? 0), 0)

    const tokenRows = compressionRows.filter(
      (r) => Number(r.input_tokens ?? 0) > 0 || Number(r.output_tokens ?? 0) > 0,
    )
    const avgInput = tokenRows.length
      ? Math.round(tokenRows.reduce((sum, r) => sum + Number(r.input_tokens ?? 0), 0) / tokenRows.length)
      : 0
    const avgOutput = tokenRows.length
      ? Math.round(tokenRows.reduce((sum, r) => sum + Number(r.output_tokens ?? 0), 0) / tokenRows.length)
      : 0

    const skippedReasons = skippedRows.reduce((acc, row) => {
      const k = row.skip_reason || 'UNKNOWN'
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})

    const errorMessages = errorRows.reduce((acc, row) => {
      const k = row.error_message || 'UNKNOWN'
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})

    return {
      total,
      success,
      skipped,
      errors,
      costTotal,
      cost30,
      avgInput,
      avgOutput,
      skippedReasons,
      errorMessages,
    }
  }, [compressionRows])

  const compressionByDayLast30 = useMemo(() => {
    const days = []
    const counts = new Map()
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(base)
      d.setDate(base.getDate() - i)
      const ymd = d.toISOString().slice(0, 10)
      days.push(ymd)
      counts.set(ymd, 0)
    }
    for (const row of compressionRows) {
      const ymd = String(row.created_at ?? '').slice(0, 10)
      if (counts.has(ymd)) counts.set(ymd, (counts.get(ymd) ?? 0) + 1)
    }
    return days.map((ymd) => ({ day: ymd.slice(5), total: counts.get(ymd) ?? 0 }))
  }, [compressionRows])

  const compressionErrorRate24h = useMemo(() => {
    if (!nowTs) return 0
    const since = nowTs - 24 * 60 * 60 * 1000
    const rows24 = compressionRows.filter((r) => new Date(r.created_at).getTime() >= since)
    if (!rows24.length) return 0
    const errors24 = rows24.filter((r) => r.status === 'error').length
    return (errors24 / rows24.length) * 100
  }, [compressionRows, nowTs])

  const filteredSortedCompressions = useMemo(() => {
    const q = compressionSearch.trim().toLowerCase()
    const filtered = compressionRows.filter((r) => {
      if (compressionStatusFilter !== 'all' && r.status !== compressionStatusFilter) return false
      if (!q) return true
      const hay = `${r.email ?? ''} ${r.user_id ?? ''}`.toLowerCase()
      return hay.includes(q)
    })

    const mult = compressionSort.direction === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      const av = a[compressionSort.key]
      const bv = b[compressionSort.key]
      if (compressionSort.key === 'created_at') {
        return (new Date(av).getTime() - new Date(bv).getTime()) * mult
      }
      if (typeof av === 'number' || typeof bv === 'number') {
        return (Number(av ?? 0) - Number(bv ?? 0)) * mult
      }
      return String(av ?? '').localeCompare(String(bv ?? '')) * mult
    })
  }, [compressionRows, compressionSearch, compressionSort, compressionStatusFilter])

  const recentCompressions = filteredSortedCompressions.slice(0, 50)

  const selectedCompression = useMemo(
    () => compressionRows.find((r) => r.id === selectedCompressionId) ?? null,
    [compressionRows, selectedCompressionId],
  )

  const selectedCompressionCurrentSnapshot = useMemo(() => {
    if (!selectedCompression) return null
    return (
      memorySnapshots.find(
        (s) =>
          s.user_id === selectedCompression.user_id &&
          Number(s.milestone_entries) === Number(selectedCompression.milestone_entries),
      ) ?? null
    )
  }, [memorySnapshots, selectedCompression])

  const selectedCompressionPreviousSnapshot = useMemo(() => {
    if (!selectedCompression) return null
    const userSnaps = memorySnapshots
      .filter((s) => s.user_id === selectedCompression.user_id)
      .sort((a, b) => Number(b.milestone_entries) - Number(a.milestone_entries))
    return userSnaps.find((s) => Number(s.milestone_entries) < Number(selectedCompression.milestone_entries)) ?? null
  }, [memorySnapshots, selectedCompression])

  const selectedCompressionDiff = useMemo(() => {
    const current = selectedCompressionCurrentSnapshot
    const previous = selectedCompressionPreviousSnapshot
    const fields = [
      ['summary', 'Résumé'],
      ['key_patterns', 'Patterns clés'],
      ['wins', 'Victoires'],
      ['struggles', 'Blocages'],
      ['timeline_markers', 'Timeline'],
    ]
    return fields.map(([key, label]) => ({
      key,
      label,
      status: memoryDiffStatus(current?.[key], previous?.[key]),
      current: current?.[key] ?? '',
      previous: previous?.[key] ?? '',
    }))
  }, [selectedCompressionCurrentSnapshot, selectedCompressionPreviousSnapshot])

  const selectedCompressionLossRisk = useMemo(() => {
    const cur = String(selectedCompressionCurrentSnapshot?.summary ?? '')
    const prev = String(selectedCompressionPreviousSnapshot?.summary ?? '')
    if (!cur || !prev) return false
    return cur.length < prev.length * 0.6
  }, [selectedCompressionCurrentSnapshot, selectedCompressionPreviousSnapshot])

  const selectedUserIds = useMemo(() => new Set(filteredUsers.map((u) => u.id)), [filteredUsers])

  const availableJournalRows = useMemo(() => {
    const sourceEntries = journalScope === 'all_users' ? entries : entries.filter((e) => selectedUserIds.has(e.user_id))
    return sourceEntries.filter((e) => {
      const day = String(e.entry_date ?? '')
      if (journalDateFrom && day < journalDateFrom) return false
      if (journalDateTo && day > journalDateTo) return false
      return true
    })
  }, [entries, journalDateFrom, journalDateTo, journalScope, selectedUserIds])

  const downloadCsv = (headers, rows, filePrefix) => {
    const lines = [headers.join(',')]
    for (const row of rows) {
      lines.push(headers.map((h) => csvEscape(row[h])).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportCsv = () => {
    const rows = filteredUsers.map((u) => ({
      email: u.email ?? '',
      first_name: u.first_name ?? '',
      age_range: u.age_range ?? '',
      gender: u.gender ?? '',
      country: u.country ?? '',
      discovery_source: u.discovery_source ?? '',
      wish: u.wish ?? '',
      secondary_wish: u.secondary_wish ?? '',
      created_at: u.created_at ?? '',
      onboarding_completed: Boolean(u.onboarding_completed),
      total_entries: u.totalEntries ?? 0,
      last_login: u.lastSignInAt ?? '',
    }))

    const headers = [
      'email',
      'first_name',
      'age_range',
      'gender',
      'country',
      'discovery_source',
      'wish',
      'secondary_wish',
      'created_at',
      'onboarding_completed',
      'total_entries',
      'last_login',
    ]
    downloadCsv(headers, rows, 'morpho_users_export')
  }

  const exportJournalCsv = () => {
    const profilesById = new Map(profiles.map((p) => [p.id, p]))
    const baseRows = availableJournalRows.map((entry) => {
      const profile = profilesById.get(entry.user_id) ?? {}
      return {
        user_id: entry.user_id ?? '',
        email: profile.email ?? '',
        first_name: profile.first_name ?? '',
        country: profile.country ?? '',
        age_range: profile.age_range ?? '',
        gender: profile.gender ?? '',
        entry_date: entry.entry_date ?? '',
        created_at: entry.created_at ?? '',
        desired_state: entry.desired_state ?? '',
        intention: entry.intention ?? '',
        gratitude: entry.gratitude ?? '',
        reflection: entry.reflection ?? '',
        synchronicity: entry.synchronicity ?? '',
        alignment_score: entry.alignment_score ?? '',
      }
    })

    const fieldMap = {
      desired_state: ['desired_state'],
      intention: ['intention'],
      gratitude: ['gratitude'],
      reflection: ['reflection'],
      synchronicity: ['synchronicity'],
      alignment_score: ['alignment_score'],
    }

    const baseHeaders = ['user_id', 'email', 'first_name', 'country', 'age_range', 'gender', 'entry_date', 'created_at']
    const selectedHeaders = journalField === 'all' ? ['desired_state', 'intention', 'gratitude', 'reflection', 'synchronicity', 'alignment_score'] : fieldMap[journalField] ?? ['desired_state']
    const headers = [...baseHeaders, ...selectedHeaders]

    const rows = baseRows
      .filter((row) => selectedHeaders.some((h) => String(row[h] ?? '').trim()))
      .map((row) => headers.reduce((acc, key) => ({ ...acc, [key]: row[key] }), {}))

    downloadCsv(headers, rows, `morpho_journal_${journalField}`)
  }

  const loadAuditLogs = async (newOffset = 0) => {
    setAuditLoading(true)
    setAuditError('')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setAuditLoading(false)
      setAuditError('Session invalide.')
      return
    }
    try {
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-audit-log`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: auditActionFilter || undefined,
          date_from: auditDateFrom || undefined,
          date_to: auditDateTo || undefined,
          limit: AUDIT_PAGE_SIZE,
          offset: newOffset,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAuditError(payload?.error || `HTTP ${res.status}`)
      } else {
        if (newOffset === 0) {
          setAuditLogs(payload.logs ?? [])
        } else {
          setAuditLogs((prev) => [...prev, ...(payload.logs ?? [])])
        }
        setAuditTotal(payload.total ?? 0)
        setAuditOffset(newOffset)
        setAuditLoaded(true)
      }
    } catch (err) {
      setAuditError(err?.message || 'Erreur réseau')
    }
    setAuditLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">
        Chargement admin...
      </div>
    )
  }

  if (!userIsAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(13,31,56,0.96)_0%,rgba(13,31,56,0.82)_100%)] p-5 shadow-[0_30px_80px_rgba(2,12,27,0.45)] backdrop-blur-xl sm:p-8">
          <DashboardHeader firstName={firstName} onLogout={onLogout} activeTab="admin" />
          <div className="mt-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Admin</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Vue d'ensemble des utilisateurs Morpho</p>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div style={premiumDashboardCardStyle}>
            <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">Utilisateurs</p>
            <p className="mt-3 text-5xl font-semibold text-white">{stats.totalUsers}</p>
            <p className="mt-2 text-xs text-white/40">comptes créés</p>
          </div>
          <div style={premiumDashboardCardStyle}>
            <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">Onboarding</p>
            <p className="mt-3 text-5xl font-semibold text-white">{stats.onboardingDone}</p>
            <p className="mt-2 text-xs text-white/40">{stats.onboardingPercent}% du total</p>
          </div>
          <div style={premiumDashboardCardStyle}>
            <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">Actifs 7 jours</p>
            <p className="mt-3 text-5xl font-semibold text-white">{stats.active7}</p>
            <p className="mt-2 text-xs text-white/40">ont écrit cette semaine</p>
          </div>
          <div style={premiumDashboardCardStyle}>
            <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">Entrées totales</p>
            <p className="mt-3 text-5xl font-semibold text-white">{stats.totalEntries}</p>
            <p className="mt-2 text-xs text-white/40">journaux remplis</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[['Par pays', chartDataCountry, 'hbar'], ['Par source de découverte', chartDataSource, 'hbar'], ['Par tranche d’âge', chartDataAge, 'vbar'], ['Par genre', chartDataGender, 'donut']].map(([title, data, kind]) => (
            <div key={title} style={premiumDashboardCardStyle} className="h-[280px]">
              <p className="text-sm font-semibold text-slate-100">{title}</p>
              <div className="mt-4 h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  {kind === 'hbar' ? (
                    <BarChart data={data} layout="vertical" margin={{ left: 20, right: 10 }}>
                      <XAxis type="number" tick={{ fill: '#9cb2d8', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#9cb2d8', fontSize: 11 }} width={130} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  ) : kind === 'vbar' ? (
                    <BarChart data={data}>
                      <XAxis dataKey="name" tick={{ fill: '#9cb2d8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9cb2d8', fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={76}>
                        {data.map((_, i) => (
                          <Cell key={i} fill={['#3b82f6', '#60a5fa', '#93c5fd'][i % 3]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        <div style={premiumDashboardCardStyle} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Monitoring compressions mémoire</h2>
              <p className="text-xs text-[#9cb2d8]">Pipeline compression + snapshots + alertes</p>
            </div>
            {compressionStats.errors > 0 ? (
              <span className="rounded-full border border-rose-400/50 bg-rose-500/15 px-3 py-1 text-xs text-rose-200">
                {compressionStats.errors} erreur{compressionStats.errors > 1 ? 's' : ''}
              </span>
            ) : null}
          </div>

          {compressionErrorRate24h > 5 ? (
            <p className="rounded-xl border border-amber-400/35 bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
              Alerte: le taux d'erreur compression sur 24h est de {compressionErrorRate24h.toFixed(1)}% (seuil 5%).
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-blue-500/20 bg-[#091525] p-4">
              <p className="text-xs text-[#9cb2d8]">Total compressions</p>
              <p className="mt-1 text-2xl font-semibold text-white">{compressionStats.total}</p>
              <p className="mt-1 text-xs text-[#9cb2d8]">{currentMemories.length} mémoires actuelles</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-[#091525] p-4">
              <p className="text-xs text-[#9cb2d8]">Succès / Ignorées / Erreurs</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {compressionStats.success} / {compressionStats.skipped} / {compressionStats.errors}
              </p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-[#091525] p-4">
              <p className="text-xs text-[#9cb2d8]">Coût cumulé (30j / total)</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {compressionStats.cost30}c / {compressionStats.costTotal}c
              </p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-[#091525] p-4">
              <p className="text-xs text-[#9cb2d8]">Tokens moyens (input / output)</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {compressionStats.avgInput} / {compressionStats.avgOutput}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-blue-500/20 bg-[#091525] p-4 text-sm text-[#dbe8fa]">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Skips par raison</p>
              {Object.keys(compressionStats.skippedReasons).length ? (
                Object.entries(compressionStats.skippedReasons).map(([reason, count]) => (
                  <p key={reason}>
                    {reason}: <span className="text-white">{count}</span>
                  </p>
                ))
              ) : (
                <p className="text-[#9cb2d8]">Aucun skip.</p>
              )}
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-[#091525] p-4 text-sm text-[#dbe8fa]">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Erreurs fréquentes</p>
              {Object.keys(compressionStats.errorMessages).length ? (
                Object.entries(compressionStats.errorMessages).map(([msg, count]) => (
                  <p key={msg}>
                    {msg}: <span className="text-white">{count}</span>
                  </p>
                ))
              ) : (
                <p className="text-[#9cb2d8]">Aucune erreur.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-[#091525] p-4">
            <p className="mb-3 text-sm font-semibold text-slate-100">Fréquence compressions (30 derniers jours)</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compressionByDayLast30}>
                  <XAxis dataKey="day" tick={{ fill: '#9cb2d8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9cb2d8', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-[#091525] p-4">
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <input
                value={compressionSearch}
                onChange={(e) => setCompressionSearch(e.target.value)}
                placeholder="Recherche email ou user_id"
                className="min-w-[220px] flex-1 rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2.5 text-sm text-[#e8edf5]"
              />
              <select
                value={compressionStatusFilter}
                onChange={(e) => setCompressionStatusFilter(e.target.value)}
                className="rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2.5 text-sm text-[#e8edf5]"
              >
                <option value="all">Tous statuts</option>
                <option value="success">success</option>
                <option value="skipped">skipped</option>
                <option value="error">error</option>
              </select>
            </div>

            <div className="overflow-auto rounded-xl border border-blue-500/10">
              <table className="min-w-[1100px] w-full text-[13px]">
                <thead className="bg-[#0d1f38] text-left text-[#7a9cc4]">
                  <tr>
                    {[
                      ['created_at', 'Date'],
                      ['email', 'User'],
                      ['milestone_entries', 'Palier'],
                      ['status', 'Status'],
                      ['entries_in_window', 'Entrées fenêtre'],
                      ['cost_cents', 'Coût (c)'],
                      ['input_tokens', 'Tokens in'],
                      ['output_tokens', 'Tokens out'],
                    ].map(([key, label]) => (
                      <th
                        key={key}
                        className="cursor-pointer border-b border-blue-500/10 px-3 py-2.5 font-medium"
                        onClick={() =>
                          setCompressionSort((prev) => ({
                            key,
                            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
                          }))
                        }
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentCompressions.map((row, i) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedCompressionId(row.id)}
                      className={`cursor-pointer ${i % 2 ? 'bg-[#0f2440]' : 'bg-[#0d1f38]'} hover:bg-[#12243f]`}
                    >
                      <td className="border-b border-blue-500/10 px-3 py-2.5 text-[#c8d6e8]">{formatDateTimeFr(row.created_at)}</td>
                      <td className="border-b border-blue-500/10 px-3 py-2.5 text-[#dbe8fa]">{row.email || row.user_id}</td>
                      <td className="border-b border-blue-500/10 px-3 py-2.5 text-[#c8d6e8]">{row.milestone_entries}</td>
                      <td className="border-b border-blue-500/10 px-3 py-2.5 text-[#c8d6e8]">{row.status}</td>
                      <td className="border-b border-blue-500/10 px-3 py-2.5 text-[#c8d6e8]">{row.entries_in_window ?? 0}</td>
                      <td className="border-b border-blue-500/10 px-3 py-2.5 text-[#c8d6e8]">{row.cost_cents ?? 0}</td>
                      <td className="border-b border-blue-500/10 px-3 py-2.5 text-[#c8d6e8]">{row.input_tokens ?? 0}</td>
                      <td className="border-b border-blue-500/10 px-3 py-2.5 text-[#c8d6e8]">{row.output_tokens ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={premiumDashboardCardStyle}>
          <div className="flex flex-wrap items-end gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Recherche email ou prénom"
              className="min-w-[220px] flex-1 rounded-xl border border-blue-500/20 bg-[#091525] px-3 py-2.5 text-sm text-[#e8edf5] outline-none focus:border-blue-400"
            />
            <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="rounded-xl border border-blue-500/20 bg-[#091525] px-3 py-2.5 text-sm text-[#e8edf5]">
              {countries.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-xl border border-blue-500/20 bg-[#091525] px-3 py-2.5 text-sm text-[#e8edf5]">
              {sources.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="rounded-xl border border-blue-500/20 bg-[#091525] px-3 py-2.5 text-sm text-[#e8edf5]">
              {['Toutes', 'Femme', 'Homme', 'Autre'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="rounded-xl border border-blue-500/20 bg-[#091525] px-3 py-2.5 text-sm text-[#e8edf5]">
              {['Toutes', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select value={onboardingFilter} onChange={(e) => setOnboardingFilter(e.target.value)} className="rounded-xl border border-blue-500/20 bg-[#091525] px-3 py-2.5 text-sm text-[#e8edf5]">
              {['Tous', 'Complété', 'Non complété'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <button onClick={exportCsv} type="button" className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
              Exporter CSV
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-blue-500/20 bg-[#091525] p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[190px]">
                <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Export journal</p>
                <select value={journalScope} onChange={(e) => setJournalScope(e.target.value)} className="w-full rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2.5 text-sm text-[#e8edf5]">
                  <option value="filtered">Users filtrés actuels</option>
                  <option value="all_users">Tous les users</option>
                </select>
              </div>
              <div className="min-w-[220px]">
                <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Zone du journal</p>
                <select value={journalField} onChange={(e) => setJournalField(e.target.value)} className="w-full rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2.5 text-sm text-[#e8edf5]">
                  <option value="all">Toutes les zones</option>
                  <option value="desired_state">Comment je me sens vraiment</option>
                  <option value="intention">Intention du jour</option>
                  <option value="gratitude">Gratitude</option>
                  <option value="reflection">Réflexion</option>
                  <option value="synchronicity">Synchronicité</option>
                  <option value="alignment_score">Score d'alignement</option>
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Du</p>
                <input type="date" value={journalDateFrom} onChange={(e) => setJournalDateFrom(e.target.value)} className="rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2.5 text-sm text-[#e8edf5]" />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Au</p>
                <input type="date" value={journalDateTo} onChange={(e) => setJournalDateTo(e.target.value)} className="rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2.5 text-sm text-[#e8edf5]" />
              </div>
              <button onClick={exportJournalCsv} type="button" className="rounded-xl bg-[#0ea5e9] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                Exporter journal
              </button>
            </div>
            <p className="mt-2 text-xs text-[#9cb2d8]">{availableJournalRows.length} entrées prêtes à exporter avec les filtres actuels.</p>
          </div>

          <div className="mt-5 overflow-auto rounded-xl border border-blue-500/10">
            <table className="min-w-[1280px] w-full text-[13px]">
              <thead className="sticky top-0 z-10 bg-[#0d1f38]">
                <tr className="text-left text-[#7a9cc4]">
                  {['Email', 'Prénom', 'Inscrit le', 'Âge', 'Genre', 'Pays', 'Source', 'Souhait principal', 'Jours pratiqués', 'Dernier login', 'Onboarding', 'Debug'].map((h) => (
                    <th key={h} className="border-b border-blue-500/10 px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u, i) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`cursor-pointer transition hover:bg-[#12243f] ${i % 2 ? 'bg-[#0f2440]' : 'bg-[#0d1f38]'}`}
                  >
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{u.email || '—'}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#e8edf5]">{u.first_name || '—'}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{formatDateFr(u.created_at)}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{u.age_range || '—'}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{genderLabel(u.gender)}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{u.country || '—'}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{u.discovery_source || '—'}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{trunc(u.wish)}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{u.totalEntries}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3 text-[#c8d6e8]">{formatRelative(u.lastSignInAt)}</td>
                    <td className="border-b border-blue-500/10 px-4 py-3">
                      {u.onboarding_completed ? (
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200">✓ OK</span>
                      ) : (
                        <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-1 text-xs text-amber-200">⚠ En attente</span>
                      )}
                    </td>
                    <td className="border-b border-blue-500/10 px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/debug/${u.id}`)
                        }}
                        className="rounded-lg border border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-200 hover:bg-sky-500/20"
                      >
                        Mode debug
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-[#9cb2d8]">
            <span>
              {filteredUsers.length} utilisateurs filtrés
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-blue-500/20 px-3 py-1.5 disabled:opacity-40"
              >
                Préc.
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-blue-500/20 px-3 py-1.5 disabled:opacity-40"
              >
                Suiv.
              </button>
            </div>
          </div>
        </div>

        {/* ── Audit Log ── */}
        <div style={premiumDashboardCardStyle} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Journal d'audit</h2>
              <p className="text-xs text-[#9cb2d8]">Impersonations, consultations admin, suppressions de données</p>
            </div>
            <button
              type="button"
              onClick={() => { setAuditOffset(0); loadAuditLogs(0) }}
              disabled={auditLoading}
              className="rounded-xl border border-blue-500/25 bg-[#091525] px-4 py-2 text-sm text-[#dbe8fa] hover:border-blue-400/45 disabled:opacity-50"
            >
              {auditLoading ? 'Chargement...' : auditLoaded ? 'Rafraîchir' : 'Charger les logs'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#9cb2d8]">Type d'action</label>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2 text-sm text-[#e8edf5]"
              >
                <option value="">Toutes</option>
                <option value="admin_data_view">admin_data_view</option>
                <option value="impersonation_start">impersonation_start</option>
                <option value="impersonation_end">impersonation_end</option>
                <option value="data_delete_entry">data_delete_entry</option>
                <option value="data_delete_chat_message">data_delete_chat_message</option>
                <option value="data_delete_profile">data_delete_profile</option>
                <option value="bulk_delete_blocked">bulk_delete_blocked</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#9cb2d8]">Depuis</label>
              <input
                type="date"
                value={auditDateFrom}
                onChange={(e) => setAuditDateFrom(e.target.value)}
                className="rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2 text-sm text-[#e8edf5]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#9cb2d8]">Jusqu'au</label>
              <input
                type="date"
                value={auditDateTo}
                onChange={(e) => setAuditDateTo(e.target.value)}
                className="rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2 text-sm text-[#e8edf5]"
              />
            </div>
            {auditLoaded ? (
              <button
                type="button"
                onClick={() => loadAuditLogs(0)}
                disabled={auditLoading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                Appliquer filtres
              </button>
            ) : null}
          </div>

          {auditError ? (
            <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{auditError}</p>
          ) : null}

          {auditLoaded ? (
            <>
              <p className="text-xs text-[#9cb2d8]">
                {auditLogs.length} événement{auditLogs.length > 1 ? 's' : ''} affichés
                {auditTotal > auditLogs.length ? ` sur ${auditTotal} au total` : ''}
              </p>

              {auditLogs.length ? (
                <div className="overflow-x-auto rounded-xl border border-blue-500/15">
                  <table className="w-full text-sm text-[#dbe8fa]">
                    <thead>
                      <tr className="border-b border-blue-500/15 bg-[#091525] text-left text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Acteur</th>
                        <th className="px-4 py-3">Cible</th>
                        <th className="px-4 py-3">Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="cursor-pointer border-b border-blue-500/10 hover:bg-blue-500/5"
                          onClick={() => setSelectedAuditId(log.id)}
                        >
                          <td className="px-4 py-3 text-xs text-[#9cb2d8] whitespace-nowrap">
                            {formatDateTimeFr(log.occurred_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              log.action === 'impersonation_start' ? 'bg-rose-500/20 text-rose-200' :
                              log.action === 'impersonation_end' ? 'bg-amber-500/20 text-amber-200' :
                              log.action === 'admin_data_view' ? 'bg-sky-500/20 text-sky-200' :
                              log.action?.startsWith('data_delete') ? 'bg-red-500/25 text-red-200' :
                              log.action === 'bulk_delete_blocked' ? 'bg-orange-500/25 text-orange-200' :
                              'bg-blue-500/15 text-blue-200'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{log.actor_email || log.actor_id?.slice(0, 8) || '—'}</td>
                          <td className="px-4 py-3 text-xs">
                            {log.metadata?.target_email
                              ? String(log.metadata.target_email)
                              : log.target_user_id?.slice(0, 8) || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#9cb2d8]">
                            {log.action === 'impersonation_end' && log.metadata?.duration_seconds != null
                              ? `Durée: ${log.metadata.duration_seconds}s`
                              : log.target_table
                              ? `Table: ${log.target_table}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[#9cb2d8]">Aucun événement pour ces filtres.</p>
              )}

              {auditTotal > auditLogs.length ? (
                <button
                  type="button"
                  onClick={() => loadAuditLogs(auditOffset + AUDIT_PAGE_SIZE)}
                  disabled={auditLoading}
                  className="w-full rounded-xl border border-blue-500/20 py-2.5 text-sm text-[#9cb2d8] hover:border-blue-400/40 disabled:opacity-50"
                >
                  {auditLoading ? 'Chargement...' : `Charger plus (${auditTotal - auditLogs.length} restants)`}
                </button>
              ) : null}
            </>
          ) : !auditLoading ? (
            <p className="text-sm text-[#9cb2d8]">Cliquez sur "Charger les logs" pour consulter l'historique d'audit.</p>
          ) : null}
        </div>
      </div>

      <Footer />

      {selectedCompression ? (
        <div className="fixed inset-0 z-50 bg-black/55" onClick={() => setSelectedCompressionId('')}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-[760px] overflow-y-auto border-l border-blue-500/20 bg-[#0d1f38] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Détail compression</h3>
                <p className="text-sm text-[#9cb2d8]">
                  {selectedCompression.email || selectedCompression.user_id} • palier {selectedCompression.milestone_entries}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedCompressionId('')} className="rounded-lg border border-blue-500/30 px-2 py-1 text-[#9cb2d8]">
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-[#dbe8fa]">
              <section className="rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                <p>Status: {selectedCompression.status}</p>
                <p>Date: {formatDateTimeFr(selectedCompression.created_at)}</p>
                <p>Fenêtre: {selectedCompression.window_start || '—'} → {selectedCompression.window_end || '—'}</p>
                <p>Entrées dans fenêtre: {selectedCompression.entries_in_window ?? 0}</p>
                <p>Coût: {selectedCompression.cost_cents ?? 0}c</p>
                <p>Tokens in/out: {selectedCompression.input_tokens ?? 0} / {selectedCompression.output_tokens ?? 0}</p>
                {selectedCompression.skip_reason ? <p>Skip reason: {selectedCompression.skip_reason}</p> : null}
                {selectedCompression.error_message ? <p>Erreur: {selectedCompression.error_message}</p> : null}
              </section>

              {selectedCompressionLossRisk ? (
                <p className="rounded-lg border border-amber-400/35 bg-amber-500/15 px-3 py-2 text-amber-100">
                  Attention: le résumé post-compression est significativement plus court que le précédent.
                </p>
              ) : null}

              <section className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Mémoire avant</p>
                  {selectedCompressionPreviousSnapshot ? (
                    <div className="space-y-2">
                      <p><span className="text-[#9cb2d8]">Résumé:</span> {selectedCompressionPreviousSnapshot.summary || '—'}</p>
                      <p><span className="text-[#9cb2d8]">Patterns:</span> {selectedCompressionPreviousSnapshot.key_patterns || '—'}</p>
                      <p><span className="text-[#9cb2d8]">Wins:</span> {selectedCompressionPreviousSnapshot.wins || '—'}</p>
                      <p><span className="text-[#9cb2d8]">Struggles:</span> {selectedCompressionPreviousSnapshot.struggles || '—'}</p>
                      <p><span className="text-[#9cb2d8]">Timeline:</span> {selectedCompressionPreviousSnapshot.timeline_markers || '—'}</p>
                    </div>
                  ) : (
                    <p className="text-[#9cb2d8]">Aucun snapshot précédent.</p>
                  )}
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Mémoire après</p>
                  {selectedCompressionCurrentSnapshot ? (
                    <div className="space-y-2">
                      <p><span className="text-[#9cb2d8]">Résumé:</span> {selectedCompressionCurrentSnapshot.summary || '—'}</p>
                      <p><span className="text-[#9cb2d8]">Patterns:</span> {selectedCompressionCurrentSnapshot.key_patterns || '—'}</p>
                      <p><span className="text-[#9cb2d8]">Wins:</span> {selectedCompressionCurrentSnapshot.wins || '—'}</p>
                      <p><span className="text-[#9cb2d8]">Struggles:</span> {selectedCompressionCurrentSnapshot.struggles || '—'}</p>
                      <p><span className="text-[#9cb2d8]">Timeline:</span> {selectedCompressionCurrentSnapshot.timeline_markers || '—'}</p>
                    </div>
                  ) : (
                    <p className="text-[#9cb2d8]">Aucun snapshot courant trouvé.</p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Diff visuel</p>
                <div className="space-y-2">
                  {selectedCompressionDiff.map((d) => (
                    <div key={d.key} className="rounded-md border border-blue-500/15 bg-[#0d1f38] p-2">
                      <p>
                        <span className="text-[#9cb2d8]">{d.label}:</span> {d.status}
                      </p>
                      {d.status !== 'inchangé' ? (
                        <>
                          <p className="mt-1 text-xs text-[#9cb2d8]">Avant: {d.previous || '—'}</p>
                          <p className="mt-1">Après: {d.current || '—'}</p>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="fixed inset-0 z-50 bg-black/55" onClick={() => setSelectedUserId('')}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-[600px] overflow-y-auto border-l border-blue-500/20 bg-[#0d1f38] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedUser.first_name || 'Utilisateur'}</h3>
                <p className="text-sm text-[#9cb2d8]">{selectedUser.email || '—'}</p>
              </div>
              <button type="button" onClick={() => setSelectedUserId('')} className="rounded-lg border border-blue-500/30 px-2 py-1 text-[#9cb2d8]">
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              <section>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Informations personnelles</p>
                <p>Email: {selectedUser.email || '—'}</p>
                <p>Prénom: {selectedUser.first_name || '—'}</p>
                <p>Date d'inscription: {formatDateFr(selectedUser.created_at)}</p>
                <p>Dernier login: {formatRelative(selectedUser.lastSignInAt)}</p>
              </section>
              <section>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Données quiz</p>
                <p>Âge: {selectedUser.age_range || '—'}</p>
                <p>Genre: {genderLabel(selectedUser.gender)}</p>
                <p>Pays: {selectedUser.country || '—'}</p>
                <p>Source: {selectedUser.discovery_source || '—'}</p>
                <p>Onboarding: {selectedUser.onboarding_completed ? '✓ OK' : '⚠ En attente'}</p>
              </section>
              <section>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Souhaits</p>
                <p>Souhait principal: {selectedUser.wish || '—'}</p>
                <p>Souhait secondaire: {selectedUser.secondary_wish || '—'}</p>
              </section>
              <section>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Activité</p>
                <p>Jours pratiqués: {selectedUser.totalEntries}</p>
                <p>Score d'alignement moyen: {selectedUser.avgAlignment || '—'}</p>
                <p>Streak actuel: {selectedUser.streak}</p>
                <p>Dernière entrée: {selectedUser.lastEntryDate || '—'}</p>
              </section>
              <section>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">5 dernières entrées</p>
                <div className="space-y-3">
                  {selectedEntries.length ? (
                    selectedEntries.map((e) => (
                      <div key={`${e.user_id}-${e.entry_date}-${e.created_at}`} className="rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                        <p className="text-xs text-[#7a9cc4]">{e.entry_date}</p>
                        <p className="mt-1">Intention: {e.intention || '—'}</p>
                        <p>Comment je me sens: {e.desired_state || '—'}</p>
                        <p>Alignement: {e.alignment_score ?? '—'}/10</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#9cb2d8]">Aucune entrée.</p>
                  )}
                </div>
              </section>
              <section>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Mémoire compressée</p>
                {selectedMemory ? (
                  <div className="space-y-2 rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                    <p>
                      <span className="text-[#7a9cc4]">Summary:</span> {selectedMemory.summary || '—'}
                    </p>
                    <p>
                      <span className="text-[#7a9cc4]">Key patterns:</span> {selectedMemory.key_patterns || '—'}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#9cb2d8]">Aucune mémoire.</p>
                )}
              </section>
            </div>
          </aside>
        </div>
      ) : null}

      {selectedAuditId ? (() => {
        const log = auditLogs.find((l) => l.id === selectedAuditId)
        if (!log) return null
        const meta = log.metadata ?? {}
        return (
          <div className="fixed inset-0 z-50 bg-black/55" onClick={() => setSelectedAuditId('')}>
            <aside
              className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto border-l border-blue-500/20 bg-[#0d1f38] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold text-white">Détail événement</h3>
                <button type="button" onClick={() => setSelectedAuditId('')} className="rounded-lg border border-blue-500/30 px-2 py-1 text-[#9cb2d8]">
                  ✕
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[#dbe8fa]">
                <div className="rounded-lg border border-blue-500/20 bg-[#091525] p-3 space-y-1">
                  <p><span className="text-[#9cb2d8]">ID:</span> {log.id}</p>
                  <p><span className="text-[#9cb2d8]">Date:</span> {formatDateTimeFr(log.occurred_at)}</p>
                  <p><span className="text-[#9cb2d8]">Action:</span> {log.action}</p>
                  <p><span className="text-[#9cb2d8]">Acteur:</span> {log.actor_email || '—'} ({log.actor_id || '—'})</p>
                  <p><span className="text-[#9cb2d8]">Cible user:</span> {meta.target_email ? String(meta.target_email) : '—'} ({log.target_user_id || '—'})</p>
                  {log.target_table ? <p><span className="text-[#9cb2d8]">Table:</span> {log.target_table}</p> : null}
                  {log.target_row_id ? <p><span className="text-[#9cb2d8]">Row ID:</span> {log.target_row_id}</p> : null}
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#7a9cc4]">Métadonnées</p>
                  <div className="rounded-lg border border-blue-500/20 bg-[#091525] p-3 space-y-1">
                    {Object.keys(meta).length ? (
                      Object.entries(meta).map(([k, v]) => (
                        <p key={k}>
                          <span className="text-[#9cb2d8]">{k}:</span>{' '}
                          {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                        </p>
                      ))
                    ) : (
                      <p className="text-[#9cb2d8]">Aucune métadonnée.</p>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )
      })() : null}
    </main>
  )
}
