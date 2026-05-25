
console.log("SERVER BOOTED");
import 'dotenv/config'
import http from 'http'
import app from './app'
import connectDB from './config/database'
import { initSocket } from './socket'
import logger from './utils/logger'

// ─── ENV VAR VALIDATION — fail fast before anything starts ───────────────────
const requiredEnvVars = [
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',
  'MONGODB_URI',
  'COOKIE_SECRET',
  'FRONTEND_URL',
]

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key])
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
  process.exit(1)
}

const PORT = process.env.PORT || 5000

const startServer = async () => {
  await connectDB()

  const httpServer = http.createServer(app)

  initSocket(httpServer)

  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
    logger.info(`Environment: ${process.env.NODE_ENV}`)
    logger.info(`Health check: http://localhost:${PORT}/health`)
  })

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...')
    httpServer.close(() => {
      logger.info('Process terminated.')
      process.exit(0)
    })
  })

  process.on('unhandledRejection', (err: Error) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', err)
    httpServer.close(() => process.exit(1))
  })

  process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', err)
    process.exit(1)
  })
}

startServer()