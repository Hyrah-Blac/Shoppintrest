import { Router } from 'express'
import {
  getConversations, getOrCreateConversation,
  getMessages, sendMessage, addReaction,
} from '../controllers/message.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)
router.get('/conversations', getConversations)
router.get('/conversations/user/:userId', getOrCreateConversation)
router.get('/:conversationId', getMessages)
router.post('/:conversationId', sendMessage)
router.post('/:messageId/react', addReaction)

export default router