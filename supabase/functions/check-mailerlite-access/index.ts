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
  return String(value ?? '')
    .trim()
    .toLowerCase()
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

type AccessResult = {
  allowed: boolean
  reason: string
  details?: string
}

async function checkWithConnectApi(
  email: string,
  apiKey: string,
  allowedGroupIds: string[],
): Promise<AccessResult> {
  const endpoint = `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })

  if (res.status === 404) {
    return { allowed: false, reason: 'NOT_FOUND' }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      allowed: false,
      reason: 'CONNECT_API_ERROR',
      details: text || `HTTP_${res.status}`,
    }
  }

  const payload = (await res.json().catch(() => ({}))) as {
    data?: { groups?: Array<{ id?: string | number }> }
  }
  const groups = payload?.data?.groups ?? []
  const groupSet = new Set(groups.map((g) => String(g?.id ?? '')))
  const matched = allowedGroupIds.some((id) => groupSet.has(String(id)))

  return { allowed: matched, reason: matched ? 'ALLOWED' : 'NOT_IN_ALLOWED_GROUP' }
}

async function checkWithClassicApi(
  email: string,
  apiKey: string,
  allowedGroupIds: string[],
): Promise<AccessResult> {
  const endpoint = `https://api.mailerlite.com/api/v2/subscribers/${encodeURIComponent(email)}/groups`
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-MailerLite-ApiKey': apiKey,
      Accept: 'application/json',
    },
  })

  if (res.status === 404) {
    return { allowed: false, reason: 'NOT_FOUND' }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      allowed: false,
      reason: 'CLASSIC_API_ERROR',
      details: text || `HTTP_${res.status}`,
    }
  }

  const groups = (await res.json().catch(() => [])) as Array<{ id?: number | string }>
  const groupSet = new Set((groups ?? []).map((g) => String(g?.id ?? '')))
  const matched = allowedGroupIds.some((id) => groupSet.has(String(id)))

  return { allowed: matched, reason: matched ? 'ALLOWED' : 'NOT_IN_ALLOWED_GROUP' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const apiKey = (Deno.env.get('MAILERLITE_API_KEY') ?? '').trim()
  const allowedGroupIds = parseGroupIds()
  const apiKind = (Deno.env.get('MAILERLITE_API_KIND') ?? 'auto').trim().toLowerCase()

  if (!apiKey || !allowedGroupIds.length) {
    return jsonResponse(
      {
        allowed: false,
        reason: 'CONFIG_ERROR',
        message: 'Configuration MailerLite manquante.',
        error:
          'Missing MAILERLITE_API_KEY or MAILERLITE_GROUP_ID/MAILERLITE_GROUP_IDS function secrets.',
      },
      500,
    )
  }

  let payload: { email?: string }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ allowed: false, reason: 'INVALID_JSON' }, 400)
  }

  const email = normalizeEmail(payload?.email)
  if (!email || !isValidEmail(email)) {
    return jsonResponse({ allowed: false, reason: 'INVALID_EMAIL' }, 400)
  }

  try {
    const checks: Array<Promise<AccessResult>> = []
    if (apiKind === 'connect') {
      checks.push(checkWithConnectApi(email, apiKey, allowedGroupIds))
    } else if (apiKind === 'classic') {
      checks.push(checkWithClassicApi(email, apiKey, allowedGroupIds))
    } else {
      checks.push(checkWithConnectApi(email, apiKey, allowedGroupIds))
      checks.push(checkWithClassicApi(email, apiKey, allowedGroupIds))
    }

    let lastError: AccessResult | null = null

    for (const run of checks) {
      const result = await run

      if (result.allowed) {
        return jsonResponse({ allowed: true, reason: 'ALLOWED' })
      }

      if (result.reason === 'NOT_FOUND' || result.reason === 'NOT_IN_ALLOWED_GROUP') {
        return jsonResponse({
          allowed: false,
          reason: 'NOT_MEMBER',
          message: "Morpho est reserve aux membres d'Esprit Subconscient 2.0.",
        })
      }

      lastError = result
    }

    return jsonResponse(
      {
        allowed: false,
        reason: 'MAILERLITE_ERROR',
        message: 'Verification impossible pour le moment. Reessaie dans quelques instants.',
        details: lastError?.reason,
      },
      502,
    )
  } catch (error) {
    return jsonResponse(
      {
        allowed: false,
        reason: 'MAILERLITE_REQUEST_FAILED',
        message: 'Verification impossible pour le moment. Reessaie dans quelques instants.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      502,
    )
  }
})
