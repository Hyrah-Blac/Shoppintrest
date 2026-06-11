'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupportStore } from '@/store/useSupportStore'
import { useSupportChat } from '@/hooks/useSupportChat'
import { useStreamContext } from '@/components/providers/StreamProvider'
import { TicketCategory, TicketStatus, SupportTicket } from '@/types/support'
import { SupportChannelPreview } from '@/hooks/useSupportChat'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

const QUICK_STARTS = [
  { icon: 'ti-package',        label: "Where's my order?", category: 'order'  as TicketCategory, prefill: "I'd like to check on my order status." },
  { icon: 'ti-arrow-back-up',  label: 'Start a return',    category: 'return' as TicketCategory, prefill: "I'd like to return something."         },
  { icon: 'ti-credit-card',    label: 'Refund issue',      category: 'refund' as TicketCategory, prefill: "I have a question about a refund."     },
  { icon: 'ti-message-circle', label: 'Something else',    category: 'other'  as TicketCategory, prefill: ''                                      },
]

const STATUS_META: Record<TicketStatus, { label: string; dot: string }> = {
  open:     { label: 'Awaiting reply', dot: 'var(--color-text-info)'      },
  pending:  { label: 'In review',      dot: 'var(--color-text-warning)'   },
  resolved: { label: 'Resolved',       dot: 'var(--color-text-success)'   },
  closed:   { label: 'Closed',         dot: 'var(--color-text-secondary)' },
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order: 'Order issue', return: 'Return', refund: 'Refund',
  account: 'Account',   other: 'Message',
}

function relativeTime(d: string | Date | undefined) {
  if (!d) return ''
  const diff = Date.now() - new Date(d as string).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d as string).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Merged ticket type ───────────────────────────────────────────────────────

interface MergedTicket extends SupportTicket {
  unreadCount:      number
  lastMessageText?: string
  lastActivityAt:   string
}

// ─── New Message Sheet ────────────────────────────────────────────────────────

