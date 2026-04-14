import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import Footer from '../components/Footer'
import { useAuth } from '../context/useAuth'
import { isValidRouteDateParam } from '../lib/dates'
import { supabase } from '../lib/supabaseClient'

const DAILY_LIMIT = 10
const HISTORY_PAGE_SIZE = 50

function getFirstName(profile, user) {
  const fn = profile?.first_name?.trim()
  if (fn) return fn
  return user?.email?.split('@')[0] ?? 'Profil'
}

function parseDayContext(context) {
  if (!context || !context.startsWith('day:')) return null
  const day = context.slice(4)
  if (!isValidRouteDateParam(day)) return null
  return day
}

function formatLowerFrenchDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildContextPrompt(ymd) {
  return `Partage-moi ton avis sur mon entrée du ${formatLowerFrenchDate(ymd)}`
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text, query) {
  const value = String(text ?? '')
  if (!query) return value
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'ig')
  const parts = value.split(regex)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={`${part}-${i}`} className="rounded bg-amber-300/90 px-0.5 text-[#1b1b1b]">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function highlightNode(node, query) {
  if (!query) return node
  if (typeof node === 'string') return highlightText(node, query)
  if (Array.isArray(node)) return node.map((child) => highlightNode(child, query))
  if (!isValidElement(node)) return node

  const nextChildren = highlightNode(node.props.children, query)
  return cloneElement(node, { ...node.props }, nextChildren)
}

