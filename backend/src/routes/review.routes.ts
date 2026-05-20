import { Router } from 'express'
import {
  getProductReviews, createReview,
  deleteReview, markHelpful,
} from '../controllers/review.controller'
import { protect } from '../middleware/auth'

const router = Router()

router.get('/product/:productId', getProductReviews)
router.post('/product/:productId', protect, createReview)
router.delete('/:id', protect, deleteReview)
router.patch('/:id/helpful', protect, markHelpful)

export default router