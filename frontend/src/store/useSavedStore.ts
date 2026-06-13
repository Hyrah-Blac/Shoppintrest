import { create } from 'zustand'
import { apiClient } from '@/lib/api'

interface Product {
  _id:             string
  title:           string
  price:           number
  comparePrice?:   number
  brand?:          string
  isFeatured?:     boolean
  totalInventory?: number
  rating?:         number
  reviewCount?:    number
  images?:         { url: string; alt?: string }[]
  variants?:       { size: string }[]
}

interface SavedState {
  savedProductIds: Set<string>
  savedProducts:   Product[]
  isLoaded:        boolean

  loadSaved:     () => Promise<void>
  saveProduct:   (productId: string) => Promise<void>
  unsaveProduct: (productId: string) => Promise<void>
  isSaved:       (productId: string) => boolean
}

export const useSavedStore = create<SavedState>((set, get) => ({
  savedProductIds: new Set(),
  savedProducts:   [],
  isLoaded:        false,

  loadSaved: async () => {
    const res      = await apiClient.saved.getAll()
    const products = (res.data.data as Product[]) ?? []
    set({
      savedProducts:   products,
      savedProductIds: new Set(products.map(p => p._id)),
      isLoaded:        true,
    })
  },

  saveProduct: async (productId) => {
    await apiClient.saved.save(productId)
    set(s => ({ savedProductIds: new Set([...s.savedProductIds, productId]) }))
  },

  unsaveProduct: async (productId) => {
    await apiClient.saved.unsave(productId)
    set(s => {
      const next = new Set(s.savedProductIds)
      next.delete(productId)
      return {
        savedProductIds: next,
        savedProducts:   s.savedProducts.filter(p => p._id !== productId),
      }
    })
  },

  isSaved: (productId) => get().savedProductIds.has(productId),
}))