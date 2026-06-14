'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient }        from '@/lib/api'
import { useSupportChat }   from '@/hooks/useSupportChat'
import { useStreamContext } from '@/components/providers/StreamProvider'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

// WhatsApp palette
const WA = {
  bubbleOutLt: '#d9fdd3',
  bubbleInLt:  '#ffffff',
  textOutLt:   '#111b21',
  textInLt:    '#111b21',
  tickRead:    '#53bdeb',
  tickSent:    '#8696a0',
  accent:      '#00a884',
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

// A compact, commonly-used emoji set rendered with the system/Apple emoji font
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: ['😀','😂','🥲','😍','😘','😅','🤔','🙄','😴','😭','😡','🥳','😎','🤗','🙃','😇'],
  },
  {
    label: 'Gestures',
    emojis: ['👍','👎','👏','🙏','💪','🤝','✌️','🤞','👌','🫶','👋','🤙'],
  },
  {
    label: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💯','✨','🔥'],
  },
  {
    label: 'Objects',
    emojis: ['🎉','🎂','☕','📦','💰','📅','✅','❌','⏰','📞','💬','📍'],
  },
]

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
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--wa-bubble-in)',
        borderRadius: '7.5px 7.5px 7.5px 0px',
        padding: '10px 14px',
        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
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

// ─── Status ticks ─────────────────────────────────────────────────────────────

