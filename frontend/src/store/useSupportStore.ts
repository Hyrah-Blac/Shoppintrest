import { create } from 'zustand'
import { apiClient } from '@/lib/api'
import { SupportTicket, TicketCategory } from '@/types/support'

interface SupportState {
  tickets:    SupportTicket[]
  isLoaded:   boolean
  loadTickets: () => Promise<void>
  createTicket: (category: TicketCategory, orderId?: string) => Promise<SupportTicket>
  closeTicket: (id: string) => Promise<void>
}

export const useSupportStore = create<SupportState>((set, get) => ({
  tickets:  [],
  isLoaded: false,

  loadTickets: async () => {
    try {
      const res = await apiClient.support.getTickets()
      set({ tickets: res.data?.data ?? [], isLoaded: true })
    } catch {
      set({ isLoaded: true })
    }
  },

  createTicket: async (category, orderId) => {
    const res = await apiClient.support.createTicket({
      category,
      ...(orderId ? { orderId } : {}),
    })
    const ticket: SupportTicket = res.data?.data
    set({ tickets: [ticket, ...get().tickets] })
    return ticket
  },

  closeTicket: async (id) => {
    await apiClient.support.closeTicket(id)
    set({
      tickets: get().tickets.map(t =>
        t._id === id ? { ...t, status: 'closed' } : t
      ),
    })
  },
}))