function NewMessageSheet({
  onClose,
  initialCategory,
  initialText,
}: {
  onClose: () => void
  initialCategory?: TicketCategory
  initialText?: string
}) {
  const router = useRouter()
  const { createTicket } = useSupportStore()
  const { client } = useStreamContext()
  const [message, setMessage] = useState(initialText ?? '')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => textRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [message])

  const handleSend = useCallback(async () => {
    if (!message.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const ticket = await createTicket(initialCategory ?? 'other', orderId.trim() || undefined)

      // Send the customer's actual typed message into the new ticket's channel
      if (client && ticket.streamChannelId) {
        try {
          const channel = client.channel('messaging', ticket.streamChannelId)
          await channel.watch()
          await channel.sendMessage({ text: message.trim() })
        } catch {
          // Non-fatal: ticket exists even if this message fails to send.
          // The customer can retry from inside the conversation.
        }
      }

      router.push(`/support/${ticket._id}`)
    } catch {
      setError('Something went wrong — please try again.')
      setLoading(false)
    }
  }, [message, loading, initialCategory, orderId, createTicket, router, client])

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  const needsOrderId = initialCategory === 'order' || initialCategory === 'return' || initialCategory === 'refund'

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--color-background-primary)',
          borderRadius: '20px 20px 0 0',
          border: '0.5px solid var(--color-border-tertiary)',
          maxHeight: '92dvh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-secondary)' }} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 16px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}>
          <div>
            <p style={{
              ...DISPLAY, fontSize: 9, letterSpacing: '0.32em',
              textTransform: 'uppercase', color: 'var(--color-text-secondary)',
              margin: '0 0 5px',
            }}>
              Support
            </p>
            <h2 style={{
              ...DISPLAY, fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              fontWeight: 300, color: 'var(--color-text-primary)',
              margin: 0, lineHeight: 1,
            }}>
              What's the issue?
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              border: '0.5px solid var(--color-border-secondary)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'var(--color-text-secondary)',
            }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ padding: '20px 20px 24px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <textarea
              ref={textRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={onKey}
              placeholder="Tell us what's happening and we'll sort it out…"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '13px 15px', fontSize: 14, lineHeight: 1.65,
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 12, outline: 'none', resize: 'none',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e  => e.currentTarget.style.borderColor = 'var(--color-border-primary)'}
              onBlur={e   => e.currentTarget.style.borderColor = 'var(--color-border-secondary)'}
            />

            {needsOrderId && (
              <div>
                <label style={{
                  display: 'block', fontSize: 11,
                  color: 'var(--color-text-secondary)', marginBottom: 6,
                }}>
                  Order number{' '}
                  <span style={{ opacity: 0.5 }}>— optional but speeds things up</span>
                </label>
                <input
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="#ORDER-123456"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 13px', fontSize: 13,
                    border: '0.5px solid var(--color-border-secondary)',
                    borderRadius: 9, outline: 'none',
                    background: 'var(--color-background-secondary)',
                    color: 'var(--color-text-primary)',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-primary)'}
                  onBlur={e  => e.currentTarget.style.borderColor = 'var(--color-border-secondary)'}
                />
              </div>
            )}

            <p style={{
              fontSize: 11, color: 'var(--color-text-secondary)',
              margin: 0, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-text-success)',
              }} />
              We typically reply within a few hours.
            </p>

            {error && (
              <p style={{
                fontSize: 12, color: 'var(--color-text-danger)',
                margin: 0, padding: '9px 12px',
                border: '0.5px solid var(--color-text-danger)',
                borderRadius: 8,
              }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSend}
              disabled={!message.trim() || loading}
              style={{
                width: '100%', padding: '13px',
                background: message.trim() && !loading
                  ? 'var(--color-text-primary)'
                  : 'var(--color-background-secondary)',
                color: message.trim() && !loading
                  ? 'var(--color-background-primary)'
                  : 'var(--color-text-secondary)',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 10,
                cursor: message.trim() && !loading ? 'pointer' : 'not-allowed',
                fontSize: 13, fontWeight: 500, letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {loading
                ? <><i className="ti ti-loader-2 ti-spin" /> Sending…</>
                : <><i className="ti ti-send-2" /> Send message</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Conversation Row ─────────────────────────────────────────────────────────

function ConversationRow({ ticket }: { ticket: MergedTicket }) {
  const [hovered, setHovered] = useState(false)
  const { label, dot } = STATUS_META[ticket.status]
  const isDone     = ticket.status === 'resolved' || ticket.status === 'closed'
  const hasUnread  = ticket.unreadCount > 0

  return (
    <Link href={`/support/${ticket._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 20px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          background: hovered
            ? 'var(--color-background-secondary)'
            : hasUnread
              ? 'color-mix(in srgb, var(--color-text-info) 4%, var(--color-background-primary))'
              : 'transparent',
          transition: 'background 0.1s', cursor: 'pointer',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: isDone
            ? 'var(--color-background-secondary)'
            : 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17,
          color: isDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
          position: 'relative',
        }}>
          <i className={`ti ti-${
            ticket.category === 'order'   ? 'package'        :
            ticket.category === 'return'  ? 'arrow-back-up'  :
            ticket.category === 'refund'  ? 'credit-card'    :
            ticket.category === 'account' ? 'user-circle'    : 'message-circle'
          }`} aria-hidden="true" />
          {hasUnread && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              minWidth: 16, height: 16, borderRadius: 8,
              background: 'var(--color-text-info)',
              border: '2px solid var(--color-background-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: '#fff',
              padding: '0 3px', boxSizing: 'border-box',
            }}>
              {ticket.unreadCount > 9 ? '9+' : ticket.unreadCount}
            </span>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: 3,
          }}>
            <span style={{
              fontSize: 14, fontWeight: hasUnread ? 600 : 400,
              color: 'var(--color-text-primary)',
            }}>
              Support Team
            </span>
            <span style={{
              fontSize: 11, color: 'var(--color-text-secondary)',
              flexShrink: 0, marginLeft: 8,
            }}>
              {relativeTime(ticket.lastActivityAt)}
            </span>
          </div>

          {ticket.lastMessageText ? (
            <div style={{
              fontSize: 13,
              color: hasUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: hasUnread ? 500 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {ticket.lastMessageText}
            </div>
          ) : (
            <div style={{
              fontSize: 13, color: 'var(--color-text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {CATEGORY_LABELS[ticket.category]}
              {' · '}
              <span style={{ color: dot, fontWeight: 500 }}>{label}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { tickets: restTickets, isLoaded, loadTickets } = useSupportStore()
  const { client, isReady } = useStreamContext()
  const { tickets: streamPreviews } = useSupportChat(client, isReady)

  const [sheet, setSheet] = useState<{
    open: boolean
    category?: TicketCategory
    prefill?: string
  }>({ open: false })

  useEffect(() => {
    if (!isLoaded) loadTickets()
  }, [isLoaded, loadTickets])

  // ── Merge REST tickets with Stream live preview data ──────────────────────
  const mergedTickets: MergedTicket[] = restTickets.map(ticket => {
    const stream = streamPreviews.find(s => s.streamChannelId === ticket.streamChannelId)
    return {
      ...ticket,
      unreadCount:      stream?.unreadCount      ?? 0,
      lastMessageText:  stream?.lastMessage,
      lastActivityAt:   stream?.lastMessageAt    ?? ticket.updatedAt,
    }
  })

  // Sort: unread first, then by most recent activity
  const sorted = [...mergedTickets].sort((a, b) => {
    if ((a.unreadCount > 0) !== (b.unreadCount > 0)) {
      return a.unreadCount > 0 ? -1 : 1
    }
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  })

  const active = sorted.filter(t => t.status === 'open' || t.status === 'pending')
  const done   = sorted.filter(t => t.status === 'resolved' || t.status === 'closed')

  return (
    <>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2.5rem 1.25rem 6rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            ...DISPLAY, fontSize: 9, letterSpacing: '0.34em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            margin: '0 0 8px',
          }}>
            Help
          </p>
          <h1 style={{
            ...DISPLAY, fontSize: 'clamp(2.2rem, 7vw, 3.5rem)', fontWeight: 300,
            color: 'var(--color-text-primary)', margin: 0, lineHeight: 0.95,
          }}>
            How can we help?
          </h1>
        </div>

        {/* Quick-start grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8, marginBottom: '2rem',
        }}>
          {QUICK_STARTS.map(q => (
            <QuickStartButton
              key={q.category + q.label}
              q={q}
              onClick={() => setSheet({ open: true, category: q.category, prefill: q.prefill })}
            />
          ))}
        </div>

        {/* Conversations panel */}
        <div style={{
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 20px',
            borderBottom: sorted.length > 0 ? '0.5px solid var(--color-border-tertiary)' : 'none',
          }}>
            <span style={{
              ...DISPLAY, fontSize: 16, fontWeight: 400,
              color: 'var(--color-text-primary)',
            }}>
              Messages
              {active.length > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 10, fontWeight: 500,
                  color: 'var(--color-text-info)',
                  border: '0.5px solid currentColor',
                  borderRadius: 20, padding: '2px 8px', opacity: 0.85,
                }}>
                  {active.length} active
                </span>
              )}
            </span>
            <button
              onClick={() => setSheet({ open: true })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', fontSize: 12, fontWeight: 500,
                background: 'var(--color-text-primary)',
                color: 'var(--color-background-primary)',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <i className="ti ti-plus" style={{ fontSize: 12 }} />
              New
            </button>
          </div>

          {!isLoaded ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
            </div>
          ) : sorted.length === 0 ? (
            /* ── Improved empty state ── */
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11, margin: '0 auto 1.25rem',
                border: '0.5px solid var(--color-border-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: 'var(--color-text-secondary)',
              }}>
                <i className="ti ti-messages" aria-hidden="true" />
              </div>
              <p style={{
                ...DISPLAY, fontSize: 20, fontWeight: 300,
                color: 'var(--color-text-primary)', margin: '0 0 8px',
              }}>
                Need help?
              </p>
              <p style={{
                fontSize: 12, color: 'var(--color-text-secondary)',
                margin: '0 0 1.5rem', lineHeight: 1.7, maxWidth: 280, marginInline: 'auto',
              }}>
                Send a message and our support team will get back to you shortly.
              </p>
              <button
                onClick={() => setSheet({ open: true })}
                style={{
                  padding: '9px 22px', fontSize: 12, fontWeight: 500,
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-background-primary)',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                }}
              >
                <i className="ti ti-message-circle" style={{ fontSize: 13 }} />
                Send a message
              </button>
            </div>
          ) : (
            <>
              {active.map(t => <ConversationRow key={t._id} ticket={t} />)}
              {done.length > 0 && active.length > 0 && (
                <div style={{
                  padding: '8px 20px 6px',
                  borderTop: '0.5px solid var(--color-border-tertiary)',
                  fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                }}>
                  Past
                </div>
              )}
              {done.map(t => <ConversationRow key={t._id} ticket={t} />)}
            </>
          )}
        </div>

        {/* Email fallback */}
        <p style={{
          marginTop: '2rem', textAlign: 'center',
          fontSize: 11, color: 'var(--color-text-secondary)',
        }}>
          Rather email?{' '}
          <a
            href="mailto:support@shoppintrest.com"
            style={{
              color: 'var(--color-text-primary)',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            support@shoppintrest.com
          </a>
        </p>
      </div>

      {sheet.open && (
        <NewMessageSheet
          onClose={() => setSheet({ open: false })}
          initialCategory={sheet.category}
          initialText={sheet.prefill}
        />
      )}
    </>
  )
}

function QuickStartButton({
  q,
  onClick,
}: {
  q: typeof QUICK_STARTS[number]
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px', cursor: 'pointer', textAlign: 'left',
        background: hovered ? 'var(--color-background-secondary)' : 'transparent',
        border: `0.5px solid ${hovered ? 'var(--color-border-secondary)' : 'var(--color-border-tertiary)'}`,
        borderRadius: 14, transition: 'all 0.15s', width: '100%',
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        border: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, color: 'var(--color-text-secondary)',
      }}>
        <i className={`ti ${q.icon}`} aria-hidden="true" />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
        {q.label}
      </span>
    </button>
  )
}