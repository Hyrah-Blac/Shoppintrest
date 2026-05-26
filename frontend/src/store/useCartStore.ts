import { create } from 'zustand'
import { apiClient } from '@/lib/api'

interface CartItem {
  product: any
  size: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  isLoading: boolean
  total: number
  itemCount: number
  fetchCart: () => Promise<void>
  addItem: (productId: string, size: string, quantity?: number) => Promise<void>
  updateItem: (productId: string, size: string, quantity: number) => Promise<void>
  removeItem: (productId: string, size: string) => Promise<void>
  clearCart: () => Promise<void>
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  computeTotals: () => void
  reset: () => void
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,
  total: 0,
  itemCount: 0,

  computeTotals: () => {
    const { items } = get()
    const total = items.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    )
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    set({ total, itemCount })
  },

  fetchCart: async () => {
    try {
      set({ isLoading: true })
      const { data } = await apiClient.cart.get()
      set({ items: data.data?.items || [] })
      get().computeTotals()
    } catch {
      // unauthenticated users have no cart — stay empty
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (productId, size, quantity = 1) => {
    try {
      set({ isLoading: true })
      const { data } = await apiClient.cart.add({ productId, size, quantity })
      set({ items: data.data?.items || [], isOpen: true })
      get().computeTotals()
    } finally {
      set({ isLoading: false })
    }
  },

  updateItem: async (productId, size, quantity) => {
    const { data } = await apiClient.cart.update(productId, size, { quantity })
    set({ items: data.data?.items || [] })
    get().computeTotals()
  },

  removeItem: async (productId, size) => {
    const { data } = await apiClient.cart.remove(productId, size)
    set({ items: data.data?.items || [] })
    get().computeTotals()
  },

  clearCart: async () => {
    await apiClient.cart.clear()
    set({ items: [], total: 0, itemCount: 0 })
  },

  // Call this on sign-out so the next user gets a clean slate
  reset: () => set({ items: [], total: 0, itemCount: 0, isOpen: false }),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
}))