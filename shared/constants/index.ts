export const APP_NAME = 'Shoppintrest'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const PRODUCT_CATEGORIES = [
  'womenswear',
  'menswear',
  'accessories',
  'shoes',
  'bags',
  'jewelry',
  'beauty',
  'home',
] as const

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 24,
  MAX_LIMIT: 100,
} as const

export const CLOUDINARY = {
  CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  UPLOAD_PRESET: 'shoppintrest_products',
  QUALITY: 'auto',
  FORMAT: 'auto',
} as const

export const SHIPPING = {
  FREE_THRESHOLD: 200,
  STANDARD_COST: 15,
  EXPRESS_COST: 35,
  TAX_RATE: 0.08,
} as const

export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  PRODUCT: (id: string) => `/product/${id}`,
  PROFILE: (username: string) => `/profile/${username}`,
  COLLECTIONS: '/collections',
  COLLECTION: (id: string) => `/collections/${id}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  MESSAGES: '/messages',
  ADMIN: '/admin',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
} as const