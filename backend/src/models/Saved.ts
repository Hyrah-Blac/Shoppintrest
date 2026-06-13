import mongoose, { Document, Schema } from 'mongoose'

export interface ISaved extends Document {
  userId:      mongoose.Types.ObjectId
  name:        string
  slug:        string
  isDefault:   boolean
  products:    mongoose.Types.ObjectId[]
  coverImage?: string
  createdAt:   Date
  updatedAt:   Date
}

const SavedSchema = new Schema<ISaved>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:       { type: String, required: true, trim: true, maxlength: 50 },
    slug:       { type: String, required: true, trim: true },
    isDefault:  { type: Boolean, default: false },
    products:   [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    coverImage: { type: String },
  },
  { timestamps: true }
)

SavedSchema.index({ userId: 1, slug: 1 }, { unique: true })

export default mongoose.model<ISaved>('Saved', SavedSchema)