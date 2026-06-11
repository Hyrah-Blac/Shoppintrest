import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth'
import {
  getAllTickets,
  getTicketAdmin,
  closeTicketAdmin,
  notifySupportReply,
} from '../controllers/admin-support.controller'

const router = Router()

router.use(protect, restrictTo('admin'))

router.get  ('/tickets',                      getAllTickets)
router.get  ('/tickets/:ticketId',            getTicketAdmin)
router.patch('/tickets/:ticketId/close',      closeTicketAdmin)
router.post ('/tickets/:ticketId/notify',     notifySupportReply)

export default router