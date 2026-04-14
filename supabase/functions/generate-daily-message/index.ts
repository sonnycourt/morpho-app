import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOTAL_COST_LIMIT_CENTS = 5000
const DEFAULT_NEUTRAL_MESSAGE = "Prends un moment pour toi aujourd'hui."
const DEFAULT_ONBOARDING_MESSAGE = 'Prends un moment pour écrire ta première entrée.'
const DAILY_SYSTEM_PROMPT = `Tu génères une phrase personnelle pour un utilisateur de Morpho, une application de transformation personnelle inspirée de la sagesse de Neville Goddard. Cette phrase apparaît sur son dashboard, sous "Bienvenue [prénom]".

Le but principal de cette phrase est le RENFORCEMENT POSITIF et l'ENCOURAGEMENT. Tu dois honorer le parcours de l'utilisateur, reconnaître ses efforts, et l'encourager à continuer — sans jamais tomber dans la flatterie creuse.

Règles strictes :
- Maximum 20 mots
- Ton doux, ancré, encourageant — jamais lyrique ni mystique
- Fait référence à QUELQUE CHOSE de précis dans ses 3 dernières entrées (une intention, un état, un mot qui revient, une victoire subtile, un pattern)
- Ne cite pas littéralement ses mots — reformule avec douceur
- Pas de citation inspirante générique type "Tu es plus fort que tu ne le crois" — c'est interdit
- Pas de point d'exclamation
- Tutoiement obligatoire
- Une seule phrase
- Ne commence jamais par "Bonjour" ni "Bienvenue"
- Privilégie les phrases qui révèlent un pattern positif, honorent une progression, ou encouragent à continuer sur la lancée

Exemples du ton à viser :
- "Trois jours que tu portes l'intention de discipline tranquille. Elle commence à s'installer."
- "Hier tu notais que l'anxiété était moins forte. C'est déjà un changement."
- "Tu as parlé de gratitude chaque jour cette semaine. Ce n'est pas rien."
- "Ton alignement monte doucement depuis trois jours. Continue d'écouter ce qui t'élève."
- "Tu reviens chaque jour. C'est déjà la moitié du chemin."

Tu retournes UNIQUEMENT la phrase. Rien d'autre. Pas de guillemets, pas de préambule.`

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function toYmd(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function formatEntries(
  entries: Array<{
    entry_date: string
    desired_state: string | null
    intention: string | null
    gratitude: string | null
    reflection: string | null
    synchronicity: string | null
    alignment_score: number | null
  }>,
) {
  return entries
    .map((e) => {
      return `Date: ${e.entry_date}
Comment je me sens: ${e.desired_state ?? ''}
Intention du jour: ${e.intention ?? ''}
Ma gratitude: ${e.gratitude ?? ''}
${e.reflection ? `Ce que je remarque: ${e.reflection}` : ''}
${e.synchronicity ? `Synchronicité: ${e.synchronicity}` : ''}
Alignement: ${e.alignment_score ?? ''}/10`
    })
    .join('\n---\n')
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
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
  const deepseekModel = Deno.env.get('DEEPSEEK_MODEL') ?? 'deepseek-chat'

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !deepseekApiKey) {
    return jsonResponse({ error: 'Missing function secrets' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
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

  const admin = createClient(supabaseUrl, supabaseServiceKey)

  let payload: { user_id?: string }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400)
  }

  const userId = payload.user_id?.trim()
  if (!userId) return jsonResponse({ error: 'user_id is required' }, 400)
  if (userId !== authUser.id) return jsonResponse({ error: 'Forbidden user_id mismatch' }, 403)

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select(
      'id, wish, secondary_wish, ai_blocked, total_ai_cost_cents, daily_message, daily_message_date',
    )
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile) {
    return jsonResponse({ error: 'Profile not found' }, 404)
  }

  const today = toYmd()
  const currentCost = Number(profile.total_ai_cost_cents ?? 0)

  if (profile.ai_blocked || currentCost >= TOTAL_COST_LIMIT_CENTS) {
    return jsonResponse({ message: DEFAULT_NEUTRAL_MESSAGE, cached: true, fallback: true })
  }

  if (profile.daily_message_date === today && String(profile.daily_message ?? '').trim()) {
    return jsonResponse({ message: String(profile.daily_message), cached: true })
  }

  const [{ data: entries }, { data: memory }] = await Promise.all([
    admin
      .from('entries')
      .select(
        'entry_date, desired_state, intention, gratitude, reflection, synchronicity, alignment_score',
      )
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(3),
    admin.from('user_memory').select('summary').eq('user_id', userId).maybeSingle(),
  ])

  const recentEntries = entries ?? []

  if (!recentEntries.length) {
    await admin
      .from('profiles')
      .update({
        daily_message: DEFAULT_ONBOARDING_MESSAGE,
        daily_message_date: today,
      })
      .eq('id', userId)

    return jsonResponse({ message: DEFAULT_ONBOARDING_MESSAGE, cached: false, onboarding: true })
  }

  const memorySummary = String(memory?.summary ?? '').trim()
  const userPrompt = `Souhait principal: ${profile.wish ?? 'non défini'}
Souhait secondaire: ${profile.secondary_wish ?? 'non défini'}

Mémoire synthétique: ${memorySummary || "aucune mémoire pour l'instant"}

3 dernières entrées de journal (de la plus récente à la plus ancienne):

${formatEntries(recentEntries)}

Génère la phrase de renforcement positif pour aujourd'hui.`

  const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: deepseekModel,
      messages: [
        { role: 'system', content: DAILY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.8,
    }),
  })

  if (!deepseekRes.ok) {
    const errorText = await deepseekRes.text()
    return jsonResponse({ error: `DeepSeek error: ${errorText}` }, 502)
  }

  const deepseekJson = (await deepseekRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }

  const message = deepseekJson.choices?.[0]?.message?.content?.trim()
  if (!message) {
    return jsonResponse({ error: 'Empty daily message response' }, 502)
  }

  const inputTokens = Number(deepseekJson.usage?.prompt_tokens ?? 0)
  const outputTokens = Number(deepseekJson.usage?.completion_tokens ?? 0)
  const costCents = Math.round((inputTokens * 0.000027 + outputTokens * 0.00011) * 100)
  const newTotalCost = currentCost + costCents

  await admin
    .from('profiles')
    .update({
      daily_message: message,
      daily_message_date: today,
      total_ai_cost_cents: newTotalCost,
      ai_blocked: newTotalCost >= TOTAL_COST_LIMIT_CENTS,
    })
    .eq('id', userId)

  return jsonResponse({
    message,
    cached: false,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: costCents,
      total_ai_cost_cents: newTotalCost,
    },
  })
})
