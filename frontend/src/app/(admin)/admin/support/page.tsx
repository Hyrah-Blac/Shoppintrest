'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { TicketCategory, TicketStatus } from '@/types/support'

// ─── Design tokens ────────────────────────────────────────────────────────────

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminTicket {
  _id:             string
  streamChannelId: string
  category:        TicketCategory
  status:          TicketStatus
  orderId?:        string
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

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<TicketCategory, { label: string; icon: string }> = {
  order:   { label: 'Order issue', icon: 'ti-package'        },
  return:  { label: 'Return',      icon: 'ti-arrow-back-up'  },
  refund:  { label: 'Refund',      icon: 'ti-credit-card'    },
  account: { label: 'Account',     icon: 'ti-user-circle'    },
  other:   { label: 'Other',       icon: 'ti-message-circle' },
}

const STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
  open:     { label: 'Open',      color: 'var(--color-text-info)'      },
  pending:  { label: 'In review', color: 'var(--color-text-warning)'   },
  resolved: { label: 'Resolved',  color: 'var(--color-text-success)'   },
  closed:   { label: 'Closed',    color: 'var(--color-text-secondary)' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
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

// ─── Ticket row ───────────────────────────────────────────────────────────────

function AdminTicketRow({ ticket }: { ticket: AdminTicket }) {
  const cat   = CATEGORY_META[ticket.category]
  const isNew = ticket.status === 'open'

  return (
    <Link
      href={`/admin/support/${ticket._id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
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
        {isNew && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-text-info)',
            boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-text-info) 20%, transparent)',
          }} />
        )}

        {/* Customer avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          border: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)',
          overflow: 'hidden', background: 'var(--color-background-secondary)',
          marginLeft: isNew ? 0 : 18,
        }}>
          {ticket.userId?.avatar
            ? <img src={ticket.userId.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (ticket.userId?.displayName?.[0] ?? ticket.userId?.username?.[0] ?? '?').toUpperCase()
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ ...DISPLAY, fontSize: 16, fontWeight: 400, color: 'var(--color-text-primary)' }}>
              {ticket.userId?.displayName ?? ticket.userId?.username ?? 'Unknown user'}
            </span>
            <StatusPill status={ticket.status} />
          </div>
          <p style={{
            fontSize: 11, letterSpacing: '0.04em',
            color: 'var(--color-text-secondary)', margin: 0,
            display: 'flex', alignItems: 'center', gap: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <i className={`ti ${cat.icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
            {cat.label} · #{ticket._id.slice(-8).toUpperCase()} · {timeAgo(ticket.updatedAt)}
          </p>
        </div>

        <i className="ti ti-arrow-right" style={{
          color: 'var(--color-text-secondary)', fontSize: 13, flexShrink: 0, opacity: 0.35,
        }} aria-hidden="true" />
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<TicketStatus | 'all'>('all')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiClient.support.admin.getAllTickets(filter === 'all' ? undefined : filter)
      .then(res => { if (!cancelled) setTickets(res.data?.data ?? []) })
      .catch(() => { if (!cancelled) setTickets([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filter])

  const openCount = tickets.filter(t => t.status === 'open').length

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem 6rem' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{
          ...DISPLAY,
          fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase',
          color: 'var(--color-text-secondary)', margin: '0 0 10px',
        }}>
          Admin
        </p>
        <h1 style={{
          ...DISPLAY,
          fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300,
          color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 0.95,
        }}>
          Support inbox
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          {openCount > 0
            ? `${openCount} ${openCount === 1 ? 'ticket needs' : 'tickets need'} attention`
            : 'All caught up.'}
        </p>
      </div>

      {/* ── Panel ── */}
      <div style={{
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '10px 16px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          overflowX: 'auto',
        }}>
          {(['all', 'open', 'pending', 'resolved', 'closed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 13px', borderRadius: 20, border: 'none',
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

        {/* List */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11, margin: '0 auto 1.25rem',
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'var(--color-text-secondary)',
            }}>
              <i className="ti ti-inbox" aria-hidden="true" />
            </div>
            <p style={{ ...DISPLAY, fontSize: 20, fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 1 }}>
              No tickets here
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
              Nothing matches this filter right now.
            </p>
          </div>
        ) : (
          tickets.map(t => <AdminTicketRow key={t._id} ticket={t} />)
        )}
      </div>
    </div>
  )
}