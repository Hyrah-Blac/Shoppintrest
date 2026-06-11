'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { useSupportChat } from '@/hooks/useSupportChat'
import { useStreamContext } from '@/components/providers/StreamProvider'
import { TicketStatus, TicketCategory, SupportTicket } from '@/types/support'

// ─── Design tokens ────────────────────────────────────────────────────────────

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminTicket extends Omit<SupportTicket, 'userId'> {
  userId: {
    _id:          string
    username:     string
    email:        string
    displayName?: string
    avatar?:      string
  } | null
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

// ─── Typing dots ──────────────────────────────────────────────────────────────

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

function MessageBubble({
  text, isMine, createdAt, isSystem,
}: {
  text: string
  isMine: boolean
  createdAt?: string | Date
  isSystem?: boolean
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
      <div style={{
        maxWidth: '72%',
        background: isMine ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
        color: isMine ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
        borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        padding: '9px 13px', fontSize: 13, lineHeight: 1.65,
        border: isMine ? 'none' : '0.5px solid var(--color-border-tertiary)',
      }}>
        {text}
      </div>
      {createdAt && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, padding: '0 4px', cursor: 'default' }}
          onMouseEnter={() => setShowAbsolute(true)}
          onMouseLeave={() => setShowAbsolute(false)}
        >
          <span style={{ fontSize: 10, letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
            {showAbsolute ? timeLabel(createdAt) : relativeTime(createdAt)}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Customer info bar ────────────────────────────────────────────────────────

function CustomerInfoBar({ ticket }: { ticket: AdminTicket }) {
  const user = ticket.userId
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px',
      borderBottom: '0.5px solid var(--color-border-tertiary)',
      background: 'var(--color-background-secondary)',
      flexShrink: 0,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        border: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)',
        overflow: 'hidden', background: 'var(--color-background-primary)',
      }}>
        {user?.avatar
          ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (user?.displayName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
          {user?.displayName ?? user?.username ?? 'Unknown user'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email ?? '—'}
          {ticket.orderId && ` · Order #${ticket.orderId.slice(-8).toUpperCase()}`}
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      }}
    >
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 14, padding: '2rem', maxWidth: 380, width: '100%',
      }}>
        <p style={{ ...DISPLAY, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
          Confirm action
        </p>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 12px', lineHeight: 1 }}>
          Mark as resolved?
        </h2>
        <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: '0 0 1.75rem' }}>
          The customer will be notified that this ticket is closed. They can open a new
          request if the issue isn't fully resolved.
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
              border: '0.5px solid var(--color-border-secondary)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={closing}
            style={{
              flex: 1, padding: '10px', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              borderRadius: 8, cursor: closing ? 'not-allowed' : 'pointer',
              background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
              border: 'none', transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: closing ? 0.7 : 1,
            }}
          >
            {closing ? <><i className="ti ti-loader-2 ti-spin" /> Closing…</> : 'Mark resolved'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
  onSend,
  onTyping,
  disabled,
}: {
  onSend: (text: string) => Promise<void>
  onTyping?: () => void
  disabled?: boolean
}) {
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef           = useRef<HTMLTextAreaElement>(null)

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
    <div style={{ padding: '10px 14px 12px', borderTop: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        border: '0.5px solid var(--color-border-secondary)',
        borderRadius: 13, padding: '7px 7px 7px 14px',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); onTyping?.() }}
          onKeyDown={handleKey}
          placeholder="Reply to customer…"
          rows={1}
          disabled={disabled}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', fontSize: 13, lineHeight: 1.6,
            color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)',
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
          {sending ? <i className="ti ti-loader-2 ti-spin" /> : <i className="ti ti-send-2" aria-hidden="true" />}
        </button>
      </div>
      <p style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--color-text-secondary)', textAlign: 'center', margin: '6px 0 0' }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTicketDetailPage() {
  const router   = useRouter()
  const params   = useParams()
  const ticketId = params.ticketId as string

  const { client, isReady } = useStreamContext()
  const {
    messages, isLoading, isTyping, openTicket, sendMessage,
    loadOlderMessages, sendTyping,
  } = useSupportChat(client, isReady)

  const [ticket,    setTicket]    = useState<AdminTicket | null>(null)
  const [loaded,    setLoaded]    = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [closing,   setClosing]   = useState(false)

  const bottomRef        = useRef<HTMLDivElement>(null)
  const listRef          = useRef<HTMLDivElement>(null)
  const wasNearBottomRef = useRef(true)

  // ── Smart auto-scroll state ──────────────────────────────────────────────
  const [showNewMessages, setShowNewMessages] = useState(false)

  // Fetch ticket meta
  useEffect(() => {
    let cancelled = false
    apiClient.support.admin.getTicket(ticketId)
      .then(res => { if (!cancelled) setTicket(res.data?.data ?? null) })
      .catch(() => { if (!cancelled) setTicket(null) })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [ticketId])

  // Open the Stream channel once we have it
  useEffect(() => {
    if (ticket?.streamChannelId) openTicket(ticket.streamChannelId)
  }, [ticket?.streamChannelId, openTicket])

  // ── isNearBottom helper ──────────────────────────────────────────────────
  const isNearBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }, [])

  // ── scrollToBottom helper ────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowNewMessages(false)
    wasNearBottomRef.current = true
  }, [])

  // ── Track near-bottom + load older on scroll-to-top ─────────────────────
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

  // ── Smart auto-scroll on new messages / typing ───────────────────────────
  useEffect(() => {
    if (wasNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setShowNewMessages(true)
    }
  }, [messages.length, isTyping])

  // ── Send + fire-and-forget notify ────────────────────────────────────────
  const handleSend = useCallback(async (text: string) => {
    await sendMessage(text)
    apiClient.support.admin.notifyReply(ticketId).catch(() => {})
  }, [sendMessage, ticketId])

  async function handleClose() {
    setClosing(true)
    try {
      await apiClient.support.admin.closeTicket(ticketId)
      router.push('/admin/support')
    } finally {
      setClosing(false)
      setShowClose(false)
    }
  }

  // ── Day grouping ─────────────────────────────────────────────────────────
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!loaded) {
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
        <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1 }}>
          Ticket not found
        </p>
        <Link
          href="/admin/support"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
            textDecoration: 'none', color: 'var(--color-text-primary)',
            padding: '9px 18px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8,
            marginTop: 16,
          }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 12 }} />
          Back to inbox
        </Link>
      </div>
    )
  }

  const isClosed   = ticket.status === 'closed' || ticket.status === 'resolved'
  const statusMeta = STATUS_META[ticket.status]

  return (
    <>
      <div style={{
        maxWidth: 760, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        height: 'calc(100dvh - 64px)',
        position: 'relative',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 20px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          flexShrink: 0,
        }}>
          <Link
            href="/admin/support"
            style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', textDecoration: 'none', padding: 4, marginRight: 4, transition: 'color 0.15s' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 10, letterSpacing: '0.1em', color: statusMeta.color, fontWeight: 500 }}>
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
                borderRadius: 7, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-secondary)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              <i className="ti ti-check" style={{ fontSize: 12 }} />
              Resolve
            </button>
          )}
        </div>

        {/* ── Customer info ── */}
        <CustomerInfoBar ticket={ticket} />

        {/* ── Message list ── */}
        <div
          ref={listRef}
          style={{ flex: 1, overflowY: 'auto', padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, border: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                <i className="ti ti-messages" aria-hidden="true" />
              </div>
              <p style={{ ...DISPLAY, fontSize: 18, fontWeight: 300, margin: 0, color: 'var(--color-text-primary)' }}>
                No messages yet
              </p>
              <p style={{ fontSize: 12, margin: 0 }}>
                The customer hasn't sent anything in this ticket.
              </p>
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
              {msgs.map(msg => (
                <MessageBubble
                  key={msg.id}
                  text={msg.text ?? ''}
                  isMine={msg.user?.id === client?.userID}
                  createdAt={msg.created_at}
                  isSystem={msg.type === 'system'}
                />
              ))}
            </div>
          ))}

          {/* ── Customer typing indicator ── */}
          {isTyping && (
            <div style={{ padding: '0 4px 4px', fontSize: 11, color: 'var(--color-text-secondary)' }}>
              Customer is typing…
            </div>
          )}
          {isTyping && <TypingDots />}

          <div ref={bottomRef} />
        </div>

        {/* ── New messages button — above composer ── */}
        {showNewMessages && (
          <button
            onClick={scrollToBottom}
            style={{
              position: 'absolute',
              bottom: isClosed ? 56 : 80,
              left: '50%', transform: 'translateX(-50%)',
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 5,
            }}
          >
            <i className="ti ti-arrow-down" style={{ fontSize: 12 }} />
            New Messages
          </button>
        )}

        {/* ── Closed notice ── */}
        {isClosed && (
          <div style={{ padding: '12px 20px', flexShrink: 0, borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="ti ti-lock" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
            <span style={{ fontSize: 12, letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
              This ticket is {ticket.status}.
            </span>
          </div>
        )}

        {/* ── Composer ── */}
        {!isClosed && <Composer onSend={handleSend} onTyping={sendTyping} />}
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