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
  const [historyRes, profilesRes, snapshotsRes, currentMemoryRes] = await Promise.all([
    admin
      .from('memory_compression_history')
      .select(
        'id, user_id, milestone_entries, window_start, window_end, entries_in_window, status, skip_reason, error_message, input_tokens, output_tokens, cost_cents, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(1000),
    admin.from('profiles').select('id, email'),
    admin
      .from('memory_snapshots')
      .select(
        'id, user_id, milestone_entries, summary, key_patterns, wins, struggles, timeline_markers, source, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(2000),
    admin
      .from('user_memory')
      .select('user_id, summary, key_patterns, wins, struggles, timeline_markers, last_updated_at'),
  ])

  if (historyRes.error) return jsonResponse({ error: historyRes.error.message }, 500)
  if (profilesRes.error) return jsonResponse({ error: profilesRes.error.message }, 500)
  if (snapshotsRes.error) return jsonResponse({ error: snapshotsRes.error.message }, 500)
  if (currentMemoryRes.error) return jsonResponse({ error: currentMemoryRes.error.message }, 500)

  return jsonResponse({
    history: historyRes.data ?? [],
    profiles: profilesRes.data ?? [],
    snapshots: snapshotsRes.data ?? [],
    current_memory: currentMemoryRes.data ?? [],
  })
})
