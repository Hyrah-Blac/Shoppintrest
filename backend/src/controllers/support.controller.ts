import { Request, Response } from 'express'
import Conversation from '../models/Conversation'
import asyncHandler from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { getOrCreateSupportChannel, getSupportToken } from '../lib/stream'

/**
 * GET /api/support/conversation
 * Returns the user's single support conversation (creates it if it doesn't exist).
 */
export const getOrCreateConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString()

  let convo = await Conversation.findOne({ userId })

  if (!convo) {
    const channelId = await getOrCreateSupportChannel(userId)
    convo = await Conversation.create({ userId, streamChannelId: channelId })
  }

  sendSuccess(res, convo, 'Conversation ready')
})

/**
 * GET /api/support/stream-token
 * Issues a Stream JWT for the authenticated user.
 */
export const getStreamToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString()
  const token  = await getSupportToken(userId)
  sendSuccess(res, { token }, 'Token generated')
})