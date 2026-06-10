import { Router } from 'express'
import { protect } from '../middleware/auth'
import {
  createFolder, getFolders, getFolder,
  renameFolder, deleteFolder,
  saveProduct, unsaveProduct, moveProduct, getAllSaved,
} from '../controllers/savedFolder.controller'

const router = Router()
router.use(protect)

router.get   ('/',                getAllSaved)
router.post  ('/:productId',      saveProduct)
router.delete('/:productId',      unsaveProduct)
router.post  ('/:productId/move', moveProduct)

router.post  ('/folders',         createFolder)
router.get   ('/folders',         getFolders)
router.get   ('/folders/:slug',   getFolder)
router.patch ('/folders/:slug',   renameFolder)
router.delete('/folders/:slug',   deleteFolder)

export default router