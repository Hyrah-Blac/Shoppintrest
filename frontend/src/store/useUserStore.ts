import { create } from 'zustand'
import { apiClient } from '@/lib/api'

interface UserStore {
  user: any | null
  isLoading: boolean
  isAuthenticated: boolean
  fetchUser: () => Promise<void>
  updateUser: (data: any) => Promise<void>
  setUser: (user: any) => void
  clearUser: () => void
  toggleSaveProduct: (productId: string) => Promise<void>
  isSaved: (productId: string) => boolean
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  fetchUser: async () => {
  const { user, isLoading } = get()
  if (user || isLoading) return // already loaded or in flight — skip duplicate fetch

  try {
    set({ isLoading: true })
    const { data } = await apiClient.users.getMe()
    set({ user: data.data, isAuthenticated: true })
  } catch {
    set({ user: null, isAuthenticated: false })
  } finally {
    set({ isLoading: false })
  }
},
  updateUser: async (userData) => {
    const { data } = await apiClient.users.updateMe(userData)
    set({ user: data.data })
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearUser: () => set({ user: null, isAuthenticated: false }),

  toggleSaveProduct: async (productId) => {
    const { data } = await apiClient.users.saveProduct(productId)
    const { user } = get()
    if (!user) return

    const isSaved = data.data.isSaved
    const savedProducts = isSaved
      ? [...user.savedProducts, productId]
      : user.savedProducts.filter((id: string) => id !== productId)

    set({ user: { ...user, savedProducts } })
  },

  isSaved: (productId) => {
    const { user } = get()
    return user?.savedProducts?.includes(productId) ?? false
  },
}))