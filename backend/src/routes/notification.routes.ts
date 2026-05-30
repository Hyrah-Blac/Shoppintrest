import { Router } from 'express'
import {
  getNotifications,
  markAllRead,
  markOneRead,
  getUnreadCount,
  syncNovuSubscriber,
} from '../controllers/notification.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)

router.get('/',              getNotifications)
router.get('/unread-count',  getUnreadCount)
router.patch('/read-all',    markAllRead)
router.patch('/:id/read',    markOneRead)

// Called after Clerk sign-in to upsert the Novu subscriber record.
// Wire this into your auth flow or call it from the Clerk webhook.
router.post('/sync-subscriber', syncNovuSubscriber)

export default router