import mongoose, { Document, Schema } from 'mongoose'

export interface IReviewDocument extends Document {
  product: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  rating: number
  title: string
  body: string
  images?: string[]
  isVerifiedPurchase: boolean
  helpful: number
  createdAt: Date
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 150 },
    body: { type: String, required: true, maxlength: 2000 },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ReviewSchema.index({ product: 1, createdAt: -1 })
ReviewSchema.index({ user: 1 })
// One review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true })

export default mongoose.model<IReviewDocument>('Review', ReviewSchema)