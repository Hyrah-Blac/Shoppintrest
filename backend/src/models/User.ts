import mongoose, { Document, Schema } from 'mongoose'

export interface IUserDocument extends Document {
  clerkId: string
  username: string
  email: string
  displayName: string
  avatar?: string
  bio?: string
  website?: string
  role: 'user' | 'admin' | 'moderator'
  followers: mongoose.Types.ObjectId[]
  following: mongoose.Types.ObjectId[]
  savedProducts: mongoose.Types.ObjectId[]
  collections: mongoose.Types.ObjectId[]
  isVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    avatar: { type: String },
    bio: { type: String, maxlength: 300 },
    website: { type: String },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    savedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

UserSchema.index({ username: 'text', displayName: 'text' })

export default mongoose.model<IUserDocument>('User', UserSchema)