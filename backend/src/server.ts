import 'dotenv/config'
import http from 'http'
import app from './app'
import connectDB from './config/database'
import { initSocket } from './socket'
import logger from './utils/logger'

const PORT = process.env.PORT || 5000

const startServer = async () => {
  // Connect to MongoDB
  await connectDB()

  // Create HTTP server
  const httpServer = http.createServer(app)

  // Initialize Socket.IO
  initSocket(httpServer)

  // Start listening
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Shoppintrest server running on port ${PORT}`)
    logger.info(`📦 Environment: ${process.env.NODE_ENV}`)
    logger.info(`🌐 Health check: http://localhost:${PORT}/health`)
  })

  // Graceful shutdown
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