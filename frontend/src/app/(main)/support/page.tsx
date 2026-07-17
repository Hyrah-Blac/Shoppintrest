'use client'

// PATH: src/app/(main)/support/page.tsx

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Parisienne } from 'next/font/google'
import { useSupportStore } from '@/store/useSupportStore'
import { useSupportChat }  from '@/hooks/useSupportChat'
import { useStreamContext } from '@/components/providers/StreamProvider'

const parisienne = Parisienne({ weight: '400', subsets: ['latin'], display: 'swap' })
const ease = [0.22, 1, 0.36, 1] as const

// ─── Shared type tokens (mirrors HeroSection / Footer / Contact) ──────────
//
// Previously this page used Cormorant Garamond for its one display moment
// and left everything else on the browser default — inconsistent with the
// Playfair Display / DM Sans pairing used everywhere else on the site.

const DISPLAY: React.CSSProperties = {
  fontFamily: '"Playfair Display", var(--font-display, Georgia), serif',
}
const UTILITY: React.CSSProperties = {
  fontFamily: '"DM Sans", system-ui, sans-serif',
}

// Brand accent — literal Pinterest red, so this reads as an exact brand
// match rather than an approximation via the generic theme accent token.
// Read receipts keep their conventional WhatsApp blue (a recognizable
// affordance, deliberately distinct from brand). The support avatar's
// status indicator is a rotating green halo instead of a plain dot.
const PINTEREST_RED = '#E60023'
const BUBBLE_GRADIENT = `linear-gradient(135deg, #ff3f59 0%, ${PINTEREST_RED} 55%, #b8001c 100%)`

