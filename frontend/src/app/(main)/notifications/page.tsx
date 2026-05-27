'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check } from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'

/* ─── Notification type → icon mapping ──────────────────────────────────── */
const typeIcon: Record<string, string> = {
  follow:          '👤',
  save:            '♡',
  order_update:    '📦',
  message:         '💬',
  review:          '★',
  collection_save: '🗂',
}

/* ─── Cinematic easing — matches --ease-out in the design system ────────── */
const ease = [0.16, 1, 0.3, 1] as const

export default function NotificationsPage() {
  const {
    notifications,
    fetchNotifications,
    markAllRead,
    unreadCount,
  } = useNotificationStore()

  useEffect(() => { fetchNotifications() }, [])

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

      {/* ══════════════════════════════════════════════════════════════════
          HEADER — glass atmospheric bar, no hard borders
          Light: translucent paper surface
          Dark:  void glass with ambient edge lighting
      ══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 glass">

        {/* Accent breath line — near-invisible in rest, felt on scroll */}
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.30) 40%, hsl(var(--accent) / 0.30) 60%, transparent 100%)',
          }}
        />

        <div className="container-narrow">
          <div
            className="flex items-end justify-between gap-4"
            style={{ paddingBlock: 'clamp(1.25rem, 2.5vw, 2rem)' }}
          >

            {/* Title block */}
            <motion.div
              initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
              transition={{ duration: 0.55, ease }}
            >
              {/* Eyebrow — luxury brand rhythm */}
              <p className="eyebrow mb-2">Activity</p>

              <h1
                className="font-display"
                style={{
                  fontSize:      'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight:    600,
                  letterSpacing: '-0.035em',
                  lineHeight:    1.08,
                  color:         'hsl(var(--foreground))',
                }}
              >
                Notifications
              </h1>

              {/* Accent underline — animated */}
              <motion.div
                className="mt-2.5 h-[1.5px] rounded-full"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent) / 0))',
                  width: '2.5rem',
                  originX: 0,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.18, ease }}
              />

              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.p
                    className="text-xs mt-1.5"
                    style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 300 }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3, ease }}
                  >
                    {unreadCount} unread
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Mark all read — ghost button, restrained */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.button
                  onClick={markAllRead}
                  className="btn-ghost"
                  style={{ fontSize: '0.8125rem', gap: '0.375rem' }}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.28, ease }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Check size={12} strokeWidth={2.5} />
                  Mark all read
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      <main className="container-narrow" style={{ paddingBlock: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* ── EMPTY STATE ─────────────────────────────────────────────── */}
        {notifications.length === 0 && (
          <motion.div
            className="flex flex-col items-center text-center"
            style={{ paddingBlock: 'clamp(4rem, 10vw, 7rem)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Icon vessel — void-float on dark, paper-card on light */}
            <div
              className="void-glow mb-6"
              style={{
                width:        '4rem',
                height:       '4rem',
                borderRadius: 'var(--radius-xl)',
                background:   'hsl(var(--surface-elevated))',
                boxShadow:    'var(--shadow-md)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={20} style={{ color: 'hsl(var(--muted))', strokeWidth: 1.5 }} />
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

        {/* ── NOTIFICATION LIST ───────────────────────────────────────── */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {notifications.map((notif, i) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
                transition={{
                  delay:    i * 0.032,
                  duration: 0.40,
                  ease,
                }}
              >
                <Link
                  href={notif.link || '#'}
                  className={cn(
                    'group flex items-start gap-4',
                    'transition-all',
                  )}
                  style={{
                    padding:         '0.875rem 1rem',
                    borderRadius:    'var(--radius-lg)',
                    background:      notif.isRead
                      ? 'transparent'
                      : 'hsl(var(--accent-muted))',
                    transition:      `background var(--duration-hover) var(--ease-smooth),
                                      box-shadow  var(--duration-hover) var(--ease-smooth)`,
                    /* Hover handled via CSS class below */
                  }}
                  onMouseEnter={e => {
                    if (notif.isRead) {
                      (e.currentTarget as HTMLElement).style.background =
                        'hsl(var(--surface-elevated))'
                      ;(e.currentTarget as HTMLElement).style.boxShadow =
                        'var(--shadow-xs)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (notif.isRead) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    }
                  }}
                >

                  {/* ── Avatar + type badge ───────────────────────────── */}
                  <div className="relative shrink-0 mt-0.5">
                    <Avatar
                      src={notif.sender?.avatar}
                      name={notif.sender?.displayName}
                      size="md"
                    />
                    {/* Type icon — floating glass badge */}
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
                      {typeIcon[notif.type] || '🔔'}
                    </span>
                  </div>

                  {/* ── Message content ───────────────────────────────── */}
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize:   'var(--text-sm)',
                        lineHeight: 1.55,
                        color:      'hsl(var(--foreground))',
                        fontWeight: notif.isRead ? 300 : 500,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {notif.message}
                    </p>
                    <p
                      style={{
                        fontSize:   'var(--text-xs)',
                        color:      'hsl(var(--muted-foreground))',
                        fontWeight: 300,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* ── Unread indicator — restrained red dot ─────────── */}
                  {!notif.isRead && (
                    <motion.div
                      className="shrink-0 mt-2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.032 + 0.18, duration: 0.28, ease }}
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

                {/* Feather divider — near-invisible, spatial only */}
                {i < notifications.length - 1 && (
                  <div className="divider" style={{ marginInline: '1rem' }} />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}