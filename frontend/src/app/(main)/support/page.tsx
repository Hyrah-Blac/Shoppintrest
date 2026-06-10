'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupportStore } from '@/store/useSupportStore'
import { TicketCategory, TicketStatus, SupportTicket } from '@/types/support'

// ─── Design tokens ────────────────────────────────────────────────────────────
// Mirrors HeroSection: Cormorant Garamond display, 0.5px borders, tracked
// uppercase micro-labels, weight-300 editorial headings.

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: {
  value: TicketCategory
  label: string
  icon: string
  description: string
}[] = [
  { value: 'order',   label: 'Order issue',  icon: 'ti-package',        description: 'Missing, delayed, or wrong item'  },
  { value: 'return',  label: 'Return',       icon: 'ti-arrow-back-up',  description: 'Start or check a return'          },
  { value: 'refund',  label: 'Refund',       icon: 'ti-credit-card',    description: 'Payment or refund status'         },
  { value: 'account', label: 'Account',      icon: 'ti-user-circle',    description: 'Login, profile, or billing'       },
  { value: 'other',   label: 'Other',        icon: 'ti-message-circle', description: 'Anything else'                    },
]

const STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
  open:     { label: 'Open',      color: 'var(--color-text-info)'      },
  pending:  { label: 'In review', color: 'var(--color-text-warning)'   },
  resolved: { label: 'Resolved',  color: 'var(--color-text-success)'   },
  closed:   { label: 'Closed',    color: 'var(--color-text-secondary)' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string | Date) {
  const diff = Date.now() - new Date(d as string).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TicketStatus }) {
  const { label, color } = STATUS_META[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500,
      color, padding: '3px 9px', borderRadius: 20, border: '0.5px solid currentColor', opacity: 0.85,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ─── Response time badge ──────────────────────────────────────────────────────
// Research-backed: showing expected reply time is now a competitive signal.

function ReplyTimeBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '6px 12px',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 20, fontSize: 12,
      color: 'var(--color-text-secondary)',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: 'var(--color-text-success)',
        boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-text-success) 20%, transparent)',
      }} />
      <span>Replies within a few hours</span>
    </div>
  )
}

// ─── Stat strip ───────────────────────────────────────────────────────────────
// Context that earns trust before the user opens a ticket.

