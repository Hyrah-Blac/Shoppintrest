import { create } from 'zustand'
import { apiClient } from '@/lib/api'
import { Conversation } from '@/types/support.types'

interface SupportState {
  conversation: Conversation | null
  isLoaded:     boolean
  load:         () => Promise<Conversation>
}

export const useSupportStore = create<SupportState>((set, get) => ({
  conversation: null,
  isLoaded:     false,

  load: async () => {
    // Return cached conversation if already loaded
    if (get().isLoaded && get().conversation) return get().conversation!
    try {
      const res  = await apiClient.support.getConversation()
      const convo: Conversation = res.data?.data
      set({ conversation: convo, isLoaded: true })
      return convo
    } catch (err) {
      set({ isLoaded: true })
      throw err
    }
  },
}))