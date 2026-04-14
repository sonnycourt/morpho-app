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

  let payload: { user_id?: string }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400)
  }
  const targetUserId = payload.user_id?.trim()
  if (!targetUserId) return jsonResponse({ error: 'user_id is required' }, 400)

  const admin = createClient(supabaseUrl, supabaseServiceKey)
  const [pRes, eRes, mRes, hRes, sRes, meRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, email, first_name, age_range, gender, country, discovery_source, onboarding_completed, wish, secondary_wish, created_at')
      .eq('id', targetUserId)
      .maybeSingle(),
    admin
      .from('entries')
      .select('user_id, entry_date, created_at, desired_state, intention, gratitude, reflection, synchronicity, alignment_score')
      .eq('user_id', targetUserId)
      .order('entry_date', { ascending: false }),
    admin
      .from('user_memory')
      .select('user_id, summary, key_patterns, wins, struggles, timeline_markers, last_updated_at')
      .eq('user_id', targetUserId)
      .maybeSingle(),
    admin
      .from('memory_compression_history')
      .select(
        'id, user_id, milestone_entries, window_start, window_end, entries_in_window, status, skip_reason, error_message, input_tokens, output_tokens, cost_cents, created_at',
      )
      .eq('user_id', targetUserId)
      .order('milestone_entries', { ascending: false }),
    admin
      .from('memory_snapshots')
      .select(
        'id, user_id, milestone_entries, summary, key_patterns, wins, struggles, timeline_markers, source, created_at',
      )
      .eq('user_id', targetUserId)
      .order('milestone_entries', { ascending: false }),
    admin
      .from('memory_events')
      .select('id, user_id, event_date, event_type, event_text, source, confidence, created_at')
      .eq('user_id', targetUserId)
      .order('event_date', { ascending: false }),
  ])

  if (pRes.error) return jsonResponse({ error: pRes.error.message }, 500)
  if (eRes.error) return jsonResponse({ error: eRes.error.message }, 500)
  if (mRes.error) return jsonResponse({ error: mRes.error.message }, 500)
  if (hRes.error) return jsonResponse({ error: hRes.error.message }, 500)
  if (sRes.error) return jsonResponse({ error: sRes.error.message }, 500)
  if (meRes.error) return jsonResponse({ error: meRes.error.message }, 500)

  return jsonResponse({
    profile: pRes.data ?? null,
    entries: eRes.data ?? [],
    memory: mRes.data ?? null,
    compression_history: hRes.data ?? [],
    memory_snapshots: sRes.data ?? [],
    memory_events: meRes.data ?? [],
  })
})
