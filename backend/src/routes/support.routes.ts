import { Router } from 'express'
import { protect } from '../middleware/auth'
import {
  createTicket, getTickets, getTicket,
  closeTicket, assignAgent, getStreamToken,
} from '../controllers/support.controller'

const router = Router()
router.use(protect)

router.get  ('/stream-token',              getStreamToken)
router.post ('/tickets',                   createTicket)
router.get  ('/tickets',                   getTickets)
router.get  ('/tickets/:ticketId',         getTicket)
router.patch('/tickets/:ticketId/close',   closeTicket)
router.patch('/tickets/:ticketId/assign',  assignAgent)

export default router