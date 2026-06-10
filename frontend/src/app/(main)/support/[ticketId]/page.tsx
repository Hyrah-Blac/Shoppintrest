'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupportStore } from '@/store/useSupportStore'
import { useSupportChat } from '@/hooks/useSupportChat'
import { TicketStatus, TicketCategory } from '@/types/support'
import { useStreamChatClient } from '@/components/providers/StreamProvider'

// ─── Design tokens ────────────────────────────────────────────────────────────

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order:   'Order issue',
  return:  'Return',
  refund:  'Refund',
  account: 'Account',
  other:   'Other',
}

const CATEGORY_ICONS: Record<TicketCategory, string> = {
  order:   'ti-package',
  return:  'ti-arrow-back-up',
  refund:  'ti-credit-card',
  account: 'ti-user-circle',
  other:   'ti-message-circle',
}

const STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
  open:     { label: 'Open',      color: 'var(--color-text-info)'      },
  pending:  { label: 'In review', color: 'var(--color-text-warning)'   },
  resolved: { label: 'Resolved',  color: 'var(--color-text-success)'   },
  closed:   { label: 'Closed',    color: 'var(--color-text-secondary)' },
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
// Pattern from Intercom: makes the experience feel alive and app-like.

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '4px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '14px 14px 14px 4px',
        padding: '10px 14px',
      }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <span
            key={i}
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--color-text-secondary)',
              display: 'block',
              animation: `bounce 1.2s ${delay}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Read receipt ─────────────────────────────────────────────────────────────

function ReadReceipt({ isRead }: { isRead?: boolean }) {
  return (
    <span style={{
      fontSize: 10, color: isRead ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
      opacity: isRead ? 1 : 0.5, userSelect: 'none',
    }}>
      {isRead ? '✓✓' : '✓'}
    </span>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  text, isMine, createdAt, isSystem, isRead,
}: {
  text: string
  isMine: boolean
  createdAt?: string | Date
  isSystem?: boolean
  isRead?: boolean
}) {
  const [showAbsolute, setShowAbsolute] = useState(false)

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0', margin: '8px 0' }}>
        <span style={{
          ...DISPLAY,
          fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
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
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isMine ? 'flex-end' : 'flex-start',
      margin: '3px 0',
    }}>
      <div
        style={{
          maxWidth: '72%',
          background: isMine ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
          color: isMine ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
          borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          padding: '9px 13px', fontSize: 13, lineHeight: 1.65,
          border: isMine ? 'none' : '0.5px solid var(--color-border-tertiary)',
        }}
      >
        {text}
      </div>

      {/* Timestamp — relative by default, absolute on hover (Muzli best practice) */}
      {createdAt && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginTop: 3, padding: '0 4px', cursor: 'default',
          }}
          onMouseEnter={() => setShowAbsolute(true)}
          onMouseLeave={() => setShowAbsolute(false)}
        >
          <span style={{ fontSize: 10, letterSpacing: '0.04em', color: 'var(--color-text-secondary)', transition: 'opacity 0.15s' }}>
            {showAbsolute ? timeLabel(createdAt) : relativeTime(createdAt)}
          </span>
          {isMine && <ReadReceipt isRead={isRead} />}
        </div>
      )}
    </div>
  )
}

// ─── Agent info bar ───────────────────────────────────────────────────────────
// Humanises the support experience — users know a real person will reply.

function AgentInfoBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px',
      borderBottom: '0.5px solid var(--color-border-tertiary)',
      background: 'var(--color-background-secondary)',
      flexShrink: 0,
    }}>
      {/* Stacked agent avatars */}
      <div style={{ display: 'flex', position: 'relative', width: 44 }}>
        {['S', 'A'].map((initial, i) => (
          <div key={i} style={{
            position: i === 0 ? 'relative' : 'absolute',
            left: i === 0 ? 0 : 16,
            width: 24, height: 24, borderRadius: '50%',
            background: i === 0 ? 'var(--color-text-primary)' : 'var(--color-border-secondary)',
            border: '1.5px solid var(--color-background-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600,
            color: i === 0 ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
            zIndex: i === 0 ? 1 : 0,
          }}>
            {initial}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
          Shoppintrest Support
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '1px 0 0' }}>
          Replies within a few hours · Human team
        </p>
      </div>

      {/* Online indicator */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-secondary)' }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--color-text-success)',
          boxShadow: '0 0 0 2px color-mix(in srgb, var(--color-text-success) 25%, transparent)',
        }} />
        Online
      </span>
    </div>
  )
}

// ─── Close confirmation ───────────────────────────────────────────────────────

function CloseConfirm({ onConfirm, onCancel, closing }: {
  onConfirm: () => void
  onCancel: () => void
  closing: boolean
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 14, padding: '2rem',
        maxWidth: 380, width: '100%',
      }}>
        <p style={{
          ...DISPLAY,
          fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: 'var(--color-text-secondary)', margin: '0 0 10px',
        }}>
          Confirm action
        </p>
        <h2 style={{
          ...DISPLAY,
          fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 300,
          color: 'var(--color-text-primary)', margin: '0 0 12px', lineHeight: 1,
        }}>
          Close this ticket?
        </h2>
        <p style={{
          fontSize: 12, lineHeight: 1.7,
          color: 'var(--color-text-secondary)', margin: '0 0 1.75rem',
        }}>
          The conversation will be archived. If the issue returns, you can open a new request
          and we'll have full context from this one.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={closing}
            style={{
              flex: 1, padding: '10px', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              borderRadius: 8, cursor: 'pointer',
              background: 'transparent', color: 'var(--color-text-secondary)',
              border: '0.5px solid var(--color-border-secondary)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Keep open
          </button>
          <button
            onClick={onConfirm}
            disabled={closing}
            style={{
              flex: 1, padding: '10px', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              borderRadius: 8, cursor: closing ? 'not-allowed' : 'pointer',
              background: 'var(--color-text-primary)',
              color: 'var(--color-background-primary)',
              border: 'none', transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: closing ? 0.7 : 1,
            }}
          >
            {closing ? <><i className="ti ti-loader-2 ti-spin" /> Closing…</> : 'Close ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CSAT prompt (shown when ticket is resolved) ──────────────────────────────

function CSATPrompt() {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div style={{
        padding: '14px 20px',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: 'var(--color-text-secondary)',
        flexShrink: 0,
      }}>
        <i className="ti ti-check" style={{ fontSize: 13, color: 'var(--color-text-success)' }} />
        Thanks for the feedback — it helps us improve.
      </div>
    )
  }

  return (
    <div style={{
      padding: '14px 20px',
      borderTop: '0.5px solid var(--color-border-tertiary)',
      flexShrink: 0,
    }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
        Was this resolved to your satisfaction?
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: voted ? 10 : 0 }}>
        {(['up', 'down'] as const).map(v => (
          <button
            key={v}
            onClick={() => setVoted(v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', fontSize: 12, fontWeight: 500,
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              background: voted === v ? 'var(--color-background-secondary)' : 'transparent',
              border: voted === v
                ? '0.5px solid var(--color-border-secondary)'
                : '0.5px solid var(--color-border-tertiary)',
              color: voted === v ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            }}
          >
            {v === 'up' ? '👍' : '👎'}
            {v === 'up' ? 'Yes' : 'Not quite'}
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
          <button
            onClick={() => setSubmitted(true)}
            style={{
              marginTop: 8, padding: '7px 16px', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
              border: 'none', borderRadius: 7, cursor: 'pointer',
            }}
          >
            Submit
          </button>
        </div>
      )}
      {voted === 'up' && (
        <button
          onClick={() => setSubmitted(true)}
          style={{
            marginTop: 10, padding: '7px 16px', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            border: 'none', borderRadius: 7, cursor: 'pointer',
          }}
        >
          Submit
        </button>
      )}
    </div>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => Promise<void>
  disabled?: boolean
}) {
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef           = useRef<HTMLTextAreaElement>(null)
  const focused               = useRef(false)

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending || disabled) return
    setSending(true)
    try { await onSend(text); setInput('') }
    finally { setSending(false) }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const canSend = !!input.trim() && !sending && !disabled

  return (
    <div style={{
      padding: '10px 14px 12px',
      borderTop: '0.5px solid var(--color-border-tertiary)',
      flexShrink: 0,
    }}>
      <div
        style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 13, padding: '7px 7px 7px 14px',
          transition: 'border-color 0.15s',
        }}
        onFocusCapture={() => {
          const el = document.getElementById('composer-wrap')
          if (el) el.style.borderColor = 'var(--color-border-primary)'
        }}
        onBlurCapture={() => {
          const el = document.getElementById('composer-wrap')
          if (el) el.style.borderColor = 'var(--color-border-secondary)'
        }}
        id="composer-wrap"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message support…"
          rows={1}
          disabled={disabled}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', fontSize: 13, lineHeight: 1.6,
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
            overflowY: 'hidden', padding: '3px 0',
          }}
        />
        <button
          onClick={handleSend}
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
          {sending
            ? <i className="ti ti-loader-2 ti-spin" />
            : <i className="ti ti-send-2" aria-hidden="true" />
          }
        </button>
      </div>
      <p style={{
        fontSize: 10, letterSpacing: '0.06em',
        color: 'var(--color-text-secondary)', textAlign: 'center', margin: '6px 0 0',
      }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const router   = useRouter()
  const params   = useParams()
  const ticketId = params.ticketId as string

  const { tickets, isLoaded, loadTickets, closeTicket } = useSupportStore()
  const { client, isReady }                             = useStreamChatClient()
  const { messages, isLoading, openTicket, sendMessage, loadOlderMessages } =
    useSupportChat(client, isReady)

  const [showClose,     setShowClose]     = useState(false)
  const [closing,       setClosing]       = useState(false)
  const [agentTyping,   setAgentTyping]   = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)

  const ticket = tickets.find(t => t._id === ticketId)

  useEffect(() => { if (!isLoaded) loadTickets() }, [isLoaded, loadTickets])

  useEffect(() => {
    if (ticket?.streamChannelId) openTicket(ticket.streamChannelId)
  }, [ticket?.streamChannelId, openTicket])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, agentTyping])

  // Infinite scroll upward
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const handler = () => { if (el.scrollTop < 60) loadOlderMessages() }
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [loadOlderMessages])

  const handleSend = useCallback(async (text: string) => {
    await sendMessage(text)
    // Simulate agent typing after user sends (remove if Stream handles this)
    setAgentTyping(true)
    setTimeout(() => setAgentTyping(false), 3000)
  }, [sendMessage])

  async function handleClose() {
    setClosing(true)
    try { await closeTicket(ticketId); router.push('/support') }
    finally { setClosing(false); setShowClose(false) }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!ticket) {
    return (
      <div style={{ maxWidth: 480, margin: '5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11, margin: '0 auto 1.5rem',
          border: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: 'var(--color-text-secondary)',
        }}>
          <i className="ti ti-file-off" aria-hidden="true" />
        </div>
        <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1 }}>
          Ticket not found
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 2rem', lineHeight: 1.7 }}>
          This ticket doesn't exist or has been removed.
        </p>
        <Link
          href="/support"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
            textDecoration: 'none', color: 'var(--color-text-primary)',
            padding: '9px 18px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8,
          }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 12 }} />
          Back to support
        </Link>
      </div>
    )
  }

  const isClosed   = ticket.status === 'closed' || ticket.status === 'resolved'
  const statusMeta = STATUS_META[ticket.status]

  // Group messages by day
  const grouped: { day: string; msgs: typeof messages }[] = []
  for (const msg of messages) {
    const day  = dayLabel(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last?.day === day) last.msgs.push(msg)
    else grouped.push({ day, msgs: [msg] })
  }

  return (
    <>
      <div style={{
        maxWidth: 680, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        height: 'calc(100dvh - 64px)',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 20px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          flexShrink: 0,
        }}>
          <Link
            href="/support"
            style={{
              display: 'flex', alignItems: 'center',
              color: 'var(--color-text-secondary)', textDecoration: 'none',
              padding: 4, marginRight: 4, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 17 }} aria-label="Back" />
          </Link>

          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            border: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--color-text-secondary)',
          }}>
            <i className={`ti ${CATEGORY_ICONS[ticket.category]}`} aria-hidden="true" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...DISPLAY, fontSize: 16, fontWeight: 400, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {CATEGORY_LABELS[ticket.category]}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 3,
              fontSize: 10, letterSpacing: '0.1em',
              color: statusMeta.color, fontWeight: 500,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusMeta.color, flexShrink: 0 }} />
              {statusMeta.label} · #{ticketId.slice(-8).toUpperCase()}
            </div>
          </div>

          {!isClosed && (
            <button
              onClick={() => setShowClose(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                background: 'transparent', color: 'var(--color-text-secondary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 7, cursor: 'pointer', flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-secondary)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
            >
              <i className="ti ti-check" style={{ fontSize: 12 }} />
              Resolve
            </button>
          )}
        </div>

        {/* ── Agent info bar ── */}
        <AgentInfoBar />

        {/* ── Message list ── */}
        <div
          ref={listRef}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '18px 18px',
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
              gap: 12, padding: '3rem 1rem', textAlign: 'center',
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
                <p style={{ ...DISPLAY, fontSize: 20, fontWeight: 300, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                  Start the conversation
                </p>
                <p style={{ fontSize: 12, margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  Describe your issue below and we'll reply within a few hours.
                </p>
              </div>
            </div>
          )}

          {grouped.map(({ day, msgs }) => (
            <div key={day}>
              <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
                <span style={{
                  ...DISPLAY,
                  fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-background-secondary)',
                  padding: '3px 12px', borderRadius: 20,
                  border: '0.5px solid var(--color-border-tertiary)',
                }}>
                  {day}
                </span>
              </div>
              {msgs.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  text={msg.text ?? ''}
                  isMine={msg.user?.id === client?.userID}
                  createdAt={msg.created_at}
                  isSystem={msg.type === 'system'}
                  isRead={i < msgs.length - 1}  // last message not yet read
                />
              ))}
            </div>
          ))}

          {/* Typing indicator — shows agent is active */}
          {agentTyping && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        {/* ── Closed notice ── */}
        {isClosed && (
          <div style={{
            padding: '12px 20px', flexShrink: 0,
            borderTop: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <i className="ti ti-lock" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
            <span style={{ fontSize: 12, letterSpacing: '0.04em', color: 'var(--color-text-secondary)', flex: 1 }}>
              This ticket is {ticket.status}.
            </span>
            <Link
              href="/support"
              style={{
                flexShrink: 0, fontSize: 11, fontWeight: 500,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--color-text-primary)',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}
            >
              New request
            </Link>
          </div>
        )}

        {/* ── CSAT on resolved tickets ── */}
        {ticket.status === 'resolved' && <CSATPrompt />}

        {/* ── Composer ── */}
        {!isClosed && <Composer onSend={handleSend} />}
      </div>

      {showClose && (
        <CloseConfirm
          onConfirm={handleClose}
          onCancel={() => setShowClose(false)}
          closing={closing}
        />
      )}
    </>
  )
}