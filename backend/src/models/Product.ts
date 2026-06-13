import mongoose, { Document, Schema } from 'mongoose'

export interface IProductDocument extends Document {
  title: string
  description: string
  price: number
  comparePrice?: number
  images: { url: string; publicId: string; alt?: string }[]
  category: string
  tags: string[]
  brand: string
  variants: { size: string; inventory: number; sku: string }[]
  totalInventory: number
  isFeatured: boolean
  isPublished: boolean
  rating: number
  reviewCount: number
  saves: number
  seller: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProductDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        alt: { type: String },
      },
    ],
    category: {
      type: String,
      required: true,
      enum: [
        'womenswear',
        'menswear',
        'accessories',
        'shoes',
        'bags',
        'jewelry',
        'beauty',
        'home',
      ],
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    brand: { type: String, required: true, trim: true },
    variants: [
      {
        size: { type: String, required: true },
        inventory: { type: Number, required: true, min: 0, default: 0 },
        sku: { type: String, required: true },
      },
    ],
    totalInventory: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

ProductSchema.index({ title: 'text', description: 'text', tags: 'text', brand: 'text' })
ProductSchema.index({ category: 1, isPublished: 1 })
ProductSchema.index({ isFeatured: 1, isPublished: 1 })
ProductSchema.index({ price: 1 })
ProductSchema.index({ createdAt: -1 })

// Recompute totalInventory whenever variants change via .save()
ProductSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.totalInventory = this.variants.reduce((sum, v) => sum + v.inventory, 0)
  } else if (this.isModified('variants')) {
    // variants explicitly cleared to an empty array
    this.totalInventory = 0
  }
  next()
})

// Recompute totalInventory whenever variants change via findByIdAndUpdate,
// findOneAndUpdate, updateOne, or updateMany. pre('save') does not fire for
// these query-based updates, so without this hook totalInventory goes stale
// (e.g. admin edits to a product's stock not reflecting on product cards).
ProductSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const update = this.getUpdate() as any
  if (!update) return next()

  // variants may be set directly or via $set
  const variants = update.variants ?? update.$set?.variants

  if (Array.isArray(variants)) {
    const totalInventory = variants.reduce(
      (sum: number, v: { inventory: number }) => sum + (v.inventory || 0),
      0
    )
    if (update.$set) {
      update.$set.totalInventory = totalInventory
    } else {
      update.totalInventory = totalInventory
    }
  }

  next()
})

export default mongoose.model<IProductDocument>('Product', ProductSchema)