function StatStrip() {
  const stats = [
    { value: '< 4h', label: 'Avg. first reply'  },
    { value: '97%',  label: 'Satisfaction rate'  },
    { value: '24/7', label: 'Ticket visibility'  },
  ]
  return (
    <div style={{
      display: 'flex', gap: 0,
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 12, overflow: 'hidden',
      marginBottom: '2.5rem',
    }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          flex: 1, padding: '14px 16px', textAlign: 'center',
          borderRight: i < stats.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
        }}>
          <div style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, color: 'var(--color-text-primary)', lineHeight: 1 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginTop: 5 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── New ticket modal ─────────────────────────────────────────────────────────

function NewTicketModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { createTicket } = useSupportStore()
  const [step,     setStep]     = useState<'pick' | 'detail'>('pick')
  const [selected, setSelected] = useState<TicketCategory | null>(null)
  const [orderId,  setOrderId]  = useState('')
  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Keyboard dismiss
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function pickCategory(cat: TicketCategory) {
    setSelected(cat)
    setStep('detail')
  }

  async function handleSubmit() {
    if (!selected) return
    setLoading(true); setError('')
    try {
      const ticket = await createTicket(selected, orderId.trim() || undefined)
      router.push(`/support/${ticket._id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 0,
      }}
    >
      {/* Sheet — slides up like Intercom's messenger on mobile, centred on desktop */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: 520,
        maxHeight: '92dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
        // On desktop, appear as a centred card
        className="md:!rounded-2xl md:!mb-auto md:!mt-auto"
      >
        {/* Drag handle (mobile affordance) */}
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '12px 0 4px',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'var(--color-border-secondary)',
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '12px 20px 16px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          flexShrink: 0,
        }}>
          <div>
            {step === 'detail' && selected && (
              <button
                onClick={() => setStep('pick')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, color: 'var(--color-text-secondary)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, marginBottom: 8,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
              >
                <i className="ti ti-arrow-left" style={{ fontSize: 11 }} />
                Back
              </button>
            )}
            <p style={{
              ...DISPLAY,
              fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase',
              color: 'var(--color-text-secondary)', margin: '0 0 6px',
            }}>
              {step === 'pick' ? 'Support' : CATEGORIES.find(c => c.value === selected)?.label}
            </p>
            <h2 style={{
              ...DISPLAY,
              fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 300,
              color: 'var(--color-text-primary)', margin: 0, lineHeight: 1,
            }}>
              {step === 'pick' ? 'What can we help with?' : 'A few more details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '50%',
              border: '0.5px solid var(--color-border-secondary)',
              background: 'transparent', color: 'var(--color-text-secondary)',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className="ti ti-x" style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px' }}>

          {step === 'pick' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => pickCategory(cat.value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    gap: 8, padding: '16px 14px', cursor: 'pointer', textAlign: 'left',
                    background: 'transparent',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 12, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--color-background-secondary)'
                    e.currentTarget.style.borderColor = 'var(--color-border-secondary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '0.5px solid var(--color-border-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, color: 'var(--color-text-secondary)',
                  }}>
                    <i className={`ti ${cat.icon}`} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 3 }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {cat.description}
                    </div>
                  </div>
                  <i className="ti ti-arrow-right" style={{
                    fontSize: 12, color: 'var(--color-text-secondary)',
                    opacity: 0.4, marginTop: 'auto', alignSelf: 'flex-end',
                  }} />
                </button>
              ))}
            </div>
          )}

          {step === 'detail' && selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Order ID — only for relevant categories */}
              {(selected === 'order' || selected === 'return' || selected === 'refund') && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)', marginBottom: 6,
                  }}>
                    Order ID <span style={{ opacity: 0.45 }}>(optional)</span>
                  </label>
                  <input
                    value={orderId}
                    onChange={e => setOrderId(e.target.value)}
                    placeholder="e.g. 664abc123…"
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
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-secondary)'}
                  />
                </div>
              )}

              {/* Initial message */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)', marginBottom: 6,
                }}>
                  Tell us what happened <span style={{ opacity: 0.45 }}>(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe the issue and we'll have context ready when we reply…"
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 13px', fontSize: 13, lineHeight: 1.6,
                    border: '0.5px solid var(--color-border-secondary)',
                    borderRadius: 9, outline: 'none', resize: 'vertical',
                    background: 'var(--color-background-secondary)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-sans)',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-secondary)'}
                />
              </div>

              {/* Reply time expectation — reassures before submit */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 13px',
                background: 'var(--color-background-secondary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 9, fontSize: 12,
                color: 'var(--color-text-secondary)',
              }}>
                <i className="ti ti-clock" style={{ fontSize: 13 }} aria-hidden="true" />
                Typical first reply within a few hours during business hours.
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 13px',
                  border: '0.5px solid var(--color-text-danger)',
                  borderRadius: 9, fontSize: 12,
                  color: 'var(--color-text-danger)',
                }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: 13 }} />
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: !loading ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
                  color: !loading ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
                  border: '0.5px solid var(--color-border-secondary)',
                  borderRadius: 9, cursor: !loading ? 'pointer' : 'not-allowed',
                  fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                {loading
                  ? <><i className="ti ti-loader-2 ti-spin" style={{ fontSize: 13 }} /> Creating…</>
                  : <><i className="ti ti-send-2" style={{ fontSize: 13 }} /> Send request</>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CSAT thumb prompt (shown on resolved/closed tickets) ────────────────────
// Pattern from Intercom / Gorgias: lightweight emoji-scale, no forms.

function CSATPrompt({ ticketId }: { ticketId: string }) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  if (voted) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 9, fontSize: 12, color: 'var(--color-text-secondary)',
      }}>
        <i className="ti ti-check" style={{ fontSize: 13 }} />
        Thanks for the feedback!
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 9, fontSize: 12, color: 'var(--color-text-secondary)',
    }}>
      <span style={{ flex: 1 }}>Was this resolved to your satisfaction?</span>
      <button
        aria-label="Yes"
        onClick={() => setVoted('up')}
        style={{
          width: 30, height: 30, borderRadius: 8, fontSize: 15,
          border: '0.5px solid var(--color-border-tertiary)',
          background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        👍
      </button>
      <button
        aria-label="No"
        onClick={() => setVoted('down')}
        style={{
          width: 30, height: 30, borderRadius: 8, fontSize: 15,
          border: '0.5px solid var(--color-border-tertiary)',
          background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        👎
      </button>
    </div>
  )
}

// ─── Ticket row ───────────────────────────────────────────────────────────────

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const cat     = CATEGORIES.find(c => c.value === ticket.category)
  const isDone  = ticket.status === 'resolved' || ticket.status === 'closed'
  const isUrgent = ticket.status === 'open'

  return (
    <Link href={`/support/${ticket._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '15px 20px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          transition: 'background 0.12s', cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Urgency dot */}
        {isUrgent && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-text-info)',
            boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-text-info) 20%, transparent)',
          }} />
        )}

        {/* Category icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          border: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, color: isDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
          opacity: isDone ? 0.5 : 1,
          marginLeft: isUrgent ? 0 : 18,  // compensate for dot width
        }}>
          <i className={`ti ${cat?.icon ?? 'ti-message-circle'}`} aria-hidden="true" />
        </div>

        {/* Copy */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              ...DISPLAY,
              fontSize: 16, fontWeight: 400,
              color: isDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            }}>
              {cat?.label ?? ticket.category}
            </span>
            <StatusPill status={ticket.status} />
          </div>
          <p style={{
            fontSize: 11, letterSpacing: '0.04em',
            color: 'var(--color-text-secondary)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            #{ticket._id.slice(-8).toUpperCase()} · {timeAgo(ticket.updatedAt)}
          </p>
        </div>

        <i className="ti ti-arrow-right" style={{
          color: 'var(--color-text-secondary)', fontSize: 13,
          flexShrink: 0, opacity: 0.35,
        }} aria-hidden="true" />
      </div>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 11, margin: '0 auto 1.5rem',
        border: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, color: 'var(--color-text-secondary)',
      }}>
        <i className="ti ti-inbox" aria-hidden="true" />
      </div>
      <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1 }}>
        No open tickets
      </p>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 1.75rem', lineHeight: 1.7 }}>
        We typically reply within a few hours.<br />Open a request below and we'll get right on it.
      </p>
      <button
        onClick={onNew}
        style={{
          padding: '9px 22px', fontSize: 11, fontWeight: 500,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
          border: 'none', borderRadius: 8, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 7,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <i className="ti ti-plus" style={{ fontSize: 12 }} />
        New request
      </button>
    </div>
  )
}