function Ticks({ status, isRead }: { status?: 'sending' | 'failed' | 'sent'; isRead?: boolean }) {
  if (status === 'sending') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={WA.tickSent} strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.9s linear infinite', flexShrink: 0 }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    )
  }
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" style={{ flexShrink: 0 }}>
      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.139.46.46 0 0 0-.336.139l-.32.323a.45.45 0 0 0 0 .646l2.926 2.926c.094.094.218.146.349.146h.013a.49.49 0 0 0 .363-.183l6.625-8.171a.453.453 0 0 0-.004-.62z" fill={isRead ? WA.tickRead : WA.tickSent}/>
      <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-.708-.668-.621.766 1.064 1.005c.094.094.218.146.349.146h.013a.49.49 0 0 0 .363-.183l6.625-8.171a.453.453 0 0 0-.21-.607z" fill={isRead ? WA.tickRead : WA.tickSent}/>
    </svg>
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
  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '6px 0', margin: '6px 0' }}>
        <span style={{
          fontSize: 12.5, color: 'var(--wa-meta)',
          background: 'var(--wa-system-bg)',
          padding: '6px 12px', borderRadius: 8,
          display: 'inline-block', lineHeight: 1.5,
          maxWidth: '90%',
          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
        }}>
          {text}
        </span>
      </div>
    )
  }

  const metaWidth = isMine ? 64 : 50

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMine ? 'row-reverse' : 'row',
      margin: '1px 0',
      padding: '0 6px',
    }}>
      <div
        style={{
          position: 'relative',
          maxWidth: '76%',
          minWidth: 60,
          background: isMine ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)',
          color: isMine ? 'var(--wa-text-out)' : 'var(--wa-text-in)',
          borderRadius: 7.5,
          borderTopRightRadius: isMine && showTail ? 0 : 7.5,
          borderTopLeftRadius: !isMine && showTail ? 0 : 7.5,
          padding: '6px 7px 8px 9px',
          fontSize: 14.5,
          lineHeight: 1.45,
          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
          wordBreak: 'break-word',
          userSelect: 'text' as const,
          opacity: status === 'sending' ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {/* Tail */}
        {showTail && (
          <svg
            width="8" height="13" viewBox="0 0 8 13"
            style={{
              position: 'absolute',
              top: 0,
              [isMine ? 'right' : 'left']: -8,
              transform: isMine ? 'scaleX(-1)' : 'none',
            }}
          >
            <path
              d="M1.533.012C.629.144 0 .997 0 2.012v8.149c0 1.13.916 2.046 2.046 2.046h.954c-1.31-1.873-2.16-4.318-2.16-6.85 0-1.99.516-3.86 1.408-5.345C2.395.04 2.04-.04 1.533.012z"
              fill={isMine ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)'}
            />
          </svg>
        )}

        {/* Message text with reserved trailing space for meta */}
        <span style={{ whiteSpace: 'pre-wrap' }}>
          {text}
          <span style={{
            display: 'inline-block',
            width: metaWidth,
            height: 1,
            verticalAlign: 'bottom',
          }} />
        </span>

        {/* Meta (time + ticks), absolutely positioned bottom-right */}
        <span style={{
          position: 'absolute',
          right: 9, bottom: 6,
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 11, lineHeight: 1,
          color: isMine ? 'var(--wa-meta-out)' : 'var(--wa-meta)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
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
              Retry
            </button>
          ) : (
            <>
              <span>{timeLabel(createdAt)}</span>
              {isMine && <Ticks status={status} />}
            </>
          )}
        </span>
      </div>
    </div>
  )
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 8,
        marginBottom: 8,
        width: 300,
        maxHeight: 280,
        overflowY: 'auto',
        background: 'var(--wa-input-bg)',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        border: '0.5px solid var(--color-border-tertiary)',
        padding: '10px 8px',
        zIndex: 20,
      }}
    >
      {EMOJI_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 6 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)',
            margin: '2px 4px 4px', textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {group.label}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {group.emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => onPick(emoji)}
                aria-label={`Insert ${emoji}`}
                style={{
                  width: 36, height: 36, border: 'none', background: 'transparent',
                  borderRadius: 8, cursor: 'pointer',
                  fontSize: 22, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
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
  const [showEmoji, setShowEmoji] = useState(false)
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

  const insertEmoji = useCallback((emoji: string) => {
    const el = ref.current
    if (!el) {
      setInput(prev => prev + emoji)
      return
    }
    const start = el.selectionStart ?? input.length
    const end   = el.selectionEnd ?? input.length
    const next  = input.slice(0, start) + emoji + input.slice(end)
    setInput(next)
    onTyping?.()
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }, [input, onTyping])

  return (
    <div style={{
      borderTop: '0.5px solid var(--color-border-tertiary)',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '8px 8px',
        background: 'var(--wa-composer-bg)',
        position: 'relative',
      }}>
        {/* Emoji button */}
        <button
          onClick={() => setShowEmoji(v => !v)}
          aria-label="Open emoji picker"
          aria-expanded={showEmoji}
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: showEmoji ? WA.accent : 'var(--wa-icon)',
            fontSize: 22, lineHeight: 1,
            fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
            transition: 'color 0.15s',
          }}
        >
          😊
        </button>

        {showEmoji && (
          <EmojiPicker onPick={insertEmoji} onClose={() => setShowEmoji(false)} />
        )}

        <div
          style={{
            flex: 1, display: 'flex', alignItems: 'flex-end',
            background: 'var(--wa-input-bg)',
            borderRadius: 24, padding: '0 6px 0 16px',
            minHeight: 42,
          }}
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
              color: 'var(--wa-text-in)', fontFamily: 'var(--font-sans)',
              overflowY: 'hidden', padding: '10px 0', maxHeight: 130,
            }}
          />
        </div>

        <button
          onClick={send}
          disabled={!canSend && !sending}
          aria-label="Send message"
          style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            border: 'none',
            background: WA.accent,
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s, opacity 0.15s',
            opacity: canSend || sending ? 1 : 0.5,
            transform: canSend ? 'scale(1)' : 'scale(0.92)',
          }}
        >
          {sending ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
            </svg>
          )}
        </button>
      </div>
      <p style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--color-text-secondary)', textAlign: 'center', margin: 0, padding: '0 0 8px' }}>
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

  const listRef          = useRef<HTMLDivElement>(null)
  const wasNearBottomRef = useRef(true)
  const [showNew, setShowNew] = useState(false)

  // Scroll bookkeeping
  const initialScrollDoneRef = useRef(false)
  const prevScrollHeightRef  = useRef(0)
  const loadingOlderRef      = useRef(false)

  // Fetch conversation meta
  useEffect(() => {
    let cancelled = false
    apiClient.support.admin.getConversation(conversationId)
      .then(res => { if (!cancelled) setConvo(res.data?.data ?? null) })
      .catch(() => { if (!cancelled) setConvo(null) })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [conversationId])

  // Open Stream channel — wait for BOTH convo meta AND Stream client to be ready.
  useEffect(() => {
    if (convo?.streamChannelId && isReady) openChannel(convo.streamChannelId)
  }, [convo?.streamChannelId, isReady, openChannel])

  const isNearBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }, [])

  // ── Scroll handling ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return

    if (prevScrollHeightRef.current > 0) {
      const diff = el.scrollHeight - prevScrollHeightRef.current
      if (diff > 0) el.scrollTop += diff
      prevScrollHeightRef.current = 0
      loadingOlderRef.current = false
      return
    }

    if (!initialScrollDoneRef.current) {
      if (isLoading) return
      el.scrollTop = el.scrollHeight
      initialScrollDoneRef.current = true
      setShowNew(false)
      return
    }

    if (wasNearBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      setShowNew(false)
    } else {
      setShowNew(true)
    }
  }, [messages.length, isTyping, optimistic.length, isLoading])

  // Track scroll position + trigger pagination near the top
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    let ticking = false
    const handler = () => {
      wasNearBottomRef.current = isNearBottom()
      if (wasNearBottomRef.current) setShowNew(false)
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        if (
          el.scrollTop < 60 &&
          initialScrollDoneRef.current &&
          !loadingOlderRef.current
        ) {
          loadingOlderRef.current = true
          prevScrollHeightRef.current = el.scrollHeight
          loadOlderMessages()
          setTimeout(() => {
            loadingOlderRef.current = false
            prevScrollHeightRef.current = 0
          }, 1200)
        }
        ticking = false
      })
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [loadOlderMessages, isNearBottom])

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    setShowNew(false)
    wasNearBottomRef.current = true
  }, [])

  // Optimistic send — shows reply instantly, replaces when real one arrives
  const handleSend = useCallback(async (text: string) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const sentAt = new Date().toISOString()
    setOptimistic(prev => [...prev, { id: tempId, text, created_at: sentAt }])
    wasNearBottomRef.current = true
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
    <div
      style={{
        maxWidth: 760, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        height: 'calc(100dvh - 64px)',
        position: 'relative',
        '--wa-bg-chat': 'var(--color-background-primary)',
        '--wa-bubble-out': WA.bubbleOutLt,
        '--wa-bubble-in': WA.bubbleInLt,
        '--wa-text-out': WA.textOutLt,
        '--wa-text-in': WA.textInLt,
        '--wa-meta': 'rgba(0,0,0,0.45)',
        '--wa-meta-out': 'rgba(0,0,0,0.45)',
        '--wa-system-bg': '#ffffff',
        '--wa-header-bg': 'var(--color-background-primary)',
        '--wa-composer-bg': 'var(--color-background-primary)',
        '--wa-input-bg': 'var(--color-background-secondary)',
        '--wa-icon': 'var(--color-text-secondary)',
      } as React.CSSProperties}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        flexShrink: 0,
        background: 'var(--wa-header-bg)',
        zIndex: 2,
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
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--color-background-secondary)',
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
            position: 'absolute', bottom: -1, right: -1,
            width: 11, height: 11, borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid var(--wa-header-bg)',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName ?? user?.username ?? 'Unknown user'}
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isTyping
              ? <span style={{ color: WA.accent }}>typing…</span>
              : (user?.email ?? '—')}
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
          padding: '10px 0 8px',
          display: 'flex', flexDirection: 'column',
          background: 'var(--wa-bg-chat)',
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(120,120,120,0.035) 0%, transparent 35%),
            radial-gradient(circle at 80% 0%, rgba(120,120,120,0.03) 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, rgba(120,120,120,0.035) 0%, transparent 35%),
            radial-gradient(circle at 10% 70%, rgba(120,120,120,0.03) 0%, transparent 35%)
          `,
          overflowAnchor: 'none',
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
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
              <span style={{
                fontSize: 12.5, color: 'var(--wa-meta)',
                background: 'var(--wa-system-bg)',
                padding: '5px 12px', borderRadius: 8,
                fontWeight: 500,
                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
              }}>
                {day}
              </span>
            </div>

            {msgs.map((msg, idx) => {
              const isMine  = msg.user?.id === client?.userID
              const prevMsg = msgs[idx - 1]
              const nextMsg = msgs[idx + 1]
              const isFirst = !prevMsg || prevMsg.user?.id !== msg.user?.id
              const isLast  = !nextMsg || nextMsg.user?.id !== msg.user?.id
              return (
                <div
                  key={msg.id}
                  style={{
                    marginTop: isFirst ? 6 : 1,
                    marginBottom: isLast ? 2 : 1,
                  }}
                >
                  <Bubble
                    text={msg.text ?? ''}
                    isMine={isMine}
                    createdAt={msg.created_at}
                    isSystem={msg.type === 'system'}
                    showTail={isLast}
                    status="sent"
                  />
                </div>
              )
            })}
          </div>
        ))}

        {/* Optimistic admin replies */}
        {optimistic.map((m, i) => (
          <div key={m.id} style={{ marginTop: i === 0 ? 6 : 1, marginBottom: 1 }}>
            <Bubble text={m.text} isMine createdAt={m.created_at} status="sending" showTail />
          </div>
        ))}

        {/* Failed sends */}
        {Object.entries(failedMsgs).map(([tempId, text]) => (
          <div key={tempId} style={{ marginTop: 1, marginBottom: 1 }}>
            <Bubble text={text} isMine status="failed" showTail onRetry={() => retryFailed(tempId)} />
          </div>
        ))}

        {isTyping && (
          <div style={{ padding: '4px 6px 2px' }}>
            <TypingDots />
          </div>
        )}
      </div>

      {/* New messages pill */}
      {showNew && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: WA.accent, color: '#ffffff',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)', zIndex: 5,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          New messages
        </button>
      )}

      <Composer onSend={handleSend} onTyping={sendTyping} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}