'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useStreamContext } from '@/components/providers/StreamProvider'
import { apiClient }        from '@/lib/api'
import { useSupportChat, ChannelPreview } from '@/hooks/useSupportChat'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

interface AdminConversation {
  _id:             string
  streamChannelId: string
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

interface MergedConversation extends AdminConversation {
  lastMessage?:   string
  lastMessageAt?: string
  unreadCount:    number
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

function Avatar({ user, size = 40 }: { user: AdminConversation['userId']; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: '0.5px solid var(--color-border-tertiary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 600, color: 'var(--color-text-secondary)',
      overflow: 'hidden', background: 'var(--color-background-secondary)',
    }}>
      {user?.avatar
        ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (user?.displayName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()
      }
    </div>
  )
}

function ConversationRow({
  convo,
  isSelected,
  onSelect,
}: {
  convo:      MergedConversation
  isSelected: boolean
  onSelect:   (c: MergedConversation) => void
}) {
  const hasUnread  = convo.unreadCount > 0
  const displayTime = convo.lastMessageAt
    ? timeAgo(convo.lastMessageAt)
    : timeAgo(convo.updatedAt)

  return (
    <div
      onClick={() => onSelect(convo)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        cursor: 'pointer', position: 'relative',
        background: isSelected
          ? 'var(--color-background-secondary)'
          : hasUnread
            ? 'color-mix(in srgb, var(--color-text-info) 4%, transparent)'
            : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-background-secondary)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = hasUnread ? 'color-mix(in srgb, var(--color-text-info) 4%, transparent)' : 'transparent' }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute', left: 0, top: 8, bottom: 8,
          width: 3, borderRadius: '0 3px 3px 0',
          background: 'var(--color-text-primary)',
        }} />
      )}

      {/* Unread dot */}
      {hasUnread
        ? <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: 'var(--color-text-info)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-text-info) 20%, transparent)' }} />
        : <span style={{ width: 7, flexShrink: 0 }} />
      }

      <Avatar user={convo.userId} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{
            fontSize: 14, fontWeight: hasUnread ? 600 : 400,
            color: 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {convo.userId?.displayName ?? convo.userId?.username ?? 'Unknown user'}
          </span>
          <span style={{
            fontSize: 11, flexShrink: 0, marginLeft: 8,
            color: hasUnread ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
            fontWeight: hasUnread ? 500 : 400,
          }}>
            {displayTime}
          </span>
        </div>
        <p style={{
          fontSize: 12, margin: 0,
          color: hasUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          fontWeight: hasUnread ? 500 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {convo.lastMessage ?? convo.userId?.email ?? '—'}
        </p>
      </div>

      {convo.unreadCount > 0 && (
        <span style={{
          minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
          background: 'var(--color-text-info)', color: '#fff',
          fontSize: 10, fontWeight: 600, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {convo.unreadCount > 99 ? '99+' : convo.unreadCount}
        </span>
      )}
    </div>
  )
}

// ─── Preview / detail panel ───────────────────────────────────────────────────

function PreviewPane({ convo, onClose }: { convo: MergedConversation; onClose: () => void }) {
  const user = convo.userId
  return (
    <div style={{
      width: 280, flexShrink: 0,
      borderLeft: '0.5px solid var(--color-border-tertiary)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-background-primary)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0,
      }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.displayName ?? user?.username ?? 'Unknown'}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2, display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-x" style={{ fontSize: 15 }} />
        </button>
      </div>

      <div style={{ padding: '16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar user={user} size={44} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? user?.username ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? '—'}
            </p>
          </div>
        </div>
        {convo.lastMessage && (
          <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 10, border: '0.5px solid var(--color-border-tertiary)' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>
              Last message
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6 }}>
              {convo.lastMessage}
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', marginTop: 'auto' }}>
        <Link
          href={`/admin/support/${convo._id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '10px', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            borderRadius: 8, textDecoration: 'none',
          }}
        >
          Open chat
          <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const [convos,   setConvos]   = useState<AdminConversation[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<MergedConversation | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { client, isReady } = useStreamContext()
  const { previews = [] }   = useSupportChat(client, isReady)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault(); searchRef.current?.focus()
      }
      if (e.key === 'Escape') { setSearch(''); setSelected(null) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiClient.support.admin.getAllConversations()
      .then(res => { if (!cancelled) setConvos(res.data?.data ?? []) })
      .catch(() => { if (!cancelled) setConvos([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const merged = useMemo<MergedConversation[]>(() => {
    const map = new Map(previews.map(p => [p.streamChannelId, p]))
    return convos.map(c => {
      const p = map.get(c.streamChannelId)
      return { ...c, lastMessage: p?.lastMessage, lastMessageAt: p?.lastMessageAt, unreadCount: p?.unreadCount ?? 0 }
    }).sort((a, b) => {
      if ((a.unreadCount > 0) !== (b.unreadCount > 0)) return a.unreadCount > 0 ? -1 : 1
      const at = a.lastMessageAt ?? a.updatedAt
      const bt = b.lastMessageAt ?? b.updatedAt
      return new Date(bt).getTime() - new Date(at).getTime()
    })
  }, [convos, previews])

  const filtered = useMemo(() => {
    if (!search.trim()) return merged
    const q = search.toLowerCase()
    return merged.filter(c =>
      c.userId?.displayName?.toLowerCase().includes(q) ||
      c.userId?.username?.toLowerCase().includes(q) ||
      c.userId?.email?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    )
  }, [merged, search])

  const unreadTotal = merged.filter(c => c.unreadCount > 0).length

  return (
    <div style={{ maxWidth: selected ? '100%' : 820, margin: '0 auto', padding: selected ? '0' : '3rem 1.25rem 6rem' }}>
      {!selected && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ ...DISPLAY, fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
            Admin
          </p>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 0.95 }}>
            Messages
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            {unreadTotal > 0
              ? `${unreadTotal} ${unreadTotal === 1 ? 'conversation needs' : 'conversations need'} attention`
              : 'All caught up.'}
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
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Search */}
          <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--color-background-secondary)',
              borderRadius: 9, padding: '7px 12px',
              border: '0.5px solid var(--color-border-tertiary)',
            }}>
              <i className="ti ti-search" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or message…"
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 12, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)',
                }}
              />
              {search
                ? <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0, display: 'flex' }}>
                    <i className="ti ti-x" style={{ fontSize: 13 }} />
                  </button>
                : <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', letterSpacing: '0.06em' }}>/</span>
              }
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, margin: '0 auto 1.25rem', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--color-text-secondary)' }}>
                <i className="ti ti-inbox" />
              </div>
              <p style={{ ...DISPLAY, fontSize: 20, fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
                {search ? 'No results' : 'No conversations yet'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                {search ? `Nothing matches "${search}"` : 'Conversations will appear here when customers message support.'}
              </p>
            </div>
          ) : (
            filtered.map(c => (
              <ConversationRow
                key={c._id}
                convo={c}
                isSelected={selected?._id === c._id}
                onSelect={setSelected}
              />
            ))
          )}
        </div>

        {selected && <PreviewPane convo={selected} onClose={() => setSelected(null)} />}
      </div>

      {!search && (
        <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 12, letterSpacing: '0.06em' }}>
          Press{' '}
          <kbd style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>/</kbd>
          {' '}to search ·{' '}
          <kbd style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Esc</kbd>
          {' '}to clear
        </p>
      )}
    </div>
  )
}