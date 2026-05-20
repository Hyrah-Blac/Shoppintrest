import { Server } from 'socket.io'
import http from 'http'
import logger from '../utils/logger'

let io: Server

export const initSocket = (httpServer: http.Server) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
  })

  const onlineUsers = new Map<string, string>() // userId -> socketId

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`)

    // User comes online
    socket.on('user:online', (userId: string) => {
      onlineUsers.set(userId, socket.id)
      socket.join(userId)
      io.emit('user:status', { userId, status: 'online' })
    })

    // Join conversation room
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
    })

    // Leave conversation room
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })

    // Send message
    socket.on('message:send', (data: { conversationId: string; message: any }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:new', data.message)
    })

    // Typing indicator
    socket.on(
      'typing:start',
      (data: { conversationId: string; userId: string }) => {
        socket
          .to(`conversation:${data.conversationId}`)
          .emit('typing:start', { userId: data.userId })
      }
    )

    socket.on(
      'typing:stop',
      (data: { conversationId: string; userId: string }) => {
        socket
          .to(`conversation:${data.conversationId}`)
          .emit('typing:stop', { userId: data.userId })
      }
    )

    // Notification
    socket.on('notification:send', (data: { recipientId: string; notification: any }) => {
      const recipientSocketId = onlineUsers.get(data.recipientId)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification:new', data.notification)
      }
    })

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          onlineUsers.delete(userId)
          io.emit('user:status', { userId, status: 'offline' })
        }
      })
      logger.info(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}