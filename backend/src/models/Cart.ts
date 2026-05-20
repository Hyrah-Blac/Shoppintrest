import mongoose, { Document, Schema } from 'mongoose'

export interface ICartDocument extends Document {
  user: mongoose.Types.ObjectId
  items: {
    product: mongoose.Types.ObjectId
    size: string
    quantity: number
  }[]
  updatedAt: Date
}

const CartSchema = new Schema<ICartDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1, max: 10 },
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.model<ICartDocument>('Cart', CartSchema)