'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, RefreshCw } from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import api from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'

const typeConfig: Record<string, { icon: string; color: string }> = {
  follow:          { icon: '👤', color: 'hsl(217 91% 60%)' },
  save:            { icon: '♡',  color: 'hsl(var(--accent))' },
  order_update:    { icon: '📦', color: 'hsl(142 60% 40%)' },
  message:         { icon: '💬', color: 'hsl(280 60% 60%)' },
  review:          { icon: '★',  color: 'hsl(45 90% 50%)' },
  collection_save: { icon: '🗂', color: 'hsl(var(--accent))' },
}

const ease = [0.16, 1, 0.3, 1] as const

export default function NotificationsPage() {
  const {
    notifications,
    fetchNotifications,
    markAllRead,
    markOneRead,
    unreadCount,
    isLoading,
  } = useNotificationStore()

  useEffect(() => { fetchNotifications() }, [])

  const unread = notifications.filter(n => !n.isRead)
  const read   = notifications.filter(n =>  n.isRead)

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
                whileTap={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <RefreshCw size={14} style={{ opacity: isLoading ? 0.4 : 1 }} />
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
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="container-narrow" style={{ paddingBlock: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* Loading skeleton */}
        {isLoading && notifications.length === 0 && (
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

        {/* Empty state */}
        {!isLoading && notifications.length === 0 && (
          <motion.div
            className="flex flex-col items-center text-center"
            style={{ paddingBlock: 'clamp(4rem, 10vw, 7rem)' }}
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
              All caught up
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
              When someone interacts with your content, it will appear here.
            </p>
          </motion.div>
        )}

        {/* Notification list */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {unread.length > 0 && (
              <>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 px-1"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  New
                </p>
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

            {read.length > 0 && (
              <>
                {unread.length > 0 && (
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 px-1"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    Earlier
                  </p>
                )}
                {read.map((notif, i) => (
                  <NotificationRow
                    key={notif._id}
                    notif={notif}
                    index={i}
                    onRead={() => {}}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function NotificationRow({
  notif,
  index,
  onRead,
}: {
  notif:  any
  index:  number
  onRead: () => void
}) {
  const config = typeConfig[notif.type] ?? { icon: '🔔', color: 'hsl(var(--muted))' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: index * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={notif.link || '#'}
        onClick={onRead}
        className="group flex items-start gap-3.5 rounded-[var(--radius-lg)]
                   transition-all duration-[var(--duration-hover)]"
        style={{
          padding:    '0.875rem 1rem',
          background: notif.isRead ? 'transparent' : 'hsl(var(--accent-muted))',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.background = notif.isRead
            ? 'hsl(var(--surface-elevated))'
            : 'hsl(var(--accent-muted))'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.background = notif.isRead
            ? 'transparent'
            : 'hsl(var(--accent-muted))'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        }}
      >
        {/* Avatar + type badge */}
        <div className="relative shrink-0 mt-0.5">
          <Avatar
            src={notif.sender?.avatar}
            name={notif.sender?.displayName}
            size="md"
          />
          <span
            className="absolute -bottom-1 -right-1 flex items-center justify-center
                       text-[0.625rem] leading-none select-none"
            style={{
              width:        '1.25rem',
              height:       '1.25rem',
              borderRadius: '50%',
              background:   'hsl(var(--surface-float))',
              boxShadow:    'var(--shadow-xs), 0 0 0 1.5px hsl(var(--background))',
            }}
          >
            {config.icon}
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
              {notif.type.replace('_', ' ')}
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

        {/* Unread dot */}
        {!notif.isRead && (
          <motion.div
            className="shrink-0 mt-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.03 + 0.15, duration: 0.25 }}
            style={{
              width:        '0.4375rem',
              height:       '0.4375rem',
              borderRadius: '50%',
              background:   'hsl(var(--accent))',
              boxShadow:    'var(--shadow-red)',
            }}
          />
        )}
      </Link>
    </motion.div>
  )
}