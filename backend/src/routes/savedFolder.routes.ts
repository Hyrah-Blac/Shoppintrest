import { Router } from 'express'
import { protect } from '../middleware/auth'
import {
  createFolder, getFolders, getFolder,
  renameFolder, deleteFolder,
  saveProduct, unsaveProduct, moveProduct, getAllSaved,
} from '../controllers/savedFolder.controller'

const router = Router()
router.use(protect)

// Saved products (all)
router.get('/', getAllSaved)

// Folders — BEFORE /:productId
router.post  ('/folders',         createFolder)
router.get   ('/folders',         getFolders)
router.get   ('/folders/:slug',   getFolder)
router.patch ('/folders/:slug',   renameFolder)
router.delete('/folders/:slug',   deleteFolder)

// Per-product actions — AFTER static routes
router.post  ('/:productId',      saveProduct)
router.delete('/:productId',      unsaveProduct)
router.post  ('/:productId/move', moveProduct)

export default router