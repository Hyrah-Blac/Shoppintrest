import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── TOKEN GETTER ─────────────────────────────────────────────────────────────
let _getToken: (() => Promise<string | null>) | null = null

export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn
}

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      if (_getToken) {
        const token = await _getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (error) {
      console.error('Failed to attach Clerk token:', error)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/sign-in')
      ) {
        window.location.href = '/sign-in'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─── API HELPERS ─────────────────────────────────────────────────────────────

export const apiClient = {
  // Products
  products: {
    getAll: (params?: Record<string, any>) =>
      api.get('/api/products', { params }),
    getOne: (id: string) =>
      api.get(`/api/products/${id}`),
    getFeatured: () =>
      api.get('/api/products/featured'),
    getTrending: () =>
      api.get('/api/products/trending'),
    getRelated: (id: string) =>
      api.get(`/api/products/${id}/related`),
    search: (q: string) =>
      api.get('/api/products/search', { params: { q } }),
    create: (data: any) =>
      api.post('/api/products', data),
    update: (id: string, data: any) =>
      api.patch(`/api/products/${id}`, data),
    delete: (id: string) =>
      api.delete(`/api/products/${id}`),
  },

  // Users
  users: {
  getMe: () => api.get('/api/users/me'),
  updateMe: (data: any) => api.patch('/api/users/me', data),
  getByUsername: (username: string) => api.get(`/api/users/${username}`),
  follow: (userId: string) => api.post(`/api/users/${userId}/follow`),
  getSaved: (params?: any) => api.get('/api/users/me/saved', { params }),  // ← fix this
  saveProduct: (productId: string) => api.post(`/api/users/me/save/${productId}`),
  search: (q: string) => api.get('/api/users/search', { params: { q } }),
  getFollowers: (username: string) => api.get(`/api/users/${username}/followers`),
  getFollowing: (username: string) => api.get(`/api/users/${username}/following`),
},

  // Cart
  cart: {
    get: () =>
      api.get('/api/cart'),
    add: (data: { productId: string; size: string; quantity?: number }) =>
      api.post('/api/cart', data),
    update: (productId: string, size: string, data: { quantity: number }) =>
      api.patch(`/api/cart/${productId}/${size}`, data),
    remove: (productId: string, size: string) =>
      api.delete(`/api/cart/${productId}/${size}`),
    clear: () =>
      api.delete('/api/cart'),
  },

  // Orders
  orders: {
    initiateMpesa: (data: { shippingAddress: any; phone: string }) =>
      api.post('/api/orders/mpesa/initiate', data),
    checkStatus: (orderId: string) =>
      api.get(`/api/orders/mpesa/status/${orderId}`),
    getMyOrders: (params?: any) =>
      api.get('/api/orders/my-orders', { params }),
    getOne: (id: string) =>
      api.get(`/api/orders/my-orders/${id}`),
  },

  // Collections
  collections: {
    getAll: (params?: any) =>
      api.get('/api/collections', { params }),
    getOne: (id: string) =>
      api.get(`/api/collections/${id}`),
    create: (data: any) =>
      api.post('/api/collections', data),
    update: (id: string, data: any) =>
      api.patch(`/api/collections/${id}`, data),
    delete: (id: string) =>
      api.delete(`/api/collections/${id}`),
    toggleProduct: (id: string, productId: string) =>
      api.post(`/api/collections/${id}/products`, { productId }),
  },

  // Reviews
  reviews: {
    getForProduct: (productId: string, params?: any) =>
      api.get(`/api/reviews/product/${productId}`, { params }),
    create: (productId: string, data: any) =>
      api.post(`/api/reviews/product/${productId}`, data),
    delete: (id: string) =>
      api.delete(`/api/reviews/${id}`),
    markHelpful: (id: string) =>
      api.patch(`/api/reviews/${id}/helpful`),
  },

  // Messages
  messages: {
    getConversations: () =>
      api.get('/api/messages/conversations'),
    getOrCreate: (userId: string) =>
      api.get(`/api/messages/conversations/user/${userId}`),
    getMessages: (conversationId: string, params?: any) =>
      api.get(`/api/messages/${conversationId}`, { params }),
    send: (conversationId: string, data: any) =>
      api.post(`/api/messages/${conversationId}`, data),
    react: (messageId: string, emoji: string) =>
      api.post(`/api/messages/${messageId}/react`, { emoji }),
  },

  // Notifications
  notifications: {
    getAll: () =>
      api.get('/api/notifications'),
    getUnreadCount: () =>
      api.get('/api/notifications/unread-count'),
    markAllRead: () =>
      api.patch('/api/notifications/read-all'),
    markOneRead: (id: string) =>
      api.patch(`/api/notifications/${id}/read`),
  },

  // Upload
  upload: {
    image: (file: File, folder?: string) => {
      const form = new FormData()
      form.append('image', file)
      return api.post(
        `/api/upload/image${folder ? `?folder=${folder}` : ''}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    },
    images: (files: File[], folder?: string) => {
      const form = new FormData()
      files.forEach((file) => form.append('images', file))
      return api.post(
        `/api/upload/images${folder ? `?folder=${folder}` : ''}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    },
    delete: (publicId: string) =>
      api.delete('/api/upload/image', { data: { publicId } }),
  },

  // Admin
  admin: {
    getStats: () =>
      api.get('/api/admin/stats'),
    getUsers: (params?: any) =>
      api.get('/api/admin/users', { params }),
    toggleUserActive: (id: string) =>
      api.patch(`/api/admin/users/${id}/toggle-active`),
    updateUserRole: (id: string, role: string) =>
      api.patch(`/api/admin/users/${id}/role`, { role }),
    getOrders: (params?: any) =>
      api.get('/api/orders', { params }),
    updateOrderStatus: (id: string, data: any) =>
      api.patch(`/api/orders/${id}/status`, data),
  },
}