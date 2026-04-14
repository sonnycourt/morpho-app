import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import Footer from '../components/Footer'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

const cardClass =
  'rounded-xl border border-[rgba(59,130,246,0.15)] bg-[#0d1f38] p-6 md:p-6'
const labelClass = 'mb-2 block text-[13px] text-[#7a9cc4]'
const inputClass =
  'w-full rounded-xl border border-blue-500/20 bg-[#091525] px-3 py-2.5 text-sm text-[#e8edf5] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingWishes, setSavingWishes] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const [firstName, setFirstName] = useState('')
  const [wish, setWish] = useState('')
  const [secondaryWish, setSecondaryWish] = useState('')

  const email = user?.email ?? ''

  useEffect(() => {
    let alive = true

    ;(async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, wish, secondary_wish')
        .eq('id', user.id)
        .maybeSingle()

      if (!alive) return

      if (profileError) {
        setError(profileError.message)
      } else {
        setFirstName(data?.first_name ?? '')
        setWish(data?.wish ?? '')
        setSecondaryWish(data?.secondary_wish ?? '')
      }

      setLoading(false)
    })()

    return () => {
      alive = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const savePersonalInfo = async () => {
    if (!user?.id) return
    setError('')
    setSavingProfile(true)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ first_name: firstName.trim() })
      .eq('id', user.id)

    setSavingProfile(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setToast('Profil mis à jour.')
  }

  const saveWishes = async () => {
    if (!user?.id) return
    setError('')
    setSavingWishes(true)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wish: wish.trim(), secondary_wish: secondaryWish.trim() })
      .eq('id', user.id)

    setSavingWishes(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setToast('Souhaits mis à jour.')
  }

  const sendReset = async () => {
    if (!email) return
    setError('')
    setSendingReset(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setSendingReset(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setToast('Email de réinitialisation envoyé')
  }

  const confirmDeletionRequest = () => {
    setShowDeleteModal(false)
    setDeleteConfirm('')
    setToast('Ta demande de suppression a été envoyée. Notre équipe traitera ta demande dans les 30 jours.')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">
        Chargement du compte...
      </div>
    )
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(13,31,56,0.96)_0%,rgba(13,31,56,0.82)_100%)] p-5 shadow-[0_30px_80px_rgba(2,12,27,0.45)] backdrop-blur-xl sm:p-8">
          <DashboardHeader
            firstName={firstName.trim() || user?.email?.split('@')[0] || 'Profil'}
            onLogout={handleLogout}
            activeTab="settings"
          />

          <div className="mx-auto mt-8 max-w-[720px]">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Mon compte</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Gère ton profil et tes préférences</p>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-950/25 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            {toast ? (
              <p className="mt-4 rounded-xl border border-blue-500/30 bg-blue-600/15 px-4 py-3 text-sm text-blue-100">
                {toast}
              </p>
            ) : null}

            <div className="mt-6 space-y-4">
              <section className={cardClass}>
                <h2 className="text-lg font-medium text-[#e8edf5]">Informations personnelles</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className={labelClass}>Prénom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" value={email} readOnly className={`${inputClass} opacity-80`} />
                  </div>
                  <button
                    type="button"
                    onClick={savePersonalInfo}
                    disabled={savingProfile}
                    className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </section>

              <section className={cardClass}>
                <h2 className="text-lg font-medium text-[#e8edf5]">Mes souhaits</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className={labelClass}>Souhait principal</label>
                    <textarea
                      rows={3}
                      value={wish}
                      onChange={(e) => setWish(e.target.value)}
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Souhait secondaire</label>
                    <textarea
                      rows={3}
                      value={secondaryWish}
                      onChange={(e) => setSecondaryWish(e.target.value)}
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveWishes}
                    disabled={savingWishes}
                    className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingWishes ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </section>

              <section className={cardClass}>
                <h2 className="text-lg font-medium text-[#e8edf5]">Sécurité</h2>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={sendReset}
                    disabled={sendingReset || !email}
                    className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sendingReset ? 'Envoi...' : 'Changer mon mot de passe'}
                  </button>
                </div>
              </section>

              <section className={cardClass}>
                <h2 className="text-lg font-medium text-[#ef4444]">Zone dangereuse</h2>
                <p className="mt-4 text-sm leading-relaxed text-[#c8d6e8]">
                  La suppression de ton compte est irréversible. Toutes tes données (entrées de journal, conversations
                  avec le coach, progression) seront définitivement effacées.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-xl border border-[#ef4444] bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0d1f38] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <h3 className="text-lg font-semibold text-[#e8edf5]">Es-tu sûr ? Cette action est irréversible.</h3>
            <p className="mt-3 text-sm text-[#c8d6e8]">
              Tape exactement <strong className="text-white">SUPPRIMER</strong> pour confirmer.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className={`${inputClass} mt-4`}
              placeholder="SUPPRIMER"
            />
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirm('')
                }}
                className="rounded-xl border border-blue-500/30 px-4 py-2 text-sm text-blue-100 transition hover:bg-blue-600/15"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteConfirm !== 'SUPPRIMER'}
                onClick={confirmDeletionRequest}
                className="rounded-xl border border-[#ef4444] bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
