'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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

const typeConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  follow:          { icon: UserPlus,      color: 'hsl(217 91% 60%)',   label: 'Follow'     },
  save:            { icon: Heart,         color: 'hsl(var(--accent))', label: 'Save'       },
  order_update:    { icon: Package,       color: 'hsl(142 60% 40%)',   label: 'Order'      },
  message:         { icon: MessageCircle, color: 'hsl(280 60% 60%)',   label: 'Message'    },
  review:          { icon: Star,          color: 'hsl(45 90% 50%)',    label: 'Review'     },
  collection_save: { icon: Bookmark,      color: 'hsl(var(--accent))', label: 'Collection' },
}
const fallbackConfig = { icon: Bell, color: 'hsl(var(--muted))', label: 'Activity' }

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
    if (created >= startOfToday)        buckets.Today.push(item)
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
    return Array.from(seen).filter(t => t in typeConfig || true)
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

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 glass">
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.30) 40%, hsl(var(--accent) / 0.30) 60%, transparent 100%)',
          }}
        />
        <div className="container-narrow">
          <div
            className="flex items-center justify-between gap-4"
            style={{ paddingBlock: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease }}
            >
              <p className="eyebrow mb-1">Activity</p>
              <div className="flex items-center gap-3">
                <h1
                  className="font-display"
                  style={{
                    fontSize:      'clamp(1.4rem, 2.5vw, 1.8rem)',
                    fontWeight:    600,
                    letterSpacing: '-0.035em',
                    lineHeight:    1.1,
                    color:         'hsl(var(--foreground))',
                  }}
                >
                  Notifications
                </h1>
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{   scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease }}
                      className="flex items-center justify-center text-white text-[10px]
                                 font-semibold leading-none"
                      style={{
                        minWidth:     '1.375rem',
                        height:       '1.375rem',
                        borderRadius: '999px',
                        background:   'hsl(var(--accent))',
                        boxShadow:    'var(--shadow-red)',
                        padding:      '0 0.3rem',
                      }}
                      aria-live="polite"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <motion.div
                className="mt-2 h-[1.5px] rounded-full"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent) / 0))',
                  width:      '2.5rem',
                  originX:    0,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.18, ease }}
              />
            </motion.div>

            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => fetchNotifications()}
                className="btn-icon"
                aria-label="Refresh"
                whileTap={{ scale: 0.92 }}
                disabled={isLoading}
              >
                <motion.span
                  className="flex"
                  animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                  transition={isLoading
                    ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
                    : { duration: 0.2 }}
                >
                  <RefreshCw size={14} />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.button
                    onClick={handleMarkAllRead}
                    className="btn-ghost"
                    style={{ fontSize: '0.8125rem', gap: '0.375rem' }}
                    initial={{ opacity: 0, scale: 0.94, x: 8 }}
                    animate={{ opacity: 1, scale: 1,    x: 0 }}
                    exit={{   opacity: 0, scale: 0.94, x: 8 }}
                    transition={{ duration: 0.25, ease }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check size={12} strokeWidth={2.5} />
                    Mark all read
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── TYPE FILTERS ── */}
          {items.length > 0 && types.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto notif-filter-scroll"
              style={{ paddingBottom: '0.875rem' }}
            >
              <FilterPill
                label="All"
                active={activeType === 'all'}
                onClick={() => setActiveType('all')}
              />
              {types.map(type => {
                const config = typeConfig[type] ?? fallbackConfig
                return (
                  <FilterPill
                    key={type}
                    label={config.label}
                    icon={config.icon}
                    active={activeType === type}
                    onClick={() => setActiveType(type)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="container-narrow" style={{ paddingBlock: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* Loading skeleton */}
        {isLoading && items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 animate-pulse"
                style={{ padding: '0.875rem 1rem' }}
              >
                <div
                  className="shrink-0 rounded-full"
                  style={{
                    width:      '2.5rem',
                    height:     '2.5rem',
                    background: 'hsl(var(--surface-elevated))',
                  }}
                />
                <div className="flex-1 space-y-2 pt-1">
                  <div
                    className="rounded"
                    style={{
                      height:     '0.875rem',
                      width:      `${60 + i * 8}%`,
                      background: 'hsl(var(--surface-elevated))',
                    }}
                  />
                  <div
                    className="rounded"
                    style={{
                      height:     '0.75rem',
                      width:      '4rem',
                      background: 'hsl(var(--surface-elevated))',
                    }}
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
                {read.length > 0 && (
                  <div className="my-5 h-px" style={{ background: 'hsl(var(--border))' }} />
                )}
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

// ─── Filter pill ────────────────────────────────────────────────────────────

function FilterPill({ label, icon: Icon, active, onClick }: {
  label:   string
  icon?:   LucideIcon
  active:  boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all"
      style={{
        fontSize:      '0.75rem',
        fontWeight:    active ? 600 : 400,
        padding:       '0.375rem 0.75rem',
        borderRadius:  '999px',
        color:         active ? 'hsl(var(--accent-foreground, var(--foreground)))' : 'hsl(var(--muted-foreground))',
        background:    active ? 'hsl(var(--accent-muted))' : 'transparent',
        border:        `1px solid ${active ? 'hsl(var(--accent) / 0.3)' : 'hsl(var(--border))'}`,
      }}
    >
      {Icon && <Icon size={12} strokeWidth={2.25} />}
      {label}
    </button>
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
        className="void-glow mb-6"
        style={{
          width:          '4.5rem',
          height:         '4.5rem',
          borderRadius:   'var(--radius-xl)',
          background:     'hsl(var(--surface-elevated))',
          boxShadow:      'var(--shadow-md)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={22} style={{ color: 'hsl(var(--muted))', strokeWidth: 1.5 }} />
      </div>
      <p
        style={{
          fontFamily:    "'Playfair Display', Georgia, serif",
          fontWeight:    600,
          fontSize:      '1.125rem',
          letterSpacing: '-0.025em',
          color:         'hsl(var(--foreground))',
          marginBottom:  '0.5rem',
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize:   'var(--text-sm)',
          color:      'hsl(var(--muted-foreground))',
          fontWeight: 300,
          maxWidth:   '22rem',
          lineHeight: 1.65,
        }}
      >
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

  const content = (
    <>
      {/* Avatar + type badge */}
      <div className="relative shrink-0 mt-0.5">
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
            boxShadow:    'var(--shadow-xs), 0 0 0 1.5px hsl(var(--background))',
            color:        config.color,
          }}
        >
          <Icon size={11} strokeWidth={2.25} />
        </span>
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontSize:     'var(--text-sm)',
            lineHeight:   1.55,
            color:        'hsl(var(--foreground))',
            fontWeight:   notif.isRead ? 300 : 500,
            marginBottom: '0.2rem',
          }}
        >
          {notif.message}
        </p>
        <div className="flex items-center gap-2">
          <p
            style={{
              fontSize:      '10px',
              color:         config.color,
              fontWeight:    500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {config.label}
          </p>
          <span style={{ color: 'hsl(var(--muted) / 0.4)', fontSize: '10px' }}>·</span>
          <p
            style={{
              fontSize:      'var(--text-xs)',
              color:         'hsl(var(--muted-foreground))',
              fontWeight:    300,
              letterSpacing: '0.01em',
            }}
          >
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
                background: 'hsl(var(--accent))',
                boxShadow: 'var(--shadow-red)',
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
    background: notif.isRead ? 'transparent' : 'hsl(var(--accent-muted))',
  }
  const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = notif.isRead ? 'hsl(var(--surface-elevated))' : 'hsl(var(--accent-muted))'
    e.currentTarget.style.boxShadow  = 'var(--shadow-xs)'
  }
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = notif.isRead ? 'transparent' : 'hsl(var(--accent-muted))'
    e.currentTarget.style.boxShadow  = 'none'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.35, ease }}
    >
      {notif.link ? (
        <Link
          href={notif.link}
          onClick={onRead}
          className={rowClassName}
          style={rowStyle}
          onMouseEnter={hoverIn}
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
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          {content}
        </div>
      )}
    </motion.div>
  )
}