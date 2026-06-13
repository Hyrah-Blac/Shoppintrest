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

  // Ensure this admin is a member of the channel (handles admins promoted
  // after channel creation, or channels created before this admin existed).
  const server  = getStreamServer()
  const channel = server.channel('messaging', convo.streamChannelId)
  const adminId = req.user._id.toString()

  await server.upsertUser({ id: adminId })

  try {
    await channel.addMembers([adminId])
    console.log(`[getConversation] added ${adminId} to ${convo.streamChannelId}`)
  } catch (err) {
    console.error(`[getConversation] addMembers failed for ${convo.streamChannelId}:`, err)
  }

  sendSuccess(res, convo, 'Conversation fetched')
})

export const notifyReply = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params
  const convo = await Conversation.findById(conversationId)
  if (!convo) throw new AppError('Conversation not found', 404)
  await Notification.create({
    recipient: convo.userId,
    type:    'message',
    message: 'New message from Support',
    link:    `/support`,
    read:    false,
  })
  sendSuccess(res, null, 'Notification sent')
})