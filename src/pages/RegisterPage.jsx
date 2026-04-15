import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function registerMember({ email, password, firstName }) {
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/member-register`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
    }),
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
  const [loadingStep, setLoadingStep] = useState('')
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
    setLoadingStep("Verification de ton acces membre Esprit Subconscient 2.0...")

    const enforcedUiDelayMs = 3000 + Math.floor(Math.random() * 2000)
    const [createRes] = await Promise.all([
      registerMember({ email, password, firstName }),
      sleep(enforcedUiDelayMs),
    ])
    if (!createRes.ok) {
      setLoading(false)
      setLoadingStep('')
      setError(
        createRes?.error ||
          "Verification d'acces impossible pour le moment. Reessaie dans quelques instants.",
      )
      return
    }
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoadingStep('Acces valide. Ouverture de ton espace...')
    setLoading(false)
    setLoadingStep('')

    if (!signInError && signInData?.session && signInData?.user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', signInData.user.id)
        .maybeSingle()
      navigate(profile?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true })
      return
    }

    setError("Inscription creee mais connexion impossible. Reessaie de te connecter depuis l'ecran login.")
  }

  return (
    <AuthLayout
      title="Inscription"
      subtitle="Cree ton compte en moins d'une minute."
      showHomeBack
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
        {loadingStep ? (
          <div className="rounded-xl border border-blue-400/30 bg-[linear-gradient(180deg,rgba(59,130,246,0.18)_0%,rgba(30,64,175,0.10)_100%)] px-3 py-2.5 text-xs text-blue-100">
            <div className="flex items-center justify-between gap-3">
              <p>{loadingStep}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-200" />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-200"
                  style={{ animationDelay: '120ms' }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-200"
                  style={{ animationDelay: '240ms' }}
                />
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-950/50">
              <div className="h-full w-full animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(147,197,253,0.25),rgba(59,130,246,0.8),rgba(147,197,253,0.25))]" />
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !acceptedLegal}
          className="w-full rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Verification en cours...' : 'Creer mon compte'}
        </button>
      </form>
    </AuthLayout>
  )
}
