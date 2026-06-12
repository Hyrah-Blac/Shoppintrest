import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth'
import {
  getAllConversations,
  getConversation,
  notifyReply,
} from '../controllers/admin-support.controller'

const router = Router()
router.use(protect, restrictTo('admin'))

router.get  ('/conversations',                        getAllConversations)
router.get  ('/conversations/:conversationId',        getConversation)
router.post ('/conversations/:conversationId/notify', notifyReply)

export default router