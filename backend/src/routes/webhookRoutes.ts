import express from 'express'
import { syncClerkUser } from '../controllers/userController'

const router = express.Router()

router.post('/clerk', syncClerkUser)

export default router