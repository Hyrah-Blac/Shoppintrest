import { Router } from 'express'
import {
  getCart, addToCart, updateCartItem,
  removeFromCart, clearCart,
} from '../controllers/cart.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.use(protect)
router.get('/', getCart)
router.post('/', addToCart)
router.patch('/:productId/:size', updateCartItem)
router.delete('/:productId/:size', removeFromCart)
router.delete('/', clearCart)

export default router