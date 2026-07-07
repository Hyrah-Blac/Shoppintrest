'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient }        from '@/lib/api'
import { useSupportChat }   from '@/hooks/useSupportChat'
import { useStreamContext } from '@/components/providers/StreamProvider'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:         '#000',
  surface:    '#0d0d0d',   // bubbles, input, cards
  surfaceHi:  '#141414',   // emoji picker, hover
  border:     'rgba(255,255,255,0.08)',
  red:        '#e60023',   // Pinterest red — the ONLY accent
  textPri:    '#fff',
  textSec:    'rgba(255,255,255,0.55)',
  textMeta:   'rgba(255,255,255,0.38)',
  online:     '#22c55e',
  tickRead:   '#60a5fa',
}

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
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

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Smileys',  emojis: ['😀','😂','🥲','😍','😘','😅','🤔','🙄','😴','😭','😡','🥳','😎','🤗','🙃','😇'] },
  { label: 'Gestures', emojis: ['👍','👎','👏','🙏','💪','🤝','✌️','🤞','👌','🫶','👋','🤙'] },
  { label: 'Hearts',   emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💯','✨','🔥'] },
  { label: 'Objects',  emojis: ['🎉','🎂','☕','📦','💰','📅','✅','❌','⏰','📞','💬','📍'] },
]

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
        background: T.surface,
        border: `0.5px solid ${T.border}`,
        borderRadius: '10px 10px 10px 2px',
        padding: '11px 15px',
      }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: T.textMeta,
            display: 'block',
            animation: `typingBounce 1.2s ${delay}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── Status ticks ─────────────────────────────────────────────────────────────
function Ticks({ status, isRead }: { status?: 'sending' | 'failed' | 'sent'; isRead?: boolean }) {
  if (status === 'sending') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMeta} strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.9s linear infinite', flexShrink: 0 }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    )
  }
  const col = isRead ? T.tickRead : T.textMeta
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" style={{ flexShrink: 0 }}>
      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.139.46.46 0 0 0-.336.139l-.32.323a.45.45 0 0 0 0 .646l2.926 2.926c.094.094.218.146.349.146h.013a.49.49 0 0 0 .363-.183l6.625-8.171a.453.453 0 0 0-.004-.62z" fill={col}/>
      <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-.708-.668-.621.766 1.064 1.005c.094.094.218.146.349.146h.013a.49.49 0 0 0 .363-.183l6.625-8.171a.453.453 0 0 0-.21-.607z" fill={col}/>
    </svg>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ text, isMine, createdAt, isSystem, showTail, status, onRetry }: {
  text: string; isMine: boolean; createdAt?: string | Date
  isSystem?: boolean; showTail?: boolean
  status?: 'sending' | 'failed' | 'sent'; onRetry?: () => void
}) {
  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '6px 0', margin: '4px 0' }}>
        <span style={{
          fontSize: 11.5, color: T.textMeta,
          background: T.surface,
          border: `0.5px solid ${T.border}`,
          padding: '5px 14px', borderRadius: 20,
          display: 'inline-block', lineHeight: 1.5,
        }}>
          {text}
        </span>
      </div>
    )
  }

  const bubbleBg    = isMine ? '#1a0008' : T.surface
  const bubbleColor = isMine ? 'rgba(255,255,255,0.92)' : T.textPri
  const metaColor   = isMine ? 'rgba(255,255,255,0.45)' : T.textMeta

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMine ? 'row-reverse' : 'row',
      margin: '1px 0', padding: '0 8px',
    }}>
      <div style={{
        position: 'relative',
        maxWidth: 'min(74%, calc(100vw - 88px))',
        minWidth: 64,
        background: bubbleBg,
        color: bubbleColor,
        border: `0.5px solid ${isMine ? 'rgba(230,0,35,0.2)' : T.border}`,
        borderRadius: 12,
        borderTopRightRadius: isMine && showTail ? 3 : 12,
        borderTopLeftRadius:  !isMine && showTail ? 3 : 12,
        padding: '8px 10px 8px 12px',
        fontSize: 14.5, lineHeight: 1.5,
        wordBreak: 'break-word',
        userSelect: 'text' as const,
        opacity: status === 'sending' ? 0.65 : 1,
        transition: 'opacity 0.15s',
      }}>
        {/* Tail */}
        {showTail && (
          <svg width="8" height="13" viewBox="0 0 8 13" style={{
            position: 'absolute', top: 0,
            [isMine ? 'right' : 'left']: -8,
            transform: isMine ? 'scaleX(-1)' : 'none',
          }}>
            <path
              d="M1.533.012C.629.144 0 .997 0 2.012v8.149c0 1.13.916 2.046 2.046 2.046h.954c-1.31-1.873-2.16-4.318-2.16-6.85 0-1.99.516-3.86 1.408-5.345C2.395.04 2.04-.04 1.533.012z"
              fill={bubbleBg}
            />
          </svg>
        )}

        {/* Text + timestamp — flex-wrap keeps them from ever overlapping */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 8, rowGap: 3 }}>
          <span style={{ whiteSpace: 'pre-wrap', flex: '1 1 auto', minWidth: 0 }}>
            {text}
          </span>
          <span style={{
            flexShrink: 0, marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, lineHeight: 1,
            color: metaColor,
            whiteSpace: 'nowrap', userSelect: 'none',
          }}>
            {status === 'failed' ? (
              <button onClick={onRetry} style={{
                fontSize: 11, fontWeight: 600, color: '#fbbf24',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
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
    </div>
  )
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'absolute', bottom: '100%', left: 8, marginBottom: 8,
      width: 'min(300px, calc(100vw - 48px))', maxHeight: 'min(280px, 50vh)',
      overflowY: 'auto', background: T.surface,
      border: `0.5px solid ${T.border}`, borderRadius: 14,
      padding: '10px 8px', zIndex: 20,
    }}>
      {EMOJI_GROUPS.map(g => (
        <div key={g.label} style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: T.textMeta, margin: '2px 4px 5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {g.label}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {g.emojis.map(emoji => (
              <button key={emoji} onClick={() => onPick(emoji)} style={{
                width: 36, height: 36, border: 'none', background: 'transparent',
                borderRadius: 8, cursor: 'pointer', fontSize: 22, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = T.surfaceHi)}
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
function Composer({ onSend, onTyping }: { onSend: (t: string) => Promise<void>; onTyping?: () => void }) {
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`
  }, [input])

  const send = useCallback(async () => {
    const text = input.trim(); if (!text || sending) return
    setSending(true)
    try { await onSend(text); setInput('') } finally { setSending(false) }
  }, [input, sending, onSend])

  const insertEmoji = useCallback((emoji: string) => {
    const el = ref.current
    if (!el) { setInput(p => p + emoji); return }
    const start = el.selectionStart ?? input.length
    const end   = el.selectionEnd   ?? input.length
    setInput(input.slice(0, start) + emoji + input.slice(end))
    onTyping?.()
    requestAnimationFrame(() => { el.focus(); const p = start + emoji.length; el.setSelectionRange(p, p) })
  }, [input, onTyping])

  const canSend = !!input.trim() && !sending

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 8,
      padding: '10px 10px',
      paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      background: T.bg,
      borderTop: `0.5px solid ${T.border}`,
      flexShrink: 0, position: 'relative',
    }}>
      {/* Emoji */}
      <button onClick={() => setShowEmoji(v => !v)} aria-label="Emoji"
        style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          border: 'none', background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, lineHeight: 1, transition: 'background 0.12s',
          fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = T.surfaceHi)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >😊</button>

      {showEmoji && <EmojiPicker onPick={insertEmoji} onClose={() => setShowEmoji(false)} />}

      {/* Input */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-end',
        background: T.surface,
        border: `0.5px solid ${T.border}`,
        borderRadius: 22, padding: '0 6px 0 14px', minHeight: 42,
        transition: 'border-color 0.15s',
      }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = T.red)}
        onBlurCapture={e  => (e.currentTarget.style.borderColor = T.border)}
      >
        <textarea ref={ref} value={input}
          onChange={e => { setInput(e.target.value); onTyping?.() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Reply to customer…" rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', fontSize: 15, lineHeight: 1.5,
            color: T.textPri, caretColor: T.red,
            fontFamily: 'var(--font-sans)',
            overflowY: 'hidden', padding: '9px 0', maxHeight: 130,
          }}
        />
      </div>

      {/* Send */}
      <button onClick={send} disabled={!canSend && !sending} aria-label="Send"
        style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          border: 'none', background: T.red, color: '#fff',
          cursor: canSend ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: canSend || sending ? 1 : 0.4,
          transition: 'opacity 0.15s, transform 0.12s',
        }}
        onMouseEnter={e => { if (canSend) e.currentTarget.style.transform = 'scale(1.06)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onMouseDown={e  => { if (canSend) e.currentTarget.style.transform = 'scale(0.93)' }}
        onMouseUp={e    => { if (canSend) e.currentTarget.style.transform = 'scale(1.06)' }}
      >
        {sending
          ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          : <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" /></svg>
        }
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminConversationPage() {
  const params = useParams()
  const conversationId = params.conversationId as string

  const { client, isReady } = useStreamContext()
  const { messages, isLoading, isTyping, openChannel, sendMessage, loadOlderMessages, sendTyping } = useSupportChat(client, isReady)

  const [convo,      setConvo]      = useState<AdminConversation | null>(null)
  const [loaded,     setLoaded]     = useState(false)
  const [optimistic, setOptimistic] = useState<{ id: string; text: string; created_at: string }[]>([])
  const [failedMsgs, setFailedMsgs] = useState<Record<string, string>>({})
  const [showNew,    setShowNew]    = useState(false)

  const listRef              = useRef<HTMLDivElement>(null)
  const wasNearBottomRef     = useRef(true)
  const initialScrollDoneRef = useRef(false)
  const prevScrollHeightRef  = useRef(0)
  const loadingOlderRef      = useRef(false)

  useEffect(() => {
    let cancelled = false
    apiClient.support.admin.getConversation(conversationId)
      .then(res => { if (!cancelled) setConvo(res.data?.data ?? null) })
      .catch(() => { if (!cancelled) setConvo(null) })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [conversationId])

  useEffect(() => {
    if (convo?.streamChannelId && isReady) openChannel(convo.streamChannelId)
  }, [convo?.streamChannelId, isReady, openChannel])

  const isNearBottom = useCallback(() => {
    const el = listRef.current; if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }, [])

  useLayoutEffect(() => {
    const el = listRef.current; if (!el) return
    if (prevScrollHeightRef.current > 0) {
      const diff = el.scrollHeight - prevScrollHeightRef.current
      if (diff > 0) el.scrollTop += diff
      prevScrollHeightRef.current = 0; loadingOlderRef.current = false; return
    }
    if (!initialScrollDoneRef.current) {
      if (isLoading) return
      el.scrollTop = el.scrollHeight; initialScrollDoneRef.current = true; setShowNew(false); return
    }
    if (wasNearBottomRef.current) { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); setShowNew(false) }
    else setShowNew(true)
  }, [messages.length, isTyping, optimistic.length, isLoading])

  useEffect(() => {
    const el = listRef.current; if (!el) return
    let ticking = false
    const handler = () => {
      wasNearBottomRef.current = isNearBottom()
      if (wasNearBottomRef.current) setShowNew(false)
      if (ticking) return; ticking = true
      requestAnimationFrame(() => {
        if (el.scrollTop < 60 && initialScrollDoneRef.current && !loadingOlderRef.current) {
          loadingOlderRef.current = true; prevScrollHeightRef.current = el.scrollHeight
          loadOlderMessages()
          setTimeout(() => { loadingOlderRef.current = false; prevScrollHeightRef.current = 0 }, 1200)
        }
        ticking = false
      })
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [loadOlderMessages, isNearBottom])

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    setShowNew(false); wasNearBottomRef.current = true
  }, [])

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

  useEffect(() => {
    if (optimistic.length === 0) return
    setOptimistic(prev => prev.filter(opt =>
      !messages.some(m =>
        m.user?.id === client?.userID && m.text === opt.text &&
        new Date(m.created_at as string).getTime() >= new Date(opt.created_at).getTime() - 5000
      )
    ))
  }, [messages, optimistic.length, client?.userID])

  const retryFailed = useCallback(async (tempId: string) => {
    const text = failedMsgs[tempId]; if (!text) return
    setFailedMsgs(prev => { const n = { ...prev }; delete n[tempId]; return n })
    await handleSend(text)
  }, [failedMsgs, handleSend])

  const grouped = useMemo(() => {
    const seen = new Set<string>()
    const result: { day: string; msgs: typeof messages }[] = []
    for (const msg of messages) {
      if (seen.has(msg.id)) continue; seen.add(msg.id)
      const day = dayLabel(msg.created_at)
      const last = result[result.length - 1]
      if (last?.day === day) last.msgs.push(msg)
      else result.push({ day, msgs: [msg] })
    }
    return result
  }, [messages])

  const spinner = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.textMeta} strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100dvh - 64px)', background: T.bg }}>
      {spinner}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!convo) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100dvh - 64px)', background: T.bg }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, color: T.textPri, margin: '0 0 14px' }}>Conversation not found</p>
        <Link href="/admin/support" style={{ fontSize: 12, color: T.textMeta, textDecoration: 'underline' }}>← Back to inbox</Link>
      </div>
    </div>
  )

  const user = convo.userId

  return (
    <div style={{
      maxWidth: 760, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - 64px)',
      background: T.bg, position: 'relative',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        borderBottom: `0.5px solid ${T.border}`,
        background: T.bg, flexShrink: 0, zIndex: 2,
      }}>
        <Link href="/admin/support" style={{
          display: 'flex', alignItems: 'center',
          color: T.textMeta, textDecoration: 'none',
          padding: '6px', borderRadius: 8, transition: 'color 0.12s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = T.textPri)}
          onMouseLeave={e => (e.currentTarget.style.color = T.textMeta)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: T.surface, border: `0.5px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: T.textSec,
            overflow: 'hidden',
          }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (user?.displayName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()
            }
          </div>
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: '50%',
            background: T.online, border: `2px solid ${T.bg}`,
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: T.textPri, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName ?? user?.username ?? 'Unknown user'}
          </p>
          <p style={{ fontSize: 12, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isTyping
              ? <span style={{ color: T.red }}>typing…</span>
              : <span style={{ color: T.textSec }}>{user?.email ?? '—'}</span>
            }
          </p>
        </div>

        {user?.username && (
          <Link href={`/profile/${user.username}`} style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: T.textMeta, textDecoration: 'none',
            padding: '5px 12px',
            border: `0.5px solid ${T.border}`,
            borderRadius: 8, flexShrink: 0, transition: 'all 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.textSec; e.currentTarget.style.color = T.textPri }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.color = T.textMeta }}
          >
            Profile
          </Link>
        )}
      </div>

      {/* ── Messages ── */}
      <div ref={listRef} role="log" aria-live="polite" style={{
        flex: 1, overflowY: 'auto',
        padding: '12px 0 8px',
        display: 'flex', flexDirection: 'column',
        background: T.bg,
        overflowAnchor: 'none',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'contain',
      }}>
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>{spinner}</div>
        )}

        {!isLoading && messages.length === 0 && optimistic.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: T.surface, border: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>💬</div>
            <div>
              <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, margin: '0 0 6px', color: T.textPri }}>No messages yet</p>
              <p style={{ fontSize: 13, margin: 0, color: T.textSec, lineHeight: 1.7 }}>The customer hasn't sent anything yet.</p>
            </div>
          </div>
        )}

        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            {/* Day separator */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 10px' }}>
              <span style={{
                fontSize: 10.5, color: T.textMeta,
                padding: '4px 14px', borderRadius: 20,
                fontWeight: 500, letterSpacing: '0.08em',
                border: `0.5px solid ${T.border}`,
                textTransform: 'uppercase',
              }}>
                {day}
              </span>
            </div>

            {msgs.map((msg, idx) => {
              const isMine = msg.user?.id === client?.userID
              const isFirst = !msgs[idx - 1] || msgs[idx - 1].user?.id !== msg.user?.id
              const isLast  = !msgs[idx + 1] || msgs[idx + 1].user?.id !== msg.user?.id
              return (
                <div key={msg.id} style={{ marginTop: isFirst ? 8 : 1, marginBottom: isLast ? 2 : 1 }}>
                  <Bubble text={msg.text ?? ''} isMine={isMine} createdAt={msg.created_at}
                    isSystem={msg.type === 'system'} showTail={isLast} status="sent" />
                </div>
              )
            })}
          </div>
        ))}

        {optimistic.map((m, i) => (
          <div key={m.id} style={{ marginTop: i === 0 ? 8 : 1, marginBottom: 1 }}>
            <Bubble text={m.text} isMine createdAt={m.created_at} status="sending" showTail />
          </div>
        ))}

        {Object.entries(failedMsgs).map(([tempId, text]) => (
          <div key={tempId} style={{ marginTop: 1, marginBottom: 1 }}>
            <Bubble text={text} isMine status="failed" showTail onRetry={() => retryFailed(tempId)} />
          </div>
        ))}

        {isTyping && <div style={{ padding: '4px 8px 2px' }}><TypingDots /></div>}
      </div>

      {/* New messages pill */}
      {showNew && (
        <button onClick={scrollToBottom} style={{
          position: 'absolute',
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          left: '50%', transform: 'translateX(-50%)',
          padding: '7px 18px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
          background: T.red, color: '#fff',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          zIndex: 5,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          New messages
        </button>
      )}

      <Composer onSend={handleSend} onTyping={sendTyping} />

      <style>{`
        @keyframes spin         { to { transform: rotate(360deg) } }
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-6px);opacity:1} }

        /* Scrollbar */
        div::-webkit-scrollbar       { width: 4px }
        div::-webkit-scrollbar-track { background: transparent }
        div::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px }
        div::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14) }

        /* Textarea reset */
        textarea { scrollbar-width: none }
        textarea::placeholder { color: rgba(255,255,255,0.22) !important }
        textarea:focus { outline: none !important; box-shadow: none !important }

        @media (max-width: 480px) {
          .wa-header  { padding: 8px 12px }
          .wa-composer { padding: 6px }
        }
      `}</style>
    </div>
  )
}