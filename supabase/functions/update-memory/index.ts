import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UPDATE_MEMORY_SYSTEM_PROMPT = `Tu es un systeme de compression de memoire pour un coach IA. Tu recois la memoire actuelle d'un utilisateur, ses dernieres entrees de journal et ses messages coach recents. Tu dois mettre a jour la memoire.

Regle absolue : la memoire est cumulative. Tu enrichis, tu ne reinitialises jamais.

CONSIGNE CRITIQUE : reponds UNIQUEMENT avec un objet JSON valide. Pas de texte avant, pas de texte apres, pas de blocs markdown, pas de backticks. Juste le JSON brut.

Format exact attendu (respecte les guillemets doubles, pas de virgule apres le dernier element) :
{
  "summary": "...",
  "key_patterns": "...",
  "wins": "...",
  "struggles": "...",
  "timeline_markers": "...",
  "memory_events": [
    {"event_date":"YYYY-MM-DD","event_type":"breakthrough","event_text":"...","source":"entries","confidence":0.9}
  ]
}

Valeurs autorisees pour event_type : breakthrough, fear, commitment, rechute, milestone, resistance, clarity, decision, other
Valeurs autorisees pour source : entries, chat_messages
confidence : nombre decimal entre 0 et 1

Limites : summary max 300 mots, key_patterns max 200 mots, wins max 200 mots, struggles max 200 mots, timeline_markers max 300 mots, memory_events 3 a 10 evenements.`

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function extractTextContent(content: Array<{ type?: string; text?: string }>) {
  return content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text ?? '')
    .join('\n')
    .trim()
}

type MemoryEvent = {
  event_date?: string
  event_type?: string
  event_text?: string
  source?: string
  confidence?: number
}

type ParsedMemory = {
  summary?: string
  key_patterns?: string
  wins?: string
  struggles?: string
  timeline_markers?: string
  memory_events?: MemoryEvent[]
}

function fixCommonJsonIssues(s: string): string {
  return (
    s
      // remove trailing commas before ] or }
      .replace(/,(\s*[}\]])/g, '$1')
      // remove code fences
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim()
  )
}

