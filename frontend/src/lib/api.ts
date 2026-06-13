// PATH: src/lib/api.ts

import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let _getToken: (() => Promise<string | null>) | null = null

export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn
}

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

export const apiClient = {
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

  users: {
    getMe: () => api.get('/api/users/me'),
    updateMe: (data: any) => api.patch('/api/users/me', data),
    getByUsername: (username: string) => api.get(`/api/users/${username}`),
    follow: (userId: string) => api.post(`/api/users/${userId}/follow`),
    getSaved: (params?: any) => api.get('/api/users/me/saved', { params }),
    saveProduct: (productId: string) => api.post(`/api/users/me/save/${productId}`),
    search: (q: string) => api.get('/api/users/search', { params: { q } }),
    getFollowers: (username: string) => api.get(`/api/users/${username}/followers`),
    getFollowing: (username: string) => api.get(`/api/users/${username}/following`),
  },

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

  chat: {
    getToken: () => api.get<{ data: { token: string } }>('/api/support/stream-token'),
  },

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

  saved: {
    getAll: () =>
      api.get('/api/saved'),
    save: (productId: string) =>
      api.post(`/api/saved/${productId}`),
    unsave: (productId: string) =>
      api.delete(`/api/saved/${productId}`),
  },

  support: {
    getConversation: () =>
      api.get('/api/support/conversation'),
    getStreamToken: () =>
      api.get('/api/support/stream-token'),
    admin: {
      getAllConversations: () =>
        api.get('/api/support/admin/conversations'),
      getConversation: (id: string) =>
        api.get(`/api/support/admin/conversations/${id}`),
      notifyReply: (id: string) =>
        api.post(`/api/support/admin/conversations/${id}/notify`),
    },
  },
}