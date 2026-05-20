// ─── USER ───────────────────────────────────────────────────────────────────

export interface IUser {
  _id: string
  clerkId: string
  username: string
  email: string
  displayName: string
  avatar?: string
  bio?: string
  website?: string
  role: 'user' | 'admin' | 'moderator'
  followers: string[]
  following: string[]
  savedProducts: string[]
  collections: string[]
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── PRODUCT ─────────────────────────────────────────────────────────────────

export interface IProductImage {
  url: string
  publicId: string
  alt?: string
}

export interface IProductVariant {
  size: string
  inventory: number
  sku: string
}

export interface IProduct {
  _id: string
  title: string
  description: string
  price: number
  comparePrice?: number
  images: IProductImage[]
  category: ProductCategory
  tags: string[]
  brand: string
  variants: IProductVariant[]
  totalInventory: number
  isFeatured: boolean
  isPublished: boolean
  rating: number
  reviewCount: number
  saves: number
  seller: string
  createdAt: Date
  updatedAt: Date
}

export type ProductCategory =
  | 'womenswear'
  | 'menswear'
  | 'accessories'
  | 'shoes'
  | 'bags'
  | 'jewelry'
  | 'beauty'
  | 'home'

// ─── ORDER ───────────────────────────────────────────────────────────────────

export interface IOrderItem {
  product: string
  title: string
  image: string
  price: number
  size: string
  quantity: number
}

export interface IShippingAddress {
  fullName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface IOrder {
  _id: string
  user: string
  items: IOrderItem[]
  shippingAddress: IShippingAddress
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  status: OrderStatus
  stripePaymentIntentId: string
  stripeChargeId?: string
  isPaid: boolean
  paidAt?: Date
  isDelivered: boolean
  deliveredAt?: Date
  trackingNumber?: string
  createdAt: Date
  updatedAt: Date
}

// ─── CART ────────────────────────────────────────────────────────────────────

export interface ICartItem {
  product: IProduct
  size: string
  quantity: number
}

export interface ICart {
  _id: string
  user: string
  items: ICartItem[]
  updatedAt: Date
}

// ─── COLLECTION ──────────────────────────────────────────────────────────────

export interface ICollection {
  _id: string
  user: string
  title: string
  description?: string
  coverImage?: string
  products: string[]
  isPrivate: boolean
  saves: number
  createdAt: Date
  updatedAt: Date
}

// ─── REVIEW ──────────────────────────────────────────────────────────────────

export interface IReview {
  _id: string
  product: string
  user: string
  rating: number
  title: string
  body: string
  images?: string[]
  isVerifiedPurchase: boolean
  helpful: number
  createdAt: Date
}

// ─── MESSAGE ─────────────────────────────────────────────────────────────────

export interface IMessage {
  _id: string
  conversation: string
  sender: string
  content: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  reactions: IReaction[]
  isRead: boolean
  createdAt: Date
}

export interface IReaction {
  user: string
  emoji: string
}

export interface IConversation {
  _id: string
  participants: string[]
  lastMessage?: IMessage
  updatedAt: Date
}

// ─── NOTIFICATION ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'follow'
  | 'save'
  | 'order_update'
  | 'message'
  | 'review'
  | 'collection_save'

export interface INotification {
  _id: string
  recipient: string
  sender?: string
  type: NotificationType
  message: string
  link?: string
  isRead: boolean
  createdAt: Date
}

// ─── API RESPONSES ───────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string>
  statusCode: number
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
}
