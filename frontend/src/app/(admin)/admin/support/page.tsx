'use client'

// PATH: src/app/(admin)/admin/support/page.tsx
// (adjust to match your actual admin route if different)

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Parisienne } from 'next/font/google'
import { useStreamContext } from '@/components/providers/StreamProvider'
import { apiClient }        from '@/lib/api'
import { useSupportChat, ChannelPreview } from '@/hooks/useSupportChat'

const parisienne = Parisienne({ weight: '400', subsets: ['latin'], display: 'swap' })

/**
 * Same fix as the conversation page: these --chat-* names used to come
 * with a comment asking you to define them yourself in global CSS, but
 * nothing ever did — so the whole inbox looked hardcoded regardless of
 * light/dark mode. Grounded in the site's real, already-working theme
 * tokens instead (the ones Footer/Contact/Hero/the chat pages use), and
 * applied as inline custom properties on this page's one root element.
 *
 * Brand/functional colors (accent, unread) stay constant across both
 * themes on purpose — they're identity/semantics, not adaptive surface.
 */
const PINTEREST_RED = '#E60023'

const chatVars = {
  '--chat-bg': 'hsl(var(--background))',
  '--chat-surface': 'hsl(var(--surface-elevated))',
  '--chat-surface-hi': 'hsl(var(--foreground) / 0.08)',
  '--chat-border': 'hsl(var(--border))',
  '--chat-text-primary': 'hsl(var(--foreground))',
  '--chat-text-secondary': 'hsl(var(--muted-foreground, var(--muted)))',
  '--chat-text-meta': 'hsl(var(--muted))',
  '--chat-accent': PINTEREST_RED,
  '--chat-accent-hover': '#ff1a38',
  '--chat-unread': '#3b82f6',
  '--chat-bubble-out': PINTEREST_RED,
  '--chat-bubble-out-text': '#ffffff',
} as React.CSSProperties

// Playfair Display / DM Sans — the pairing used sitewide. The original
// file used Cormorant Garamond, inconsistent with Footer/Contact/Hero/
// the chat pages.
const DISPLAY: React.CSSProperties = {
  fontFamily: '"Playfair Display", var(--font-display, Georgia), serif',
}
const UTILITY: React.CSSProperties = {
  fontFamily: '"DM Sans", var(--font-sans, system-ui), sans-serif',
}

