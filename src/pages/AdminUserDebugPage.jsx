import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import Footer from '../components/Footer'
import { useAuth } from '../context/useAuth'
import { isAdmin } from '../lib/admin'
import { premiumDashboardCardStyle } from '../lib/premiumDashboardCard'
import { supabase } from '../lib/supabaseClient'

async function writeAuditLog(accessToken, action, targetUserId, metadata = {}) {
  try {
    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-audit-write`
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, target_user_id: targetUserId, metadata }),
    })
  } catch {
    // Audit log failure must never block the UI
  }
}

const IMPERSONATION_KEY = 'morpho_impersonation_context'

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

function diffLabel(current, previous) {
  const nowValue = String(current ?? '').trim()
  const prevValue = String(previous ?? '').trim()
  if (!nowValue && !prevValue) return 'inchangé'
  if (nowValue && !prevValue) return 'ajouté'
  if (!nowValue && prevValue) return 'supprimé'
  if (nowValue === prevValue) return 'inchangé'
  return 'modifié'
}

export default function AdminUserDebugPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [entries, setEntries] = useState([])
  const [memory, setMemory] = useState(null)
  const [compressionHistory, setCompressionHistory] = useState([])
  const [memorySnapshots, setMemorySnapshots] = useState([])
  const [memoryEvents, setMemoryEvents] = useState([])
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [impersonating, setImpersonating] = useState(false)
  const [forcingCompression, setForcingCompression] = useState(false)
  const [forceCompressionMessage, setForceCompressionMessage] = useState('')
  const auditLoggedRef = useRef(false)
  const userIsAdmin = isAdmin(user)
  const firstName = user?.user_metadata?.first_name?.trim() || user?.email?.split('@')[0] || 'Profil'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.id || !userIsAdmin || !userId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const { data, error: invokeError } = await supabase.functions.invoke('admin-user-debug', {
        body: { user_id: userId },
      })

      if (cancelled) return

      if (invokeError) {
        setError(invokeError.message)
      } else {
        setProfile(data?.profile ?? null)
        setEntries(data?.entries ?? [])
        setMemory(data?.memory ?? null)
        setCompressionHistory(data?.compression_history ?? [])
        setMemorySnapshots(data?.memory_snapshots ?? [])
        setMemoryEvents(data?.memory_events ?? [])

        // Log admin_data_view once per page load
        if (!auditLoggedRef.current) {
          auditLoggedRef.current = true
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session?.access_token) {
            writeAuditLog(session.access_token, 'admin_data_view', userId, {
              target_email: data?.profile?.email ?? '',
            })
          }
        }
      }

      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, userId, userIsAdmin])

  const stats = useMemo(() => {
    const totalEntries = entries.length
    const avgAlignment =
      totalEntries > 0
        ? Number((entries.reduce((sum, x) => sum + Number(x.alignment_score ?? 0), 0) / totalEntries).toFixed(1))
        : 0

    let streak = 0
    const doneDays = new Set(entries.map((x) => String(x.entry_date)))
    const cursor = new Date()
    while (true) {
      const ymd = cursor.toISOString().slice(0, 10)
      if (!doneDays.has(ymd)) break
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return {
      totalEntries,
      avgAlignment,
      streak,
      lastEntryDate: entries[0]?.entry_date ?? '',
    }
  }, [entries])

  const previousSnapshot = memorySnapshots[1] ?? null
  const memoryDiff = useMemo(() => {
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
      status: diffLabel(memory?.[key], previousSnapshot?.[key]),
      current: memory?.[key] ?? '',
      previous: previousSnapshot?.[key] ?? '',
    }))
  }, [memory, previousSnapshot])

  const filteredEvents = useMemo(() => {
    return memoryEvents.filter((e) => (eventTypeFilter === 'all' ? true : e.event_type === eventTypeFilter))
  }, [eventTypeFilter, memoryEvents])

  const selectedEvent = useMemo(
    () => memoryEvents.find((e) => e.id === selectedEventId) ?? null,
    [memoryEvents, selectedEventId],
  )

  const onLogout = async () => {
    await supabase.auth.signOut()
  }

  const startImpersonation = async () => {
    if (!profile?.id) return
    const ok = window.confirm(
      `Tu vas ouvrir une session reelle en tant que ${profile.email || 'cet utilisateur'}. Ta session admin actuelle sera remplacee. Continuer ?`,
    )
    if (!ok) return

    setImpersonating(true)
    setError('')
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      setImpersonating(false)
      setError(sessionError?.message || 'Session invalide, reconnecte-toi puis reessaie.')
      return
    }

    try {
      localStorage.setItem(
        IMPERSONATION_KEY,
        JSON.stringify({
          adminUserId: user.id,
          adminEmail: user.email ?? '',
          adminAccessToken: session.access_token,
          adminRefreshToken: session.refresh_token,
          startedAt: new Date().toISOString(),
        }),
      )
    } catch {
      // Continue even if storage fails; impersonation can still open.
    }

    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-impersonate`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        target_user_id: profile.id,
        redirect_to: `${window.location.origin}/dashboard`,
      }),
    })

    const payload = await res.json().catch(() => ({}))
    setImpersonating(false)

    if (!res.ok) {
      const details = payload?.error || payload?.message || `HTTP ${res.status}`
      setError(`Impersonation impossible (${res.status}): ${details}`)
      return
    }

    if (!payload?.action_link) {
      setError("Lien d'impersonation introuvable.")
      return
    }

    // Log impersonation_start before redirecting
    await writeAuditLog(session.access_token, 'impersonation_start', profile.id, {
      target_email: profile.email ?? '',
      started_at: new Date().toISOString(),
    })

    window.location.href = payload.action_link
  }

  const forceCompressionNow = async () => {
    if (!profile?.id) return
    setForcingCompression(true)
    setForceCompressionMessage('')
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session?.access_token) {
      setForcingCompression(false)
      setForceCompressionMessage(
        `Erreur: ${sessionError?.message || 'Session invalide, reconnecte-toi.'}`,
      )
      return
    }

    let data = null
    let invokeError = null
    try {
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-memory`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ user_id: profile.id }),
      })
      data = await res.json().catch(() => ({}))
      if (!res.ok) {
        invokeError = {
          message: data?.error || data?.message || `HTTP ${res.status}`,
        }
      }
    } catch (err) {
      invokeError = { message: err?.message || 'Failed to send request' }
    }
    setForcingCompression(false)

    if (invokeError) {
      setForceCompressionMessage(`Erreur: ${invokeError.message}`)
      return
    }

    if (data?.updated) {
      setForceCompressionMessage(
        `Compression lancée avec succès (palier ${data.milestone_entries ?? 'n/a'}).`,
      )
    } else if (data?.skipped) {
      setForceCompressionMessage(`Compression ignorée: ${data.reason || 'UNKNOWN'}`)
    } else {
      setForceCompressionMessage('Compression déclenchée.')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">
        Chargement mode debug...
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
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Mode debug utilisateur</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Lecture seule - aperçu dashboard/settings/journal</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={forceCompressionNow}
                disabled={!profile || forcingCompression}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {forcingCompression ? 'Compression...' : 'Forcer update-memory'}
              </button>
              <button
                type="button"
                onClick={startImpersonation}
                disabled={!profile || impersonating}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {impersonating ? 'Connexion en cours...' : 'Se connecter comme cet utilisateur'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="rounded-xl border border-blue-500/25 bg-[#091525] px-4 py-2.5 text-sm text-[#dbe8fa] hover:border-blue-400/45"
              >
                Retour admin
              </button>
            </div>
          </div>
          {forceCompressionMessage ? (
            <p className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {forceCompressionMessage}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Vous consultez les donnees de cet utilisateur en mode debug (lecture seule). Aucune action n'est executee en son nom.
        </div>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}

        {!profile ? (
          <div style={premiumDashboardCardStyle}>
            <p className="text-sm text-[#dbe8fa]">Utilisateur introuvable.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div style={premiumDashboardCardStyle}>
                <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">Entrées journal</p>
                <p className="mt-3 text-5xl font-semibold text-white">{stats.totalEntries}</p>
              </div>
              <div style={premiumDashboardCardStyle}>
                <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">Alignement moyen</p>
                <p className="mt-3 text-5xl font-semibold text-white">{stats.avgAlignment || '—'}</p>
              </div>
              <div style={premiumDashboardCardStyle}>
                <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">Streak actuel</p>
                <p className="mt-3 text-5xl font-semibold text-white">{stats.streak}</p>
              </div>
              <div style={premiumDashboardCardStyle}>
                <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">Dernière entrée</p>
                <p className="mt-3 text-2xl font-semibold text-white">{stats.lastEntryDate || '—'}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div style={premiumDashboardCardStyle}>
                <p className="mb-3 text-sm font-semibold text-slate-100">Aperçu settings / profil</p>
                <div className="space-y-1 text-sm text-[#dbe8fa]">
                  <p>Email: {profile.email || '—'}</p>
                  <p>Prénom: {profile.first_name || '—'}</p>
                  <p>Age: {profile.age_range || '—'}</p>
                  <p>Pays: {profile.country || '—'}</p>
                  <p>Genre: {profile.gender || '—'}</p>
                  <p>Source: {profile.discovery_source || '—'}</p>
                  <p>Inscription: {formatDateFr(profile.created_at)}</p>
                  <p>Onboarding: {profile.onboarding_completed ? '✓ OK' : '⚠ En attente'}</p>
                  <p>Souhait principal: {profile.wish || '—'}</p>
                  <p>Souhait secondaire: {profile.secondary_wish || '—'}</p>
                </div>
              </div>

              <div style={premiumDashboardCardStyle}>
                <p className="mb-3 text-sm font-semibold text-slate-100">Mémoire coach</p>
                {memory ? (
                  <div className="space-y-2 text-sm text-[#dbe8fa]">
                    <p>
                      <span className="text-[#9cb2d8]">Dernière mise à jour:</span> {formatDateTimeFr(memory.last_updated_at)}
                    </p>
                    <p>
                      <span className="text-[#9cb2d8]">Summary:</span> {memory.summary || '—'}
                    </p>
                    <p>
                      <span className="text-[#9cb2d8]">Key patterns:</span> {memory.key_patterns || '—'}
                    </p>
                    <p>
                      <span className="text-[#9cb2d8]">Wins:</span> {memory.wins || '—'}
                    </p>
                    <p>
                      <span className="text-[#9cb2d8]">Struggles:</span> {memory.struggles || '—'}
                    </p>
                    <p>
                      <span className="text-[#9cb2d8]">Timeline:</span> {memory.timeline_markers || '—'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[#9cb2d8]">Aucune mémoire disponible.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div style={premiumDashboardCardStyle}>
                <p className="mb-3 text-sm font-semibold text-slate-100">Historique des paliers de compression</p>
                {compressionHistory.length ? (
                  <div className="space-y-2 text-sm text-[#dbe8fa]">
                    {compressionHistory.map((h) => (
                      <div key={h.id} className="rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                        <p>
                          <span className="text-[#9cb2d8]">Palier:</span> {h.milestone_entries} jours
                        </p>
                        <p>
                          <span className="text-[#9cb2d8]">Statut:</span> {h.status}
                        </p>
                        <p>
                          <span className="text-[#9cb2d8]">Fenêtre:</span> {h.window_start || '—'} → {h.window_end || '—'} ({h.entries_in_window} entrées)
                        </p>
                        <p>
                          <span className="text-[#9cb2d8]">Date:</span> {formatDateTimeFr(h.created_at)}
                        </p>
                        {h.skip_reason ? (
                          <p>
                            <span className="text-[#9cb2d8]">Skip:</span> {h.skip_reason}
                          </p>
                        ) : null}
                        {h.error_message ? (
                          <p>
                            <span className="text-[#9cb2d8]">Erreur:</span> {h.error_message}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#9cb2d8]">Aucun palier compressé pour le moment.</p>
                )}
              </div>

              <div style={premiumDashboardCardStyle}>
                <p className="mb-3 text-sm font-semibold text-slate-100">Diff mémoire vs palier précédent</p>
                {memory ? (
                  previousSnapshot ? (
                    <div className="space-y-2 text-sm text-[#dbe8fa]">
                      <p className="text-xs text-[#9cb2d8]">
                        Comparaison avec snapshot palier {previousSnapshot.milestone_entries} ({formatDateTimeFr(previousSnapshot.created_at)})
                      </p>
                      {memoryDiff.map((d) => (
                        <div key={d.key} className="rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                          <p>
                            <span className="text-[#9cb2d8]">{d.label}:</span> {d.status}
                          </p>
                          {d.status !== 'inchangé' ? (
                            <>
                              <p className="mt-1 text-xs text-[#9cb2d8]">Avant: {d.previous || '—'}</p>
                              <p className="mt-1">Maintenant: {d.current || '—'}</p>
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9cb2d8]">Pas encore de snapshot précédent pour calculer une diff.</p>
                  )
                ) : (
                  <p className="text-sm text-[#9cb2d8]">Aucune mémoire disponible.</p>
                )}
              </div>
            </div>

            <div style={premiumDashboardCardStyle}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">Timeline memory_events</p>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="rounded-xl border border-blue-500/20 bg-[#0d1f38] px-3 py-2 text-sm text-[#e8edf5]"
                >
                  {['all', 'breakthrough', 'fear', 'commitment', 'rechute', 'milestone', 'resistance', 'clarity', 'decision', 'other'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              {filteredEvents.length ? (
                <div className="space-y-2">
                  {filteredEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelectedEventId(ev.id)}
                      className="w-full rounded-lg border border-blue-500/20 bg-[#091525] p-3 text-left text-sm text-[#dbe8fa] hover:bg-[#10243d]"
                    >
                      <p className="text-xs text-[#7a9cc4]">
                        {ev.event_date} • {ev.event_type} • source: {ev.source}
                      </p>
                      <p className="mt-1">{ev.event_text || '—'}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9cb2d8]">Aucun event pour ce filtre.</p>
              )}
            </div>

            <div style={premiumDashboardCardStyle}>
              <p className="mb-3 text-sm font-semibold text-slate-100">Journal complet ({entries.length})</p>
              <div className="space-y-3">
                {entries.length ? (
                  entries.map((e) => (
                    <div key={`${e.user_id}-${e.entry_date}-${e.created_at}`} className="rounded-lg border border-blue-500/20 bg-[#091525] p-3 text-sm text-[#dbe8fa]">
                      <p className="text-xs text-[#7a9cc4]">
                        {e.entry_date || '—'} - {formatDateFr(e.created_at)}
                      </p>
                      <p className="mt-1">
                        <span className="text-[#9cb2d8]">Comment je me sens:</span> {e.desired_state || '—'}
                      </p>
                      <p>
                        <span className="text-[#9cb2d8]">Intention:</span> {e.intention || '—'}
                      </p>
                      <p>
                        <span className="text-[#9cb2d8]">Gratitude:</span> {e.gratitude || '—'}
                      </p>
                      <p>
                        <span className="text-[#9cb2d8]">Réflexion:</span> {e.reflection || '—'}
                      </p>
                      <p>
                        <span className="text-[#9cb2d8]">Synchronicité:</span> {e.synchronicity || '—'}
                      </p>
                      <p>
                        <span className="text-[#9cb2d8]">Alignement:</span> {e.alignment_score ?? '—'}/10
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#9cb2d8]">Aucune entree de journal.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />

      {selectedEvent ? (
        <div className="fixed inset-0 z-50 bg-black/55" onClick={() => setSelectedEventId('')}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto border-l border-blue-500/20 bg-[#0d1f38] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold text-white">Détail memory_event</h3>
              <button type="button" onClick={() => setSelectedEventId('')} className="rounded-lg border border-blue-500/30 px-2 py-1 text-[#9cb2d8]">
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#dbe8fa]">
              <p>
                <span className="text-[#9cb2d8]">Date parcours:</span> {selectedEvent.event_date || '—'}
              </p>
              <p>
                <span className="text-[#9cb2d8]">Type:</span> {selectedEvent.event_type || '—'}
              </p>
              <p>
                <span className="text-[#9cb2d8]">Source:</span> {selectedEvent.source || '—'}
              </p>
              <p>
                <span className="text-[#9cb2d8]">Confiance:</span> {selectedEvent.confidence ?? '—'}
              </p>
              <p>
                <span className="text-[#9cb2d8]">Créé le:</span> {formatDateTimeFr(selectedEvent.created_at)}
              </p>
              <div className="rounded-lg border border-blue-500/20 bg-[#091525] p-3">
                <p className="text-[#dbe8fa]">{selectedEvent.event_text || '—'}</p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  )
}
