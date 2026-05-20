import { Router } from 'express'
import {
  getProducts, searchProducts, getProduct,
  getFeaturedProducts, getRelatedProducts,
  createProduct, updateProduct, deleteProduct, getTrendingProducts,
} from '../controllers/product.controller'
import { protect, restrictTo } from '../middleware/auth'

const router = Router()

router.get('/', getProducts)
router.get('/search', searchProducts)
router.get('/featured', getFeaturedProducts)
router.get('/trending', getTrendingProducts)
router.get('/:id', getProduct)
router.get('/:id/related', getRelatedProducts)
router.post('/', protect, restrictTo('admin'), createProduct)
router.patch('/:id', protect, restrictTo('admin'), updateProduct)
router.delete('/:id', protect, restrictTo('admin'), deleteProduct)

export default router