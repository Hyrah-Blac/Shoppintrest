import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth'
import {
  getAllTickets,
  getTicketAdmin,
  closeTicketAdmin,
} from '../controllers/admin-support.controller'

const router = Router()

router.use(protect, restrictTo('admin'))

router.get  ('/tickets',                 getAllTickets)
router.get  ('/tickets/:ticketId',       getTicketAdmin)
router.patch('/tickets/:ticketId/close', closeTicketAdmin)

export default router