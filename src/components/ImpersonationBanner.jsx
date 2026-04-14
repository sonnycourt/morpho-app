import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

const IMPERSONATION_KEY = 'morpho_impersonation_context'

function readContext() {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

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

export default function ImpersonationBanner() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ctx = readContext()

  if (!ctx || !user || user.id === ctx.adminUserId) return null

  const backToAdmin = async () => {
    setBusy(true)
    setError('')

    // Log impersonation_end using the admin token from context before restoring
    if (ctx.adminAccessToken) {
      const startedAt = ctx.startedAt ? new Date(ctx.startedAt) : null
      const durationSeconds = startedAt ? Math.round((Date.now() - startedAt.getTime()) / 1000) : null
      await writeAuditLog(ctx.adminAccessToken, 'impersonation_end', user.id, {
        target_email: user.email ?? '',
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
    }

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: ctx.adminAccessToken,
      refresh_token: ctx.adminRefreshToken,
    })
    setBusy(false)

    if (setSessionError) {
      setError("Impossible de restaurer la session admin. Reconnecte-toi avec ton compte admin.")
      return
    }

    localStorage.removeItem(IMPERSONATION_KEY)
    navigate('/admin', { replace: true })
  }

  return (
    <div className="sticky top-0 z-[70] border-b border-amber-400/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-100 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2">
        <p>
          Mode impersonation actif: vous etes connecte en tant que <span className="font-semibold">{user.email || user.id}</span>.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={backToAdmin}
            disabled={busy}
            className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-[#11243d] transition hover:brightness-95 disabled:opacity-60"
          >
            {busy ? 'Retour...' : 'Revenir a mon compte admin'}
          </button>
        </div>
      </div>
      {error ? <p className="mx-auto mt-2 max-w-[1280px] text-xs text-rose-200">{error}</p> : null}
    </div>
  )
}
