import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { supabase } from '../lib/supabaseClient'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const detectRecovery = async () => {
      const { data } = await supabase.auth.getSession()
      setIsRecoveryMode(Boolean(data.session))
    }

    detectRecovery()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true)
      }

      if (!session && event === 'SIGNED_OUT') {
        setIsRecoveryMode(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const sendResetEmail = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setMessage('Email envoye. Ouvre le lien recu pour definir un nouveau mot de passe.')
  }

  const updatePassword = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage('Mot de passe mis a jour. Tu peux maintenant te connecter.')
  }

  return (
    <AuthLayout
      title="Reinitialiser le mot de passe"
      subtitle="Choisis le flux adapte a ta situation."
      footer={
        <Link to="/login" className="text-blue-300 hover:text-blue-200">
          Retour a la connexion
        </Link>
      }
    >
      {isRecoveryMode ? (
        <form className="space-y-4" onSubmit={updatePassword}>
          <label className="block text-sm text-slate-200">
            Nouveau mot de passe
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-slate-600/40 bg-slate-900/45 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Mise a jour...' : 'Mettre a jour'}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={sendResetEmail}>
          <label className="block text-sm text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-600/40 bg-slate-900/45 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
