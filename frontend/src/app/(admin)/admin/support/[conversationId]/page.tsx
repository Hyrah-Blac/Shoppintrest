'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient }        from '@/lib/api'
import { useSupportChat }   from '@/hooks/useSupportChat'
import { useStreamContext } from '@/components/providers/StreamProvider'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

interface AdminConversation {
  _id:             string
  streamChannelId: string
  createdAt:       string
  updatedAt:       string
  userId: {
    _id:          string
    username:     string
    email:        string
    displayName?: string
    avatar?:      string
  } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeLabel(d?: string | Date) {
  if (!d) return ''
  return new Date(d as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(d?: string | Date) {
  if (!d) return ''
  const date = new Date(d as string)
  const diff = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', padding: '2px 0 4px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '18px 18px 18px 4px',
        padding: '10px 16px',
      }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-text-secondary)',
            display: 'block',
            animation: `typingBounce 1.2s ${delay}s infinite ease-in-out`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes typingBounce {
          0%,60%,100%{transform:translateY(0);opacity:.35}
          30%{transform:translateY(-6px);opacity:1}
        }
      `}</style>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({
  text, isMine, createdAt, isSystem, showTail, status, onRetry,
}: {
  text: string
  isMine: boolean
  createdAt?: string | Date
  isSystem?: boolean
  showTail?: boolean
  status?: 'sending' | 'failed' | 'sent'
  onRetry?: () => void
}) {
  const [showTime, setShowTime] = useState(false)

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0', margin: '4px 0' }}>
        <span style={{
          fontSize: 11, color: 'var(--color-text-secondary)',
          background: 'var(--color-background-secondary)',
          padding: '4px 16px', borderRadius: 20,
          border: '0.5px solid var(--color-border-tertiary)',
          display: 'inline-block', lineHeight: 1.6,
        }}>
          {text}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMine ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 6, margin: '1px 0',
    }}>
      <div style={{ width: 28, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
        <div
          onClick={() => setShowTime(v => !v)}
          style={{
            background: isMine ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
            color: isMine ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
            borderRadius: isMine
              ? showTail ? '18px 18px 4px 18px' : '18px'
              : showTail ? '18px 18px 18px 4px' : '18px',
            padding: '10px 14px',
            fontSize: 15, lineHeight: 1.5,
            border: isMine ? 'none' : '0.5px solid var(--color-border-tertiary)',
            wordBreak: 'break-word',
            cursor: 'default',
            userSelect: 'text' as const,
            opacity: status === 'sending' ? 0.55 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {text}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          marginTop: 3, padding: '0 2px',
          height: (showTime || status === 'failed') ? 'auto' : 0,
          opacity: (showTime || status === 'failed') ? 1 : 0,
          overflow: 'hidden', transition: 'opacity 0.15s',
        }}>
          {status === 'failed' ? (
            <button
              onClick={onRetry}
              style={{
                fontSize: 11, fontWeight: 600, color: 'var(--color-text-danger)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>
              </svg>
              Failed · Tap to retry
            </button>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {timeLabel(createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({ onSend, onTyping }: {
  onSend:    (t: string) => Promise<void>
  onTyping?: () => void
}) {
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`
  }, [input])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try { await onSend(text); setInput('') }
    finally { setSending(false) }
  }, [input, sending, onSend])

  const canSend = !!input.trim() && !sending

  return (
    <div style={{
      padding: '8px 12px 12px',
      background: 'var(--color-background-primary)',
      borderTop: '0.5px solid var(--color-border-tertiary)',
      flexShrink: 0,
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 26, padding: '6px 6px 6px 16px',
          transition: 'border-color 0.15s',
        }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--color-border-primary)')}
        onBlurCapture={e  => (e.currentTarget.style.borderColor = 'var(--color-border-secondary)')}
      >
        <textarea
          ref={ref}
          value={input}
          onChange={e => { setInput(e.target.value); onTyping?.() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Reply to customer…"
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', fontSize: 15, lineHeight: 1.5,
            color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)',
            overflowY: 'hidden', padding: '5px 0', maxHeight: 130,
          }}
        />
        <button
          onClick={send}
          disabled={!canSend}
          aria-label="Send message"
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            border: 'none',
            background: canSend ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
            color: canSend ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
            transform: canSend ? 'scale(1)' : 'scale(0.88)',
          }}
        >
          {sending ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
            </svg>
          )}
        </button>
      </div>
      <p style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--color-text-secondary)', textAlign: 'center', margin: '6px 0 0' }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminConversationPage() {
  const params         = useParams()
  const conversationId = params.conversationId as string

  const { client, isReady } = useStreamContext()
  const {
    messages, isLoading, isTyping,
    openChannel, sendMessage, loadOlderMessages, sendTyping,
  } = useSupportChat(client, isReady)

  const [convo,  setConvo]  = useState<AdminConversation | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [optimistic, setOptimistic] = useState<{ id: string; text: string; created_at: string }[]>([])
  const [failedMsgs, setFailedMsgs] = useState<Record<string, string>>({})

  const bottomRef        = useRef<HTMLDivElement>(null)
  const listRef          = useRef<HTMLDivElement>(null)
  const wasNearBottomRef = useRef(true)
  const hasMountedRef    = useRef(false)
  const [showNew, setShowNew] = useState(false)

  // Fetch conversation meta
  useEffect(() => {
    let cancelled = false
    apiClient.support.admin.getConversation(conversationId)
      .then(res => { if (!cancelled) setConvo(res.data?.data ?? null) })
      .catch(() => { if (!cancelled) setConvo(null) })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [conversationId])

  // Open Stream channel
  useEffect(() => {
    if (convo?.streamChannelId) openChannel(convo.streamChannelId)
  }, [convo?.streamChannelId, openChannel])

  const isNearBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }, [])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowNew(false)
    wasNearBottomRef.current = true
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    let ticking = false
    const handler = () => {
      wasNearBottomRef.current = isNearBottom()
      if (wasNearBottomRef.current) setShowNew(false)
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => { if (el.scrollTop < 60) loadOlderMessages(); ticking = false })
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [loadOlderMessages, isNearBottom])

  useEffect(() => {
    if (wasNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: hasMountedRef.current ? 'smooth' : 'auto' })
      hasMountedRef.current = true
    } else setShowNew(true)
  }, [messages.length, isTyping, optimistic.length])

  // Optimistic send — shows reply instantly, replaces when real one arrives
  const handleSend = useCallback(async (text: string) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const sentAt = new Date().toISOString()
    setOptimistic(prev => [...prev, { id: tempId, text, created_at: sentAt }])
    try {
      await sendMessage(text)
      apiClient.support.admin.notifyReply(conversationId).catch(() => {})
    } catch {
      setOptimistic(prev => prev.filter(m => m.id !== tempId))
      setFailedMsgs(prev => ({ ...prev, [tempId]: text }))
    }
  }, [sendMessage, conversationId])

  // Drop optimistic copies once the real message syncs in
  useEffect(() => {
    if (optimistic.length === 0) return
    setOptimistic(prev => prev.filter(opt =>
      !messages.some(m =>
        m.user?.id === client?.userID &&
        m.text === opt.text &&
        new Date(m.created_at as string).getTime() >= new Date(opt.created_at).getTime() - 5000
      )
    ))
  }, [messages, optimistic.length, client?.userID])

  const retryFailed = useCallback(async (tempId: string) => {
    const text = failedMsgs[tempId]
    if (!text) return
    setFailedMsgs(prev => { const n = { ...prev }; delete n[tempId]; return n })
    await handleSend(text)
  }, [failedMsgs, handleSend])

  const grouped = useMemo(() => {
    const result: { day: string; msgs: typeof messages }[] = []
    for (const msg of messages) {
      const day  = dayLabel(msg.created_at)
      const last = result[result.length - 1]
      if (last?.day === day) last.msgs.push(msg)
      else result.push({ day, msgs: [msg] })
    }
    return result
  }, [messages])

  if (!loaded) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh',
      background: 'var(--color-background-primary)',
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!convo) return (
    <div style={{
      maxWidth: 480, margin: '5rem auto', padding: '0 1.5rem', textAlign: 'center',
      background: 'var(--color-background-primary)', color: 'var(--color-text-primary)',
    }}>
      <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, margin: '0 0 16px' }}>Conversation not found</p>
      <Link href="/admin/support" style={{ fontSize: 12, color: 'var(--color-text-primary)', textDecoration: 'underline' }}>
        ← Back to inbox
      </Link>
    </div>
  )

  const user = convo.userId

  return (
    <div style={{
      maxWidth: 760, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - 64px)',
      position: 'relative',
      background: 'var(--color-background-primary)',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        flexShrink: 0,
        background: 'var(--color-background-primary)',
      }}>
        <Link
          href="/admin/support"
          style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', textDecoration: 'none', padding: 4 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)',
            overflow: 'hidden',
          }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (user?.displayName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()
            }
          </div>
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 11, height: 11, borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid var(--color-background-primary)',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName ?? user?.username ?? 'Unknown user'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? '—'}
          </p>
        </div>

        {user?.username && (
          <Link
            href={`/profile/${user.username}`}
            style={{
              fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--color-text-secondary)', textDecoration: 'none',
              padding: '5px 10px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 7,
              flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-secondary)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          >
            Profile
          </Link>
        )}
      </div>

      {/* ── Messages ── */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        style={{
          flex: 1, overflowY: 'auto',
          padding: '12px 16px 8px',
          display: 'flex', flexDirection: 'column', gap: 2,
          background: 'var(--color-background-primary)',
        }}
      >
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}

        {!isLoading && messages.length === 0 && optimistic.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, padding: '3rem 2rem', textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              💬
            </div>
            <div>
              <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                No messages yet
              </p>
              <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: 260 }}>
                The customer hasn't sent anything yet.
              </p>
            </div>
          </div>
        )}

        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 10px' }}>
              <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
              <span style={{
                fontSize: 11, color: 'var(--color-text-secondary)',
                background: 'var(--color-background-secondary)',
                padding: '3px 12px', borderRadius: 20,
                border: '0.5px solid var(--color-border-tertiary)',
                whiteSpace: 'nowrap', fontWeight: 500,
              }}>
                {day}
              </span>
              <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
            </div>

            {msgs.map((msg, idx) => {
              const isMine  = msg.user?.id === client?.userID
              const nextMsg = msgs[idx + 1]
              const isLast  = !nextMsg || nextMsg.user?.id !== msg.user?.id
              return (
                <Bubble
                  key={msg.id}
                  text={msg.text ?? ''}
                  isMine={isMine}
                  createdAt={msg.created_at}
                  isSystem={msg.type === 'system'}
                  showTail={isLast}
                />
              )
            })}
          </div>
        ))}

        {/* Optimistic admin replies */}
        {optimistic.map(m => (
          <Bubble key={m.id} text={m.text} isMine createdAt={m.created_at} status="sending" showTail />
        ))}

        {/* Failed sends */}
        {Object.entries(failedMsgs).map(([tempId, text]) => (
          <Bubble key={tempId} text={text} isMine status="failed" showTail onRetry={() => retryFailed(tempId)} />
        ))}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
            </div>
            <TypingDots />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Customer typing label */}
      {isTyping && (
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)',
          padding: '2px 20px 0', flexShrink: 0,
        }}>
          {user?.displayName ?? user?.username ?? 'Customer'} is typing…
        </div>
      )}

      {/* New messages pill */}
      {showNew && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 5,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          New messages
        </button>
      )}

      <Composer onSend={handleSend} onTyping={sendTyping} />
    </div>
  )
}