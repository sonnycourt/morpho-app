import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import ImpersonationBanner from './ImpersonationBanner'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  const prevUserIdRef = useRef(undefined)

  useEffect(() => {
    let cancelled = false
    const uid = user?.id

    if (!uid) return

    const isNewUser = prevUserIdRef.current !== uid
    prevUserIdRef.current = uid

    ;(async () => {
      if (isNewUser) {
        await new Promise((r) => { setTimeout(r, 0) })
        if (cancelled) return
        setCheckingOnboarding(true)
        setOnboardingCompleted(false)
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', uid)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setOnboardingCompleted(false)
      } else {
        setOnboardingCompleted(Boolean(data?.onboarding_completed))
      }
      setCheckingOnboarding(false)
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, location.pathname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-300">
        Chargement...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (checkingOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-300">
        Chargement...
      </div>
    )
  }

  if (location.state?.skipOnboardingCheck) {
    return <Outlet />
  }

  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <ImpersonationBanner />
      <Outlet />
    </>
  )
}
