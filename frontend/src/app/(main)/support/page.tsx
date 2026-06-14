'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSupportStore } from '@/store/useSupportStore'
import { useSupportChat }  from '@/hooks/useSupportChat'
import { useStreamContext } from '@/components/providers/StreamProvider'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
}

// Brand accent colors — kept consistent regardless of site theme
const WA = {
  tickRead: '#53bdeb', // WhatsApp blue (read receipts)
  tickSent: 'hsl(var(--muted-foreground))',
  accent:   '#00a884', // WhatsApp teal (send button, typing indicator)
  online:   '#25d366', // WhatsApp green (online status)
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
        boxShadow: '0 1px 0.5px hsl(var(--foreground) / 0.06)',
      }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'hsl(var(--muted-foreground))',
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
  text, isMine, createdAt, isSystem, isRead, showTail, status, onRetry, deleted,
}: {
  text: string
  isMine: boolean
  createdAt?: string | Date
  isSystem?: boolean
  isRead?: boolean
  showTail?: boolean
  status?: 'sending' | 'failed' | 'sent'
  onRetry?: () => void
  deleted?: boolean
}) {
  if (deleted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: isMine ? 'row-reverse' : 'row',
        margin: '2px 0',
        padding: '0 6px',
      }}>
        <div style={{
          fontSize: 13.5, fontStyle: 'italic',
          color: 'var(--wa-meta)',
          background: 'var(--wa-bubble-in)',
          padding: '6px 12px',
          borderRadius: 7.5,
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 1px 0.5px hsl(var(--foreground) / 0.06)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/>
          </svg>
          This message was deleted
        </div>
      </div>
    )
  }

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '6px 0', margin: '6px 0' }}>
        <span style={{
          fontSize: 12.5, color: 'var(--wa-meta)',
          background: 'var(--wa-system-bg)',
          padding: '6px 12px', borderRadius: 8,
          display: 'inline-block', lineHeight: 1.5,
          maxWidth: '90%',
          boxShadow: '0 1px 0.5px hsl(var(--foreground) / 0.06)',
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
          maxWidth: 'min(76%, calc(100vw - 96px))',
          minWidth: 60,
          background: isMine ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)',
          color: isMine ? 'var(--wa-text-out)' : 'var(--wa-text-in)',
          borderRadius: 7.5,
          borderTopRightRadius: isMine && showTail ? 0 : 7.5,
          borderTopLeftRadius: !isMine && showTail ? 0 : 7.5,
          padding: '6px 7px 8px 9px',
          fontSize: 14.5,
          lineHeight: 1.45,
          boxShadow: '0 1px 0.5px hsl(var(--foreground) / 0.06)',
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
              className="wa-retry-btn"
              onClick={onRetry}
              style={{
                fontSize: 11, fontWeight: 600, color: 'hsl(var(--destructive))',
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
              {isMine && <Ticks status={status} isRead={isRead} />}
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
      className="wa-emoji-picker"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 8,
        marginBottom: 8,
        width: 'min(300px, calc(100vw - 48px))',
        maxHeight: 'min(280px, 50vh)',
        overflowY: 'auto',
        background: 'var(--wa-input-bg)',
        borderRadius: 12,
        boxShadow: '0 4px 24px hsl(var(--foreground) / 0.1)',
        border: '0.5px solid hsl(var(--border) / 0.6)',
        padding: '10px 8px',
        zIndex: 20,
      }}
    >
      {EMOJI_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 6 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))',
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
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
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
    <div
      className="wa-composer"
      style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '8px 8px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        background: 'var(--wa-composer-bg)',
        borderTop: '0.5px solid hsl(var(--border) / 0.6)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Emoji button */}
      <button
        className="wa-icon-btn"
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
        className="wa-input-wrap"
        style={{
          flex: 1, display: 'flex', alignItems: 'flex-end',
          background: 'var(--wa-input-bg)',
          borderRadius: 24, padding: '0 6px 0 16px',
          minHeight: 42,
          border: '1px solid transparent',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <textarea
          ref={ref}
          value={input}
          onChange={e => { setInput(e.target.value); onTyping?.() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Message"
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', fontSize: 16, lineHeight: 1.5,
            color: 'hsl(var(--foreground))', caretColor: 'hsl(var(--foreground))',
            fontFamily: 'var(--font-sans)',
            overflowY: 'hidden', padding: '9px 0', maxHeight: 130,
          }}
        />
      </div>

      <button
        className="wa-send-btn"
        onClick={send}
        disabled={!canSend && !sending}
        aria-label="Send message"
        style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          border: 'none',
          background: WA.accent,
          color: 'hsl(var(--primary-foreground))',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s, opacity 0.15s',
          opacity: canSend || sending ? 1 : 0.5,
          transform: canSend ? undefined : 'scale(0.92)',
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
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { conversation, isLoaded, load } = useSupportStore()
  const { client, isReady }              = useStreamContext()
  const {
    messages, isLoading, isTyping, readBy,
    openChannel, sendMessage, loadOlderMessages, sendTyping,
  } = useSupportChat(client, isReady)

  const listRef          = useRef<HTMLDivElement>(null)
  const wasNearBottomRef = useRef(true)

  // Scroll bookkeeping
  const channelIdRef         = useRef<string | null>(null)
  const initialScrollDoneRef = useRef(false)
  const prevScrollHeightRef  = useRef(0)
  const loadingOlderRef      = useRef(false)

  const [showNew,     setShowNew]     = useState(false)
  const [optimistic,  setOptimistic]  = useState<{ id: string; text: string; created_at: string }[]>([])
  const [failedMsgs,  setFailedMsgs]  = useState<Record<string, string>>({})
  const [deletedIds,  setDeletedIds]  = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (conversation?.streamChannelId && isReady) openChannel(conversation.streamChannelId)
  }, [conversation?.streamChannelId, isReady, openChannel])

  // Reset scroll bookkeeping whenever we switch to a different channel
  useEffect(() => {
    if (conversation?.streamChannelId !== channelIdRef.current) {
      channelIdRef.current        = conversation?.streamChannelId ?? null
      initialScrollDoneRef.current = false
      prevScrollHeightRef.current  = 0
      loadingOlderRef.current      = false
      wasNearBottomRef.current     = true
      setShowNew(false)
    }
  }, [conversation?.streamChannelId])

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

  // Optimistic send
  const handleSend = useCallback(async (text: string) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const sentAt = new Date().toISOString()
    setOptimistic(prev => [...prev, { id: tempId, text, created_at: sentAt }])
    wasNearBottomRef.current = true
    try {
      await sendMessage(text)
    } catch {
      setOptimistic(prev => prev.filter(m => m.id !== tempId))
      setFailedMsgs(prev => ({ ...prev, [tempId]: text }))
    }
  }, [sendMessage])

  // Drop optimistic copy once real message syncs
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

  const lastMineRead = useMemo(() => {
    const mine = [...messages].reverse().find(m => m.user?.id === client?.userID)
    if (!mine?.created_at) return false
    return Object.values(readBy).some(
      ts => new Date(ts).getTime() >= new Date(mine.created_at as string).getTime()
    )
  }, [messages, readBy, client?.userID])

  const lastMineId = useMemo(() =>
    [...messages].reverse().find(m => m.user?.id === client?.userID)?.id
  , [messages, client?.userID])

  return (
    <div
      className="wa-chat-root"
      style={{
        maxWidth: 680, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}
    >

      {/* ── Header ── */}
      <div className="wa-header" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        borderBottom: '0.5px solid hsl(var(--border) / 0.6)',
        flexShrink: 0,
        background: 'var(--wa-header-bg)',
        zIndex: 2,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'hsl(var(--muted))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'hsl(var(--muted-foreground))',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <span style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 11, height: 11, borderRadius: '50%',
            background: WA.online,
            border: '2px solid var(--wa-header-bg)',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15.5, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.25 }}>
            Support Team
          </p>
          <p style={{ fontSize: 12.5, margin: '2px 0 0' }}>
            {isTyping
              ? <span style={{ color: WA.accent }}>typing…</span>
              : <span style={{ color: WA.online, fontWeight: 500 }}>online</span>}
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={listRef}
        className="wa-msg-list"
        role="log"
        aria-live="polite"
        style={{
          flex: 1, overflowY: 'auto',
          padding: '10px 0 8px',
          display: 'flex', flexDirection: 'column',
          background: 'var(--wa-bg-chat)',
          backgroundImage: `
            radial-gradient(circle at 20% 20%, hsl(var(--foreground) / 0.035) 0%, transparent 35%),
            radial-gradient(circle at 80% 0%, hsl(var(--foreground) / 0.03) 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, hsl(var(--foreground) / 0.035) 0%, transparent 35%),
            radial-gradient(circle at 10% 70%, hsl(var(--foreground) / 0.03) 0%, transparent 35%)
          `,
          overflowAnchor: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
        }}
      >
        {(isLoading || !isLoaded) && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}

        {!isLoading && isLoaded && messages.length === 0 && optimistic.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, padding: '3rem 2rem', textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'hsl(var(--muted))',
              border: '0.5px solid hsl(var(--border) / 0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              👋
            </div>
            <div>
              <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, margin: '0 0 6px', color: 'hsl(var(--foreground))' }}>
                Hi there!
              </p>
              <p style={{ fontSize: 13, margin: 0, color: 'hsl(var(--muted-foreground))', lineHeight: 1.7, maxWidth: 260 }}>
                Got a question or need help with an order? Send us a message — we're here.
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
                boxShadow: '0 1px 0.5px hsl(var(--foreground) / 0.06)',
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
              const isLastMineOverall = isMine && msg.id === lastMineId
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
                    isRead={isMine ? (isLastMineOverall ? lastMineRead : true) : undefined}
                    showTail={isLast}
                    status="sent"
                    deleted={deletedIds.has(msg.id) || msg.deleted_at != null}
                  />
                </div>
              )
            })}
          </div>
        ))}

        {/* Optimistic messages */}
        {optimistic.map((m, i) => (
          <div key={m.id} style={{ marginTop: i === 0 ? 6 : 1, marginBottom: 1 }}>
            <Bubble text={m.text} isMine createdAt={m.created_at} status="sending" showTail />
          </div>
        ))}

        {/* Failed messages */}
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
            position: 'absolute',
            bottom: 'calc(80px + env(safe-area-inset-bottom))',
            left: '50%', transform: 'translateX(-50%)',
            padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: WA.accent, color: 'hsl(var(--primary-foreground))',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 16px hsl(var(--foreground) / 0.15)', zIndex: 5,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          New messages
        </button>
      )}

      <Composer onSend={handleSend} onTyping={sendTyping} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .wa-chat-root {
          height: calc(100vh - 64px);
          --wa-bg-chat: hsl(var(--background));
          --wa-bubble-out: hsl(var(--primary));
          --wa-bubble-in: hsl(var(--card));
          --wa-text-out: hsl(var(--primary-foreground));
          --wa-text-in: hsl(var(--foreground));
          --wa-meta: hsl(var(--muted-foreground));
          --wa-meta-out: hsl(var(--primary-foreground) / 0.75);
          --wa-system-bg: hsl(var(--card));
          --wa-header-bg: hsl(var(--background));
          --wa-composer-bg: hsl(var(--background));
          --wa-input-bg: hsl(var(--muted));
          --wa-icon: hsl(var(--muted-foreground));
        }

        @supports (height: 100dvh) {
          .wa-chat-root { height: calc(100dvh - 64px); }
        }

        /* ── Themed scrollbars ── */
        .wa-msg-list, .wa-emoji-picker {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) transparent;
        }
        .wa-msg-list::-webkit-scrollbar, .wa-emoji-picker::-webkit-scrollbar {
          width: 6px;
        }
        .wa-msg-list::-webkit-scrollbar-thumb, .wa-emoji-picker::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 999px;
        }
        .wa-msg-list::-webkit-scrollbar-track, .wa-emoji-picker::-webkit-scrollbar-track {
          background: transparent;
        }

        /* ── Composer input states ── */
        .wa-composer textarea::placeholder {
          color: hsl(var(--muted-foreground));
          opacity: 1;
        }
        .wa-input-wrap:focus-within {
          border-color: hsl(var(--primary) / 0.5);
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.15);
        }

        /* ── Button hover/active feedback ── */
        .wa-icon-btn {
          transition: background-color 0.15s, color 0.15s;
        }
        .wa-icon-btn:hover {
          background: hsl(var(--muted));
        }
        .wa-send-btn {
          transition: transform 0.15s, opacity 0.15s, filter 0.15s;
        }
        .wa-send-btn:hover:not(:disabled) {
          filter: brightness(1.08);
        }
        .wa-send-btn:active:not(:disabled) {
          transform: scale(0.94);
        }
        .wa-retry-btn {
          transition: opacity 0.15s;
        }
        .wa-retry-btn:hover {
          opacity: 0.7;
        }

        /* ── Small-screen polish ── */
        @media (max-width: 480px) {
          .wa-header { padding: 8px 12px; }
          .wa-msg-list { padding: 8px 0 6px; }
          .wa-composer { padding: 6px; }
        }
      `}</style>
    </div>
  )
}