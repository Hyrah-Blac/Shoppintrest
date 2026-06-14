'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, useSpring } from 'framer-motion'
import {
  Bell, Check, RefreshCw, ChevronRight,
  UserPlus, Heart, Package, MessageCircle, Star, Bookmark,
  type LucideIcon,
} from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import api from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'

interface NotificationItem {
  _id:       string
  type:      string
  message:   string
  link?:     string
  isRead:    boolean
  createdAt: string
  sender?: {
    avatar?:      string
    displayName?: string
  }
}

// Plain, monochrome — icon only, no per-type colour coding
const typeConfig: Record<string, { icon: LucideIcon; label: string }> = {
  follow:          { icon: UserPlus,      label: 'Follow'     },
  save:            { icon: Heart,         label: 'Save'       },
  order_update:    { icon: Package,       label: 'Order'      },
  message:         { icon: MessageCircle, label: 'Message'    },
  review:          { icon: Star,          label: 'Review'     },
  collection_save: { icon: Bookmark,      label: 'Collection' },
}
const fallbackConfig = { icon: Bell, label: 'Activity' }

const ease = [0.16, 1, 0.3, 1] as const

// ─── Date grouping ──────────────────────────────────────────────────────────

function groupByDate(items: NotificationItem[]) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  const buckets: Record<string, NotificationItem[]> = {
    Today: [], Yesterday: [], 'This week': [], Earlier: [],
  }

  for (const item of items) {
    const created = new Date(item.createdAt)
    if (created >= startOfToday)          buckets.Today.push(item)
    else if (created >= startOfYesterday) buckets.Yesterday.push(item)
    else if (created >= startOfWeek)      buckets['This week'].push(item)
    else                                   buckets.Earlier.push(item)
  }

  return Object.entries(buckets).filter(([, v]) => v.length > 0)
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    notifications,
    fetchNotifications,
    markAllRead,
    markOneRead,
    unreadCount,
    isLoading,
  } = useNotificationStore()

  const [activeType, setActiveType] = useState<string>('all')

  useEffect(() => { fetchNotifications() }, [])

  const items = notifications as NotificationItem[]

  const types = useMemo(() => {
    const seen = new Set<string>()
    items.forEach(n => seen.add(n.type))
    return Array.from(seen)
  }, [items])

  const visible = useMemo(() =>
    activeType === 'all' ? items : items.filter(n => n.type === activeType)
  , [items, activeType])

  const unread = visible.filter(n => !n.isRead)
  const read   = visible.filter(n =>  n.isRead)
  const readGroups = useMemo(() => groupByDate(read), [read])

  const handleMarkAllRead = () => {
    markAllRead()
    api.patch('/api/notifications/read-all').catch(console.error)
  }

  const handleMarkOneRead = (id: string) => {
    markOneRead(id)
    api.patch(`/api/notifications/${id}/read`).catch(console.error)
  }

  // ── Cursor spotlight — subtle ambient light following the pointer ──
  const spotlightX = useMotionValue(-500)
  const spotlightY = useMotionValue(-500)
  const spotlightXSpring = useSpring(spotlightX, { damping: 30, stiffness: 120, mass: 0.5 })
  const spotlightYSpring = useSpring(spotlightY, { damping: 30, stiffness: 120, mass: 0.5 })
  const spotlightBackground = useMotionTemplate`radial-gradient(600px circle at ${spotlightXSpring}px ${spotlightYSpring}px, hsl(var(--foreground) / 0.045), transparent 60%)`

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    spotlightX.set(e.clientX)
    spotlightY.set(e.clientY)
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ background: 'hsl(var(--background))' }}
      onMouseMove={handlePointerMove}
    >
      {/* ── Ambient cursor spotlight ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30 hidden sm:block"
        style={{ background: spotlightBackground }}
      />

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'hsl(var(--background))',
          borderBottom: '1px solid hsl(var(--border) / 0.5)',
        }}
      >
        <div className="container-narrow">
          <div
            className="flex items-baseline justify-between gap-4"
            style={{ paddingBlock: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease }}
            >
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--muted))',
                  marginBottom: '0.375rem',
                }}
              >
                Activity
              </p>
              <div className="flex items-center gap-3">
                <h1
                  className="font-display"
                  style={{
                    fontSize:      'clamp(1.75rem, 3vw, 2.5rem)',
                    fontWeight:    300,
                    letterSpacing: '-0.02em',
                    lineHeight:    1,
                    color:         'hsl(var(--foreground))',
                  }}
                >
                  Noti<span style={{ color: 'hsl(var(--accent))' }}>fications</span>
                </h1>
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{   scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease }}
                      className="flex items-center justify-center text-[10px]
                                 font-semibold leading-none"
                      style={{
                        minWidth:     '1.375rem',
                        height:       '1.375rem',
                        borderRadius: '999px',
                        background:   'hsl(var(--surface-elevated))',
                        border:       '1px solid hsl(var(--border))',
                        color:        'hsl(var(--foreground))',
                        padding:      '0 0.3rem',
                      }}
                      aria-live="polite"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.button
                    onClick={handleMarkAllRead}
                    className="hidden sm:inline-flex items-center gap-1.5 group"
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--muted))',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted))')}
                    initial={{ opacity: 0, scale: 0.94, x: 8 }}
                    animate={{ opacity: 1, scale: 1,    x: 0 }}
                    exit={{   opacity: 0, scale: 0.94, x: 8 }}
                    transition={{ duration: 0.25, ease }}
                  >
                    <Check size={11} strokeWidth={1.5} />
                    Mark all read
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.button
                onClick={() => fetchNotifications()}
                aria-label="Refresh"
                whileTap={{ scale: 0.92 }}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--muted))',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted))')}
              >
                <motion.span
                  className="flex"
                  animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                  transition={isLoading
                    ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
                    : { duration: 0.2 }}
                >
                  <RefreshCw size={14} strokeWidth={1.5} />
                </motion.span>
              </motion.button>
            </div>
          </div>

          {/* ── TYPE FILTERS ── */}
          {items.length > 0 && types.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
              style={{ paddingBottom: '0.875rem' }}
            >
              <button
                onClick={() => setActiveType('all')}
                className={cn('pill', activeType === 'all' && 'active-plain')}
                style={activeType === 'all' ? plainActivePill : undefined}
              >
                All
              </button>
              {types.map(type => {
                const config = typeConfig[type] ?? fallbackConfig
                const Icon = config.icon
                const isActive = activeType === type
                return (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className="pill"
                    style={isActive ? plainActivePill : undefined}
                  >
                    <Icon size={12} strokeWidth={2.25} />
                    {config.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── MOBILE MARK-ALL-READ ── */}
          {unreadCount > 0 && (
            <div className="sm:hidden pb-3 -mt-1">
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5"
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--muted))',
                  background: 'transparent',
                  border: 'none',
                }}
              >
                <Check size={11} strokeWidth={1.5} />
                Mark all read
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="container-narrow" style={{ paddingBlock: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* Loading skeleton */}
        {isLoading && items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4"
                style={{ padding: '0.875rem 1rem' }}
              >
                <div
                  className="skeleton shrink-0"
                  style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }}
                />
                <div className="flex-1 space-y-2 pt-1">
                  <div
                    className="skeleton"
                    style={{ height: '0.875rem', width: `${60 + i * 8}%` }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: '0.75rem', width: '4rem' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — nothing at all */}
        {!isLoading && items.length === 0 && (
          <EmptyState
            title="All caught up"
            body="When someone follows you, saves your pins, or sends a message, it'll show up here."
          />
        )}

        {/* Empty state — filter has nothing */}
        {!isLoading && items.length > 0 && visible.length === 0 && (
          <EmptyState
            title="Nothing here yet"
            body={`No ${(typeConfig[activeType]?.label ?? 'matching').toLowerCase()} notifications right now.`}
            compact
          />
        )}

        {/* Notification list */}
        {visible.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {unread.length > 0 && (
              <>
                <SectionLabel>New</SectionLabel>
                {unread.map((notif, i) => (
                  <NotificationRow
                    key={notif._id}
                    notif={notif}
                    index={i}
                    onRead={() => handleMarkOneRead(notif._id)}
                  />
                ))}
                {read.length > 0 && <hr className="divider my-5" />}
              </>
            )}

            {readGroups.map(([label, group], gi) => (
              <div key={label}>
                <SectionLabel>{label}</SectionLabel>
                {group.map((notif, i) => (
                  <NotificationRow
                    key={notif._id}
                    notif={notif}
                    index={gi * 6 + i}
                    onRead={() => {}}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// Active filter pill — plain, no accent colour
const plainActivePill: React.CSSProperties = {
  background:  'hsl(var(--foreground))',
  color:       'hsl(var(--background))',
  borderColor: 'hsl(var(--foreground))',
  fontWeight:  500,
}

// ─── Section label ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 px-1 mt-5 first:mt-0"
      style={{ color: 'hsl(var(--muted))' }}
    >
      {children}
    </p>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ title, body, compact }: { title: string; body: string; compact?: boolean }) {
  return (
    <motion.div
      className="flex flex-col items-center text-center"
      style={{ paddingBlock: compact ? 'clamp(2.5rem, 6vw, 4rem)' : 'clamp(4rem, 10vw, 7rem)' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
    >
      <div
        className="mb-6"
        style={{
          width:          '4.5rem',
          height:         '4.5rem',
          borderRadius:   'var(--radius-xl)',
          background:     'hsl(var(--surface-elevated))',
          border:         '1px solid hsl(var(--border))',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={22} style={{ color: 'hsl(var(--muted))', strokeWidth: 1.5 }} />
      </div>
      <p className="font-display" style={{
        fontWeight:    600,
        fontSize:      '1.125rem',
        letterSpacing: '-0.025em',
        color:         'hsl(var(--foreground))',
        marginBottom:  '0.5rem',
      }}>
        {title}
      </p>
      <p style={{
        fontSize:   'var(--text-sm)',
        color:      'hsl(var(--muted-foreground))',
        fontWeight: 300,
        maxWidth:   '22rem',
        lineHeight: 1.65,
      }}>
        {body}
      </p>
    </motion.div>
  )
}

// ─── Notification row ───────────────────────────────────────────────────────

function NotificationRow({
  notif,
  index,
  onRead,
}: {
  notif:  NotificationItem
  index:  number
  onRead: () => void
}) {
  const config = typeConfig[notif.type] ?? fallbackConfig
  const Icon   = config.icon
  const delay  = Math.min(index, 10) * 0.03

  const hasIdentity = Boolean(notif.sender?.avatar || notif.sender?.displayName)

  // ── Magnetic tilt — subtle 3D rotation toward cursor on hover ──
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const tiltX = useSpring(rotateX, { damping: 18, stiffness: 220, mass: 0.4 })
  const tiltY = useSpring(rotateY, { damping: 18, stiffness: 220, mass: 0.4 })

  const handleTiltMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width  - 0.5
    const py = (e.clientY - rect.top)  / rect.height - 0.5
    rotateY.set(px * 4)
    rotateX.set(py * -4)
  }
  const resetTilt = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const content = (
    <>
      {/* Avatar (only if we have one) or a plain icon tile */}
      <div className="relative shrink-0 mt-0.5">
        {hasIdentity ? (
          <>
            <Avatar
              src={notif.sender?.avatar}
              name={notif.sender?.displayName}
              size="md"
            />
            <span
              className="absolute -bottom-1 -right-1 flex items-center justify-center select-none"
              style={{
                width:        '1.25rem',
                height:       '1.25rem',
                borderRadius: '50%',
                background:   'hsl(var(--surface-float))',
                border:       '1px solid hsl(var(--border))',
                boxShadow:    '0 0 0 1.5px hsl(var(--background))',
                color:        'hsl(var(--foreground-secondary))',
              }}
            >
              <Icon size={11} strokeWidth={2.25} />
            </span>
          </>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width:        '2.5rem',
              height:       '2.5rem',
              borderRadius: '50%',
              background:   'hsl(var(--surface-elevated))',
              border:       '1px solid hsl(var(--border))',
              color:        'hsl(var(--foreground-secondary))',
            }}
          >
            <Icon size={17} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p style={{
          fontSize:     'var(--text-sm)',
          lineHeight:   1.55,
          color:        'hsl(var(--foreground))',
          fontWeight:   notif.isRead ? 300 : 500,
          marginBottom: '0.2rem',
        }}>
          {notif.message}
        </p>
        <div className="flex items-center gap-2">
          <p style={{
            fontSize:      '10px',
            color:         'hsl(var(--muted-foreground))',
            fontWeight:    500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {config.label}
          </p>
          <span style={{ color: 'hsl(var(--muted) / 0.4)', fontSize: '10px' }}>·</span>
          <p style={{
            fontSize:      'var(--text-xs)',
            color:         'hsl(var(--muted-foreground))',
            fontWeight:    300,
            letterSpacing: '0.01em',
          }}>
            {formatRelativeTime(notif.createdAt)}
          </p>
        </div>
      </div>

      {/* End slot: unread → tap-to-mark-read dot/check; read → reveal chevron */}
      <div
        className="shrink-0 flex items-center justify-center relative"
        style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.4rem' }}
      >
        {!notif.isRead ? (
          <>
            <motion.span
              className="absolute inset-0 m-auto rounded-full transition-opacity group-hover:opacity-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.15, duration: 0.25 }}
              style={{
                width: '0.4375rem', height: '0.4375rem',
                background: 'hsl(var(--foreground))',
              }}
            />
            <button
              aria-label="Mark as read"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onRead() }}
              className="absolute inset-0 flex items-center justify-center rounded-full opacity-0
                         transition-opacity group-hover:opacity-100"
              style={{ background: 'hsl(var(--surface-elevated))', color: 'hsl(var(--foreground))' }}
            >
              <Check size={11} strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <ChevronRight
            size={14}
            className="opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          />
        )}
      </div>
    </>
  )

  const rowClassName = "group flex items-start gap-3.5 rounded-[var(--radius-lg)] cursor-pointer transition-all duration-[var(--duration-hover)]"
  const rowStyle: React.CSSProperties = {
    padding:    '0.875rem 1rem',
    background: notif.isRead ? 'transparent' : 'hsl(var(--surface-elevated))',
    transformStyle: 'preserve-3d',
  }
  const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'hsl(var(--surface-elevated))'
    e.currentTarget.style.boxShadow  = 'var(--shadow-xs)'
  }
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = notif.isRead ? 'transparent' : 'hsl(var(--surface-elevated))'
    e.currentTarget.style.boxShadow  = 'none'
    resetTilt()
  }
  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    hoverIn(e)
    handleTiltMove(e)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.35, ease }}
      style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 600 }}
    >
      {notif.link ? (
        <Link
          href={notif.link}
          onClick={onRead}
          className={rowClassName}
          style={rowStyle}
          onMouseEnter={handleMove}
          onMouseMove={handleTiltMove}
          onMouseLeave={hoverOut}
        >
          {content}
        </Link>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={onRead}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onRead() }}
          className={rowClassName}
          style={rowStyle}
          onMouseEnter={handleMove}
          onMouseMove={handleTiltMove}
          onMouseLeave={hoverOut}
        >
          {content}
        </div>
      )}
    </motion.div>
  )
}