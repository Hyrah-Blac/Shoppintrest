import mongoose, { Document, Schema } from 'mongoose'

export interface IOrderDocument extends Document {
  user: mongoose.Types.ObjectId
  items: {
    product: mongoose.Types.ObjectId
    title: string
    image: string
    price: number
    size: string
    quantity: number
  }[]
  shippingAddress: {
    fullName: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  status: string
  // M-Pesa fields
  mpesaCheckoutRequestId?: string
  mpesaMerchantRequestId?: string
  mpesaReceiptNumber?: string
  mpesaPhone?: string
  mpesaResultCode?: number
  mpesaResultDesc?: string
  isPaid: boolean
  paidAt?: Date
  isDelivered: boolean
  deliveredAt?: Date
  trackingNumber?: string
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        title: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'awaiting_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    // M-Pesa
    mpesaCheckoutRequestId: { type: String, index: true },
    mpesaMerchantRequestId: { type: String },
    mpesaReceiptNumber: { type: String },
    mpesaPhone: { type: String },
    mpesaResultCode: { type: Number },
    mpesaResultDesc: { type: String },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    trackingNumber: { type: String },
  },
  { timestamps: true }
)

OrderSchema.index({ user: 1, createdAt: -1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ mpesaCheckoutRequestId: 1 })

export default mongoose.model<IOrderDocument>('Order', OrderSchema)