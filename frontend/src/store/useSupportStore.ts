import { create } from 'zustand'
import { SupportTicket, TicketCategory } from '@/types/support'

interface SupportState {
  tickets:    SupportTicket[]
  isLoaded:   boolean
  loadTickets: () => Promise<void>
  createTicket: (category: TicketCategory, orderId?: string) => Promise<SupportTicket>
}

export const useSupportStore = create<SupportState>((set, get) => ({
  tickets:  [],
  isLoaded: false,

  loadTickets: async () => {
    try {
      const res  = await fetch('/api/support/tickets', { credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Failed to load tickets')
      set({ tickets: json.data ?? [], isLoaded: true })
    } catch {
      set({ isLoaded: true })
    }
  },

  createTicket: async (category, orderId) => {
    const res  = await fetch('/api/support/tickets', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ category, ...(orderId ? { orderId } : {}) }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? 'Failed to create ticket')

    const ticket: SupportTicket = json.data
    set({ tickets: [ticket, ...get().tickets] })
    return ticket
  },
}))