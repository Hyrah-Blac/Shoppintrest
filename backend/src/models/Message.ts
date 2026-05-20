import mongoose, { Document, Schema } from 'mongoose'

export interface IConversationDocument extends Document {
  participants: mongoose.Types.ObjectId[]
  lastMessage?: mongoose.Types.ObjectId
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
)

ConversationSchema.index({ participants: 1 })

export const Conversation = mongoose.model<IConversationDocument>(
  'Conversation',
  ConversationSchema
)

export interface IMessageDocument extends Document {
  conversation: mongoose.Types.ObjectId
  sender: mongoose.Types.ObjectId
  content: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  reactions: { user: mongoose.Types.ObjectId; emoji: string }[]
  isRead: boolean
  createdAt: Date
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 5000 },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video'] },
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String },
      },
    ],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
)

MessageSchema.index({ conversation: 1, createdAt: 1 })

export const Message = mongoose.model<IMessageDocument>('Message', MessageSchema)