import { Router } from 'express'
import {
  initiateMpesaPayment,
  mpesaCallback,
  checkPaymentStatus,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller'
import { protect, restrictTo } from '../middleware/auth'
import { checkoutLimiter } from '../config/rateLimiter'

const router = Router()

// ── Public callback — Safaricom calls this, no auth ──
router.post('/mpesa/callback', mpesaCallback)

// ── Protected ──
router.post('/mpesa/initiate', protect, checkoutLimiter, initiateMpesaPayment)
router.get('/mpesa/status/:orderId', protect, checkPaymentStatus)
router.get('/my-orders', protect, getMyOrders)
router.get('/my-orders/:id', protect, getOrder)

// ── Admin ──
router.get('/', protect, restrictTo('admin'), getAllOrders)
router.patch('/:id/status', protect, restrictTo('admin'), updateOrderStatus)

export default router