export default function CoachPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [profile, setProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [streamingMsgId, setStreamingMsgId] = useState(null)
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [dailyUserCount, setDailyUserCount] = useState(0)
  const [historyCursor, setHistoryCursor] = useState(null)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [initialScrollDone, setInitialScrollDone] = useState(false)
  const messagesContainerRef = useRef(null)
  const endRef = useRef(null)
  const stickToBottomRef = useRef(true)

  const dayContext = useMemo(
    () => parseDayContext(searchParams.get('context')),
    [searchParams],
  )

  const userCountToday = dailyUserCount

  const disabled = blocked || limitReached || sending

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const visibleMessages = useMemo(() => {
    if (!normalizedSearch) return messages
    return messages.filter((msg) => String(msg.content ?? '').toLowerCase().includes(normalizedSearch))
  }, [messages, normalizedSearch])

  const scrollToBottom = (behavior = 'smooth') => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior })
    setShowScrollToBottom(false)
    stickToBottomRef.current = true
  }

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const atBottom = distanceFromBottom < 48
    setShowScrollToBottom(!atBottom)
    stickToBottomRef.current = atBottom
  }

  useEffect(() => {
    if (loadingMoreHistory) return
    if (stickToBottomRef.current) {
      scrollToBottom(sending ? 'smooth' : 'auto')
    }
  }, [messages, sending, loadingMoreHistory])

  const fetchHistoryPage = async (userId, beforeDate = null) => {
    let query = supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_PAGE_SIZE)

    if (beforeDate) {
      query = query.lt('created_at', beforeDate)
    }

    const { data, error: messagesError } = await query
    return { data: data ?? [], error: messagesError }
  }

  const loadOlderMessages = async () => {
    if (!user?.id || !historyCursor || loadingMoreHistory || !hasMoreHistory) return
    const container = messagesContainerRef.current
    const previousHeight = container?.scrollHeight ?? 0
    setLoadingMoreHistory(true)
    const { data, error: messagesError } = await fetchHistoryPage(user.id, historyCursor)
    if (messagesError) {
      setError(messagesError.message)
      setLoadingMoreHistory(false)
      return
    }

    const chronologic = [...data].reverse()
    setMessages((prev) => [...chronologic, ...prev])
    setHasMoreHistory(data.length === HISTORY_PAGE_SIZE)
    setHistoryCursor(data.length ? data[data.length - 1].created_at : null)
    setLoadingMoreHistory(false)

    requestAnimationFrame(() => {
      const nextContainer = messagesContainerRef.current
      if (!nextContainer) return
      const nextHeight = nextContainer.scrollHeight
      const delta = nextHeight - previousHeight
      nextContainer.scrollTop += delta
    })
  }

  const fetchDailyUserCount = async (userId) => {
    if (!userId) return 0
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 1)

    const { count, error: countError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())

    if (countError) {
      setError(countError.message)
      return 0
    }

    const next = count ?? 0
    setDailyUserCount(next)
    setLimitReached(next >= DAILY_LIMIT)
    return next
  }

  const submitMessage = async (rawMessage) => {
    const message = rawMessage.trim()
    if (!message || !user?.id || blocked || limitReached) return false

    setError('')
    setSending(true)

    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
      localOnly: true,
    }
    setMessages((prev) => [...prev, tempUserMessage])

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError('Session invalide, reconnecte-toi.')
      setSending(false)
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      return false
    }

    let res
    try {
      res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ user_id: user.id, message }),
      })
    } catch (err) {
      setError(err.message)
      setSending(false)
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      return false
    }

    const contentType = res.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      setSending(false)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || `Erreur ${res.status}`)
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
        return false
      }

      if (data?.code === 'AI_BLOCKED' || data?.code === 'AI_BUDGET_REACHED') {
        setBlocked(true)
        setError(data.error ?? 'Accès coach bloqué.')
        return false
      }

      if (data?.limited) {
        setLimitReached(true)
        await fetchDailyUserCount(user.id)
        setMessages((prev) => [
          ...prev,
          {
            id: `limit-${Date.now()}`,
            role: 'system',
            content: data.reply,
            created_at: new Date().toISOString(),
            localOnly: true,
          },
        ])
        return false
      }

      if (data?.reply) {
        await fetchDailyUserCount(user.id)
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-assistant-${Date.now()}`,
            role: data.role ?? 'assistant',
            content: data.reply,
            created_at: new Date().toISOString(),
            localOnly: true,
          },
        ])
      }
      return true
    }

    const assistantId = `stream-${Date.now()}`
    setStreamingMsgId(assistantId)
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        localOnly: true,
      },
    ])
    setSending(false)

    if (!res.body) {
      setError('Réponse vide du serveur.')
      setStreamingMsgId(null)
      return false
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const payload = trimmed.slice(6).trim()
          try {
            const parsed = JSON.parse(payload)
            if (parsed.type === 'done') {
              setDailyUserCount(parsed.daily_count ?? 0)
              setLimitReached((parsed.daily_count ?? 0) >= DAILY_LIMIT)
              continue
            }
            if (parsed.type === 'error') {
              setError(parsed.error ?? 'Erreur streaming')
              continue
            }
            if (parsed.token) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.token } : m,
                ),
              )
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setError(err.message)
    }

    setStreamingMsgId(null)
    return true
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const [profileRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name, ai_blocked').eq('id', user.id).maybeSingle(),
        fetchHistoryPage(user.id),
      ])

      if (!alive) return

      if (profileRes.error) {
        setError(profileRes.error.message)
      } else {
        setProfile(profileRes.data)
        setBlocked(Boolean(profileRes.data?.ai_blocked))
      }

      const historyBatch = messagesRes.data ?? []
      if (messagesRes.error) {
        setError(messagesRes.error.message)
      } else {
        const serverMessages = [...historyBatch].reverse()
        setMessages(serverMessages)
        setHasMoreHistory(historyBatch.length === HISTORY_PAGE_SIZE)
        setHistoryCursor(historyBatch.length ? historyBatch[historyBatch.length - 1].created_at : null)
        stickToBottomRef.current = true
      }

      await fetchDailyUserCount(user.id)
      setLoading(false)
      setInitialScrollDone(true)
      requestAnimationFrame(() => scrollToBottom('auto'))

      if (!dayContext) return

      const autoPrompt = buildContextPrompt(dayContext)
      const serverMessages = [...historyBatch].reverse()
      const alreadyExists = serverMessages.some(
        (m) => m.role === 'user' && String(m.content).trim() === autoPrompt,
      )

      if (!alreadyExists) {
        await submitMessage(autoPrompt)
      }

      navigate('/coach', { replace: true })
    })()

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submitMessage and navigate intentionally stable enough here
  }, [user?.id, dayContext])

  useEffect(() => {
    if (!initialScrollDone) return
    sessionStorage.setItem('morpho_last_path', '/coach')
    sessionStorage.setItem('morpho_last_tab', 'coach')
  }, [initialScrollDone])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const send = async () => {
    const message = text.trim()
    if (!message || disabled) return
    setText('')
    await submitMessage(message)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">
        Chargement du coach...
      </div>
    )
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(13,31,56,0.96)_0%,rgba(13,31,56,0.82)_100%)] p-5 shadow-[0_30px_80px_rgba(2,12,27,0.45)] backdrop-blur-xl sm:p-8">
        <DashboardHeader firstName={getFirstName(profile, user)} onLogout={handleLogout} activeTab="coach" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">Coach Morpho</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Ton coach en reprogrammation du subconscient et manifestation
            </p>
          </div>
          <div className="flex min-w-[280px] flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative w-full max-w-[340px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un mot-clé..."
                className="w-full rounded-full border border-blue-500/30 bg-slate-950/35 px-3 py-2 pr-16 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full border border-blue-500/30 bg-blue-600/10 px-2 py-1 text-[10px] text-blue-100 hover:bg-blue-600/20"
                >
                  Reset
                </button>
              ) : null}
            </div>
            <p className="rounded-full border border-blue-500/30 bg-blue-600/10 px-3 py-1.5 text-xs text-blue-200">
              {Math.min(userCountToday, DAILY_LIMIT)} / {DAILY_LIMIT} messages aujourd'hui
            </p>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-950/25 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <section className="relative flex h-[68vh] min-h-[520px] max-h-[760px] flex-col rounded-[24px] border border-blue-500/20 bg-[#0a1628]/55">
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6"
          >
            {hasMoreHistory ? (
              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  onClick={loadOlderMessages}
                  disabled={loadingMoreHistory}
                  className="rounded-full border border-blue-500/35 bg-blue-600/10 px-3 py-1 text-xs text-blue-100 transition hover:bg-blue-600/20 disabled:opacity-60"
                >
                  {loadingMoreHistory ? 'Chargement...' : 'Charger les messages plus anciens'}
                </button>
              </div>
            ) : null}

            {visibleMessages.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <div key={msg.id} className="mx-auto max-w-2xl rounded-2xl border border-blue-500/20 bg-blue-600/10 px-4 py-3 text-center text-sm text-blue-100">
                    {msg.content}
                  </div>
                )
              }

              const userBubble = msg.role === 'user'
              return (
                <div key={msg.id} className={`flex ${userBubble ? 'justify-end' : 'justify-start'}`}>
                  {!userBubble ? (
                    <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/45 bg-blue-600/20 text-xs font-semibold text-blue-100">
                      C
                    </div>
                  ) : null}
                  <div
                    className={
                      userBubble
                        ? 'max-w-[80%] rounded-2xl border border-blue-500/25 bg-[rgba(37,99,235,0.15)] px-4 py-3 text-sm leading-relaxed text-slate-100'
                        : 'max-w-[80%] rounded-2xl border border-blue-500/30 bg-[#0d1f38] px-4 py-3 text-sm leading-relaxed text-slate-100'
                    }
                  >
                    {userBubble ? (
                      highlightText(msg.content, normalizedSearch)
                    ) : (
                      <div className="coach-markdown">
                        {streamingMsgId === msg.id ? (
                          msg.content ? (
                            <>
                              <span className="whitespace-pre-wrap">{msg.content}</span>
                              <span className="ml-0.5 inline-block h-3.5 w-[3px] translate-y-0.5 animate-pulse rounded-sm bg-blue-300/70" />
                            </>
                          ) : (
                            <span className="inline-block h-3.5 w-[3px] animate-pulse rounded-sm bg-blue-300/70" />
                          )
                        ) : (
                          <ReactMarkdown
                            components={{
                              p: ({ children, ...props }) => (
                                <p style={{ margin: '0 0 12px 0', lineHeight: '1.6' }} {...props}>
                                  {highlightNode(children, normalizedSearch)}
                                </p>
                              ),
                              strong: ({ children, ...props }) => (
                                <strong style={{ fontWeight: 600, color: '#ffffff' }} {...props}>
                                  {highlightNode(children, normalizedSearch)}
                                </strong>
                              ),
                              em: ({ children, ...props }) => (
                                <em style={{ fontStyle: 'italic', color: '#c8d6e8' }} {...props}>
                                  {highlightNode(children, normalizedSearch)}
                                </em>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {normalizedSearch && visibleMessages.length === 0 ? (
              <div className="mx-auto max-w-2xl rounded-2xl border border-blue-500/20 bg-blue-600/10 px-4 py-3 text-center text-sm text-blue-100">
                Aucun message ne correspond à "{searchQuery}".
              </div>
            ) : null}

            {sending ? (
              <div className="flex justify-start">
                <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/45 bg-blue-600/20 text-xs font-semibold text-blue-100">
                  C
                </div>
                <div className="rounded-2xl border border-blue-500/30 bg-[#0d1f38] px-4 py-3 text-sm text-[var(--text-muted)]">
                  Le coach réfléchit...
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {showScrollToBottom ? (
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-24 right-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-blue-300/25 bg-[#1a3f72]/60 text-sm text-blue-100/90 shadow-[0_8px_18px_rgba(7,18,37,0.28)] transition hover:bg-[#1a3f72]/75"
              aria-label="Descendre en bas de la conversation"
              title="Descendre en bas"
            >
              ↓
            </button>
          ) : null}

          <div className="border-t border-blue-500/20 p-4 sm:p-5">
            {normalizedSearch ? (
              <p className="mb-3 text-xs text-[#9cb2d8]">
                {visibleMessages.length} résultat{visibleMessages.length > 1 ? 's' : ''} pour "{searchQuery}"
              </p>
            ) : null}
            {(blocked || limitReached) ? (
              <p className="mb-3 text-sm text-[var(--text-muted)]">Reviens demain pour continuer</p>
            ) : null}
            <div className="flex items-end gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                disabled={disabled}
                placeholder="Écris ton message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                className="min-h-[48px] flex-1 resize-none rounded-2xl border border-blue-500/30 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={send}
                disabled={disabled || !text.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-blue)] text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                aria-label="Envoyer"
              >
                ↑
              </button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
