import { Request, Response } from 'express'
import Conversation from '../models/Conversation'
import Notification from '../models/Notification'
import asyncHandler from '../utils/asyncHandler'
import AppError     from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'
import { getStreamServer } from '../lib/stream'

export const getAllConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await Conversation.find()
    .populate('userId', 'username email displayName avatar')
    .sort({ updatedAt: -1 })
    .lean()
  sendSuccess(res, conversations, 'Conversations fetched')
})

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params
  const convo = await Conversation.findById(conversationId)
    .populate('userId', 'username email displayName avatar')
    .lean()
  if (!convo) throw new AppError('Conversation not found', 404)
  sendSuccess(res, convo, 'Conversation fetched')
})

export const notifyReply = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params
  const convo = await Conversation.findById(conversationId)
  if (!convo) throw new AppError('Conversation not found', 404)
  await Notification.create({
    userId:  convo.userId,
    type:    'message',
    message: 'New message from Support',
    link:    `/support`,
    read:    false,
  })
  sendSuccess(res, null, 'Notification sent')
})

// Run once to patch all existing channels with support: true
// Delete this after running
export const migrateChannels = asyncHandler(async (req: Request, res: Response) => {
  const server = getStreamServer()
  const convos = await Conversation.find().lean()

  const results = []
  for (const convo of convos) {
    try {
      const channel = server.channel('messaging', convo.streamChannelId)
      await channel.updatePartial({ set: { support: true } })
      results.push({ id: convo.streamChannelId, ok: true })
    } catch (err: any) {
      results.push({ id: convo.streamChannelId, error: err.message })
    }
  }

  sendSuccess(res, results, 'Migration done')
})