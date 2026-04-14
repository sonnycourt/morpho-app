/**
 * Insert ou met à jour l’entrée du jour. Utilise upsert si l’index unique (user_id, entry_date) existe ;
 * sinon repli sur update / insert.
 */
export async function saveDayEntry(supabase, userId, dateYmd, values, priorAiMessage) {
  const ai_message = priorAiMessage ?? ''
  const row = {
    user_id: userId,
    entry_date: dateYmd,
    desired_state: values.desired_state.trim(),
    intention: values.intention.trim(),
    gratitude: values.gratitude.trim(),
    reflection: values.reflection?.trim() ? values.reflection.trim() : null,
    synchronicity: values.synchronicity?.trim() ? values.synchronicity.trim() : null,
    alignment_score: values.alignment_score,
    ai_message,
  }

  const upsert = await supabase
    .from('entries')
    .upsert(row, { onConflict: 'user_id,entry_date' })
    .select()
    .single()

  if (!upsert.error) return upsert

  const { data: existing, error: fetchErr } = await supabase
    .from('entries')
    .select('id, ai_message')
    .eq('user_id', userId)
    .eq('entry_date', dateYmd)
    .maybeSingle()

  if (fetchErr) return { data: null, error: fetchErr }

  const mergedAi = existing?.ai_message ?? ai_message

  if (existing) {
    return supabase
      .from('entries')
      .update({
        desired_state: row.desired_state,
        intention: row.intention,
        gratitude: row.gratitude,
        reflection: row.reflection,
        synchronicity: row.synchronicity,
        alignment_score: row.alignment_score,
        ai_message: mergedAi,
      })
      .eq('id', existing.id)
      .select()
      .single()
  }

  return supabase.from('entries').insert({ ...row, ai_message: mergedAi }).select().single()
}
