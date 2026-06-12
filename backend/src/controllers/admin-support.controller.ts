import { Request, Response } from 'express'
import Conversation from '../models/Conversation'
import Notification from '../models/Notification'
import asyncHandler from '../utils/asyncHandler'
import AppError     from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'

/**
 * GET /api/admin/support/conversations
 * Returns all conversations with user info populated.
 */
export const getAllConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await Conversation.find()
    .populate('userId', 'username email displayName avatar')
    .sort({ updatedAt: -1 })
    .lean()

  sendSuccess(res, conversations, 'Conversations fetched')
})

/**
 * GET /api/admin/support/conversations/:conversationId
 * Returns a single conversation with user info.
 */
export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params

  const convo = await Conversation.findById(conversationId)
    .populate('userId', 'username email displayName avatar')
    .lean()

  if (!convo) throw new AppError('Conversation not found', 404)

  sendSuccess(res, convo, 'Conversation fetched')
})

/**
 * POST /api/admin/support/conversations/:conversationId/notify
 * Sends an in-app notification to the user that support replied.
 */
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