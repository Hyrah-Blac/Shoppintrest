import { Router } from 'express'
import {
  getCollections, getCollection, createCollection,
  updateCollection, deleteCollection, toggleProductInCollection,
} from '../controllers/collection.controller'
import { protect, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/', getCollections)
router.get('/:id', optionalAuth, getCollection)
router.post('/', protect, createCollection)
router.patch('/:id', protect, updateCollection)
router.delete('/:id', protect, deleteCollection)
router.post('/:id/products', protect, toggleProductInCollection)

export default router