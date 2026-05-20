import { Router } from 'express'
import {
  getMe,
  updateMe,
  getUserByUsername,
  toggleFollow,
  getFollowers,
  getFollowing,
  toggleSaveProduct,
  getSavedProducts,
  searchUsers,
  syncClerkUser,
} from '../controllers/user.controller'

import { protect, optionalAuth } from '../middleware/auth'

const router = Router()

// Clerk webhook
router.post('/clerk/sync', syncClerkUser)

// Users
router.get('/search', searchUsers)

router.get('/me', protect, getMe)
router.patch('/me', protect, updateMe)

router.get('/me/saved', protect, getSavedProducts)
router.post('/me/save/:productId', protect, toggleSaveProduct)

router.get('/:username', optionalAuth, getUserByUsername)

router.get('/:username/followers', getFollowers)
router.get('/:username/following', getFollowing)

router.post('/:userId/follow', protect, toggleFollow)

export default router