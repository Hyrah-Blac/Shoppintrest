import { Router } from 'express'
import {
  getDashboardStats, getAllUsers,
  toggleUserActive, updateUserRole,
} from '../controllers/admin.controller'
import { protect, restrictTo } from '../middleware/auth'

const router = Router()

router.use(protect)
router.use(restrictTo('admin'))

router.get('/stats', getDashboardStats)
router.get('/users', getAllUsers)
router.patch('/users/:id/toggle-active', toggleUserActive)
router.patch('/users/:id/role', updateUserRole)

export default router