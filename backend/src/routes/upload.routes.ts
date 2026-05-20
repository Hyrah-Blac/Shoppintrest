import { Router } from 'express'
import multer from 'multer'
import {
  uploadImage, uploadMultipleImages, deleteImage,
} from '../controllers/upload.controller'
import { protect } from '../middleware/auth'
import { uploadLimiter } from '../config/rateLimiter'

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

const router = Router()

router.use(protect)
router.use(uploadLimiter)
router.post('/image', upload.single('image'), uploadImage)
router.post('/images', upload.array('images', 10), uploadMultipleImages)
router.delete('/image', deleteImage)

export default router