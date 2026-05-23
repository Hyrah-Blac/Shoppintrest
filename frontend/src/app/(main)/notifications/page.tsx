'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, Check } from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'

const typeIcon: Record<string, string> = {
  follow:           '👤',
  save:             '♡',
  order_update:     '📦',
  message:          '💬',
  review:           '★',
  collection_save:  '🗂',
}

export default function NotificationsPage() {
  const {
    notifications,
    fetchNotifications,
    markAllRead,
    unreadCount,
  } = useNotificationStore()

  useEffect(() => { fetchNotifications() }, [])

  return (
    <div className="min-h-screen">

      {/* ── Header ── */}
      <div
        className="border-b"
        style={{
          background:  'hsl(var(--surface))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {/* Pinterest red top accent */}
        <div
          className="h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.4), transparent)',
          }}
        />

        <div className="container-narrow py-8">
          <div className="flex items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
                style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
              >
                Notifications
              </h1>

              {/* Accent underline */}
              <motion.div
                className="mt-2 h-[2px] w-8 rounded-full"
                style={{ background: 'hsl(var(--accent))' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              />

              {unreadCount > 0 && (
                <p
                  className="text-sm mt-1"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {unreadCount} unread
                </p>
              )}
            </motion.div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="btn-ghost gap-2 text-sm"
              >
                <Check size={13} />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container-narrow py-6">
        {notifications.length === 0 ? (

          /* Empty state */
          <div className="py-24 text-center">
            <div
              className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center
                         justify-center mx-auto mb-5 border shadow-[var(--shadow-card)]"
              style={{
                background:  'hsl(var(--surface))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <Bell size={24} style={{ color: 'hsl(var(--muted))' }} />
            </div>
            <p
              className="font-medium mb-1"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              No notifications yet
            </p>
            <p
              className="text-sm"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
            >
              When someone interacts with you, it will appear here
            </p>
          </div>

        ) : (

          /* Notification list */
          <div className="space-y-1">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay:    i * 0.03,
                  duration: 0.35,
                  ease:     [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={notif.link || '#'}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-[var(--radius-lg)]',
                    'transition-all duration-[var(--duration-hover)]',
                    !notif.isRead
                      ? 'bg-[hsl(var(--accent-muted))]'
                      : 'hover:bg-[hsl(var(--surface))]'
                  )}
                >
                  {/* Avatar + type icon */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={notif.sender?.avatar}
                      name={notif.sender?.displayName}
                      size="md"
                    />
                    <span
                      className="absolute -bottom-1 -right-1 text-sm
                                 leading-none select-none"
                    >
                      {typeIcon[notif.type] || '🔔'}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-snug"
                      style={{
                        color:      'hsl(var(--foreground))',
                        fontWeight: notif.isRead ? 400 : 500,
                      }}
                    >
                      {notif.message}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'hsl(var(--muted))' }}
                    >
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot — Pinterest red */}
                  {!notif.isRead && (
                    <div
                      className="w-2 h-2 rounded-full shrink-0 mt-2
                                 shadow-[var(--shadow-red)]"
                      style={{ background: 'hsl(var(--accent))' }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}