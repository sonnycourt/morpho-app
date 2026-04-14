import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAILY_LIMIT = 10
const TOTAL_COST_LIMIT_CENTS = 5000
const HISTORY_CONTEXT_LIMIT = 40
const SYSTEM_LIMIT_MESSAGE =
  "Tu as atteint ta limite quotidienne avec ton coach. Reviens demain pour continuer la conversation. Cette pause est intentionnelle - elle te laisse le temps d'incarner ce qu'on a explore aujourd'hui."

const COACH_SYSTEM_PROMPT = `Tu es Coach Morpho, le coach IA de reprogrammation du subconscient et manifestation. Tu parles a un membre du programme Esprit Subconscient 2.0.

Tes principes fondamentaux :
- L'etat d'etre precede la manifestation. Tu ramenes toujours le membre a son etat d'etre.
- Ta boussole est de faire vivre le membre depuis l'etat deja accompli, pas de courir vers un manque.
- Tu parles avec douceur mais conviction. Tu ne flattes jamais. Tu ne minimises jamais.
- Tu te bases sur la memoire compressee du membre et son entree du jour pour personnaliser chaque echange.
- Tu fais reference a son passe avec des dates precises pour reveler sa progression. Exemple : "Il y a 6 semaines tu ecrivais X. Aujourd'hui tu ecris Y. Tu vois ce qui a change ?"
- Tu peux proposer des actions concretes UNIQUEMENT quand elles decoulent de l'etat accompli. Pas de conseils generiques. Toujours : "Depuis l'etat ou tu as deja X, qu'est-ce que tu fais maintenant ?"
- Tu peux inclure de courtes references neuroscientifiques (neuroplasticite, attention selective, prediction du cerveau, reconsolidation de la memoire) pour renforcer la comprehension, sans tomber dans un ton academique.
- Ces references restent breves (1 phrase max a la fois) et servent l'objectif principal: stabiliser l'etat interne du souhait deja realise.
- Tu tutoies. Tu es chaleureux mais jamais mielleux. Tu es honnete mais jamais brutal.
- Quand le prenom du membre est disponible, tu l'utilises naturellement pour t'adresser a lui.
- Tu n'appelles jamais le membre "Morpho" : Morpho est le nom de l'application, pas son prenom.
- Tu ne mentionnes jamais Neville Goddard, ni "la sagesse de Neville", ni "je suis la voix de Neville".
- Si on te demande "qui es-tu ?", tu reponds simplement que tu es Coach Morpho, le coach IA de reprogrammation du subconscient et manifestation.
- Tu reponds en texte simple uniquement: pas de markdown, pas de **gras**, pas de listes markdown.
- Maximum 200 mots par reponse. Tu vas a l'essentiel.

Ton role n'est pas de resoudre les problemes du membre. Ton role est de lui rappeler qu'il est deja la personne qu'il veut devenir, et que sa realite va s'aligner avec cet etat d'etre.`

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function formatEntries(entries: Array<Record<string, unknown>>) {
  if (!entries.length) return 'Aucune entree recente.'

  return entries
    .map((entry) => {
      const date = String(entry.entry_date ?? '')
      const desired = String(entry.desired_state ?? '')
      const intention = String(entry.intention ?? '')
      const gratitude = String(entry.gratitude ?? '')
      const reflection = String(entry.reflection ?? '')
      const synchronicity = String(entry.synchronicity ?? '')
      const score = String(entry.alignment_score ?? '')
      return `- ${date}
  etat_souhaite: ${desired}
  intention: ${intention}
  gratitude: ${gratitude}
  reflexion: ${reflection}
  synchronicite: ${synchronicity || '(vide)'}
  alignment_score: ${score}/10`
    })
    .join('\n')
}

function extractKeywords(text: string) {
  const stop = new Set([
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une',
    'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi', 'quand', 'dans', 'sur', 'pour', 'avec',
    'est', 'suis', 'es', 'au', 'aux', 'en', 'ce', 'cet', 'cette', 'ça', 'ca', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  ])
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 4 && !stop.has(w)),
    ),
  ).slice(0, 10)
}

function scoreEvent(eventText: string, keywords: string[], confidence: number, eventDate: string) {
  const text = String(eventText ?? '').toLowerCase()
  const hits = keywords.reduce((sum, k) => sum + (text.includes(k) ? 1 : 0), 0)
  const c = Number(confidence ?? 0)
  const d = new Date(eventDate || '1970-01-01').getTime()
  const recencyBonus = Number.isFinite(d) ? d / 1e14 : 0
  return hits * 10 + c * 5 + recencyBonus
}

