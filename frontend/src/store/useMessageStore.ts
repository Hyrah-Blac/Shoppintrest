// D:\$\shoppintrest\frontend\src\store\useMessageStore.ts

import { create } from 'zustand'

interface MessageStore {
  totalUnread:    number
  setTotalUnread: (count: number) => void
  incrementUnread: () => void
  resetUnread:    () => void
}

export const useMessageStore = create<MessageStore>((set) => ({
  totalUnread:    0,
  setTotalUnread: (count) => set({ totalUnread: count }),
  incrementUnread: () => set((s) => ({ totalUnread: s.totalUnread + 1 })),
  resetUnread:    () => set({ totalUnread: 0 }),
}))