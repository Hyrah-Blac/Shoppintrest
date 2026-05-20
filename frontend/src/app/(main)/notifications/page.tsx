'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, Check } from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime, cn } from '@/lib/utils'

const typeIcon: Record<string, string> = {
  follow: '👤',
  save: '♡',
  order_update: '📦',
  message: '💬',
  review: '★',
  collection_save: '🗂',
}

export default function NotificationsPage() {
  const {
    notifications,
    fetchNotifications,
    markAllRead,
    unreadCount,
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-surface">
        <div className="container-narrow py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Check size={13} />}
                onClick={markAllRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container-narrow py-6">
        {notifications.length === 0 ? (
          <div className="py-24 text-center">
            <Bell size={36} className="text-muted mx-auto mb-4" />
            <p className="font-medium text-foreground mb-1">
              No notifications yet
            </p>
            <p className="text-sm text-muted">
              When someone interacts with you, it will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={notif.link || '#'}
                  className={cn(
                    `flex items-start gap-4 p-4 rounded-2xl transition-all
                     duration-200 hover:bg-surface`,
                    !notif.isRead && 'bg-accent/50'
                  )}
                >
                  {/* Icon/Avatar */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={notif.sender?.avatar}
                      name={notif.sender?.displayName}
                      size="md"
                    />
                    <span className="absolute -bottom-1 -right-1 text-sm">
                      {typeIcon[notif.type] || '🔔'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        !notif.isRead
                          ? 'font-medium text-foreground'
                          : 'text-foreground'
                      )}
                    >
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-foreground shrink-0 mt-2" />
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