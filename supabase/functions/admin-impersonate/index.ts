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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return jsonResponse({ error: 'Missing function secrets' }, 500)
  }

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return jsonResponse({ error: 'Invalid Authorization header' }, 401)
  }

  // Validate caller session manually.
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
  const {
    data: { user: authUser },
    error: authError,
  } = await userClient.auth.getUser()
  if (authError || !authUser) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }
  const authEmail = String(authUser.email ?? '').toLowerCase()

  // Keep server-side guard for impersonation rights.
  if (authEmail !== 'sonnycourt@gmail.com') {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  let payload: { target_user_id?: string; redirect_to?: string }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400)
  }

  const targetUserId = payload.target_user_id?.trim()
  const redirectTo = payload.redirect_to?.trim()

  if (!targetUserId) {
    return jsonResponse({ error: 'target_user_id is required' }, 400)
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: targetProfile, error: targetProfileError } = await admin
    .from('profiles')
    .select('id, email')
    .eq('id', targetUserId)
    .maybeSingle()

  if (targetProfileError || !targetProfile?.email) {
    return jsonResponse({ error: 'Target user not found' }, 404)
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetProfile.email,
    options: {
      redirectTo: redirectTo || undefined,
    },
  })

  if (linkError) {
    return jsonResponse({ error: linkError.message }, 500)
  }

  const actionLink = linkData?.properties?.action_link
  if (!actionLink) {
    return jsonResponse({ error: 'Failed to create impersonation link' }, 500)
  }

  return jsonResponse({
    action_link: actionLink,
    target_user_id: targetProfile.id,
    target_email: targetProfile.email,
  })
})
