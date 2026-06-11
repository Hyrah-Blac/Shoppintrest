'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useStreamContext } from 'stream-chat-react'
import { apiClient } from '@/lib/api'
import { useSupportChat } from '@/hooks/useSupportChat'
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

interface MergedTicket extends AdminTicket {
  lastMessage?:   string
  lastMessageAt?: string
  unreadCount:    number
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

// ─── Unread badge ─────────────────────────────────────────────────────────────

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
      background: 'var(--color-text-info)', color: '#fff',
      fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', flexShrink: 0,
    }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ─── Ticket row ───────────────────────────────────────────────────────────────

function AdminTicketRow({ ticket }: { ticket: MergedTicket }) {
  const cat     = CATEGORY_META[ticket.category]
  const hasUnread = ticket.unreadCount > 0
  const displayTime = ticket.lastMessageAt
    ? timeAgo(ticket.lastMessageAt)
    : timeAgo(ticket.updatedAt)

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
          background: hasUnread
            ? 'color-mix(in srgb, var(--color-text-info) 4%, transparent)'
            : 'transparent',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
        onMouseLeave={e => e.currentTarget.style.background = hasUnread
          ? 'color-mix(in srgb, var(--color-text-info) 4%, transparent)'
          : 'transparent'
        }
      >
        {/* Unread indicator dot */}
        {hasUnread ? (
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-text-info)',
            boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-text-info) 20%, transparent)',
          }} />
        ) : (
          <span style={{ width: 6, height: 6, flexShrink: 0 }} />
        )}

        {/* Customer avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          border: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)',
          overflow: 'hidden', background: 'var(--color-background-secondary)',
        }}>
          {ticket.userId?.avatar
            ? <img src={ticket.userId.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (ticket.userId?.displayName?.[0] ?? ticket.userId?.username?.[0] ?? '?').toUpperCase()
          }
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + status + unread badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              ...DISPLAY,
              fontSize: 16,
              fontWeight: hasUnread ? 500 : 400,
              color: 'var(--color-text-primary)',
            }}>
              {ticket.userId?.displayName ?? ticket.userId?.username ?? 'Unknown user'}
            </span>
            <StatusPill status={ticket.status} />
            <UnreadBadge count={ticket.unreadCount} />
          </div>

          {/* Last message preview or category/id/time */}
          {ticket.lastMessage ? (
            <p style={{
              fontSize: 12, color: hasUnread
                ? 'var(--color-text-primary)'
                : 'var(--color-text-secondary)',
              margin: 0, fontWeight: hasUnread ? 500 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {ticket.lastMessage}
            </p>
          ) : (
            <p style={{
              fontSize: 11, letterSpacing: '0.04em',
              color: 'var(--color-text-secondary)', margin: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              <i className={`ti ${cat.icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
              {cat.label} · #{ticket._id.slice(-8).toUpperCase()}
            </p>
          )}
        </div>

        {/* Time + arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{
            fontSize: 11,
            color: hasUnread ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
            fontWeight: hasUnread ? 500 : 400,
          }}>
            {displayTime}
          </span>
          <i className="ti ti-arrow-right" style={{
            color: 'var(--color-text-secondary)', fontSize: 13, opacity: 0.35,
          }} aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<TicketStatus | 'all'>('all')

  // Stream live previews — same hook used in the customer inbox
  const { client, isReady } = useStreamContext()
  const { previews }        = useSupportChat(client, isReady)

  // Fetch REST tickets when filter changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiClient.support.admin.getAllTickets(filter === 'all' ? undefined : filter)
      .then(res => { if (!cancelled) setTickets(res.data?.data ?? []) })
      .catch(() => { if (!cancelled) setTickets([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filter])

  // Merge Stream previews into REST tickets using streamChannelId as key
  const merged = useMemo<MergedTicket[]>(() => {
    const previewMap = new Map(
      previews.map(p => [p.streamChannelId, p])
    )

    const result: MergedTicket[] = tickets.map(ticket => {
      const preview = previewMap.get(ticket.streamChannelId)
      return {
        ...ticket,
        lastMessage:   preview?.lastMessage   ?? undefined,
        lastMessageAt: preview?.lastMessageAt ?? undefined,
        unreadCount:   preview?.unreadCount   ?? 0,
      }
    })

    // Sort: unread first, then by most recent activity
    return result.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return  1
      const aTime = a.lastMessageAt ?? a.updatedAt
      const bTime = b.lastMessageAt ?? b.updatedAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }, [tickets, previews])

  const unreadTotal = merged.filter(t => t.unreadCount > 0).length

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
          {unreadTotal > 0
            ? `${unreadTotal} ${unreadTotal === 1 ? 'conversation needs' : 'conversations need'} attention`
            : 'All conversations are up to date.'}
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
        ) : merged.length === 0 ? (
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
              All conversations are up to date.
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
              Nothing matches this filter right now.
            </p>
          </div>
        ) : (
          merged.map(t => <AdminTicketRow key={t._id} ticket={t} />)
        )}
      </div>
    </div>
  )
}