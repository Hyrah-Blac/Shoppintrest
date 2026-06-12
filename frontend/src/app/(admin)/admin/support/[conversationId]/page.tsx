'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

function relativeTime(d?: string | Date) {
  if (!d) return ''
  const diff = Date.now() - new Date(d as string).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d as string).toLocaleDateString([], { month: 'short', day: 'numeric' })
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
    <div style={{ display: 'flex', alignItems: 'flex-end', padding: '4px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '14px 14px 14px 4px', padding: '10px 14px',
      }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--color-text-secondary)', display: 'block',
            animation: `bounce 1.2s ${delay}s infinite ease-in-out`,
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ text, isMine, createdAt, isSystem }: {
  text: string; isMine: boolean; createdAt?: string | Date; isSystem?: boolean
}) {
  const [showAbsolute, setShowAbsolute] = useState(false)

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0', margin: '8px 0' }}>
        <span style={{
          fontSize: 11, color: 'var(--color-text-secondary)',
          background: 'var(--color-background-secondary)',
          padding: '4px 14px', borderRadius: 20,
          border: '0.5px solid var(--color-border-tertiary)',
        }}>
          {text}
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', margin: '3px 0' }}>
      <div style={{
        maxWidth: '72%',
        background: isMine ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
        color: isMine ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
        borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        padding: '9px 13px', fontSize: 13, lineHeight: 1.65,
        border: isMine ? 'none' : '0.5px solid var(--color-border-tertiary)',
        wordBreak: 'break-word',
      }}>
        {text}
      </div>
      {createdAt && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, padding: '0 4px', cursor: 'default' }}
          onMouseEnter={() => setShowAbsolute(true)}
          onMouseLeave={() => setShowAbsolute(false)}
        >
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
            {showAbsolute ? timeLabel(createdAt) : relativeTime(createdAt)}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({ onSend, onTyping }: {
  onSend:    (text: string) => Promise<void>
  onTyping?: () => void
}) {
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try { await onSend(text); setInput('') } finally { setSending(false) }
  }

  const canSend = !!input.trim() && !sending

  return (
    <div style={{ padding: '10px 14px 12px', borderTop: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        border: '0.5px solid var(--color-border-secondary)',
        borderRadius: 13, padding: '7px 7px 7px 14px',
      }}>
        <textarea
          ref={ref}
          value={input}
          onChange={e => { setInput(e.target.value); onTyping?.() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Reply to customer…"
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', fontSize: 13, lineHeight: 1.6,
            color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)',
            overflowY: 'hidden', padding: '3px 0',
          }}
        />
        <button
          onClick={send}
          disabled={!canSend}
          aria-label="Send"
          style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: canSend ? 'var(--color-text-primary)' : 'transparent',
            border: '0.5px solid var(--color-border-secondary)',
            color: canSend ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, transition: 'all 0.15s',
          }}
        >
          {sending ? <i className="ti ti-loader-2 ti-spin" /> : <i className="ti ti-send-2" />}
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

  const bottomRef        = useRef<HTMLDivElement>(null)
  const listRef          = useRef<HTMLDivElement>(null)
  const wasNearBottomRef = useRef(true)
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
    if (wasNearBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    else setShowNew(true)
  }, [messages.length, isTyping])

  const handleSend = useCallback(async (text: string) => {
    await sendMessage(text)
    // Fire-and-forget in-app notification to the customer
    apiClient.support.admin.notifyReply(conversationId).catch(() => {})
  }, [sendMessage, conversationId])

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />
    </div>
  )

  if (!convo) return (
    <div style={{ maxWidth: 480, margin: '5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
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
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
        borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0,
      }}>
        <Link
          href="/admin/support"
          style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', textDecoration: 'none', padding: 4, marginRight: 4 }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 17 }} />
        </Link>

        {/* Customer avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          border: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)',
          overflow: 'hidden', background: 'var(--color-background-secondary)',
        }}>
          {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (user?.displayName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>
            {user?.displayName ?? user?.username ?? 'Unknown user'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      {/* Messages */}
      <div
        ref={listRef}
        style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '3rem 1rem', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, border: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--color-text-secondary)' }}>
              <i className="ti ti-messages" />
            </div>
            <p style={{ ...DISPLAY, fontSize: 18, fontWeight: 300, margin: 0, color: 'var(--color-text-primary)' }}>No messages yet</p>
            <p style={{ fontSize: 12, margin: 0, color: 'var(--color-text-secondary)' }}>The customer hasn't sent anything yet.</p>
          </div>
        )}

        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
              <span style={{
                fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-background-secondary)',
                padding: '3px 12px', borderRadius: 20,
                border: '0.5px solid var(--color-border-tertiary)',
              }}>
                {day}
              </span>
            </div>
            {msgs.map(msg => (
              <Bubble
                key={msg.id}
                text={msg.text ?? ''}
                isMine={msg.user?.id === client?.userID}
                createdAt={msg.created_at}
                isSystem={msg.type === 'system'}
              />
            ))}
          </div>
        ))}

        {isTyping && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '0 4px 4px' }}>Customer is typing…</div>}
        {isTyping && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {showNew && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 5,
          }}
        >
          <i className="ti ti-arrow-down" style={{ fontSize: 12 }} />
          New messages
        </button>
      )}

      <Composer onSend={handleSend} onTyping={sendTyping} />
    </div>
  )
}