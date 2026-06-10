import mongoose, { Document, Schema } from 'mongoose'

export type TicketStatus   = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketCategory = 'order' | 'return' | 'refund' | 'account' | 'other'
export type TicketPriority = 'low' | 'normal' | 'high'

export interface ISupportTicket extends Document {
  userId:          mongoose.Types.ObjectId
  streamChannelId: string
  category:        TicketCategory
  orderId?:        mongoose.Types.ObjectId
  status:          TicketStatus
  priority:        TicketPriority
  agentId?:        mongoose.Types.ObjectId
  resolvedAt?:     Date
  createdAt:       Date
  updatedAt:       Date
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    streamChannelId: { type: String, required: true, unique: true },
    category:        { type: String, enum: ['order','return','refund','account','other'], required: true },
    orderId:         { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    status:          { type: String, enum: ['open','pending','resolved','closed'], default: 'open' },
    priority:        { type: String, enum: ['low','normal','high'], default: 'normal' },
    agentId:         { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt:      { type: Date, default: null },
  },
  { timestamps: true }
)

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema)