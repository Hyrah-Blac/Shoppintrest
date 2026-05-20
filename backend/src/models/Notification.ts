import mongoose, { Document, Schema } from 'mongoose'

export interface INotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId
  sender?: mongoose.Types.ObjectId
  type: string
  message: string
  link?: string
  isRead: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['follow', 'save', 'order_update', 'message', 'review', 'collection_save'],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
)

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

export default mongoose.model<INotificationDocument>('Notification', NotificationSchema)