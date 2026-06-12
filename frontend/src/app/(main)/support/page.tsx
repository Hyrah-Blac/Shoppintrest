'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
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

function relativeTime(d?: string | Date) {
  if (!d) return ''
  const diff = Date.now() - new Date(d as string).getTime()
  const m = Math.floor(diff / 60000)
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

function Bubble({
  text, isMine, createdAt, isSystem, isRead, showTail, status, onRetry, onDelete, deleted,
}: {
  text: string
  isMine: boolean
  createdAt?: string | Date
  isSystem?: boolean
  isRead?: boolean
  showTail?: boolean
  status?: 'sending' | 'failed' | 'sent'
  onRetry?: () => void
  onDelete?: () => void
  deleted?: boolean
}) {
  const [showTime, setShowTime] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (deleted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: isMine ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 6,
        margin: '1px 0',
      }}>
        <div style={{ width: 28, flexShrink: 0 }} />
        <div style={{
          maxWidth: '78%',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.5)',
          background: '#232B36',
          border: '0.5px dashed rgba(255,255,255,0.15)',
        }}>
          🚫 You deleted this message
        </div>
      </div>
    )
  }

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0', margin: '4px 0' }}>
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.55)',
          background: '#232B36',
          padding: '4px 16px', borderRadius: 20,
          border: '0.5px solid rgba(255,255,255,0.08)',
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
      gap: 6,
      margin: '1px 0',
    }}>
      <div style={{ width: 28, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
        <div
          onClick={() => setShowTime(v => !v)}
          style={{
            background: isMine ? '#005C4B' : '#262D36',
            color: isMine ? '#E9FBF5' : '#E8EAED',
            borderRadius: isMine
              ? showTail ? '8px 8px 0px 8px' : '8px'
              : showTail ? '8px 8px 8px 0px' : '8px',
            padding: '6px 9px 8px',
            fontSize: 14.5,
            lineHeight: 1.4,
            boxShadow: '0 1px 1px rgba(0,0,0,0.35)',
            wordBreak: 'break-word',
            cursor: 'default',
            userSelect: 'text' as const,
            opacity: status === 'sending' ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {text}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginTop: 3, padding: '0 2px',
          opacity: (showTime || status === 'failed') ? 1 : 0,
          transition: 'opacity 0.15s',
          height: (showTime || status === 'failed') ? 'auto' : 0,
          overflow: 'hidden',
        }}>
          {status === 'failed' ? (
            <button
              onClick={onRetry}
              style={{
                fontSize: 11, fontWeight: 600, color: '#ef4444',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              Failed · Tap to retry
            </button>
          ) : (
            <>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                {timeLabel(createdAt)}
              </span>
              {isMine && status !== 'sending' && (
                <span style={{ fontSize: 13, color: isRead ? '#53bdeb' : 'rgba(255,255,255,0.45)', lineHeight: 1 }}>
                  {isRead ? '✓✓' : '✓'}
                </span>
              )}
              {isMine && status !== 'sending' && onDelete && (
                confirming ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                    <button
                      onClick={() => { setConfirming(false); onDelete() }}
                      style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    aria-label="Delete message"
                    style={{ display: 'flex', alignItems: 'center', marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.45)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }, [send])

  const canSend = !!input.trim() && !sending

  return (
    <div style={{
      padding: '8px 12px 12px',
      background: '#1F242C',
      flexShrink: 0,
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: '#2A313B',
          borderRadius: 24,
          padding: '6px 6px 6px 10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          transition: 'box-shadow 0.15s',
        }}
        onFocusCapture={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)')}
        onBlurCapture={e  => (e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.25)')}
      >
        <button
          aria-label="Attach a file"
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          ref={ref}
          value={input}
          onChange={e => { setInput(e.target.value); onTyping?.() }}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          aria-label="Message"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 15,
            lineHeight: 1.5,
            color: '#E8EAED',
            fontFamily: 'var(--font-sans)',
            overflowY: 'hidden',
            padding: '4px 0',
            maxHeight: 130,
          }}
        />
        <button
          onClick={send}
          disabled={!canSend}
          aria-label="Send message"
          style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            border: 'none',
            background: canSend ? '#00A884' : '#E0E0E0',
            color: canSend ? '#fff' : '#9CA3AF',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
            transform: canSend ? 'scale(1)' : 'scale(0.92)',
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
  const hasMountedRef    = useRef(false)
  const [showNew, setShowNew] = useState(false)
  const [failedMsgs, setFailedMsgs] = useState<Record<string, string>>({}) // tempId -> text
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [optimistic, setOptimistic] = useState<{ id: string; text: string; created_at: string }[]>([])

  const handleDelete = useCallback(async (messageId: string) => {
    // optimistic UI
    setDeletedIds(prev => new Set(prev).add(messageId))
    try {
      await client?.deleteMessage(messageId)
    } catch (err) {
      // revert on failure
      setDeletedIds(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    }
  }, [client])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (conversation?.streamChannelId) openChannel(conversation.streamChannelId)
  }, [conversation?.streamChannelId, openChannel])

  const isNearBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100
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
  }, [messages.length, isTyping])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowNew(false)
    wasNearBottomRef.current = true
  }, [])

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

  // Wrapped send with retry/failure tracking
  const handleSend = useCallback(async (text: string) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const sentAt = new Date().toISOString()
    setOptimistic(prev => [...prev, { id: tempId, text, created_at: sentAt }])
    try {
      await sendMessage(text)
    } catch (err) {
      setOptimistic(prev => prev.filter(m => m.id !== tempId))
      setFailedMsgs(prev => ({ ...prev, [tempId]: text }))
      throw err
    }
  }, [sendMessage])

  // Once the real message shows up in the synced list, drop the optimistic copy
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
    try {
      await sendMessage(text)
      setFailedMsgs(prev => {
        const next = { ...prev }
        delete next[tempId]
        return next
      })
    } catch {
      // keep as failed
    }
  }, [failedMsgs, sendMessage])

  const headerStatus = { label: 'Online · usually replies in minutes', color: '#22c55e', dot: '#22c55e' }

  return (
    <div style={{
      maxWidth: 680, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - 64px)',
      position: 'relative',
      background: '#161B22',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        flexShrink: 0,
        background: '#075E54',
        color: '#fff',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: '50%',
            background: headerStatus.dot,
            border: '2px solid #075E54',
            transition: 'background 0.2s',
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.2 }}>
            Support Team
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '2px 0 0', fontWeight: 400, transition: 'color 0.2s' }}>
            {headerStatus.label}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        style={{
          flex: 1, overflowY: 'auto',
          padding: '12px 16px 8px',
          display: 'flex', flexDirection: 'column', gap: 2,
          backgroundColor: '#161B22',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'%3E%3Cg fill=\'none\' stroke=\'%23232B36\' stroke-width=\'1.5\'%3E%3Cpath d=\'M30 18c0-4 3-7 7-7s7 3 7 7M37 18v6M27 26h20l6 16-8 3v32H29V45l-8-3z\'/%3E%3Ccircle cx=\'90\' cy=\'30\' r=\'9\'/%3E%3Cpath d=\'M84 30a6 6 0 0112 0M81 36h18M85 36l-4 30h18l-4-30\'/%3E%3Cpath d=\'M15 80c0-3 2.5-5.5 5.5-5.5S26 77 26 80M20.5 80v4.5M13 86h15l4 12-6 2v18H15V100l-6-2z\'/%3E%3Cpath d=\'M70 75l4 6h12l4-6M74 81v28h12V81\'/%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '180px 180px',
        }}
      >
        {(isLoading || !isLoaded) && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}

        {!isLoading && isLoaded && messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: '3rem 2rem', textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#232B36',
              border: '0.5px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              👋
            </div>
            <div>
              <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, margin: '0 0 6px', color: '#E8EAED' }}>
                Hi there!
              </p>
              <p style={{ fontSize: 13, margin: 0, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 260 }}>
                Got a question or need help with an order? Send us a message — we're here.
              </p>
            </div>
          </div>
        )}

        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            {/* Day divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 10px' }}>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{
                fontSize: 11, color: 'rgba(255,255,255,0.5)',
                background: '#232B36',
                padding: '3px 12px', borderRadius: 20,
                border: '0.5px solid rgba(255,255,255,0.08)',
                whiteSpace: 'nowrap', fontWeight: 500,
              }}>
                {day}
              </span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
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
                  onDelete={isMine ? () => handleDelete(msg.id) : undefined}
                />
              )
            })}
          </div>
        ))}

        {/* Optimistic messages: shown instantly while sending */}
        {optimistic.map(m => (
          <Bubble
            key={m.id}
            text={m.text}
            isMine
            createdAt={m.created_at}
            status="sending"
            showTail
          />
        ))}

        {/* Failed messages, shown locally until retried */}
        {Object.entries(failedMsgs).map(([tempId, text]) => (
          <Bubble
            key={tempId}
            text={text}
            isMine
            status="failed"
            showTail
            onRetry={() => retryFailed(tempId)}
          />
        ))}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
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
          color: 'rgba(255,255,255,0.45)',
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
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          New messages
        </button>
      )}

      <Composer onSend={handleSend} onTyping={sendTyping} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}