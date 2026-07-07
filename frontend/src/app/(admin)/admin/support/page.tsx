'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStreamContext } from '@/components/providers/StreamProvider'
import { apiClient }        from '@/lib/api'
import { useSupportChat, ChannelPreview } from '@/hooks/useSupportChat'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:        '#000',
  surface:   '#0d0d0d',
  surfaceHi: '#141414',
  border:    'rgba(255,255,255,0.08)',
  red:       '#e60023',
  blue:      '#3b82f6',
  textPri:   '#fff',
  textSec:   'rgba(255,255,255,0.55)',
  textMeta:  'rgba(255,255,255,0.28)',
}

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
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
      background: T.surface, border: `0.5px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: T.textSec,
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
    background: 'rgba(255,255,255,0.06)',
    animation: `pulse 1.6s ${delay}s ease-in-out infinite`,
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 18px', borderBottom: `0.5px solid ${T.border}` }}>
      <span style={{ width: 8, flexShrink: 0 }} />
      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, ...skel(40, 40), borderRadius: '50%' }} />
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
      display: 'flex', alignItems: 'center', gap: 13,
      padding: '14px 18px',
      borderBottom: `0.5px solid ${T.border}`,
      cursor: 'pointer', position: 'relative',
      background: isSelected ? T.surfaceHi : 'transparent',
      outline: isFocused && !isSelected ? `1.5px solid rgba(255,255,255,0.1)` : 'none',
      outlineOffset: -1,
      transition: 'background 0.1s',
      ...style,
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.surface }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Red selected bar */}
      {isSelected && (
        <div style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 2.5, borderRadius: '0 2px 2px 0', background: T.red }} />
      )}

      {/* Unread dot */}
      {hasUnread ? (
        <span style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: T.blue, animation: 'unreadPulse 2.4s ease-in-out infinite' }} />
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: T.blue }} />
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
            color: hasUnread ? T.textPri : 'rgba(255,255,255,0.7)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {convo.userId?.displayName ?? convo.userId?.username ?? 'Unknown user'}
          </span>
          <span style={{
            fontSize: 11, flexShrink: 0,
            color: hasUnread ? T.blue : T.textMeta,
            fontWeight: hasUnread ? 600 : 400,
          }}>
            {displayTime}
          </span>
        </div>
        <p style={{
          fontSize: 12, margin: 0,
          color: hasUnread ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.22)',
          fontWeight: hasUnread ? 500 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {convo.lastMessage ?? convo.userId?.email ?? '—'}
        </p>
      </div>

      {convo.unreadCount > 0 && (
        <span style={{
          minWidth: 19, height: 19, borderRadius: 10, padding: '0 5px',
          background: T.blue, color: '#fff',
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
      width: 272, flexShrink: 0,
      borderLeft: `0.5px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      background: T.surface,
      animation: 'slideInRight 0.16s ease both',
    }}>
      {/* Pane header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: `0.5px solid ${T.border}`, flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.textMeta }}>
          Details
        </span>
        <button onClick={onClose} aria-label="Close" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.textMeta, padding: 5, display: 'flex', alignItems: 'center',
          borderRadius: 6, transition: 'color 0.12s, background 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = T.textPri; e.currentTarget.style.background = T.surfaceHi }}
          onMouseLeave={e => { e.currentTarget.style.color = T.textMeta; e.currentTarget.style.background = 'none' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* User section */}
      <div style={{ padding: '20px 16px', borderBottom: `0.5px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Avatar user={user} size={48} />
          <div style={{ minWidth: 0 }}>
            <p style={{ ...DISPLAY, fontSize: 18, fontWeight: 400, color: T.textPri, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? user?.username ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: T.textMeta, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? '—'}
            </p>
          </div>
        </div>

        {/* Last message card */}
        {convo.lastMessage && (
          <div style={{ padding: '10px 12px', background: T.surfaceHi, borderRadius: 10, border: `0.5px solid ${T.border}`, marginBottom: 14 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.textMeta, margin: '0 0 6px', fontWeight: 600 }}>
              Last message
            </p>
            <p style={{ fontSize: 12.5, color: T.textSec, margin: 0, lineHeight: 1.65 }}>
              {convo.lastMessage}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: T.textMeta }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            Started {formatDate(convo.createdAt)}
          </div>
          {convo.unreadCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: T.blue, fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.blue, flexShrink: 0 }} />
              {convo.unreadCount} unread {convo.unreadCount === 1 ? 'message' : 'messages'}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '16px', marginTop: 'auto' }}>
        <Link href={`/admin/support/${convo._id}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '11px',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
            background: hover ? '#ff1a38' : T.red,
            color: '#fff', borderRadius: 9, textDecoration: 'none',
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
    <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, margin: '0 auto 1.5rem',
        border: `0.5px solid ${T.border}`, background: T.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.textMeta,
      }}>
        {icon}
      </div>
      <p style={{ ...DISPLAY, fontSize: 22, fontWeight: 300, color: T.textPri, margin: '0 0 8px' }}>{title}</p>
      <p style={{ fontSize: 12.5, color: T.textSec, margin: 0, maxWidth: 260, marginInline: 'auto', lineHeight: 1.7 }}>{body}</p>
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
      if (e.key === 'Enter' && focusedIndexRef.current >= 0) { const c = filteredRef.current[focusedIndexRef.current]; if (c) handleSelect(c) }
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
    <kbd style={{ background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: 'inherit', color: T.textSec }}>
      {children}
    </kbd>
  )

  return (
    <div style={{ maxWidth: selected ? '100%' : 820, margin: '0 auto', padding: selected ? '0' : '3rem 1.25rem 6rem' }}>

      {/* Page header */}
      {!selected && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase', color: T.textMeta, margin: '0 0 10px', fontWeight: 600 }}>
            Admin
          </p>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, color: T.textPri, margin: '0 0 10px', lineHeight: 0.95 }}>
            Messages
          </h1>
          <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>
            {loading ? 'Loading…' : (
              <>
                {merged.length} {merged.length === 1 ? 'conversation' : 'conversations'}
                {unreadTotal > 0 && <> · <span style={{ color: T.blue, fontWeight: 500 }}>{unreadTotal} need{unreadTotal === 1 ? 's' : ''} a reply</span></>}
                {unreadTotal === 0 && ' · all caught up'}
              </>
            )}
          </p>
        </div>
      )}

      {/* Card */}
      <div style={{
        display: 'flex',
        border: `0.5px solid ${T.border}`,
        borderRadius: selected ? 0 : 14,
        overflow: 'hidden',
        background: T.bg,
        minHeight: selected ? 'calc(100dvh - 64px)' : undefined,
      }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Search */}
          <div style={{ padding: '11px 14px', borderBottom: `0.5px solid ${T.border}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: T.surface, borderRadius: 9, padding: '8px 13px',
              border: `0.5px solid ${T.border}`, transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = T.red)}
              onBlurCapture={e  => (e.currentTarget.style.borderColor = T.border)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMeta} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or message…"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: T.textPri, fontFamily: 'var(--font-sans)' }}
              />
              {search ? (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMeta, padding: 0, display: 'flex' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              ) : (
                <kbd style={{ fontSize: 10, color: T.textMeta, background: T.surfaceHi, border: `0.5px solid ${T.border}`, borderRadius: 4, padding: '1px 5px', fontFamily: 'inherit' }}>/</kbd>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '9px 14px', borderBottom: `0.5px solid ${T.border}` }}>
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
                  color: active ? T.textPri : T.textSec,
                  background: active ? T.surface : 'transparent',
                  border: `0.5px solid ${active ? T.border : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surface }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: tab.key === 'unread' ? T.blue : T.textMeta }}>
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

      {/* Keyboard hint */}
      {!search && !selected && (
        <p style={{ fontSize: 10.5, color: T.textMeta, textAlign: 'center', marginTop: 14, letterSpacing: '0.04em' }}>
          <Kbd>/</Kbd> search
          {!isMobile && <> · <Kbd>↑↓</Kbd> navigate · <Kbd>↵</Kbd> open · </>}
          {isMobile && ' · '}
          <Kbd>Esc</Kbd> clear
        </p>
      )}

      <style>{`
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes pulse     { 0%,100%{opacity:.2} 50%{opacity:.55} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes unreadPulse {
          0%   { transform: scale(1);   opacity: 0.5 }
          70%  { transform: scale(2.5); opacity: 0   }
          100% { transform: scale(2.5); opacity: 0   }
        }
        input::placeholder { color: rgba(255,255,255,0.2) !important }
        input:focus         { outline: none }
      `}</style>
    </div>
  )
}