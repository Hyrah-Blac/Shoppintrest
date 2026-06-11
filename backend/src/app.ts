import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import mongoSanitize from 'express-mongo-sanitize'
import morgan from 'morgan'
import { clerkMiddleware } from '@clerk/express'
import { globalLimiter } from './config/rateLimiter'
import globalErrorHandler from './middleware/errorHandler'
import logger from './utils/logger'

import userRoutes         from './routes/user.routes'
import productRoutes      from './routes/product.routes'
import orderRoutes        from './routes/order.routes'
import cartRoutes         from './routes/cart.routes'
import reviewRoutes       from './routes/review.routes'
import notificationRoutes from './routes/notification.routes'
import uploadRoutes       from './routes/upload.routes'
import stripeRoutes       from './routes/stripe.routes'
import adminRoutes        from './routes/admin.routes'
import webhookRoutes      from './routes/webhookRoutes'
import savedFolderRoutes  from './routes/savedFolder.routes'
import supportRoutes      from './routes/support.routes'
import adminSupportRoutes from './routes/admin-support.routes'

const app = express()

app.set('trust proxy', 1)
logger.info('APP INITIALIZED')

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://shoppin-five.vercel.app',
  'https://shoppintrest.vercel.app',
  'https://shoppintrest.com',
  'https://www.shoppintrest.com',
  'https://shoppin-git-main-hyrahs-projects.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-clerk-auth-token'],
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}))

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))
app.use('/api/webhooks',       express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(compression())
app.use(mongoSanitize())
app.use('/api', globalLimiter)

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined', {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  }))
}

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shoppin API is running',
    timestamp: new Date().toISOString(),
  })
})
app.head('/health', (_req, res) => res.sendStatus(200))

// Webhook routes — before clerkMiddleware
app.use('/api/webhooks', webhookRoutes)
app.use('/api/stripe',   stripeRoutes)

// Clerk — after webhooks
app.use(clerkMiddleware())

// API routes
app.use('/api/users',         userRoutes)
app.use('/api/products',      productRoutes)
app.use('/api/orders',        orderRoutes)
app.use('/api/cart',          cartRoutes)
app.use('/api/reviews',       reviewRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/upload',        uploadRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/saved',         savedFolderRoutes)
app.use('/api/support',       supportRoutes)
app.use('/api/support/admin', adminSupportRoutes)

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
})

app.use(globalErrorHandler)

export default app