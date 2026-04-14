import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DayToast from '../components/day/DayToast'
import AlignmentScale from '../components/day/AlignmentScale'
import Footer from '../components/Footer'
import { useAuth } from '../context/useAuth'
import { formatLongFrenchDate, isValidRouteDateParam } from '../lib/dates'
import { saveDayEntry } from '../lib/saveDayEntry'
import { supabase } from '../lib/supabaseClient'

function fieldClass(disabled) {
  return [
    'mt-2 w-full resize-none rounded-2xl border border-blue-500/25 bg-slate-950/35 px-4 py-3.5 text-sm leading-relaxed text-slate-100 outline-none transition duration-200',
    'placeholder:text-slate-500 focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-blue-500/20',
    disabled ? 'opacity-60' : '',
  ].join(' ')
}

export default function DayPage() {
  const { date } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const valid = Boolean(date && isValidRouteDateParam(date))

  const [entry, setEntry] = useState(null)
  const [form, setForm] = useState({
    desired_state: '',
    intention: '',
    gratitude: '',
    reflection: '',
    synchronicity: '',
    alignment_score: 5,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [toast, setToast] = useState('')
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)
  const dismissToast = useCallback(() => setToast(''), [])

  useEffect(() => {
    if (!valid) navigate('/dashboard', { replace: true })
  }, [valid, navigate])

  useEffect(() => {
    if (!valid || !user?.id) return undefined

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setSubmitError('')

      const { data, error: dayError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', date)
        .maybeSingle()

      if (cancelled) return

      if (dayError) {
        setSubmitError(dayError.message)
        setEntry(null)
        setSavedSuccessfully(false)
      } else {
        const row = data
        setEntry(row ?? null)
        setSavedSuccessfully(false)
        setForm({
          desired_state: row?.desired_state ?? '',
          intention: row?.intention ?? '',
          gratitude: row?.gratitude ?? '',
          reflection: row?.reflection ?? '',
          synchronicity: row?.synchronicity ?? '',
          alignment_score: row?.alignment_score ?? 5,
        })
      }

      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [valid, user?.id, date])

  const titleDate = useMemo(() => (valid ? formatLongFrenchDate(date) : ''), [valid, date])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id || !valid) return

    const nextErrors = {}
    const desired = form.desired_state.trim()
    const intention = form.intention.trim()
    const gratitude = form.gratitude.trim()

    if (!desired) nextErrors.desired_state = "Ce champ est obligatoire."
    if (!intention) nextErrors.intention = "Ce champ est obligatoire."
    if (!gratitude) nextErrors.gratitude = "Ce champ est obligatoire."
    if (form.alignment_score < 1 || form.alignment_score > 10) {
      nextErrors.alignment_score = "Choisis une note entre 1 et 10."
    }

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitError('')
    setSaving(true)

    const priorAi = entry?.ai_message ?? ''
    const { data, error } = await saveDayEntry(
      supabase,
      user.id,
      date,
      {
        desired_state: desired,
        intention,
        gratitude,
        reflection: form.reflection,
        synchronicity: form.synchronicity,
        alignment_score: form.alignment_score,
      },
      priorAi,
    )

    setSaving(false)

    if (error) {
      setSubmitError(error.message)
      return
    }

    if (data) setEntry(data)
    setSavedSuccessfully(true)
    setToast('Entrée sauvegardée')

    // Trigger memory compression on 7-entry milestones (7, 14, 21, ...).
    try {
      await supabase.functions.invoke('update-memory', {
        body: { user_id: user.id },
      })
    } catch {
      // Non-blocking: the journal save should still succeed even if compression fails.
    }
  }

  if (!valid) return null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">
        Chargement…
      </div>
    )
  }

  return (
    <main className="min-h-screen px-4 py-6 pb-28 md:px-8 md:py-10">
      <DayToast message={toast} onDismiss={dismissToast} />

      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/5 px-4 py-2.5 text-sm font-medium text-blue-200 transition duration-200 hover:border-blue-400/50 hover:bg-blue-600/10"
          >
            <span aria-hidden>←</span> Tableau de bord
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">{titleDate}</h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(13,31,56,0.96)_0%,rgba(13,31,56,0.88)_100%)] p-6 shadow-[0_30px_80px_rgba(2,12,27,0.45)] backdrop-blur-xl md:p-9"
        >
          {submitError ? (
            <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/25 px-4 py-3 text-sm text-red-200 transition duration-200">
              {submitError}
            </p>
          ) : null}

          <div className="space-y-8">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Comment je me sens vraiment aujourd'hui</span>
              <textarea
                name="desired_state"
                value={form.desired_state}
                onChange={(e) => {
                  setForm((s) => ({ ...s, desired_state: e.target.value }))
                  setFieldErrors((prev) => ({ ...prev, desired_state: undefined }))
                }}
                rows={4}
                disabled={saving}
                className={fieldClass(saving)}
                placeholder="Décris comment tu te sens vraiment..."
              />
              {fieldErrors.desired_state ? (
                <p className="mt-2 text-sm text-red-300">{fieldErrors.desired_state}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">L'intention que je porte aujourd'hui</span>
              <textarea
                name="intention"
                value={form.intention}
                onChange={(e) => {
                  setForm((s) => ({ ...s, intention: e.target.value }))
                  setFieldErrors((prev) => ({ ...prev, intention: undefined }))
                }}
                rows={4}
                disabled={saving}
                className={fieldClass(saving)}
                placeholder="L'intention que tu choisis de vivre aujourd'hui..."
              />
              {fieldErrors.intention ? (
                <p className="mt-2 text-sm text-red-300">{fieldErrors.intention}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Ma gratitude</span>
              <textarea
                name="gratitude"
                value={form.gratitude}
                onChange={(e) => {
                  setForm((s) => ({ ...s, gratitude: e.target.value }))
                  setFieldErrors((prev) => ({ ...prev, gratitude: undefined }))
                }}
                rows={4}
                disabled={saving}
                className={fieldClass(saving)}
                placeholder="Ce pour quoi tu es reconnaissant·e…"
              />
              {fieldErrors.gratitude ? (
                <p className="mt-2 text-sm text-red-300">{fieldErrors.gratitude}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">
                Ce que je remarque <span className="font-normal text-[var(--text-muted)]">(optionnel)</span>
              </span>
              <textarea
                name="reflection"
                value={form.reflection}
                onChange={(e) => setForm((s) => ({ ...s, reflection: e.target.value }))}
                rows={4}
                disabled={saving}
                className={fieldClass(saving)}
                placeholder="Ce que tu observes, ce qui bouge en toi…"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">
                Synchronicité du jour{' '}
                <span className="font-normal text-[var(--text-muted)]">(optionnel)</span>
              </span>
              <textarea
                name="synchronicity"
                value={form.synchronicity}
                onChange={(e) => setForm((s) => ({ ...s, synchronicity: e.target.value }))}
                rows={3}
                disabled={saving}
                className={fieldClass(saving)}
                placeholder="Signes, coïncidences, rencontres…"
              />
            </label>

            <div className="rounded-2xl border border-blue-500/20 bg-slate-950/20 p-5 transition duration-200">
              <span className="block text-sm font-medium text-slate-200">
                À quel point je vis mon intention aujourd'hui
              </span>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Score de 1 à 10</p>
              <div className="mt-5">
                <AlignmentScale
                  value={form.alignment_score}
                  onChange={(n) => {
                    setForm((s) => ({ ...s, alignment_score: n }))
                    setFieldErrors((prev) => ({ ...prev, alignment_score: undefined }))
                  }}
                  disabled={saving}
                />
              </div>
              {fieldErrors.alignment_score ? (
                <p className="mt-2 text-sm text-red-300">{fieldErrors.alignment_score}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-10">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[var(--accent-blue)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(37,99,235,0.35)] transition duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
            {savedSuccessfully ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate(`/coach?context=day:${date}`)}
                  className="rounded-full border border-blue-500/35 bg-blue-600/10 px-5 py-2.5 text-sm font-medium text-blue-100 transition hover:border-blue-400/60 hover:bg-blue-600/20"
                >
                  Parler à mon coach de cette entrée →
                </button>
              </div>
            ) : null}
          </div>
        </form>
      </div>
      <Footer />
    </main>
  )
}