// ─── Quick-help strip ─────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { icon: 'ti-truck',   label: 'Track order',   href: '/orders'  },
  { icon: 'ti-rotate',  label: 'Returns',       href: '/returns' },
  { icon: 'ti-book',    label: 'FAQ',           href: '/faq'     },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { tickets, isLoaded, loadTickets } = useSupportStore()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter]       = useState<TicketStatus | 'all'>('all')

  useEffect(() => {
    if (!isLoaded) loadTickets()
  }, [isLoaded, loadTickets])

  const filtered    = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)
  const activeCount = tickets.filter(t => t.status === 'open' || t.status === 'pending').length
  const doneTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed')

  return (
    <>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.25rem 6rem' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{
            ...DISPLAY,
            fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase',
            color: 'var(--color-text-secondary)', margin: '0 0 10px',
          }}>
            Help &amp; support
          </p>
          <h1 style={{
            ...DISPLAY,
            fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 300,
            color: 'var(--color-text-primary)', margin: '0 0 16px', lineHeight: 0.95,
          }}>
            How can we help?
          </h1>
          <ReplyTimeBadge />
        </div>

        {/* ── Trust stats ── */}
        <StatStrip />

        {/* ── Quick links ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '3rem' }}>
          {QUICK_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 14px',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 20, fontSize: 12, fontWeight: 500,
                color: 'var(--color-text-secondary)', textDecoration: 'none',
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
              <i className={`ti ${l.icon}`} style={{ fontSize: 13 }} aria-hidden="true" />
              {l.label}
            </Link>
          ))}
        </div>

        {/* ── Tickets panel ── */}
        <div style={{
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 14, overflow: 'hidden', marginBottom: '2rem',
        }}>

          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ ...DISPLAY, fontSize: 16, fontWeight: 400, color: 'var(--color-text-primary)' }}>
                My tickets
              </span>
              {activeCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.1em',
                  color: 'var(--color-text-info)',
                  border: '0.5px solid currentColor',
                  borderRadius: 20, padding: '2px 8px', opacity: 0.85,
                }}>
                  {activeCount} active
                </span>
              )}
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                background: 'var(--color-text-primary)',
                color: 'var(--color-background-primary)',
                border: 'none', borderRadius: 7, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <i className="ti ti-plus" style={{ fontSize: 12 }} />
              New
            </button>
          </div>

          {/* Filter tabs — only shown when there are tickets */}
          {tickets.length > 0 && (
            <div style={{
              display: 'flex', gap: 2, padding: '8px 14px',
              borderBottom: '0.5px solid var(--color-border-tertiary)',
              overflowX: 'auto',
            }}>
              {(['all', 'open', 'pending', 'resolved', 'closed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, border: 'none',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: filter === f ? 'var(--color-background-secondary)' : 'transparent',
                    color: filter === f ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    transition: 'all 0.1s',
                  }}
                >
                  {f === 'all' ? 'All' : STATUS_META[f].label}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          {!isLoaded ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onNew={() => setShowModal(true)} />
          ) : (
            filtered.map(t => <TicketRow key={t._id} ticket={t} />)
          )}
        </div>

        {/* ── CSAT for resolved/closed tickets ── */}
        {doneTickets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '2rem' }}>
            {doneTickets.slice(0, 2).map(t => (
              <CSATPrompt key={t._id} ticketId={t._id} />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <p style={{
          fontSize: 11, letterSpacing: '0.06em',
          color: 'var(--color-text-secondary)', textAlign: 'center', margin: 0,
        }}>
          Need urgent help?{' '}
          <a
            href="mailto:support@shoppintrest.com"
            style={{ color: 'var(--color-text-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            Email us directly
          </a>
        </p>
      </div>

      {showModal && <NewTicketModal onClose={() => setShowModal(false)} />}
    </>
  )
}