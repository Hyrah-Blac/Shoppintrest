import mongoose, { Document, Schema } from 'mongoose'

export interface ISavedFolder extends Document {
  userId:      mongoose.Types.ObjectId
  name:        string
  slug:        string
  isDefault:   boolean
  products:    mongoose.Types.ObjectId[]
  coverImage?: string
  createdAt:   Date
  updatedAt:   Date
}

const SavedFolderSchema = new Schema<ISavedFolder>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:      { type: String, required: true, trim: true, maxlength: 50 },
    slug:      { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    products:  [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    coverImage:{ type: String },
  },
  { timestamps: true }
)

SavedFolderSchema.index({ userId: 1, slug: 1 }, { unique: true })

export default mongoose.model<ISavedFolder>('SavedFolder', SavedFolderSchema)