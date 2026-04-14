import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const VALID_ACTIONS = [
  'admin_data_view',
  'impersonation_start',
  'impersonation_end',
  'bulk_delete_blocked',
] as const

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return jsonResponse({ error: 'Missing function secrets' }, 500)
  }

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401)
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return jsonResponse({ error: 'Invalid Authorization header' }, 401)

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser()
  if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401)
  if ((user.email ?? '').toLowerCase() !== 'sonnycourt@gmail.com') {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  let payload: {
    action: string
    target_user_id?: string
    target_email?: string
    metadata?: Record<string, unknown>
  }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400)
  }

  if (!payload.action || !VALID_ACTIONS.includes(payload.action as (typeof VALID_ACTIONS)[number])) {
    return jsonResponse(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      400,
    )
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey)

  const { error: insertError } = await admin.from('audit_log').insert({
    actor_id: user.id,
    actor_email: user.email ?? '',
    action: payload.action,
    target_user_id: payload.target_user_id ?? null,
    target_table: null,
    target_row_id: null,
    metadata: {
      ...(payload.metadata ?? {}),
      ...(payload.target_email ? { target_email: payload.target_email } : {}),
    },
  })

  if (insertError) return jsonResponse({ error: insertError.message }, 500)

  return jsonResponse({ ok: true })
})
