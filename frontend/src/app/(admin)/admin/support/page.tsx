'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

type Filter = 'all' | 'unread'

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)    return 'Just now'
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
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

// ─── Skeleton row (loading state) ─────────────────────────────────────────────

function SkeletonRow({ delay }: { delay: number }) {
  const block = (w: string | number, h = 10): React.CSSProperties => ({
    width: w, height: h, borderRadius: 5,
    background: 'var(--color-background-secondary)',
    animation: `pulse 1.6s ease-in-out ${delay}s infinite`,
  })
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px',
      borderBottom: '0.5px solid var(--color-border-tertiary)',
    }}>
      <span style={{ width: 7, flexShrink: 0 }} />
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: 'var(--color-background-secondary)',
        animation: `pulse 1.6s ease-in-out ${delay}s infinite`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={block('38%')} />
          <div style={block(46)} />
        </div>
        <div style={block('64%', 9)} />
      </div>
    </div>
  )
}

// ─── Conversation row ─────────────────────────────────────────────────────────

function ConversationRow({ convo, isSelected, isFocused, onSelect, style, innerRef }: {
  convo:      MergedConversation
  isSelected: boolean
  isFocused:  boolean
  onSelect:   (c: MergedConversation) => void
  style?:     React.CSSProperties
  innerRef?:  (el: HTMLDivElement | null) => void
}) {
  const hasUnread   = convo.unreadCount > 0
  const displayTime = convo.lastMessageAt ? timeAgo(convo.lastMessageAt) : timeAgo(convo.updatedAt)

  return (
    <div
      ref={innerRef}
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
        boxShadow: isFocused && !isSelected
          ? 'inset 0 0 0 1.5px var(--color-border-secondary)'
          : 'none',
        transition: 'background 0.12s, box-shadow 0.12s',
        ...style,
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

      {hasUnread
        ? (
          <span style={{ position: 'relative', width: 7, height: 7, flexShrink: 0 }}>
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'var(--color-text-info)',
              animation: 'unreadPulse 2.2s ease-in-out infinite',
            }} />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'var(--color-text-info)',
            }} />
          </span>
        )
        : <span style={{ width: 7, flexShrink: 0 }} />
      }

      <Avatar user={convo.userId} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
          <span style={{
            fontSize: 14, fontWeight: hasUnread ? 600 : 400,
            color: 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {convo.userId?.displayName ?? convo.userId?.username ?? 'Unknown user'}
          </span>
          <span style={{
            fontSize: 11, flexShrink: 0,
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

// ─── Preview pane ───────────────────────────────────────────────────────────────

function PreviewPane({ convo, onClose }: { convo: MergedConversation; onClose: () => void }) {
  const user = convo.userId
  const [hover, setHover] = useState(false)

  return (
    <div style={{
      width: 280, flexShrink: 0,
      borderLeft: '0.5px solid var(--color-border-tertiary)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-background-primary)',
      animation: 'slideInRight 0.18s ease both',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0,
      }}>
        <span style={{
          flex: 1, fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}>
          Preview
        </span>
        <button
          onClick={onClose}
          aria-label="Close preview"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2, display: 'flex', alignItems: 'center', transition: 'color 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div style={{ padding: '18px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar user={user} size={46} />
          <div style={{ minWidth: 0 }}>
            <p style={{ ...DISPLAY, fontSize: 17, fontWeight: 400, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? user?.username ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? '—'}
            </p>
          </div>
        </div>

        {convo.lastMessage && (
          <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 10, border: '0.5px solid var(--color-border-tertiary)', marginBottom: 12 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>
              Last message
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6 }}>
              {convo.lastMessage}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          Started {formatDate(convo.createdAt)}
        </div>

        {convo.unreadCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-info)', fontWeight: 500, marginTop: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-info)' }} />
            {convo.unreadCount} unread {convo.unreadCount === 1 ? 'message' : 'messages'}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', marginTop: 'auto' }}>
        <Link
          href={`/admin/support/${convo._id}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '11px', fontSize: 11, fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            background: hover ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            color: 'var(--color-background-primary)',
            borderRadius: 8, textDecoration: 'none',
            transition: 'background 0.15s',
          }}
        >
          Open chat
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: hover ? 'translateX(2px)' : 'none', transition: 'transform 0.15s' }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </div>
  )
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 11, margin: '0 auto 1.25rem',
        border: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-secondary)',
        background: 'var(--color-background-secondary)',
      }}>
        {icon}
      </div>
      <p style={{ ...DISPLAY, fontSize: 20, fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
        {title}
      </p>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, maxWidth: 280, marginInline: 'auto', lineHeight: 1.6 }}>
        {body}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const router = useRouter()

  const [convos,   setConvos]   = useState<AdminConversation[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<Filter>('all')
  const [selected, setSelected] = useState<MergedConversation | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isMobile, setIsMobile] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const rowRefs   = useRef<(HTMLDivElement | null)[]>([])

  const { client, isReady } = useStreamContext()
  const { previews } = useSupportChat(client, isReady)

  // ── Responsive: on narrow screens, open the full conversation instead of
  //    squeezing a 280px preview pane next to the list ──────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = document.activeElement?.tagName === 'INPUT'

      if (e.key === '/' && !inInput) {
        e.preventDefault(); searchRef.current?.focus()
        return
      }
      if (e.key === 'Escape') {
        if (search)        { setSearch(''); return }
        if (selected)      { setSelected(null); return }
        searchRef.current?.blur()
        setFocusedIndex(-1)
        return
      }
      if (inInput && document.activeElement === searchRef.current && e.key !== 'Enter') return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(i => Math.min(i + 1, filteredRef.current.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(i => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && focusedIndexRef.current >= 0) {
        const convo = filteredRef.current[focusedIndexRef.current]
        if (convo) handleSelect(convo)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selected])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiClient.support.admin.getAllConversations()
      .then(res => { if (!cancelled) setConvos(res.data?.data ?? []) })
      .catch(() => { if (!cancelled) setConvos([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Merge REST conversations with live Stream preview data
  const merged = useMemo<MergedConversation[]>(() => {
    const map = new Map(previews.map(p => [p.streamChannelId, p]))
    return convos.map(c => {
      const p = map.get(c.streamChannelId)
      return {
        ...c,
        lastMessage:   p?.lastMessage,
        lastMessageAt: p?.lastMessageAt,
        unreadCount:   p?.unreadCount ?? 0,
      }
    }).sort((a, b) => {
      if ((a.unreadCount > 0) !== (b.unreadCount > 0)) return a.unreadCount > 0 ? -1 : 1
      const at = a.lastMessageAt ?? a.updatedAt
      const bt = b.lastMessageAt ?? b.updatedAt
      return new Date(bt).getTime() - new Date(at).getTime()
    })
  }, [convos, previews])

  const unreadTotal = useMemo(() => merged.filter(c => c.unreadCount > 0).length, [merged])

  const byFilter = useMemo(() =>
    filter === 'unread' ? merged.filter(c => c.unreadCount > 0) : merged
  , [merged, filter])

  const filtered = useMemo(() => {
    if (!search.trim()) return byFilter
    const q = search.toLowerCase()
    return byFilter.filter(c =>
      c.userId?.displayName?.toLowerCase().includes(q) ||
      c.userId?.username?.toLowerCase().includes(q) ||
      c.userId?.email?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    )
  }, [byFilter, search])

  // Refs that mirror state for use inside the keydown handler without
  // re-subscribing the listener on every render.
  const filteredRef = useRef(filtered)
  filteredRef.current = filtered
  const focusedIndexRef = useRef(focusedIndex)
  focusedIndexRef.current = focusedIndex

  // Reset keyboard focus whenever the visible list changes
  useEffect(() => { setFocusedIndex(-1) }, [search, filter])

  // Keep the focused row in view
  useEffect(() => {
    if (focusedIndex < 0) return
    rowRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex])

  const handleSelect = useCallback((c: MergedConversation) => {
    if (isMobile) {
      router.push(`/admin/support/${c._id}`)
    } else {
      setSelected(c)
    }
  }, [isMobile, router])

  return (
    <div style={{ maxWidth: selected ? '100%' : 820, margin: '0 auto', padding: selected ? '0' : '3rem 1.25rem 6rem' }}>
      {!selected && (
        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ ...DISPLAY, fontSize: 9, letterSpacing: '0.34em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
            Admin
          </p>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 0.95 }}>
            Messages
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            {loading ? (
              'Loading…'
            ) : (
              <>
                {merged.length} {merged.length === 1 ? 'conversation' : 'conversations'}
                {unreadTotal > 0 && (
                  <>
                    {' · '}
                    <span style={{ color: 'var(--color-text-info)', fontWeight: 500 }}>
                      {unreadTotal} need{unreadTotal === 1 ? 's' : ''} a reply
                    </span>
                  </>
                )}
                {unreadTotal === 0 && ' · all caught up'}
              </>
            )}
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
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--color-border-primary)')}
              onBlurCapture={e  => (e.currentTarget.style.borderColor = 'var(--color-border-tertiary)')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
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
              {search ? (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0, display: 'flex' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              ) : (
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', letterSpacing: '0.06em' }}>/</span>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: '8px 14px',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
          }}>
            {([
              { key: 'all',    label: 'All',    count: merged.length },
              { key: 'unread', label: 'Unread', count: unreadTotal   },
            ] as const).map(tab => {
              const active = filter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 7,
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    background: active ? 'var(--color-background-secondary)' : 'transparent',
                    border: '0.5px solid',
                    borderColor: active ? 'var(--color-border-secondary)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-background-secondary)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: tab.key === 'unread' ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* List */}
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} delay={i * 0.08} />)
          ) : filtered.length === 0 ? (
            filter === 'unread' ? (
              <EmptyState
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/>
                  </svg>
                }
                title="All caught up"
                body="There are no unread conversations right now."
              />
            ) : search ? (
              <EmptyState
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                }
                title="No results"
                body={`Nothing matches "${search}". Try a different name, email, or keyword.`}
              />
            ) : (
              <EmptyState
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                }
                title="No conversations yet"
                body="Conversations will appear here when customers message support."
              />
            )
          ) : (
            filtered.map((c, idx) => (
              <ConversationRow
                key={c._id}
                convo={c}
                isSelected={selected?._id === c._id}
                isFocused={focusedIndex === idx}
                onSelect={handleSelect}
                innerRef={el => { rowRefs.current[idx] = el }}
                style={{ animation: `fadeInUp 0.25s ease ${Math.min(idx, 12) * 0.025}s both` }}
              />
            ))
          )}
        </div>

        {selected && !isMobile && <PreviewPane convo={selected} onClose={() => setSelected(null)} />}
      </div>

      {!search && !selected && (
        <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 12, letterSpacing: '0.06em' }}>
          Press{' '}
          <kbd style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>/</kbd>
          {' '}to search
          {!isMobile && (
            <>
              {' · '}
              <kbd style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>↑↓</kbd>
              {' '}to navigate ·{' '}
              <kbd style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>↵</kbd>
              {' '}to open ·{' '}
            </>
          )}
          {isMobile && ' · '}
          <kbd style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Esc</kbd>
          {' '}to clear
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: .35 } 50% { opacity: .8 } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(8px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes unreadPulse {
          0%   { transform: scale(1);   opacity: 0.55 }
          70%  { transform: scale(2.4); opacity: 0 }
          100% { transform: scale(2.4); opacity: 0 }
        }
      `}</style>
    </div>
  )
}