import { create } from 'zustand'
import { SavedFolder } from '@/types/savedFolder'
import { apiClient }   from '@/lib/api'

interface Product {
  _id:          string
  title:        string
  price:        number
  comparePrice?: number
  brand?:       string
  isFeatured?:  boolean
  totalInventory?: number
  rating?:      number
  reviewCount?: number
  images?:      { url: string; alt?: string }[]
  variants?:    { size: string }[]
}

interface SavedState {
  savedProductIds: Set<string>
  savedProducts:   Product[]
  folders:         SavedFolder[]
  isLoaded:        boolean

  loadSaved:     () => Promise<void>
  saveProduct:   (productId: string, folderId?: string) => Promise<void>
  unsaveProduct: (productId: string) => Promise<void>
  moveProduct:   (productId: string, fromSlug: string, toSlug: string) => Promise<void>
  createFolder:  (name: string) => Promise<SavedFolder>
  renameFolder:  (slug: string, newName: string) => Promise<void>
  deleteFolder:  (slug: string) => Promise<void>
  isSaved:       (productId: string) => boolean
}

export const useSavedStore = create<SavedState>((set, get) => ({
  savedProductIds: new Set(),
  savedProducts:   [],
  folders:         [],
  isLoaded:        false,

  loadSaved: async () => {
    const [savedRes, foldersRes] = await Promise.all([
      apiClient.saved.getAll(),
      apiClient.saved.getFolders(),
    ])
    const products = (savedRes.data.data as Product[]) ?? []
    const ids      = products.map(p => p._id)
    set({
      savedProducts:   products,
      savedProductIds: new Set(ids),
      folders:         foldersRes.data.data ?? [],
      isLoaded:        true,
    })
  },

  saveProduct: async (productId, folderId) => {
    await apiClient.saved.save(productId, folderId)
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

  moveProduct: async (productId, fromSlug, toSlug) => {
    await apiClient.saved.move(productId, fromSlug, toSlug)
  },

  createFolder: async (name) => {
    const res    = await apiClient.saved.createFolder(name)
    const folder = res.data.data as SavedFolder
    set(s => ({ folders: [...s.folders, folder] }))
    return folder
  },

  renameFolder: async (slug, newName) => {
    const res     = await apiClient.saved.renameFolder(slug, newName)
    const updated = res.data.data as SavedFolder
    set(s => ({
      folders: s.folders.map(f => f.slug === slug ? updated : f),
    }))
  },

  deleteFolder: async (slug) => {
    await apiClient.saved.deleteFolder(slug)
    set(s => ({ folders: s.folders.filter(f => f.slug !== slug) }))
  },

  isSaved: (productId) => get().savedProductIds.has(productId),
}))