import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth'
import {
  getAllConversations,
  getConversation,
  notifyReply,
  migrateChannels,
} from '../controllers/admin-support.controller'

const router = Router()
router.use(protect, restrictTo('admin'))

router.get  ('/conversations',                        getAllConversations)
router.get  ('/conversations/:conversationId',        getConversation)
router.post ('/conversations/:conversationId/notify', notifyReply)
router.get  ('/migrate',                              migrateChannels)  // delete after running

export default router