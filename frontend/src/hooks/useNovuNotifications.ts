/**
 * useNovuNotifications
 *
 * A thin bridge hook that syncs Novu's feed state with our Zustand store.
 *
 * Architecture:
 *   MongoDB  → historical source  (fetched via /api/notifications on mount)
 *   Novu     → realtime delivery  (pushed via NovuProvider socket bridge)
 *   Zustand  → UI state           (single source of truth for the component)
 *
 * This hook wires Novu's mark-read API calls so that read state stays in sync
 * between MongoDB (via our REST endpoints) and Novu's own feed tracking.
 */

'use client'

import { useNotifications as useNovuFeed } from '@novu/notification-center'
import { useCallback } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'

export function useNovuNotifications() {
  const {
    markNotificationAsRead: novuMarkOne,
    markAllNotificationsAsRead: novuMarkAll,
  } = useNovuFeed()

  const {
    notifications,
    unreadCount,
    markOneRead:  storeMarkOne,
    markAllRead:  storeMarkAll,
    fetchNotifications,
  } = useNotificationStore()

  /**
   * Mark a single notification read in both systems.
   * Optimistic UI update fires immediately (store); REST + Novu run async.
   */
  const markOneRead = useCallback(
    async (id: string, novuMessageId?: string) => {
      // 1. Optimistic store update — UI responds instantly
      storeMarkOne(id)

      // 2. Persist to MongoDB via our REST endpoint
      fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(
        err => console.error('[markOneRead] MongoDB sync failed', err),
      )

      // 3. Sync Novu's own read-state (affects Novu analytics / digest logic)
      if (novuMessageId) {
        novuMarkOne(novuMessageId).catch(
          err => console.error('[markOneRead] Novu sync failed', err),
        )
      }
    },
    [storeMarkOne, novuMarkOne],
  )

  /**
   * Mark all notifications read in both systems.
   */
  const markAllRead = useCallback(async () => {
    // 1. Optimistic
    storeMarkAll()

    // 2. MongoDB
    fetch('/api/notifications/read-all', { method: 'PATCH' }).catch(
      err => console.error('[markAllRead] MongoDB sync failed', err),
    )

    // 3. Novu
    novuMarkAll().catch(
      err => console.error('[markAllRead] Novu sync failed', err),
    )
  }, [storeMarkAll, novuMarkAll])

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markOneRead,
    markAllRead,
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape stored in Zustand and rendered by the existing UI */
export interface AppNotification {
  _id:       string
  message:   string
  link:      string
  type:      string
  isRead:    boolean
  createdAt: string
  sender?: {
    displayName: string
    avatar?:     string
    username?:   string
  }
  /** Novu message id — present on realtime-pushed notifications */
  novuMessageId?: string
}

/** Payload shape we send inside every Novu workflow trigger */
export interface NovuTriggerPayload {
  notifId:      string   // MongoDB _id
  senderName:   string
  senderAvatar: string
  message:      string
  link:         string
  type:         string
  createdAt:    string
}

/** Novu workflow identifiers */
export type NovuWorkflowId =
  | 'new-follower'
  | 'pin-saved'
  | 'order-updated'
  | 'new-message'
  | 'new-review'
  | 'collection-saved'