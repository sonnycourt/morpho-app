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

  const admin = createClient(supabaseUrl, supabaseServiceKey)
  const [pRes, eRes, mRes] = await Promise.all([
    admin
      .from('profiles')
      .select(
        'id, email, first_name, age_range, gender, country, discovery_source, onboarding_completed, wish, secondary_wish, created_at',
      )
      .order('created_at', { ascending: false }),
    admin
      .from('entries')
      .select(
        'user_id, entry_date, created_at, desired_state, intention, gratitude, reflection, synchronicity, alignment_score',
      )
      .order('entry_date', { ascending: false }),
    admin.from('user_memory').select('user_id, summary, key_patterns'),
  ])

  if (pRes.error) return jsonResponse({ error: pRes.error.message }, 500)
  if (eRes.error) return jsonResponse({ error: eRes.error.message }, 500)
  if (mRes.error) return jsonResponse({ error: mRes.error.message }, 500)

  return jsonResponse({
    profiles: pRes.data ?? [],
    entries: eRes.data ?? [],
    memories: mRes.data ?? [],
  })
})
