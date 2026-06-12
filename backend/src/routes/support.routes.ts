import { Router } from 'express'
import { protect } from '../middleware/auth'
import { getOrCreateConversation, getStreamToken } from '../controllers/support.controller'

const router = Router()
router.use(protect)

router.get('/stream-token', getStreamToken)
router.get('/conversation',  getOrCreateConversation)

export default router