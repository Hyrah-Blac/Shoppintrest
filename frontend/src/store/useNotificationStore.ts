import { create } from 'zustand'
import { apiClient } from '@/lib/api'

interface NotificationStore {
  notifications: any[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (notification: any) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const { data } = await apiClient.notifications.getAll()
    set({ notifications: data.data })
  },

  fetchUnreadCount: async () => {
    const { data } = await apiClient.notifications.getUnreadCount()
    set({ unreadCount: data.data.count })
  },

  markAllRead: async () => {
    await apiClient.notifications.markAllRead()
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }))
  },

  addNotification: (notification) => {
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    }))
  },
}))