interface AdminConversation {
  _id: string; streamChannelId: string; createdAt: string; updatedAt: string
  userId: { _id: string; username: string; email: string; displayName?: string; avatar?: string } | null
}
interface MergedConversation extends AdminConversation {
  lastMessage?: string; lastMessageAt?: string; unreadCount: number
}
type Filter = 'all' | 'unread'

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime(), m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'; if (m < 60) return `${m}m`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  const days = Math.floor(h / 24); if (days < 7) return `${days}d`
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 40 }: { user: AdminConversation['userId']; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--chat-surface)', border: '0.5px solid var(--chat-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'var(--chat-text-secondary)',
      overflow: 'hidden',
    }}>
      {user?.avatar
        ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (user?.displayName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()
      }
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow({ delay }: { delay: number }) {
  const skel = (w: string | number, h = 9): React.CSSProperties => ({
    width: w, height: h, borderRadius: 5,
    background: 'var(--chat-surface)',
    animation: `pulse 1.6s ${delay}s ease-in-out infinite`,
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 18px', borderBottom: '0.5px solid var(--chat-border)' }}>
      <span style={{ width: 8, flexShrink: 0 }} />
      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, ...skel(40, 40) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
          <div style={skel('38%')} /><div style={skel(40)} />
        </div>
        <div style={skel('62%', 8)} />
      </div>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function ConversationRow({ convo, isSelected, isFocused, onSelect, style, innerRef }: {
  convo: MergedConversation; isSelected: boolean; isFocused: boolean
  onSelect: (c: MergedConversation) => void
  style?: React.CSSProperties; innerRef?: (el: HTMLDivElement | null) => void
}) {
  const hasUnread   = convo.unreadCount > 0
  const displayTime = convo.lastMessageAt ? timeAgo(convo.lastMessageAt) : timeAgo(convo.updatedAt)

  return (
    <div ref={innerRef} onClick={() => onSelect(convo)} style={{
      ...UTILITY,
      display: 'flex', alignItems: 'center', gap: 13,
      padding: '14px 18px',
      borderBottom: '0.5px solid var(--chat-border)',
      cursor: 'pointer', position: 'relative',
      background: isSelected ? 'var(--chat-surface-hi)' : 'transparent',
      outline: isFocused && !isSelected ? '1.5px solid var(--chat-border)' : 'none',
      outlineOffset: -1,
      transition: 'background 0.1s',
      ...style,
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--chat-surface)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Accent selected bar */}
      {isSelected && (
        <div style={{
          position: 'absolute', left: 0, top: 10, bottom: 10,
          width: 2.5, borderRadius: '0 2px 2px 0',
          background: 'var(--chat-accent)',
        }} />
      )}

      {/* Unread dot */}
      {hasUnread ? (
        <span style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--chat-unread)', animation: 'unreadPulse 2.4s ease-in-out infinite' }} />
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--chat-unread)' }} />
        </span>
      ) : (
        <span style={{ width: 8, flexShrink: 0 }} />
      )}

      <Avatar user={convo.userId} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
          <span style={{
            fontSize: 13.5,
            fontWeight: hasUnread ? 600 : 400,
            color: hasUnread ? 'var(--chat-text-primary)' : 'var(--chat-text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {convo.userId?.displayName ?? convo.userId?.username ?? 'Unknown user'}
          </span>
          <span style={{
            fontSize: 11, flexShrink: 0,
            color: hasUnread ? 'var(--chat-unread)' : 'var(--chat-text-meta)',
            fontWeight: hasUnread ? 600 : 400,
          }}>
            {displayTime}
          </span>
        </div>
        <p style={{
          fontSize: 12, margin: 0,
          color: hasUnread ? 'var(--chat-text-secondary)' : 'var(--chat-text-meta)',
          fontWeight: hasUnread ? 500 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {convo.lastMessage ?? convo.userId?.email ?? '—'}
        </p>
      </div>

      {convo.unreadCount > 0 && (
        <span style={{
          minWidth: 19, height: 19, borderRadius: 10, padding: '0 5px',
          background: 'var(--chat-unread)', color: '#fff',
          fontSize: 10, fontWeight: 700, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          letterSpacing: '-0.02em',
        }}>
          {convo.unreadCount > 99 ? '99+' : convo.unreadCount}
        </span>
      )}
    </div>
  )
}

// ─── Preview pane ─────────────────────────────────────────────────────────────
function PreviewPane({ convo, onClose }: { convo: MergedConversation; onClose: () => void }) {
  const user = convo.userId
  const [hover, setHover] = useState(false)

  return (
    <div style={{
      ...UTILITY,
      width: 272, flexShrink: 0,
      borderLeft: '0.5px solid var(--chat-border)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--chat-surface)',
      animation: 'slideInRight 0.16s ease both',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '13px 16px', borderBottom: '0.5px solid var(--chat-border)', flexShrink: 0,
      }}>
        <span style={{ flex: 1, fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--chat-text-meta)' }}>
          Details
        </span>
        <button onClick={onClose} aria-label="Close" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--chat-text-meta)', padding: 5,
          display: 'flex', alignItems: 'center', borderRadius: 6,
          transition: 'color 0.12s, background 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--chat-text-primary)'; e.currentTarget.style.background = 'var(--chat-surface-hi)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--chat-text-meta)';    e.currentTarget.style.background = 'none' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: '20px 16px', borderBottom: '0.5px solid var(--chat-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Avatar user={user} size={48} />
          <div style={{ minWidth: 0 }}>
            <p style={{ ...DISPLAY, fontSize: 18, fontStyle: 'italic', fontWeight: 500, color: 'var(--chat-text-primary)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? user?.username ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--chat-text-meta)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? '—'}
            </p>
          </div>
        </div>

        {convo.lastMessage && (
          <div style={{
            padding: '10px 12px', marginBottom: 14,
            background: 'var(--chat-surface-hi)',
            borderRadius: 10, border: '0.5px solid var(--chat-border)',
          }}>
            <p style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--chat-text-meta)', margin: '0 0 6px', fontWeight: 600 }}>
              Last message
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--chat-text-secondary)', margin: 0, lineHeight: 1.65 }}>
              {convo.lastMessage}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--chat-text-meta)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            Started {formatDate(convo.createdAt)}
          </div>
          {convo.unreadCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--chat-unread)', fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chat-unread)', flexShrink: 0 }} />
              {convo.unreadCount} unread {convo.unreadCount === 1 ? 'message' : 'messages'}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', marginTop: 'auto' }}>
        <Link href={`/admin/support/${convo._id}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '11px',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
            background: hover ? 'var(--chat-accent-hover)' : 'var(--chat-accent)',
            color: 'var(--chat-bubble-out-text)',
            borderRadius: 9, textDecoration: 'none',
            transition: 'background 0.12s',
          }}
        >
          Open conversation
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: hover ? 'translateX(2px)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div style={{ ...UTILITY, textAlign: 'center', padding: '5rem 1.5rem' }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, margin: '0 auto 1.5rem',
        border: '0.5px solid var(--chat-border)', background: 'var(--chat-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--chat-text-meta)',
      }}>
        {icon}
      </div>
      <p style={{ ...DISPLAY, fontSize: 22, fontStyle: 'italic', fontWeight: 500, color: 'var(--chat-text-primary)', margin: '0 0 8px' }}>{title}</p>
      <p style={{ fontSize: 12.5, color: 'var(--chat-text-secondary)', margin: 0, maxWidth: 260, marginInline: 'auto', lineHeight: 1.7 }}>{body}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminSupportPage() {
  const router = useRouter()
  const [convos,       setConvos]       = useState<AdminConversation[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState<Filter>('all')
  const [selected,     setSelected]     = useState<MergedConversation | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isMobile,     setIsMobile]     = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const rowRefs   = useRef<(HTMLDivElement | null)[]>([])

  const { client, isReady } = useStreamContext()
  const { previews } = useSupportChat(client, isReady)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const update = () => setIsMobile(mq.matches); update()
    mq.addEventListener('change', update); return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = document.activeElement?.tagName === 'INPUT'
      if (e.key === '/' && !inInput) { e.preventDefault(); searchRef.current?.focus(); return }
      if (e.key === 'Escape') {
        if (search) { setSearch(''); return }
        if (selected) { setSelected(null); return }
        searchRef.current?.blur(); setFocusedIndex(-1); return
      }
      if (inInput && document.activeElement === searchRef.current && e.key !== 'Enter') return
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, filteredRef.current.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && focusedIndexRef.current >= 0) {
        const c = filteredRef.current[focusedIndexRef.current]; if (c) handleSelect(c)
      }
    }
    document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selected])

  useEffect(() => {
    let cancelled = false; setLoading(true)
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
      return new Date(b.lastMessageAt ?? b.updatedAt).getTime() - new Date(a.lastMessageAt ?? a.updatedAt).getTime()
    })
  }, [convos, previews])

  const unreadTotal = useMemo(() => merged.filter(c => c.unreadCount > 0).length, [merged])
  const byFilter    = useMemo(() => filter === 'unread' ? merged.filter(c => c.unreadCount > 0) : merged, [merged, filter])
  const filtered    = useMemo(() => {
    if (!search.trim()) return byFilter
    const q = search.toLowerCase()
    return byFilter.filter(c =>
      c.userId?.displayName?.toLowerCase().includes(q) ||
      c.userId?.username?.toLowerCase().includes(q) ||
      c.userId?.email?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    )
  }, [byFilter, search])

  const filteredRef     = useRef(filtered);     filteredRef.current     = filtered
  const focusedIndexRef = useRef(focusedIndex); focusedIndexRef.current = focusedIndex

  useEffect(() => { setFocusedIndex(-1) }, [search, filter])
  useEffect(() => { if (focusedIndex >= 0) rowRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' }) }, [focusedIndex])

  const handleSelect = useCallback((c: MergedConversation) => {
    if (isMobile) router.push(`/admin/support/${c._id}`)
    else setSelected(c)
  }, [isMobile, router])

  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd style={{
      background: 'var(--chat-surface)', border: '0.5px solid var(--chat-border)',
      borderRadius: 4, padding: '1px 5px', fontSize: 10,
      fontFamily: 'inherit', color: 'var(--chat-text-secondary)',
    }}>
      {children}
    </kbd>
  )

  return (
    <div style={{ ...UTILITY, ...chatVars, maxWidth: selected ? '100%' : 820, margin: '0 auto', padding: selected ? '0' : '3rem 1.25rem 6rem' }}>

      {!selected && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase', color: 'var(--chat-text-meta)', margin: 0, fontWeight: 600 }}>
              Admin
            </p>
            <span className={parisienne.className} style={{ fontSize: 17, color: 'var(--chat-accent)', lineHeight: 1 }}>
              your inbox
            </span>
          </div>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, color: 'var(--chat-text-primary)', margin: '0 0 10px', lineHeight: 0.95 }}>
            Messages
          </h1>
          <p style={{ fontSize: 13, color: 'var(--chat-text-secondary)', margin: 0 }}>
            {loading ? 'Loading…' : (
              <>
                {merged.length} {merged.length === 1 ? 'conversation' : 'conversations'}
                {unreadTotal > 0 && <> · <span style={{ color: 'var(--chat-unread)', fontWeight: 500 }}>{unreadTotal} need{unreadTotal === 1 ? 's' : ''} a reply</span></>}
                {unreadTotal === 0 && ' · all caught up'}
              </>
            )}
          </p>
        </div>
      )}

      <div style={{
        display: 'flex',
        border: '0.5px solid var(--chat-border)',
        borderRadius: selected ? 0 : 14,
        overflow: 'hidden',
        background: 'var(--chat-bg)',
        minHeight: selected ? 'calc(100dvh - 64px)' : undefined,
      }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Search */}
          <div style={{ padding: '11px 14px', borderBottom: '0.5px solid var(--chat-border)' }}>
            <div className="inbox-search-wrap" style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'var(--chat-surface)', borderRadius: 9, padding: '8px 13px',
              border: '0.5px solid var(--chat-border)', transition: 'border-color 0.15s',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--chat-text-meta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or message…"
                style={{ ...UTILITY, flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--chat-text-primary)' }}
              />
              {search ? (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--chat-text-meta)', padding: 0, display: 'flex' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              ) : (
                <kbd style={{ fontSize: 10, color: 'var(--chat-text-meta)', background: 'var(--chat-surface-hi)', border: '0.5px solid var(--chat-border)', borderRadius: 4, padding: '1px 5px', fontFamily: 'inherit' }}>/</kbd>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '9px 14px', borderBottom: '0.5px solid var(--chat-border)' }}>
            {([
              { key: 'all',    label: 'All',    count: merged.length },
              { key: 'unread', label: 'Unread', count: unreadTotal   },
            ] as const).map(tab => {
              const active = filter === tab.key
              return (
                <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '5px 12px', borderRadius: 8,
                  fontSize: 12.5, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--chat-text-primary)' : 'var(--chat-text-secondary)',
                  background: active ? 'var(--chat-surface)' : 'transparent',
                  border: `0.5px solid ${active ? 'var(--chat-border)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--chat-surface)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: tab.key === 'unread' ? 'var(--chat-unread)' : 'var(--chat-text-meta)' }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* List */}
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} delay={i * 0.07} />)
          ) : filtered.length === 0 ? (
            filter === 'unread' ? (
              <EmptyState icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>} title="All caught up" body="No unread conversations right now." />
            ) : search ? (
              <EmptyState icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>} title="No results" body={`Nothing matches "${search}".`} />
            ) : (
              <EmptyState icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} title="No conversations yet" body="Conversations will appear when customers message support." />
            )
          ) : (
            filtered.map((c, idx) => (
              <ConversationRow key={c._id} convo={c}
                isSelected={selected?._id === c._id}
                isFocused={focusedIndex === idx}
                onSelect={handleSelect}
                innerRef={el => { rowRefs.current[idx] = el }}
                style={{ animation: `fadeInUp 0.2s ease ${Math.min(idx, 10) * 0.02}s both` }}
              />
            ))
          )}
        </div>

        {selected && !isMobile && <PreviewPane convo={selected} onClose={() => setSelected(null)} />}
      </div>

      {!search && !selected && (
        <p style={{ fontSize: 10.5, color: 'var(--chat-text-meta)', textAlign: 'center', marginTop: 14, letterSpacing: '0.04em' }}>
          <Kbd>/</Kbd> search
          {!isMobile && <> · <Kbd>↑↓</Kbd> navigate · <Kbd>↵</Kbd> open · </>}
          {isMobile && ' · '}
          <Kbd>Esc</Kbd> clear
        </p>
      )}

      <style>{`
        @keyframes pulse     { 0%,100%{opacity:.2} 50%{opacity:.55} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes unreadPulse {
          0%   { transform: scale(1);   opacity: 0.5 }
          70%  { transform: scale(2.5); opacity: 0   }
          100% { transform: scale(2.5); opacity: 0   }
        }
        .inbox-search-wrap:focus-within { border-color: var(--chat-accent) !important; }
        input::placeholder { color: var(--chat-text-meta) !important }
        input:focus        { outline: none }
      `}</style>
    </div>
  )
}