import { create } from 'zustand'
import type { AppNotification } from '@/hooks/useNovuNotifications'
import api from '@/lib/api'

interface NotificationState {
  notifications: AppNotification[]
  unreadCount:   number
  isLoading:     boolean
  fetchNotifications:          () => Promise<void>
  markOneRead:                 (id: string) => void
  markAllRead:                 () => void
  prependRealtimeNotification: (notif: AppNotification) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount:   0,
  isLoading:     false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const res   = await api.get('/api/notifications')
      const items: AppNotification[] = res.data?.data ?? []
      set({
        notifications: items,
        unreadCount:   items.filter(n => !n.isRead).length,
        isLoading:     false,
      })
    } catch (err) {
      console.error('[useNotificationStore] fetchNotifications failed', err)
      set({ isLoading: false })
    }
  },

  markOneRead: (id) =>
    set(state => {
      const notifications = state.notifications.map(n =>
        n._id === id ? { ...n, isRead: true } : n,
      )
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length,
      }
    }),

  markAllRead: () =>
    set(() => ({
      notifications: [],
      unreadCount:   0,
    })),

  prependRealtimeNotification: (notif) =>
    set(state => {
      const alreadyExists = state.notifications.some(n => n._id === notif._id)
      if (alreadyExists) return state
      const notifications = [notif, ...state.notifications]
      return {
        notifications,
        unreadCount: state.unreadCount + 1,
      }
    }),
}))