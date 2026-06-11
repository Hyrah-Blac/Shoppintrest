'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useStreamContext } from '@/components/providers/StreamProvider'
import { apiClient } from '@/lib/api'
import { useSupportChat } from '@/hooks/useSupportChat'
import { TicketCategory, TicketStatus } from '@/types/support'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

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

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)   return 'Just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

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

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
      background: 'var(--color-text-info)', color: '#fff',
      fontSize: 10, fontWeight: 600, flexShrink: 0,
    }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function Avatar({ user, size = 38 }: { user: AdminTicket['userId']; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: '0.5px solid var(--color-border-tertiary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 600, color: 'var(--color-text-secondary)',
      overflow: 'hidden', background: 'var(--color-background-secondary)',
    }}>
      {user?.avatar
        ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (user?.displayName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()
      }
    </div>
  )
}

function AdminTicketRow({
  ticket,
  isSelected,
  onSelect,
  isChecked,
  onCheck,
}: {
  ticket: MergedTicket
  isSelected: boolean
  onSelect: (t: MergedTicket) => void
  isChecked: boolean
  onCheck: (id: string, checked: boolean) => void
}) {
  const cat       = CATEGORY_META[ticket.category]
  const hasUnread = ticket.unreadCount > 0
  const displayTime = ticket.lastMessageAt
    ? timeAgo(ticket.lastMessageAt)
    : timeAgo(ticket.updatedAt)

  return (
    <div
      onClick={() => onSelect(ticket)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        cursor: 'pointer',
        background: isSelected
          ? 'var(--color-background-secondary)'
          : hasUnread
            ? 'color-mix(in srgb, var(--color-text-info) 4%, transparent)'
            : 'transparent',
        transition: 'background 0.1s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-background-secondary)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = hasUnread ? 'color-mix(in srgb, var(--color-text-info) 4%, transparent)' : 'transparent' }}
    >
      {/* Selected accent */}
      {isSelected && (
        <div style={{
          position: 'absolute', left: 0, top: 8, bottom: 8,
          width: 3, borderRadius: '0 3px 3px 0',
          background: 'var(--color-text-primary)',
        }} />
      )}

      {/* Checkbox */}
      <div
        onClick={e => { e.stopPropagation(); onCheck(ticket._id, !isChecked) }}
        style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: `1px solid ${isChecked ? 'var(--color-text-primary)' : 'var(--color-border-secondary)'}`,
          background: isChecked ? 'var(--color-text-primary)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.1s',
        }}
      >
        {isChecked && <i className="ti ti-check" style={{ fontSize: 11, color: 'var(--color-background-primary)' }} />}
      </div>

      {/* Unread dot */}
      {hasUnread
        ? <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: 'var(--color-text-info)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-text-info) 20%, transparent)' }} />
        : <span style={{ width: 6, flexShrink: 0 }} />
      }

      <Avatar user={ticket.userId} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ ...DISPLAY, fontSize: 15, fontWeight: hasUnread ? 500 : 400, color: 'var(--color-text-primary)' }}>
            {ticket.userId?.displayName ?? ticket.userId?.username ?? 'Unknown user'}
          </span>
          <StatusPill status={ticket.status} />
          <UnreadBadge count={ticket.unreadCount} />
        </div>
        {ticket.lastMessage ? (
          <p style={{
            fontSize: 12,
            color: hasUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            margin: 0, fontWeight: hasUnread ? 500 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {ticket.lastMessage}
          </p>
        ) : (
          <p style={{
            fontSize: 11, letterSpacing: '0.04em',
            color: 'var(--color-text-secondary)', margin: 0,
            display: 'flex', alignItems: 'center', gap: 5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <i className={`ti ${cat.icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
            {cat.label} · #{ticket._id.slice(-8).toUpperCase()}
          </p>
        )}
      </div>

      <span style={{
        fontSize: 11, flexShrink: 0,
        color: hasUnread ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
        fontWeight: hasUnread ? 500 : 400,
      }}>
        {displayTime}
      </span>
    </div>
  )
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkBar({
  count,
  onClose,
  onResolve,
  onMarkPending,
  working,
}: {
  count: number
  onClose: () => void
  onResolve: () => void
  onMarkPending: () => void
  working: boolean
}) {
  const btn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', fontSize: 11, fontWeight: 500,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    background: 'transparent', border: '0.5px solid var(--color-border-secondary)',
    borderRadius: 7, cursor: working ? 'not-allowed' : 'pointer',
    color: 'var(--color-text-secondary)', transition: 'all 0.12s',
    opacity: working ? 0.6 : 1,
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      borderBottom: '0.5px solid var(--color-border-tertiary)',
      background: 'color-mix(in srgb, var(--color-text-primary) 4%, transparent)',
    }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', marginRight: 4 }}>
        {count} selected
      </span>
      <button style={btn} disabled={working} onClick={onResolve}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
      >
        <i className="ti ti-check" style={{ fontSize: 12 }} />
        Resolve
      </button>
      <button style={btn} disabled={working} onClick={onMarkPending}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
      >
        <i className="ti ti-clock" style={{ fontSize: 12 }} />
        Mark pending
      </button>
      <button
        onClick={onClose}
        style={{ ...btn, marginLeft: 'auto' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
      >
        <i className="ti ti-x" style={{ fontSize: 12 }} />
        Cancel
      </button>
    </div>
  )
}

// ─── Preview pane ─────────────────────────────────────────────────────────────

function PreviewPane({ ticket, onClose }: { ticket: MergedTicket; onClose: () => void }) {
  const cat  = CATEGORY_META[ticket.category]
  const user = ticket.userId

  return (
    <div style={{
      width: 300, flexShrink: 0,
      borderLeft: '0.5px solid var(--color-border-tertiary)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-background-primary)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '13px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        flexShrink: 0,
      }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.displayName ?? user?.username ?? 'Unknown user'}
        </span>
        <button
          onClick={onClose}
          aria-label="Close preview"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2, display: 'flex', alignItems: 'center' }}
        >
          <i className="ti ti-x" style={{ fontSize: 15 }} />
        </button>
      </div>

      {/* Customer info */}
      <div style={{ padding: '16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar user={user} size={44} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? user?.username ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? '—'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: 'ti-tag', label: 'Category', value: cat.label },
            { icon: 'ti-hash', label: 'Ticket ID', value: `#${ticket._id.slice(-8).toUpperCase()}` },
            ...(ticket.orderId ? [{ icon: 'ti-package', label: 'Order', value: `#${ticket.orderId.slice(-8).toUpperCase()}` }] : []),
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <i className={`ti ${row.icon}`} style={{ fontSize: 13, color: 'var(--color-text-secondary)', width: 16, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>{row.label}</span>
              <span style={{ color: 'var(--color-text-primary)', marginLeft: 'auto', fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last message */}
      {ticket.lastMessage && (
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
            Last message
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6 }}>
            {ticket.lastMessage}
          </p>
        </div>
      )}

      {/* Open button */}
      <div style={{ padding: '14px 16px', marginTop: 'auto' }}>
        <Link
          href={`/admin/support/${ticket._id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '10px', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            borderRadius: 8, textDecoration: 'none', border: 'none',
          }}
        >
          Open conversation
          <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const [tickets,  setTickets]  = useState<AdminTicket[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<TicketStatus | 'all'>('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<MergedTicket | null>(null)
  const [checked,  setChecked]  = useState<Set<string>>(new Set())
  const [working,  setWorking]  = useState(false)
  const searchRef              = useRef<HTMLInputElement>(null)

  const { client, isReady } = useStreamContext()
  const { previews = [] }   = useSupportChat(client, isReady)

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setSearch('')
        setSelected(null)
        setChecked(new Set())
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiClient.support.admin.getAllTickets(filter === 'all' ? undefined : filter)
      .then(res => { if (!cancelled) setTickets(res.data?.data ?? []) })
      .catch(() => { if (!cancelled) setTickets([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filter])

  const merged = useMemo<MergedTicket[]>(() => {
    const previewMap = new Map((previews ?? []).map(p => [p.streamChannelId, p]))
    const result: MergedTicket[] = tickets.map(ticket => {
      const preview = previewMap.get(ticket.streamChannelId)
      return {
        ...ticket,
        lastMessage:   preview?.lastMessage   ?? undefined,
        lastMessageAt: preview?.lastMessageAt ?? undefined,
        unreadCount:   preview?.unreadCount   ?? 0,
      }
    })
    return result.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return  1
      const aTime = a.lastMessageAt ?? a.updatedAt
      const bTime = b.lastMessageAt ?? b.updatedAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }, [tickets, previews])

  const filtered = useMemo(() => {
    if (!search.trim()) return merged
    const q = search.toLowerCase()
    return merged.filter(t =>
      t.userId?.displayName?.toLowerCase().includes(q) ||
      t.userId?.username?.toLowerCase().includes(q) ||
      t.userId?.email?.toLowerCase().includes(q) ||
      t._id.slice(-8).toLowerCase().includes(q) ||
      t.lastMessage?.toLowerCase().includes(q)
    )
  }, [merged, search])

  const unreadTotal = merged.filter(t => t.unreadCount > 0).length

  const handleCheck = useCallback((id: string, val: boolean) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (val) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const clearChecked = useCallback(() => setChecked(new Set()), [])

  const handleBulkResolve = useCallback(async () => {
    setWorking(true)
    try {
      await Promise.all([...checked].map(id => apiClient.support.admin.closeTicket(id)))
      setTickets(prev => prev.map(t => checked.has(t._id) ? { ...t, status: 'resolved' as TicketStatus } : t))
      clearChecked()
    } finally { setWorking(false) }
  }, [checked, clearChecked])

  const handleBulkPending = useCallback(async () => {
    setWorking(true)
    try {
      await Promise.all([...checked].map(id =>
        apiClient.support.admin.updateTicket?.(id, { status: 'pending' }).catch(() => {})
      ))
      setTickets(prev => prev.map(t => checked.has(t._id) ? { ...t, status: 'pending' as TicketStatus } : t))
      clearChecked()
    } finally { setWorking(false) }
  }, [checked, clearChecked])

  const hasChecked = checked.size > 0

  return (
    <div style={{ maxWidth: selected ? '100%' : 820, margin: '0 auto', padding: selected ? '0' : '3rem 1.25rem 6rem' }}>
      {!selected && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ ...DISPLAY, fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
            Admin
          </p>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 0.95 }}>
            Support inbox
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            {unreadTotal > 0
              ? `${unreadTotal} ${unreadTotal === 1 ? 'conversation needs' : 'conversations need'} attention`
              : 'All conversations are up to date.'}
          </p>
        </div>
      )}

      <div style={{
        display: 'flex',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: selected ? 0 : 14,
        overflow: 'hidden',
        minHeight: selected ? 'calc(100dvh - 64px)' : undefined,
      }}>
        {/* Left: list */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Search */}
          <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--color-background-secondary)',
              borderRadius: 9, padding: '7px 12px',
              border: '0.5px solid var(--color-border-tertiary)',
            }}>
              <i className="ti ti-search" style={{ fontSize: 14, color: 'var(--color-text-secondary)', flexShrink: 0 }} aria-hidden="true" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, message…"
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 12, color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              {search
                ? <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0, display: 'flex' }}>
                    <i className="ti ti-x" style={{ fontSize: 13 }} />
                  </button>
                : <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', letterSpacing: '0.06em', flexShrink: 0 }}>/</span>
              }
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 2, padding: '8px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', overflowX: 'auto' }}>
            {(['all', 'open', 'pending', 'resolved', 'closed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap', fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: filter === f ? 'var(--color-background-secondary)' : 'transparent',
                  color: filter === f ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  transition: 'all 0.1s',
                }}
              >
                {f === 'all' ? 'All' : STATUS_META[f].label}
              </button>
            ))}
          </div>

          {/* Bulk bar */}
          {hasChecked && (
            <BulkBar
              count={checked.size}
              onClose={clearChecked}
              onResolve={handleBulkResolve}
              onMarkPending={handleBulkPending}
              working={working}
            />
          )}

          {/* Ticket list */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, margin: '0 auto 1.25rem', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--color-text-secondary)' }}>
                <i className="ti ti-inbox" aria-hidden="true" />
              </div>
              <p style={{ ...DISPLAY, fontSize: 20, fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 1 }}>
                {search ? 'No results found' : 'All conversations are up to date.'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                {search ? `No tickets match "${search}"` : 'Nothing matches this filter right now.'}
              </p>
            </div>
          ) : (
            filtered.map(t => (
              <AdminTicketRow
                key={t._id}
                ticket={t}
                isSelected={selected?._id === t._id}
                onSelect={setSelected}
                isChecked={checked.has(t._id)}
                onCheck={handleCheck}
              />
            ))
          )}
        </div>

        {/* Right: preview pane */}
        {selected && (
          <PreviewPane ticket={selected} onClose={() => setSelected(null)} />
        )}
      </div>

      {/* Keyboard hint */}
      {!hasChecked && !search && (
        <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 12, letterSpacing: '0.06em' }}>
          Press <kbd style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>/</kbd> to search · <kbd style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Esc</kbd> to clear
        </p>
      )}
    </div>
  )
}