'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSupportStore } from '@/store/useSupportStore'
import { useSupportChat }  from '@/hooks/useSupportChat'
import { useStreamContext } from '@/components/providers/StreamProvider'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

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
  const [showTime, setShowTime] = useState(false)

  if (deleted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: isMine ? 'row-reverse' : 'row',
        margin: '1px 0', gap: 6,
      }}>
        <div style={{ width: 28, flexShrink: 0 }} />
        <div style={{
          fontSize: 13, fontStyle: 'italic',
          color: 'var(--color-text-secondary)',
          padding: '8px 12px',
          border: '0.5px dashed var(--color-border-secondary)',
          borderRadius: 8,
        }}>
          🚫 This message was deleted
        </div>
      </div>
    )
  }

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

        {/* Time / status row — shown on tap */}
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
            <>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {timeLabel(createdAt)}
              </span>
              {isMine && status !== 'sending' && (
                <span style={{ fontSize: 13, color: isRead ? 'var(--color-text-info)' : 'var(--color-text-secondary)', lineHeight: 1 }}>
                  {isRead ? '✓✓' : '✓'}
                </span>
              )}
            </>
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
          placeholder="Message…"
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

  const bottomRef        = useRef<HTMLDivElement>(null)
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
    if (conversation?.streamChannelId) openChannel(conversation.streamChannelId)
  }, [conversation?.streamChannelId, openChannel])

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
  // Runs BEFORE paint (useLayoutEffect) so the initial jump-to-bottom is
  // invisible — no flash of the top of the conversation, no visible "scroll
  // all the way down" animation, and no need to manually scroll afterwards.
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return

    // 1. Older messages were just prepended via pagination — keep the
    //    viewport visually anchored on the same message the user was reading.
    if (prevScrollHeightRef.current > 0) {
      const diff = el.scrollHeight - prevScrollHeightRef.current
      if (diff > 0) el.scrollTop += diff
      prevScrollHeightRef.current = 0
      loadingOlderRef.current = false
      return
    }

    // 2. First time messages are available for this channel — jump straight
    //    to the bottom instantly (no animation), like every chat app does.
    if (!initialScrollDoneRef.current) {
      if (isLoading) return
      el.scrollTop = el.scrollHeight
      initialScrollDoneRef.current = true
      setShowNew(false)
      return
    }

    // 3. A new message arrived after the initial load.
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
          // Safety net: clear the flag even if no new messages arrive
          // (e.g. we've reached the start of the conversation).
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

  // Optimistic send — shows message instantly, replaces when real one arrives
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

  const handleDelete = useCallback(async (messageId: string) => {
    setDeletedIds(prev => new Set(prev).add(messageId))
    try {
      await client?.deleteMessage(messageId)
    } catch {
      setDeletedIds(prev => { const n = new Set(prev); n.delete(messageId); return n })
    }
  }, [client])

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
    <div style={{
      maxWidth: 680, margin: '0 auto',
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
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-secondary)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 11, height: 11, borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid var(--color-background-primary)',
          }} />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.25 }}>
            Support Team
          </p>
          <p style={{ fontSize: 12, color: '#22c55e', margin: '2px 0 0', fontWeight: 500 }}>
            Online · usually replies in minutes
          </p>
        </div>
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
          overflowAnchor: 'none',
        }}
      >
        {(isLoading || !isLoaded) && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
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
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              👋
            </div>
            <div>
              <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                Hi there!
              </p>
              <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: 260 }}>
                Got a question or need help with an order? Send us a message — we're here.
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
              const isLastMineOverall = isMine && msg.id === lastMineId
              return (
                <Bubble
                  key={msg.id}
                  text={msg.text ?? ''}
                  isMine={isMine}
                  createdAt={msg.created_at}
                  isSystem={msg.type === 'system'}
                  isRead={isMine ? (isLastMineOverall ? lastMineRead : true) : undefined}
                  showTail={isLast}
                  deleted={deletedIds.has(msg.id) || msg.deleted_at != null}
                />
              )
            })}
          </div>
        ))}

        {/* Optimistic messages */}
        {optimistic.map(m => (
          <Bubble key={m.id} text={m.text} isMine createdAt={m.created_at} status="sending" showTail />
        ))}

        {/* Failed messages */}
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

      {/* Read receipt */}
      {lastMineRead && !isTyping && (
        <div style={{
          textAlign: 'right', fontSize: 11, fontWeight: 500,
          color: 'var(--color-text-secondary)',
          padding: '2px 20px 0', flexShrink: 0,
        }}>
          Seen ✓✓
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}