function formatMemoryEvents(events: Array<Record<string, unknown>>) {
  if (!events.length) return 'Aucun evenement memoire pertinent trouve.'
  return events
    .map((e) => {
      const date = String(e.event_date ?? '')
      const type = String(e.event_type ?? '')
      const text = String(e.event_text ?? '')
      const confidence = Number(e.confidence ?? 0).toFixed(2)
      return `- ${date} [${type}] (confidence ${confidence}): ${text}`
    })
    .join('\n')
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

  let payload: { user_id?: string; message?: string }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400)
  }

  const userId = payload.user_id?.trim()
  const userMessage = payload.message?.trim()

  if (!userId || !userMessage) {
    return jsonResponse({ error: 'user_id and message are required' }, 400)
  }

  if (authUser.id !== userId) {
    return jsonResponse({ error: 'Forbidden user_id mismatch' }, 403)
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, first_name, wish, secondary_wish, total_ai_cost_cents, ai_blocked')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile) {
    return jsonResponse({ error: 'Profile not found' }, 404)
  }

  if (profile.ai_blocked) {
    return jsonResponse({ error: 'AI access blocked', code: 'AI_BLOCKED' }, 403)
  }

  const currentCost = Number(profile.total_ai_cost_cents ?? 0)
  if (currentCost >= TOTAL_COST_LIMIT_CENTS) {
    await admin.from('profiles').update({ ai_blocked: true }).eq('id', userId)
    return jsonResponse({ error: 'AI budget reached', code: 'AI_BUDGET_REACHED' }, 403)
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(todayStart.getDate() + 1)

  const { count: userMessagesToday, error: countError } = await admin
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', tomorrowStart.toISOString())

  if (countError) {
    return jsonResponse({ error: countError.message }, 500)
  }

  if ((userMessagesToday ?? 0) >= DAILY_LIMIT) {
    return jsonResponse({
      reply: SYSTEM_LIMIT_MESSAGE,
      role: 'system',
      daily_count: userMessagesToday ?? DAILY_LIMIT,
      daily_limit: DAILY_LIMIT,
      limited: true,
    })
  }

  const [{ data: memory }, { data: recentEntries }, { data: chatHistory }] = await Promise.all([
    admin
      .from('user_memory')
      .select('summary, key_patterns, wins, struggles, timeline_markers')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('entries')
      .select('entry_date, desired_state, intention, gratitude, reflection, synchronicity, alignment_score')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(3),
    admin
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_CONTEXT_LIMIT),
  ])

  const memoryBlock = {
    summary: memory?.summary ?? '',
    key_patterns: memory?.key_patterns ?? '',
    wins: memory?.wins ?? '',
    struggles: memory?.struggles ?? '',
    timeline_markers: memory?.timeline_markers ?? '',
  }

  const keywords = extractKeywords(userMessage)
  let relevantEvents: Array<Record<string, unknown>> = []
  if (keywords.length > 0) {
    const eventQuery = await admin
      .from('memory_events')
      .select('event_date, event_type, event_text, confidence, source')
      .eq('user_id', userId)
      .order('event_date', { ascending: false })
      .limit(150)
    const allEvents = eventQuery.data ?? []
    relevantEvents = allEvents
      .map((e) => ({
        ...e,
        _score: scoreEvent(String(e.event_text ?? ''), keywords, Number(e.confidence ?? 0), String(e.event_date ?? '')),
      }))
      .filter((e) => Number(e._score) > 0)
      .sort((a, b) => Number(b._score) - Number(a._score))
      .slice(0, 5)
  }

  const contextPrompt = `Contexte profil Morpho:
prenom_membre: ${profile.first_name ?? '(non defini)'}
wish_principal: ${profile.wish ?? '(non defini)'}
wish_secondaire: ${profile.secondary_wish ?? '(non defini)'}

memoire_compressee:
${JSON.stringify(memoryBlock, null, 2)}

3 dernieres entries:
${formatEntries(recentEntries ?? [])}

Evenements memoire pertinents:
${formatMemoryEvents(relevantEvents)}
`

  const deepseekMessages = [
    { role: 'system', content: COACH_SYSTEM_PROMPT },
    { role: 'system', content: contextPrompt },
    ...((chatHistory ?? [])
      .slice()
      .reverse()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })) as Array<{
      role: 'user' | 'assistant'
      content: string
    }>),
    { role: 'user', content: userMessage },
  ]

  const { error: storeUserError } = await admin.from('chat_messages').insert({
    user_id: userId,
    role: 'user',
    content: userMessage,
  })
  if (storeUserError) {
    return jsonResponse({ error: storeUserError.message }, 500)
  }

  const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: deepseekModel,
      messages: deepseekMessages,
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    }),
  })

  if (!deepseekRes.ok || !deepseekRes.body) {
    const errorText = await deepseekRes.text()
    return jsonResponse({ error: `DeepSeek error: ${errorText}` }, 502)
  }

  const sourceReader = deepseekRes.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = ''
      let sseBuffer = ''

      try {
        while (true) {
          const { done, value } = await sourceReader.read()
          if (done) break

          sseBuffer += decoder.decode(value, { stream: true })
          const lines = sseBuffer.split('\n')
          sseBuffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            const payload = trimmed.slice(6).trim()
            if (payload === '[DONE]') continue
            try {
              const parsed = JSON.parse(payload)
              const delta: string = parsed.choices?.[0]?.delta?.content ?? ''
              if (delta) {
                fullText += delta
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`),
                )
              }
            } catch { /* skip malformed */ }
          }
        }

        if (fullText) {
          await admin.from('chat_messages').insert({
            user_id: userId,
            role: 'assistant',
            content: fullText,
          })

          const estInputTokens = Math.ceil(
            deepseekMessages.reduce((s, m) => s + (m.content?.length ?? 0), 0) / 4,
          )
          const estOutputTokens = Math.ceil(fullText.length / 4)
          const costCents = Math.round(
            (estInputTokens * 0.000027 + estOutputTokens * 0.00011) * 100,
          )
          const newTotalCost = currentCost + costCents
          await admin
            .from('profiles')
            .update({
              total_ai_cost_cents: newTotalCost,
              ai_blocked: newTotalCost >= TOTAL_COST_LIMIT_CENTS,
            })
            .eq('id', userId)
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              daily_count: (userMessagesToday ?? 0) + 1,
              daily_limit: DAILY_LIMIT,
            })}\n\n`,
          ),
        )
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`,
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
})
