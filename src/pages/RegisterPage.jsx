import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

async function checkMailerLiteAccess(email) {
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-mailerlite-access`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email }),
  })
  const payload = await res.json().catch(() => ({}))
  return { ok: res.ok, ...payload }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [legalError, setLegalError] = useState('')

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLegalError('')

    if (!acceptedLegal) {
      setLegalError('Tu dois accepter les conditions pour créer un compte.')
      return
    }

    setLoading(true)

    const accessCheck = await checkMailerLiteAccess(email)
    if (!accessCheck.ok) {
      setLoading(false)
      setError(
        accessCheck?.message ||
          "Verification d'acces impossible pour le moment. Reessaie dans quelques instants.",
      )
      return
    }

    if (!accessCheck.allowed) {
      setLoading(false)
      setError(
        "Morpho est reserve aux inscrits d'Esprit Subconscient 2.0. Utilise l'email de ton inscription.",
      )
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    const userId = signUpData.user?.id
    const hasSession = Boolean(signUpData.session)
    if (userId && hasSession) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle()
      navigate(profile?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true })
      return
    }

    setMessage('Compte cree. Verifie ton email pour confirmer ton inscription.')
  }

  return (
    <AuthLayout
      title="Inscription"
      subtitle="Cree ton compte en moins d'une minute."
      footer={
        <div>
          Deja inscrit ?{' '}
          <Link to="/login" className="text-blue-300 hover:text-blue-200">
            Se connecter
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm text-slate-200">
          Prenom
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-600/40 bg-slate-900/45 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
          />
        </label>

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

        <label className="block text-sm text-slate-200">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border border-slate-600/40 bg-slate-900/45 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
          />
        </label>

        <div>
          <label className="flex items-start gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(event) => {
                setAcceptedLegal(event.target.checked)
                setLegalError('')
              }}
              className="mt-0.5 h-[18px] w-[18px] rounded-[4px] border border-blue-500/45 bg-slate-900/45 accent-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <span>
              J'accepte les{' '}
              <Link to="/cgu" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200">
                conditions générales d'utilisation
              </Link>{' '}
              et la{' '}
              <Link
                to="/confidentialite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200"
              >
                politique de confidentialité
              </Link>{' '}
              de Morpho.
            </span>
          </label>
          {legalError ? <p className="mt-2 text-sm text-red-300">{legalError}</p> : null}
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

        <button
          type="submit"
          disabled={loading || !acceptedLegal}
          className="w-full rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creation...' : 'Creer mon compte'}
        </button>
      </form>
    </AuthLayout>
  )
}