const WA = {
  tickRead: '#53bdeb',
  tickSent: 'var(--wa-meta)',
  accent:   PINTEREST_RED,
  accentInk: '#ffffff',
  online:   '#25d366',
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
        boxShadow: '0 1px 0.5px hsl(0 0% 0% / 0.24)',
      }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--wa-meta)',
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
    <AnimatePresence mode="wait" initial={false}>
      <motion.svg
        key={isRead ? 'read' : 'sent'}
        width="16" height="11" viewBox="0 0 16 11" fill="none"
        style={{ flexShrink: 0 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.139.46.46 0 0 0-.336.139l-.32.323a.45.45 0 0 0 0 .646l2.926 2.926c.094.094.218.146.349.146h.013a.49.49 0 0 0 .363-.183l6.625-8.171a.453.453 0 0 0-.004-.62z" fill={isRead ? WA.tickRead : WA.tickSent}/>
        <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-.708-.668-.621.766 1.064 1.005c.094.094.218.146.349.146h.013a.49.49 0 0 0 .363-.183l6.625-8.171a.453.453 0 0 0-.21-.607z" fill={isRead ? WA.tickRead : WA.tickSent}/>
      </motion.svg>
    </AnimatePresence>
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
          ...UTILITY,
          fontSize: 13.5, fontStyle: 'italic',
          color: 'var(--wa-meta)',
          background: 'var(--wa-bubble-in)',
          padding: '6px 12px',
          borderRadius: 7.5,
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 1px 0.5px hsl(0 0% 0% / 0.24)',
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
          ...UTILITY,
          fontSize: 12.5, color: 'var(--wa-meta)',
          background: 'var(--wa-system-bg)',
          padding: '6px 12px', borderRadius: 8,
          display: 'inline-block', lineHeight: 1.5,
          maxWidth: '90%',
          boxShadow: '0 1px 0.5px hsl(0 0% 0% / 0.24)',
        }}>
          {text}
        </span>
      </div>
    )
  }

  const metaBadgeStyle: React.CSSProperties = {
    ...UTILITY,
    display: 'flex', alignItems: 'center', gap: 3,
    fontSize: 11, fontWeight: 500, lineHeight: 1,
    padding: '1px 5px',
    borderRadius: 6,
    whiteSpace: 'nowrap',
  }

  const metaContent = status === 'failed' ? (
    <button
      className="wa-retry-btn"
      onClick={onRetry}
      tabIndex={-1}
      style={{
        ...UTILITY,
        fontSize: 11, fontWeight: 600, color: '#ffd9a0',
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
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        flexDirection: isMine ? 'row-reverse' : 'row',
        margin: '1px 0',
        padding: '0 6px',
      }}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: 'min(78%, 440px)',
          minWidth: 60,
          background: isMine ? BUBBLE_GRADIENT : 'var(--wa-bubble-in)',
          color: isMine ? 'var(--wa-text-out)' : 'var(--wa-text-in)',
          borderRadius: 16,
          borderTopRightRadius: isMine && showTail ? 4 : 16,
          borderTopLeftRadius: !isMine && showTail ? 4 : 16,
          padding: '7px 8px 9px 10px',
          fontSize: 14.5,
          lineHeight: 1.45,
          boxShadow: isMine
            ? `0 6px 18px -4px ${PINTEREST_RED}66, inset 0 1px 0 hsl(0 0% 100% / 0.16), 0 1px 0.5px hsl(0 0% 0% / 0.3)`
            : '0 1px 0.5px hsl(0 0% 0% / 0.24)',
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
              fill={isMine ? PINTEREST_RED : 'var(--wa-bubble-in)'}
            />
          </svg>
        )}

        {/* Message text, with an invisible clone of the real meta badge
            reserved inline right after it — guarantees the blank gap left
            for the visible badge always matches its actual width exactly,
            instead of guessing a fixed pixel number that drifts out of
            sync with real content (this is what caused the badge to
            overlap short messages). */}
        <span style={{ ...UTILITY, whiteSpace: 'pre-wrap' }}>
          {text}
          <span
            aria-hidden
            style={{ ...metaBadgeStyle, display: 'inline-flex', visibility: 'hidden' }}
          >
            {metaContent}
          </span>
        </span>

        {/* Meta (time + ticks, or retry), absolutely positioned bottom-right */}
        <span style={{
          ...metaBadgeStyle,
          position: 'absolute',
          right: 6, bottom: 5,
          background: isMine ? 'hsl(0 0% 100% / 0.14)' : 'hsl(var(--foreground) / 0.06)',
          color: isMine ? 'var(--wa-meta-out)' : 'var(--wa-meta)',
          userSelect: 'none',
        }}>
          {metaContent}
        </span>
      </div>
    </motion.div>
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
        width: 'min(300px, calc(100% - 16px))',
        maxHeight: 'min(280px, 50vh)',
        overflowY: 'auto',
        background: 'var(--wa-input-bg)',
        borderRadius: 12,
        boxShadow: '0 4px 24px hsl(0 0% 0% / 0.5)',
        padding: '10px 8px',
        zIndex: 20,
      }}
    >
      {EMOJI_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 6 }}>
          <p style={{
            ...UTILITY,
            fontSize: 11, fontWeight: 600, color: 'var(--wa-meta)',
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
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--wa-surface-hover)')}
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
        // Reserve extra bottom clearance (via --fab-clearance, set to 0 on
        // this route by hiding the global floating chat button — see the
        // root-layout note at the bottom of this file) so the send button
        // is never geometrically covered by a floating action button.
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px) + var(--fab-clearance, 0px))',
        background: 'var(--wa-composer-bg)',
        flexShrink: 0,
        position: 'relative',
        // Own stacking context above everything else in the chat card,
        // so nothing inside this component tree can ever render on top
        // of the input or the send button.
        zIndex: 10,
      }}
    >
      {/* Emoji button */}
      <button
        className="wa-icon-btn"
        onClick={() => setShowEmoji(v => !v)}
        aria-label="Open emoji picker"
        aria-expanded={showEmoji}
        style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          border: 'none', background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: showEmoji ? WA.accent : 'var(--wa-icon)',
          fontSize: 22, lineHeight: 1,
          fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
          transition: 'color 0.15s',
        }}
      >
        <motion.span
          key={String(showEmoji)}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-block' }}
        >
          😊
        </motion.span>
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
          minHeight: 44,
          transition: 'box-shadow 0.15s',
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
            ...UTILITY,
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', fontSize: 16, lineHeight: 1.5,
            color: 'var(--wa-text-in)', caretColor: 'var(--wa-text-in)',
            overflowY: 'hidden', padding: '9px 0', maxHeight: 130,
          }}
        />
      </div>

      <motion.button
        className="wa-send-btn"
        onClick={send}
        disabled={!canSend && !sending}
        aria-label="Send message"
        whileTap={canSend ? { scale: 0.82, rotate: -12 } : undefined}
        style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          border: 'none',
          background: WA.accent,
          color: WA.accentInk,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.15s, box-shadow 0.2s',
          opacity: canSend || sending ? 1 : 0.5,
          position: 'relative',
          zIndex: 1,
        }}
        animate={{ scale: canSend ? 1 : 0.92 }}
        transition={{ duration: 0.15 }}
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
      </motion.button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const grainId = useId()
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
    const seen   = new Set<string>()
    const result: { day: string; msgs: typeof messages }[] = []
    for (const msg of messages) {
      if (seen.has(msg.id)) continue
      seen.add(msg.id)
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
    <div className="relative overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Faint radial wash — same restrained-glow language as Contact/Hero.
          Hidden on mobile since the chat card goes full-screen there and
          would otherwise sit underneath it, unseen and wasted. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[420px] z-0 hidden sm:block"
        style={{ background: `radial-gradient(closest-side, ${PINTEREST_RED}14, transparent 70%)` }}
      />

      <div className="container-narrow relative z-10 sm:[padding-block:clamp(1.25rem,5vw,4rem)]">

        {/* ── Chat card ──
            Mobile (< sm): breaks out of the padded/max-width container and
            fills the viewport *below the navbar* edge-to-edge, using
            `--navbar-height` (set in the root layout / globals.css) rather
            than a hardcoded offset, and `100dvh` math so it tracks the
            on-screen keyboard correctly. It sits under the navbar in the
            stacking order (z-40 vs. the navbar's z-50) and never overlaps it.
            Tablet/desktop (>= sm): reverts to the original static, rounded,
            height-capped card sitting inside the page layout. */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="
            wa-chat-card
            fixed inset-x-0 bottom-0 z-40 rounded-none overflow-hidden
            sm:static sm:inset-auto sm:z-auto
            sm:rounded-[28px]
            sm:h-[min(600px,76dvh)] lg:h-[min(660px,72dvh)]
          "
          style={{
            boxShadow: '0 20px 40px -20px hsl(0 0% 0% / 0.3)',
          }}
        >
          <div
            className="wa-chat-root"
            style={{
              ...UTILITY,
              height: '100%',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
            }}
          >

      {/* ── Header ── */}
      <div
        className="wa-header"
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
          flexShrink: 0,
          background: 'var(--wa-header-bg)',
          zIndex: 2,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0, width: 40, height: 40 }}>
          {/* Rotating half-green glow halo — a livelier "online" cue than
              a plain static dot */}
          <div
            className="wa-avatar-halo"
            aria-hidden
            style={{
              position: 'absolute',
              top: -3, left: -3, right: -3, bottom: -3,
              borderRadius: '50%',
              background: `conic-gradient(from 0deg, ${WA.online} 0deg, transparent 170deg, transparent 190deg, ${WA.online} 360deg)`,
              filter: 'blur(2px)',
            }}
          />
          <div style={{
            position: 'relative',
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--wa-bubble-in)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--wa-meta)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className={parisienne.className} style={{ fontSize: 20, fontWeight: 400, color: 'var(--wa-text-in)', margin: 0, lineHeight: 1.3 }}>
            Support Team
          </p>
          <p style={{ ...UTILITY, fontSize: 12.5, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ position: 'relative', display: 'flex', width: 6, height: 6 }}>
              <span className="wa-status-dot" style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: isTyping ? WA.accent : WA.online,
                animation: 'statusPulse 1.6s ease-in-out infinite',
              }} />
              <span style={{
                position: 'relative', width: 6, height: 6, borderRadius: '50%',
                background: isTyping ? WA.accent : WA.online,
              }} />
            </span>
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
            radial-gradient(circle at 20% 20%, ${PINTEREST_RED}14 0%, transparent 35%),
            radial-gradient(circle at 80% 0%, hsl(var(--foreground) / 0.025) 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, ${PINTEREST_RED}10 0%, transparent 35%),
            radial-gradient(circle at 10% 70%, hsl(var(--foreground) / 0.02) 0%, transparent 35%)
          `,
          backgroundSize: '160% 160%',
          overflowAnchor: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
        }}
      >
        {(isLoading || !isLoaded) && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wa-meta)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
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
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--wa-bubble-in)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}
            >
              👋
            </motion.div>
            <div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{ ...DISPLAY, fontSize: 24, fontStyle: 'italic', fontWeight: 500, margin: '0 0 6px', color: 'var(--wa-text-in)' }}
              >
                Hi there!
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ ...UTILITY, fontSize: 13, margin: 0, color: 'var(--wa-meta)', lineHeight: 1.7, maxWidth: 260, fontWeight: 300 }}
              >
                Got a question or need help with an order? Send us a message — we&apos;re here.
              </motion.p>
            </div>
          </div>
        )}

        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0', position: 'sticky', top: 6, zIndex: 3, pointerEvents: 'none' }}>
              <span style={{
                ...UTILITY,
                fontSize: 12.5, color: 'var(--wa-meta)',
                background: 'var(--wa-system-bg)',
                padding: '5px 12px', borderRadius: 8,
                fontWeight: 500,
                boxShadow: '0 2px 8px hsl(0 0% 0% / 0.35)',
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
            ...UTILITY,
            position: 'absolute',
            bottom: '80px',
            left: '50%', transform: 'translateX(-50%)',
            padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: WA.accent, color: WA.accentInk,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: `0 4px 20px ${PINTEREST_RED}59`, zIndex: 5,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          New messages
        </button>
      )}

      <Composer onSend={handleSend} onTyping={sendTyping} />

      {/* Film grain — same restrained texture trick as the Hero. Uses dark
          noise rather than white: darkening reads correctly against both
          a light and a dark background, whereas white noise would have
          been invisible once this page started following the theme. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0.05, mixBlendMode: 'overlay', zIndex: 6 }}
      >
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes avatarHaloSpin { to { transform: rotate(360deg); } }
        @keyframes statusPulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(2.2); opacity: 0; }
        }

        .wa-chat-root {
          height: 100%;
          /* Theme tokens, not hardcoded literals — this is what makes the
             chat switch with light/dark mode the same way Footer/Contact/
             Hero do. The Pinterest red (bubbles, accents, focus ring) stays
             constant across both themes on purpose — it's the brand color,
             not part of the light/dark surface system. */
          --wa-bg-chat: hsl(var(--background));
          --wa-bubble-out: ${PINTEREST_RED};
          --wa-bubble-in: hsl(var(--surface-elevated));
          --wa-text-out: hsl(var(--accent-foreground, 0 0% 100%));
          --wa-text-in: hsl(var(--foreground));
          --wa-meta: hsl(var(--muted));
          --wa-meta-out: hsl(var(--accent-foreground, 0 0% 100%) / 0.8);
          --wa-system-bg: hsl(var(--surface-elevated));
          --wa-header-bg: hsl(var(--background));
          --wa-composer-bg: hsl(var(--background));
          --wa-input-bg: hsl(var(--surface-elevated));
          --wa-icon: hsl(var(--muted));
          --wa-border: hsl(var(--border));
          --wa-surface-hover: hsl(var(--foreground) / 0.08);
        }

        .wa-avatar-halo {
          animation: avatarHaloSpin 5s linear infinite;
        }

        /* ── Themed scrollbars ── */
        .wa-msg-list, .wa-emoji-picker {
          scrollbar-width: thin;
          scrollbar-color: var(--wa-border) transparent;
        }
        .wa-msg-list {
          animation: driftGlow 26s ease-in-out infinite alternate;
        }
        @keyframes driftGlow {
          0%   { background-position: 0% 0%; }
          100% { background-position: 12% 8%; }
        }
        .wa-msg-list::-webkit-scrollbar, .wa-emoji-picker::-webkit-scrollbar {
          width: 6px;
        }
        .wa-msg-list::-webkit-scrollbar-thumb, .wa-emoji-picker::-webkit-scrollbar-thumb {
          background: var(--wa-border);
          border-radius: 999px;
        }
        .wa-msg-list::-webkit-scrollbar-thumb:hover, .wa-emoji-picker::-webkit-scrollbar-thumb:hover {
          background: var(--wa-surface-hover);
        }
        .wa-msg-list::-webkit-scrollbar-track, .wa-emoji-picker::-webkit-scrollbar-track {
          background: transparent;
        }

        /* ── Composer input states ── */
        .wa-composer textarea::placeholder {
          color: var(--wa-meta);
          opacity: 1;
        }
        .wa-composer textarea,
        .wa-composer textarea:focus,
        .wa-composer textarea:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
        }
        .wa-input-wrap:focus-within {
          box-shadow: 0 0 0 2px ${PINTEREST_RED}59;
        }

        /* ── Button hover/active feedback ── */
        .wa-icon-btn {
          transition: background-color 0.15s, color 0.15s;
        }
        .wa-icon-btn:hover {
          background: var(--wa-surface-hover);
        }
        .wa-send-btn {
          transition: opacity 0.15s, box-shadow 0.2s;
        }
        .wa-send-btn:hover:not(:disabled) {
          box-shadow: 0 4px 16px ${PINTEREST_RED}66;
        }
        .wa-retry-btn {
          transition: opacity 0.15s;
        }
        .wa-retry-btn:hover {
          opacity: 0.7;
        }

        /* ── Mobile: sit below the navbar, never over/under it ──
           --navbar-height should be defined once globally (see globals.css
           note below); 64px is just the fallback if that variable is
           missing. z-40 here assumes the navbar itself uses z-50 — if your
           navbar uses a different z-index, keep this one lower than it. */
        @media (max-width: 639px) {
          .wa-chat-card {
            top: var(--navbar-height, 64px);
            height: calc(100dvh - var(--navbar-height, 64px));
          }
        }

        /* ── Small-screen polish ── */
        @media (max-width: 480px) {
          .wa-header { padding-left: 12px; padding-right: 12px; }
          .wa-msg-list { padding: 8px 0 6px; }
          .wa-composer { padding: 6px; padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px) + var(--fab-clearance, 0px)); }
        }

        /* ── Respect reduced-motion preferences ── */
        @media (prefers-reduced-motion: reduce) {
          .wa-msg-list { animation: none; }
          .wa-status-dot { animation: none; }
          .wa-avatar-halo { animation: none; }
        }
      `}</style>
          </div>
        </motion.div>
      </div>
    </div>
  )
}