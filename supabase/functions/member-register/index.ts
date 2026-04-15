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

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function parseGroupIds() {
  const multiple = (Deno.env.get('MAILERLITE_GROUP_IDS') ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  const single = (Deno.env.get('MAILERLITE_GROUP_ID') ?? '').trim()
  const all = single ? [single, ...multiple] : multiple
  return Array.from(new Set(all.map((x) => String(x))))
}

async function checkWithConnectApi(email: string, apiKey: string, allowedGroupIds: string[]) {
  const endpoint = `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })

  if (res.status === 404) return { allowed: false, reason: 'NOT_FOUND' }
  if (!res.ok) return { allowed: false, reason: 'CONNECT_API_ERROR' }

  const payload = (await res.json().catch(() => ({}))) as {
    data?: { groups?: Array<{ id?: string | number }> }
  }
  const groups = payload?.data?.groups ?? []
  const groupSet = new Set(groups.map((g) => String(g?.id ?? '')))
  const matched = allowedGroupIds.some((id) => groupSet.has(String(id)))

  return { allowed: matched, reason: matched ? 'ALLOWED' : 'NOT_IN_ALLOWED_GROUP' }
}

async function checkWithClassicApi(email: string, apiKey: string, allowedGroupIds: string[]) {
  const endpoint = `https://api.mailerlite.com/api/v2/subscribers/${encodeURIComponent(email)}/groups`
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-MailerLite-ApiKey': apiKey,
      Accept: 'application/json',
    },
  })

  if (res.status === 404) return { allowed: false, reason: 'NOT_FOUND' }
  if (!res.ok) return { allowed: false, reason: 'CLASSIC_API_ERROR' }

  const groups = (await res.json().catch(() => [])) as Array<{ id?: number | string }>
  const groupSet = new Set((groups ?? []).map((g) => String(g?.id ?? '')))
  const matched = allowedGroupIds.some((id) => groupSet.has(String(id)))

  return { allowed: matched, reason: matched ? 'ALLOWED' : 'NOT_IN_ALLOWED_GROUP' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const mailerLiteApiKey = (Deno.env.get('MAILERLITE_API_KEY') ?? '').trim()
  const allowedGroupIds = parseGroupIds()
  const apiKind = (Deno.env.get('MAILERLITE_API_KIND') ?? 'auto').trim().toLowerCase()

  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: 'Missing Supabase secrets' }, 500)
  if (!mailerLiteApiKey || !allowedGroupIds.length) {
    return jsonResponse({ error: 'Configuration MailerLite manquante.' }, 500)
  }

  let payload: { email?: string; password?: string; first_name?: string }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Payload invalide.' }, 400)
  }

  const email = normalizeEmail(payload?.email)
  const password = String(payload?.password ?? '')
  const firstName = String(payload?.first_name ?? '').trim()

  if (!isValidEmail(email)) return jsonResponse({ error: 'Email invalide.' }, 400)
  if (password.length < 6) return jsonResponse({ error: 'Mot de passe trop court.' }, 400)

  const checks: Promise<{ allowed: boolean; reason: string }>[] = []
  if (apiKind === 'connect') checks.push(checkWithConnectApi(email, mailerLiteApiKey, allowedGroupIds))
  else if (apiKind === 'classic') checks.push(checkWithClassicApi(email, mailerLiteApiKey, allowedGroupIds))
  else {
    checks.push(checkWithConnectApi(email, mailerLiteApiKey, allowedGroupIds))
    checks.push(checkWithClassicApi(email, mailerLiteApiKey, allowedGroupIds))
  }

  let allowed = false
  let notMember = false
  for (const check of checks) {
    const result = await check
    if (result.allowed) {
      allowed = true
      break
    }
    if (result.reason === 'NOT_FOUND' || result.reason === 'NOT_IN_ALLOWED_GROUP') {
      notMember = true
      break
    }
  }

  if (!allowed) {
    if (notMember) {
      return jsonResponse(
        { error: "Morpho est reserve aux inscrits d'Esprit Subconscient 2.0. Utilise l'email de ton inscription." },
        403,
      )
    }
    return jsonResponse({ error: 'Verification d\'acces impossible pour le moment. Reessaie dans quelques instants.' }, 502)
  }

  const admin = createClient(supabaseUrl, serviceKey)

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return jsonResponse({ error: 'Un compte existe deja avec cet email.' }, 409)
    }
    return jsonResponse({ error: error.message }, 400)
  }

  return jsonResponse({ ok: true, user_id: data.user?.id ?? null })
})
