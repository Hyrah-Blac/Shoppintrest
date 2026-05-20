import mongoose, { Document, Schema } from 'mongoose'

export interface ICollectionDocument extends Document {
  user: mongoose.Types.ObjectId
  title: string
  description?: string
  coverImage?: string
  products: mongoose.Types.ObjectId[]
  isPrivate: boolean
  saves: number
  createdAt: Date
  updatedAt: Date
}

const CollectionSchema = new Schema<ICollectionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    coverImage: { type: String },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    isPrivate: { type: Boolean, default: false },
    saves: { type: Number, default: 0 },
  },
  { timestamps: true }
)

CollectionSchema.index({ user: 1 })
CollectionSchema.index({ isPrivate: 1 })

export default mongoose.model<ICollectionDocument>('Collection', CollectionSchema)