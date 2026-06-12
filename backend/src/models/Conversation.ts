import mongoose, { Document, Schema } from 'mongoose'

export interface IConversation extends Document {
  userId:          mongoose.Types.ObjectId
  streamChannelId: string
  createdAt:       Date
  updatedAt:       Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    streamChannelId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
)

export default mongoose.model<IConversation>('Conversation', ConversationSchema)