// PATH: src/routes/webhookRoutes.ts

import express, { Request, Response, NextFunction } from 'express'
import { Webhook } from 'svix'
import User from '../models/User'
import SavedFolder from '../models/SavedFolder'
import Product from '../models/Product'
import Order from '../models/Order'
import Review from '../models/Review'
import Notification from '../models/Notification'
import Cart from '../models/Cart'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { createNotification } from '../controllers/notification.controller'
import { getStreamServer } from '../lib/stream'
import logger from '../utils/logger'

const router = express.Router()

// ─── CLERK WEBHOOK ───────────────────────────────────────────────────────────
router.post(
  '/clerk',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) return next(new AppError('Webhook secret not configured', 500))

    const svixId        = req.headers['svix-id'] as string
    const svixTimestamp = req.headers['svix-timestamp'] as string
    const svixSignature = req.headers['svix-signature'] as string

    if (!svixId || !svixTimestamp || !svixSignature) {
      return next(new AppError('Missing svix headers', 400))
    }

    let event: any
    try {
      const wh = new Webhook(secret)
      event = wh.verify(req.body, {
        'svix-id':        svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch {
      return next(new AppError('Invalid webhook signature', 400))
    }

    if (!['user.created', 'user.updated', 'user.deleted'].includes(event.type)) {
      return res.status(200).json({ success: true })
    }

    const { id, email_addresses, username, image_url, first_name, last_name } = event.data

    if (event.type === 'user.deleted') {
      if (!id) return next(new AppError('Missing user id', 400))

      const user = await User.findOne({ clerkId: id })

      if (user) {
        const streamClient = getStreamServer()

        await Promise.all([
          SavedFolder.deleteMany({ userId: user._id }),
          Review.deleteMany({ user: user._id }),
          Order.deleteMany({ user: user._id }),
          Cart.deleteMany({ user: user._id }),
          Notification.deleteMany({
            $or: [{ recipient: user._id }, { sender: user._id }],
          }),
          streamClient.deleteUser(user._id.toString(), {
            mark_messages_deleted: true,
            hard_delete:           true,
          }).catch((err) => {
            logger.error('[Webhook] Stream user deletion failed', err)
          }),
          User.updateMany(
            { followers: user._id },
            { $pull: { followers: user._id } }
          ),
          User.updateMany(
            { following: user._id },
            { $pull: { following: user._id } }
          ),
          User.updateMany(
            { savedProducts: { $in: user.savedProducts } },
            { $pull: { savedProducts: { $in: user.savedProducts } } }
          ),
          User.updateMany(
            { collections: { $in: user.collections } },
            { $pull: { collections: { $in: user.collections } } }
          ),
        ])

        await User.findByIdAndDelete(user._id)
      }

      return res.status(200).json({ success: true })
    }

    const email = email_addresses?.[0]?.email_address
    if (!id || !email) return next(new AppError('Missing required fields', 400))

    const displayName =
      `${first_name || ''} ${last_name || ''}`.trim() || username || email.split('@')[0]

    const generatedUsername =
      username ||
      `${email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 1000)}`

    try {
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          $set:         { email, displayName, avatar: image_url, isActive: true },
          $setOnInsert: { clerkId: id, username: generatedUsername, role: 'user', isVerified: false },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } catch (error: any) {
      if (error.code === 11000) {
        await User.findOneAndUpdate(
          { clerkId: id },
          {
            $set:         { email, displayName, avatar: image_url, isActive: true },
            $setOnInsert: { clerkId: id, username: `${generatedUsername}${Date.now()}`, role: 'user', isVerified: false },
          },
          { upsert: true, new: true }
        )
      } else {
        throw error
      }
    }

    return res.status(200).json({ success: true })
  })
)

// ─── STREAM CHAT WEBHOOK ─────────────────────────────────────────────────────
// Configure in Stream Dashboard → Developers → Webhooks
// URL: https://your-backend.com/api/webhooks/stream/message-created
// Events: message.new
router.post('/stream/message-created', async (req: Request, res: Response) => {
  const signature = req.headers['x-signature'] as string

  if (!signature) {
    logger.warn('[Stream webhook] Missing x-signature header — request rejected')
    return res.sendStatus(403)
  }

  const streamClient = getStreamServer()

  const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body))

  const isValid = streamClient.verifyWebhook(rawBody, signature)
  if (!isValid) {
    logger.warn('[Stream webhook] Invalid signature — request rejected')
    return res.sendStatus(403)
  }

  let event: any
  try {
    event = JSON.parse(rawBody.toString())
  } catch {
    return res.sendStatus(400)
  }

  if (event.type !== 'message.new') return res.sendStatus(200)

  const senderId    = event.user?.id
  const members     = event.members ?? []
  const recipientId = members.find((m: any) => m.user_id !== senderId)?.user_id

  if (!senderId || !recipientId) return res.sendStatus(200)

  try {
    await createNotification({
      recipientId,
      senderId,
      senderName:   event.user?.name  ?? 'Someone',
      senderAvatar: event.user?.image ?? '',
      type:         'message',
      message:      `${event.user?.name ?? 'Someone'} sent you a message`,
      link:         '/messages',
    })
  } catch (err) {
    logger.error('[Stream webhook] notification failed', err)
  }

  res.sendStatus(200)
})

export default router