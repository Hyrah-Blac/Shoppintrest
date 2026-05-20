import { Request, Response, NextFunction } from 'express'
import { Conversation, Message } from '../models/Message'
import User from '../models/User'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'
import { getIO } from '../socket'

// ─── GET MY CONVERSATIONS ────────────────────────────────────────────────────
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate('participants', 'username displayName avatar')
    .populate({
      path: 'lastMessage',
      select: 'content createdAt sender isRead',
    })
    .sort({ updatedAt: -1 })
    .lean()

  sendSuccess(res, conversations)
})

// ─── GET OR CREATE CONVERSATION ──────────────────────────────────────────────
export const getOrCreateConversation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params

    const otherUser = await User.findById(userId)
    if (!otherUser) return next(new AppError('User not found', 404))

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
    }).populate('participants', 'username displayName avatar')

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      })
      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'username displayName avatar'
      ) as any
    }

    sendSuccess(res, conversation)
  }
)

// ─── GET MESSAGES ─────────────────────────────────────────────────────────────
export const getMessages = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    })

    if (!conversation) return next(new AppError('Conversation not found', 403))

    const page = parseInt(req.query.page as string) || 1
    const limit = 30
    const skip = (page - 1) * limit

    const messages = await Message.find({
      conversation: req.params.conversationId,
    })
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Mark as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.user._id },
        isRead: false,
      },
      { isRead: true }
    )

    sendSuccess(res, messages.reverse())
  }
)

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
export const sendMessage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { content, mediaUrl, mediaType } = req.body

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    })

    if (!conversation) return next(new AppError('Conversation not found', 403))

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content,
      ...(mediaUrl && { mediaUrl, mediaType }),
    })

    const populated = await message.populate('sender', 'username displayName avatar')

    // Update conversation last message
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
      updatedAt: new Date(),
    })

    // Emit via socket
    try {
      const io = getIO()
      io.to(`conversation:${conversation._id}`).emit('message:new', populated)
    } catch {
      // socket not critical
    }

    sendSuccess(res, populated, 'Message sent', 201)
  }
)

// ─── ADD REACTION ─────────────────────────────────────────────────────────────
export const addReaction = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { emoji } = req.body

    const message = await Message.findById(req.params.messageId)
    if (!message) return next(new AppError('Message not found', 404))

    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    )

    if (existingIdx > -1) {
      message.reactions[existingIdx].emoji = emoji
    } else {
      message.reactions.push({ user: req.user._id, emoji })
    }

    await message.save()
    sendSuccess(res, message)
  }
)