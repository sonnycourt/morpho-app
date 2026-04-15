import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    const userId = signInData.user?.id
    if (!userId) {
      navigate('/dashboard', { replace: true })
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle()

    navigate(profile?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true })
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Bienvenue. Accede a ton espace personnel."
      showHomeBack
      footer={
        <div className="flex items-center justify-between">
          <Link to="/register" className="text-blue-300 hover:text-blue-200">
            Creer un compte
          </Link>
          <Link to="/reset-password" className="text-blue-300 hover:text-blue-200">
            Mot de passe oublie
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
            className="mt-1 w-full rounded-xl border border-slate-600/40 bg-slate-900/45 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
          />
        </label>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </AuthLayout>
  )
}
