export type TicketStatus   = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketCategory = 'order' | 'return' | 'refund' | 'account' | 'other'
export type TicketPriority = 'low' | 'normal' | 'high'

export interface SupportTicket {
  _id:             string
  userId:          string
  streamChannelId: string
  category:        TicketCategory
  orderId?:        string
  status:          TicketStatus
  priority:        TicketPriority
  agentId?:        string
  resolvedAt?:     string
  createdAt:       string
  updatedAt:       string
}

export interface SupportTicketPreview {
  ticketId:           string
  streamChannelId:    string
  category:           TicketCategory
  status:             TicketStatus
  lastMessage?:       string
  lastMessageAt?:     string
  unreadCount?:       number
  lastMessageUserId?: string
}