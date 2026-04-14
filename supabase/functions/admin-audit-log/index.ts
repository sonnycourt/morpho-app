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
    action?: string
    target_user_id?: string
    actor_id?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }
  try {
    payload = (await req.json()) as typeof payload
  } catch {
    payload = {}
  }

  const pageLimit = Math.min(Number(payload.limit ?? 100), 200)
  const pageOffset = Number(payload.offset ?? 0)

  const admin = createClient(supabaseUrl, supabaseServiceKey)

  let query = admin
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('occurred_at', { ascending: false })
    .range(pageOffset, pageOffset + pageLimit - 1)

  if (payload.action) query = query.eq('action', payload.action)
  if (payload.target_user_id) query = query.eq('target_user_id', payload.target_user_id)
  if (payload.actor_id) query = query.eq('actor_id', payload.actor_id)
  if (payload.date_from) query = query.gte('occurred_at', payload.date_from)
  if (payload.date_to) {
    // Include the full end day
    const endOfDay = new Date(payload.date_to)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte('occurred_at', endOfDay.toISOString())
  }

  const { data, error, count } = await query
  if (error) return jsonResponse({ error: error.message }, 500)

  return jsonResponse({
    logs: data ?? [],
    total: count ?? 0,
    limit: pageLimit,
    offset: pageOffset,
  })
})