function deepestJsonObject(s: string): string | null {
  // Walk and find balanced { ... } from the first {
  const start = s.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let escape = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (escape) { escape = false; continue }
    if (c === '\\' && inStr) { escape = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

function extractFieldRegex(raw: string, field: string): string {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)
  const m = raw.match(re)
  return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : ''
}

function parseAssistantJson(raw: string): {
  summary: string
  key_patterns: string
  wins: string
  struggles: string
  timeline_markers: string
  memory_events: MemoryEvent[]
} {
  const attempts: string[] = [
    raw,
    fixCommonJsonIssues(raw),
    deepestJsonObject(raw) ?? '',
    deepestJsonObject(fixCommonJsonIssues(raw)) ?? '',
  ]

  let parsed: ParsedMemory | null = null
  for (const attempt of attempts) {
    if (!attempt.trim()) continue
    try {
      const candidate = JSON.parse(attempt) as ParsedMemory
      if (typeof candidate === 'object' && candidate !== null) {
        parsed = candidate
        break
      }
    } catch {
      // try next strategy
    }
  }

  // Last resort: regex field extraction — always succeeds even on broken JSON
  const summary = parsed?.summary ? String(parsed.summary) : extractFieldRegex(raw, 'summary')
  const key_patterns = parsed?.key_patterns ? String(parsed.key_patterns) : extractFieldRegex(raw, 'key_patterns')
  const wins = parsed?.wins ? String(parsed.wins) : extractFieldRegex(raw, 'wins')
  const struggles = parsed?.struggles ? String(parsed.struggles) : extractFieldRegex(raw, 'struggles')
  const timeline_markers = parsed?.timeline_markers ? String(parsed.timeline_markers) : extractFieldRegex(raw, 'timeline_markers')

  let memory_events: MemoryEvent[] = []
  if (Array.isArray(parsed?.memory_events)) {
    memory_events = parsed.memory_events
  } else {
    // Try to extract just the events array from raw
    const evMatch = raw.match(/"memory_events"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
    if (evMatch) {
      try {
        memory_events = JSON.parse(fixCommonJsonIssues(evMatch[1])) as MemoryEvent[]
      } catch {
        memory_events = []
      }
    }
  }

  return { summary, key_patterns, wins, struggles, timeline_markers, memory_events }
}

function mergeField(currentValue: string, nextValue: string) {
  const current = String(currentValue ?? '').trim()
  const next = String(nextValue ?? '').trim()
  return next || current
}

function formatEntries(entries: Array<Record<string, unknown>>) {
  if (!entries.length) return 'Aucune entree.'

  return entries
    .map((entry) => {
      const date = String(entry.entry_date ?? '')
      const desired = String(entry.desired_state ?? '')
      const intention = String(entry.intention ?? '')
      const gratitude = String(entry.gratitude ?? '')
      const reflection = String(entry.reflection ?? '')
      const synchronicity = String(entry.synchronicity ?? '')
      const score = String(entry.alignment_score ?? '')
      const createdAt = String(entry.created_at ?? '')
      return `- date: ${date}
  created_at: ${createdAt}
  desired_state: ${desired}
  intention: ${intention}
  gratitude: ${gratitude}
  reflection: ${reflection}
  synchronicity: ${synchronicity || '(vide)'}
  alignment_score: ${score}/10`
    })
    .join('\n')
}

function formatChatMessages(messages: Array<Record<string, unknown>>) {
  if (!messages.length) return 'Aucun message coach recent.'
  return messages
    .map((m) => {
      const date = String(m.created_at ?? '')
      const role = String(m.role ?? '')
      const content = String(m.content ?? '')
      return `- created_at: ${date}\n  role: ${role}\n  content: ${content}`
    })
    .join('\n')
}

function normalizeEventText(text: string) {
  return String(text ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
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
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
  const anthropicModel = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-5'

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !anthropicApiKey) {
    return jsonResponse({ error: 'Missing function secrets' }, 500)
  }

  const authHeaderRaw = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? ''
  const token = authHeaderRaw.replace(/^Bearer\s+/i, '').trim()
  const apikeyHeader = req.headers.get('apikey')?.trim() ?? ''
  const isServiceRoleCall = token === supabaseServiceKey || apikeyHeader === supabaseServiceKey

  let payload: { user_id?: string | null }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400)
  }

  const userId = payload.user_id?.trim()
  if (!userId) {
    return jsonResponse({ error: 'user_id is required' }, 400)
  }

  if (!isServiceRoleCall) {
    if (!token) return jsonResponse({ error: 'Unauthorized' }, 401)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    })
    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser()
    if (authError || !authUser) return jsonResponse({ error: 'Unauthorized' }, 401)
    const isAdminCaller = (authUser.email ?? '').toLowerCase() === 'sonnycourt@gmail.com'
    if (authUser.id !== userId && !isAdminCaller) {
      return jsonResponse({ error: 'Forbidden user_id mismatch' }, 403)
    }
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey)

  const [{ data: profile }, { data: existingMemory, error: memoryError }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, total_ai_cost_cents, wish, secondary_wish')
      .eq('id', userId)
      .maybeSingle(),
    admin
      .from('user_memory')
      .select('summary, key_patterns, wins, struggles, timeline_markers, last_updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (!profile) {
    return jsonResponse({ error: 'Profile not found' }, 404)
  }
  if (memoryError) {
    return jsonResponse({ error: memoryError.message }, 500)
  }

  const { count: totalEntries, error: totalEntriesError } = await admin
    .from('entries')
    .select('entry_date', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (totalEntriesError) {
    return jsonResponse({ error: totalEntriesError.message }, 500)
  }

  const milestoneEntries = Math.floor(Number(totalEntries ?? 0) / 7) * 7
  if (milestoneEntries < 7) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: 'MILESTONE_NOT_REACHED',
      total_entries: totalEntries ?? 0,
    })
  }

  const { data: existingMilestone } = await admin
    .from('memory_compression_history')
    .select('id, status')
    .eq('user_id', userId)
    .eq('milestone_entries', milestoneEntries)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingMilestone?.status === 'success') {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: 'ALREADY_COMPRESSED_FOR_MILESTONE',
      milestone_entries: milestoneEntries,
    })
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentEntries, error: entriesError } = await admin
    .from('entries')
    .select('entry_date, desired_state, intention, gratitude, reflection, synchronicity, alignment_score, created_at')
    .eq('user_id', userId)
    .gte('entry_date', sevenDaysAgo.toISOString().slice(0, 10))
    .order('entry_date', { ascending: true })

  if (entriesError) {
    return jsonResponse({ error: entriesError.message }, 500)
  }

  const { data: recentChat, error: chatError } = await admin
    .from('chat_messages')
    .select('created_at, role, content')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (chatError) {
    return jsonResponse({ error: chatError.message }, 500)
  }

  const entries = recentEntries ?? []
  if (!entries.length) {
    await admin.from('memory_compression_history').insert({
      user_id: userId,
      milestone_entries: milestoneEntries,
      status: 'skipped',
      skip_reason: 'NO_ENTRIES_LAST_7_DAYS',
      entries_in_window: 0,
    })
    return jsonResponse({ ok: true, skipped: true, reason: 'NO_ENTRIES_LAST_7_DAYS' })
  }

  const lastUpdated = existingMemory?.last_updated_at ? new Date(existingMemory.last_updated_at) : null
  const hasNewSinceLastUpdate =
    !lastUpdated ||
    entries.some((e) => {
      if (!e.created_at) return true
      return new Date(e.created_at).getTime() > lastUpdated.getTime()
    })

  if (!hasNewSinceLastUpdate) {
    await admin.from('memory_compression_history').insert({
      user_id: userId,
      milestone_entries: milestoneEntries,
      status: 'skipped',
      skip_reason: 'NO_NEW_ENTRIES_SINCE_LAST_UPDATE',
      entries_in_window: entries.length,
      window_start: entries[0]?.entry_date ?? null,
      window_end: entries[entries.length - 1]?.entry_date ?? null,
    })
    return jsonResponse({ ok: true, skipped: true, reason: 'NO_NEW_ENTRIES_SINCE_LAST_UPDATE' })
  }

  const currentMemory = {
    summary: existingMemory?.summary ?? '',
    key_patterns: existingMemory?.key_patterns ?? '',
    wins: existingMemory?.wins ?? '',
    struggles: existingMemory?.struggles ?? '',
    timeline_markers: existingMemory?.timeline_markers ?? '',
  }

  const userPrompt = `Mise a jour memoire utilisateur.

Souhait principal: ${profile.wish ?? '(non defini)'}
Souhait secondaire: ${profile.secondary_wish ?? '(non defini)'}

Memoire actuelle:
${JSON.stringify(currentMemory, null, 2)}

Entrees des 7 derniers jours:
${formatEntries(entries)}

Messages coach des 7 derniers jours:
${formatChatMessages(recentChat ?? [])}
`

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: anthropicModel,
      system: UPDATE_MEMORY_SYSTEM_PROMPT,
      max_tokens: 1200,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!anthropicRes.ok) {
    const errorText = await anthropicRes.text()
    return jsonResponse({ error: `Anthropic error: ${errorText}` }, 502)
  }

  const anthropicJson = (await anthropicRes.json()) as {
    content?: Array<{ type?: string; text?: string }>
    usage?: { input_tokens?: number; output_tokens?: number }
  }

  const rawText = extractTextContent(anthropicJson.content ?? [])
  if (!rawText) {
    await admin.from('memory_compression_history').insert({
      user_id: userId,
      milestone_entries: milestoneEntries,
      status: 'error',
      error_message: 'Empty model response',
      entries_in_window: entries.length,
      window_start: entries[0]?.entry_date ?? null,
      window_end: entries[entries.length - 1]?.entry_date ?? null,
    })
    return jsonResponse({ error: 'Empty model response' }, 502)
  }

  let parsed: {
    summary: string
    key_patterns: string
    wins: string
    struggles: string
    timeline_markers: string
    memory_events: Array<{
      event_date?: string
      event_type?: string
      event_text?: string
      source?: string
      confidence?: number
    }>
  }
  try {
    parsed = parseAssistantJson(rawText)
  } catch {
    await admin.from('memory_compression_history').insert({
      user_id: userId,
      milestone_entries: milestoneEntries,
      status: 'error',
      error_message: 'Model output is not valid JSON',
      entries_in_window: entries.length,
      window_start: entries[0]?.entry_date ?? null,
      window_end: entries[entries.length - 1]?.entry_date ?? null,
    })
    return jsonResponse({ error: 'Model output is not valid JSON', raw: rawText }, 502)
  }

  const mergedMemory = {
    summary: mergeField(currentMemory.summary, parsed.summary),
    key_patterns: mergeField(currentMemory.key_patterns, parsed.key_patterns),
    wins: mergeField(currentMemory.wins, parsed.wins),
    struggles: mergeField(currentMemory.struggles, parsed.struggles),
    timeline_markers: mergeField(currentMemory.timeline_markers, parsed.timeline_markers),
  }

  const existingEvents = (
    await admin
      .from('memory_events')
      .select('event_date, event_type, event_text')
      .eq('user_id', userId)
  ).data ?? []

  const existingEventKeys = new Set(
    existingEvents.map((e) => `${e.event_date}|${e.event_type}|${normalizeEventText(e.event_text)}`),
  )

  const validTypes = new Set([
    'breakthrough',
    'fear',
    'commitment',
    'rechute',
    'milestone',
    'resistance',
    'clarity',
    'decision',
    'other',
  ])

  const eventCandidates = (parsed.memory_events ?? [])
    .slice(0, 10)
    .map((e) => {
      const eventDate = String(e.event_date ?? '').slice(0, 10)
      const eventType = String(e.event_type ?? '').toLowerCase()
      const eventText = String(e.event_text ?? '').trim()
      const source = String(e.source ?? '').toLowerCase() === 'chat_messages' ? 'chat_messages' : 'entries'
      const confidenceRaw = Number(e.confidence ?? 0.6)
      const confidence = Math.max(0, Math.min(1, Number.isFinite(confidenceRaw) ? confidenceRaw : 0.6))
      if (!eventDate || !eventText || !validTypes.has(eventType)) return null
      return { event_date: eventDate, event_type: eventType, event_text: eventText, source, confidence }
    })
    .filter(Boolean) as Array<{
    event_date: string
    event_type: string
    event_text: string
    source: 'entries' | 'chat_messages'
    confidence: number
  }>

  const eventRows = eventCandidates.filter((e) => {
    const key = `${e.event_date}|${e.event_type}|${normalizeEventText(e.event_text)}`
    if (existingEventKeys.has(key)) return false
    existingEventKeys.add(key)
    return true
  })

  const { error: upsertError } = await admin.from('user_memory').upsert({
    user_id: userId,
    summary: mergedMemory.summary,
    key_patterns: mergedMemory.key_patterns,
    wins: mergedMemory.wins,
    struggles: mergedMemory.struggles,
    timeline_markers: mergedMemory.timeline_markers,
    last_updated_at: new Date().toISOString(),
  })

  if (upsertError) {
    return jsonResponse({ error: upsertError.message }, 500)
  }

  const inputTokens = Number(anthropicJson.usage?.input_tokens ?? 0)
  const outputTokens = Number(anthropicJson.usage?.output_tokens ?? 0)
  const costCents = Math.round((inputTokens * 0.000003 + outputTokens * 0.000015) * 100)

  await admin
    .from('profiles')
    .update({
      total_ai_cost_cents: Number(profile.total_ai_cost_cents ?? 0) + costCents,
    })
    .eq('id', userId)

  await admin.from('memory_compression_history').insert({
    user_id: userId,
    milestone_entries: milestoneEntries,
    status: 'success',
    entries_in_window: entries.length,
    window_start: entries[0]?.entry_date ?? null,
    window_end: entries[entries.length - 1]?.entry_date ?? null,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_cents: costCents,
  })

  await admin.from('memory_snapshots').upsert({
    user_id: userId,
    milestone_entries: milestoneEntries,
    summary: mergedMemory.summary,
    key_patterns: mergedMemory.key_patterns,
    wins: mergedMemory.wins,
    struggles: mergedMemory.struggles,
    timeline_markers: mergedMemory.timeline_markers,
    source: 'compression',
  })

  if (eventRows.length) {
    await admin.from('memory_events').insert(
      eventRows.map((e) => ({
        user_id: userId,
        event_date: e.event_date,
        event_type: e.event_type,
        event_text: e.event_text,
        source: e.source,
        confidence: e.confidence,
      })),
    )
  }

  return jsonResponse({
    ok: true,
    updated: true,
    milestone_entries: milestoneEntries,
    total_entries: totalEntries ?? 0,
    created_events: eventRows.length,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: costCents,
    },
  })
})
