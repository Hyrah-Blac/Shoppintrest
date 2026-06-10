console.log("USER ROUTES REGISTERED");

import { Router } from 'express'
import {
  getMe,
  updateMe,
  getUserByUsername,
  toggleSaveProduct,
  getSavedProducts,
  searchUsers,
  syncClerkUser,
} from '../controllers/user.controller'
import { protect, optionalAuth } from '../middleware/auth'
import { authLimiter } from '../config/rateLimiter'

const router = Router()

// ─── SYNC — no protect, user doesn't exist in MongoDB yet ────────────────────
router.post('/clerk/sync', authLimiter, syncClerkUser)

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
router.get('/search', searchUsers)

// ─── /me ROUTES (must be before /:username) ──────────────────────────────────
router.get('/me',                  authLimiter, protect, getMe)
router.patch('/me',                protect,     updateMe)
router.get('/me/saved',            protect,     getSavedProducts)
router.post('/me/save/:productId', protect,     toggleSaveProduct)

// ─── DYNAMIC /:username ROUTES LAST ──────────────────────────────────────────
router.get('/:username', optionalAuth, getUserByUsername)

export default router