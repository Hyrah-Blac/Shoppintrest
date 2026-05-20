import { Router } from 'express'
import {
  getNotifications, markAllRead,
  markOneRead, getUnreadCount,
} from '../controllers/notification.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)
router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.patch('/read-all', markAllRead)
router.patch('/:id/read', markOneRead)

export default router