'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupportStore } from '@/store/useSupportStore'
import { useSupportChat } from '@/hooks/useSupportChat'
import { TicketStatus, TicketCategory } from '@/types/support'
import { useStreamContext } from '@/components/providers/StreamProvider'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order: 'Order issue', return: 'Return', refund: 'Refund',
  account: 'Account', other: 'Message',
}

function timeLabel(d?: string | Date) {
  if (!d) return ''
  return new Date(d as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function relativeTime(d?: string | Date) {
  if (!d) return ''
  const diff = Date.now() - new Date(d as string).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
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

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', padding: '4px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '14px 14px 14px 4px',
        padding: '10px 14px',
      }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--color-text-secondary)',
            display: 'block',
            animation: `bounce 1.2s ${delay}s infinite ease-in-out`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%,60%,100%{transform:translateY(0);opacity:.4}
          30%{transform:translateY(-5px);opacity:1}
        }
      `}</style>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({
  text, isMine, createdAt, isSystem, isRead,
}: {
  text: string; isMine: boolean; createdAt?: string | Date
  isSystem?: boolean; isRead?: boolean
}) {
  const [showTime, setShowTime] = useState(false)

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <span style={{
          fontSize: 11, color: 'var(--color-text-secondary)',
          background: 'var(--color-background-secondary)',
          padding: '4px 14px', borderRadius: 20,
          border: '0.5px solid var(--color-border-tertiary)',
          whiteSpace: 'pre-line',
        }}>
          {text}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isMine ? 'flex-end' : 'flex-start',
      margin: '3px 0',
    }}>
      <div style={{
        maxWidth: '75%',
        background: isMine ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
        color: isMine ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: '10px 14px', fontSize: 14, lineHeight: 1.6,
        border: isMine ? 'none' : '0.5px solid var(--color-border-tertiary)',
        wordBreak: 'break-word',
      }}>
        {text}
      </div>
      {createdAt && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginTop: 3, padding: '0 4px', cursor: 'default',
          }}
          onMouseEnter={() => setShowTime(true)}
          onMouseLeave={() => setShowTime(false)}
        >
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
            {showTime ? timeLabel(createdAt) : relativeTime(createdAt)}
          </span>
          {isMine && (
            <span style={{
              fontSize: 10,
              color: isRead ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
              opacity: isRead ? 1 : 0.5,
            }}>
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CSAT ─────────────────────────────────────────────────────────────────────

function CSAT() {
  const [voted,   setVoted]   = useState<'up' | 'down' | null>(null)
  const [comment, setComment] = useState('')
  const [done,    setDone]    = useState(false)

  if (done) return (
    <div style={{
      padding: '12px 20px', borderTop: '0.5px solid var(--color-border-tertiary)',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0,
    }}>
      <i className="ti ti-check" style={{ color: 'var(--color-text-success)', fontSize: 13 }} />
      Thanks — that helps us improve.
    </div>
  )

  return (
    <div style={{
      padding: '12px 20px', borderTop: '0.5px solid var(--color-border-tertiary)',
      flexShrink: 0,
    }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
        Was this helpful?
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['up', 'down'] as const).map(v => (
          <button key={v} onClick={() => setVoted(v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
            background: voted === v ? 'var(--color-background-secondary)' : 'transparent',
            border: `0.5px solid ${voted === v ? 'var(--color-border-secondary)' : 'var(--color-border-tertiary)'}`,
            color: voted === v ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            transition: 'all 0.15s',
          }}>
            {v === 'up' ? '👍 Yes' : '👎 Not quite'}
          </button>
        ))}
      </div>
      {voted === 'down' && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What could we have done better?"
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px', fontSize: 12, lineHeight: 1.6,
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 8, resize: 'none', outline: 'none',
              background: 'var(--color-background-secondary)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
      )}
      {voted && (
        <button onClick={() => setDone(true)} style={{
          marginTop: 10, padding: '7px 16px', fontSize: 11, fontWeight: 500,
          background: 'var(--color-text-primary)',
          color: 'var(--color-background-primary)',
          border: 'none', borderRadius: 7, cursor: 'pointer',
        }}>
          Submit
        </button>
      )}
    </div>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
  onSend,
  onTyping,
  disabled,
}: {
  onSend: (t: string) => Promise<void>
  onTyping?: () => void
  disabled?: boolean
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

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending || disabled) return
    setSending(true)
    try { await onSend(text); setInput('') } finally { setSending(false) }
  }, [input, sending, disabled, onSend])

  const canSend = !!input.trim() && !sending && !disabled

  return (
    <div style={{
      padding: '10px 14px 14px',
      borderTop: '0.5px solid var(--color-border-tertiary)',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        border: '0.5px solid var(--color-border-secondary)',
        borderRadius: 14, padding: '8px 8px 8px 14px',
        transition: 'border-color 0.15s',
      }}>
        <textarea
          ref={ref}
          value={input}
          onChange={e => {
            setInput(e.target.value)
            onTyping?.()
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          placeholder={disabled ? 'This conversation is closed.' : 'Message support…'}
          rows={1}
          disabled={disabled}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', fontSize: 14, lineHeight: 1.6,
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
            overflowY: 'hidden', padding: '2px 0',
          }}
        />
        <button
          onClick={send}
          disabled={!canSend}
          aria-label="Send"
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: canSend ? 'var(--color-text-primary)' : 'transparent',
            border: '0.5px solid var(--color-border-secondary)',
            color: canSend ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, transition: 'all 0.15s',
          }}
        >
          {sending
            ? <i className="ti ti-loader-2 ti-spin" />
            : <i className="ti ti-send-2" aria-hidden="true" />
          }
        </button>
      </div>
      <p style={{
        fontSize: 10, color: 'var(--color-text-secondary)',
        textAlign: 'center', margin: '5px 0 0', letterSpacing: '0.04em',
      }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params   = useParams()
  const ticketId = params.ticketId as string

  const { tickets, isLoaded, loadTickets } = useSupportStore()
  const { client, isReady } = useStreamContext()
  const {
    messages, isLoading, isTyping, readBy,
    openTicket, sendMessage, loadOlderMessages, sendTyping,
  } = useSupportChat(client, isReady)

  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)
  const ticket    = tickets.find(t => t._id === ticketId)

  // Smart auto-scroll bookkeeping
  const [showNewMessages, setShowNewMessages] = useState(false)
  const wasNearBottomRef = useRef(true)

  useEffect(() => { if (!isLoaded) loadTickets() }, [isLoaded, loadTickets])

  useEffect(() => {
    if (ticket?.streamChannelId) openTicket(ticket.streamChannelId)
  }, [ticket?.streamChannelId, openTicket])

  const isNearBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }, [])

  // Track whether the user is near the bottom + handle scroll-to-top loading
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    let ticking = false
    const handler = () => {
      wasNearBottomRef.current = isNearBottom()
      if (wasNearBottomRef.current) setShowNewMessages(false)

      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        if (el.scrollTop < 60) loadOlderMessages()
        ticking = false
      })
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [loadOlderMessages, isNearBottom])

  // Smart auto-scroll: only jump to bottom if the user was already near it
  useEffect(() => {
    if (wasNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setShowNewMessages(true)
    }
  }, [messages.length, isTyping])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowNewMessages(false)
    wasNearBottomRef.current = true
  }, [])

  const handleSend = useCallback(async (text: string) => {
    await sendMessage(text)
  }, [sendMessage])

  // Memoised day grouping — only recomputes when messages array changes
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

  // Whether the current user's last message has been seen by support
  const lastMineSeenBySupport = useMemo(() => {
    const mine = [...messages].reverse().find(m => m.user?.id === client?.userID)
    if (!mine?.created_at) return false
    return Object.values(readBy).some(
      ts => new Date(ts).getTime() >= new Date(mine.created_at as string).getTime()
    )
  }, [messages, readBy, client?.userID])

  if (!isLoaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />
    </div>
  )

  if (!ticket) return (
    <div style={{ maxWidth: 480, margin: '5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
      <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, margin: '0 0 8px' }}>
        Conversation not found
      </p>
      <p style={{
        fontSize: 12, color: 'var(--color-text-secondary)',
        margin: '0 0 2rem', lineHeight: 1.7,
      }}>
        This message thread doesn't exist or has been removed.
      </p>
      <Link href="/support" style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontSize: 12, fontWeight: 500, textDecoration: 'none',
        color: 'var(--color-text-primary)', padding: '9px 18px',
        border: '0.5px solid var(--color-border-secondary)', borderRadius: 8,
      }}>
        <i className="ti ti-arrow-left" style={{ fontSize: 12 }} />
        Back to help
      </Link>
    </div>
  )

  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div style={{
      maxWidth: 640, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - 64px)',
      position: 'relative',
    }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        flexShrink: 0,
      }}>
        <Link
          href="/support"
          style={{
            display: 'flex', alignItems: 'center',
            color: 'var(--color-text-secondary)', textDecoration: 'none',
            padding: '4px 6px 4px 0', transition: 'color 0.15s',
          }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 18 }} aria-label="Back" />
        </Link>

        {/* Avatar with online dot */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: 'var(--color-text-secondary)',
          flexShrink: 0, position: 'relative',
        }}>
          <i className="ti ti-headset" aria-hidden="true" />
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-text-success)',
            border: '2px solid var(--color-background-primary)',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 500,
            color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2,
          }}>
            Support Team
          </p>
          <p style={{
            fontSize: 11, color: 'var(--color-text-secondary)',
            margin: '2px 0 0', lineHeight: 1,
          }}>
            {isClosed ? (
              <span style={{ color: 'var(--color-text-success)' }}>
                · Resolved
              </span>
            ) : (
              'Usually replies within a few minutes'
            )}
          </p>
        </div>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}
      >
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '3rem 1rem', textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11,
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'var(--color-text-secondary)',
            }}>
              <i className="ti ti-messages" aria-hidden="true" />
            </div>
            <div>
              <p style={{
                ...DISPLAY, fontSize: 19, fontWeight: 300,
                margin: '0 0 5px', color: 'var(--color-text-primary)',
              }}>
                Need help?
              </p>
              <p style={{
                fontSize: 12, margin: 0,
                color: 'var(--color-text-secondary)', lineHeight: 1.7,
              }}>
                Send a message and our support team will get back to you shortly.
              </p>
            </div>
          </div>
        )}

        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
              <span style={{
                fontSize: 11, color: 'var(--color-text-secondary)',
                background: 'var(--color-background-secondary)',
                padding: '3px 12px', borderRadius: 20,
                border: '0.5px solid var(--color-border-tertiary)',
              }}>
                {day}
              </span>
            </div>
            {msgs.map((msg) => {
              const isMine = msg.user?.id === client?.userID
              const isLastMineOverall = isMine && msg.id === [...messages].reverse().find(m => m.user?.id === client?.userID)?.id
              return (
                <Bubble
                  key={msg.id}
                  text={msg.text ?? ''}
                  isMine={isMine}
                  createdAt={msg.created_at}
                  isSystem={msg.type === 'system'}
                  isRead={isMine ? (isLastMineOverall ? lastMineSeenBySupport : true) : undefined}
                />
              )
            })}
          </div>
        ))}

        {isTyping && (
          <div style={{ padding: '0 4px 4px', fontSize: 11, color: 'var(--color-text-secondary)' }}>
            Support is typing…
          </div>
        )}
        {isTyping && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* New messages button */}
      {showNewMessages && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: isClosed ? 70 : (ticket.status === 'resolved' ? 160 : 90),
            left: '50%', transform: 'translateX(-50%)',
            padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 5,
          }}
        >
          <i className="ti ti-arrow-down" style={{ fontSize: 12 }} />
          New Messages
        </button>
      )}

      {/* Seen by Support */}
      {!isClosed && lastMineSeenBySupport && (
        <div style={{
          textAlign: 'right', fontSize: 10,
          color: 'var(--color-text-secondary)',
          padding: '0 22px',
        }}>
          Seen by Support
        </div>
      )}

      {/* Resolved bar */}
      {isClosed && (
        <div style={{
          padding: '12px 20px',
          borderTop: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: 'var(--color-text-secondary)',
          flexShrink: 0,
        }}>
          <i className="ti ti-circle-check" style={{
            fontSize: 14, color: 'var(--color-text-success)', flexShrink: 0,
          }} />
          <span style={{ flex: 1 }}>This conversation is resolved.</span>
          <Link href="/support" style={{
            fontSize: 11, fontWeight: 500,
            color: 'var(--color-text-primary)',
            textDecoration: 'underline', textUnderlineOffset: 3,
            flexShrink: 0,
          }}>
            New message
          </Link>
        </div>
      )}

      {/* CSAT — only on resolved, not closed */}
      {ticket.status === 'resolved' && <CSAT />}

      {/* Composer — hidden when closed */}
      {!isClosed && <Composer onSend={handleSend} onTyping={sendTyping} />}
    </div>
  )
}