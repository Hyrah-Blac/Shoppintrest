import express, { Request, Response, NextFunction } from 'express'
import { Webhook } from 'svix'
import User from '../models/User'
import Collection from '../models/Collection'
import Product from '../models/Product'
import Order from '../models/Order'
import Review from '../models/Review'
import Notification from '../models/Notification'
import Message from '../models/Message'
import Cart from '../models/Cart'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

const router = express.Router()

router.post(
  '/clerk',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) return next(new AppError('Webhook secret not configured', 500))

    // ── Verify svix signature ──────────────────────────────────────────────
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

    // ── Ignore events we don't handle ─────────────────────────────────────
    if (!['user.created', 'user.updated', 'user.deleted'].includes(event.type)) {
      return res.status(200).json({ success: true })
    }

    const { id, email_addresses, username, image_url, first_name, last_name } = event.data

    // ── user.deleted — cascade delete everything ───────────────────────────
    if (event.type === 'user.deleted') {
      if (!id) return next(new AppError('Missing user id', 400))

      const user = await User.findOne({ clerkId: id })

      if (user) {
        await Promise.all([
          // Delete user's collections
          Collection.deleteMany({ user: user._id }),

          // Delete user's reviews and remove them from product rating counts
          Review.deleteMany({ user: user._id }),

          // Delete user's orders
          Order.deleteMany({ user: user._id }),

          // Delete user's cart
          Cart.deleteMany({ user: user._id }),

          // Delete all notifications sent to or by this user
          Notification.deleteMany({
            $or: [{ recipient: user._id }, { sender: user._id }],
          }),

          // Delete all messages sent to or from this user
          Message.deleteMany({
            $or: [{ sender: user._id }, { recipient: user._id }],
          }),

          // Remove user from other users' followers/following lists
          User.updateMany(
            { followers: user._id },
            { $pull: { followers: user._id } }
          ),
          User.updateMany(
            { following: user._id },
            { $pull: { following: user._id } }
          ),

          // Remove user's saved products references
          User.updateMany(
            { savedProducts: { $in: user.savedProducts } },
            { $pull: { savedProducts: { $in: user.savedProducts } } }
          ),

          // Remove this collection from other users who saved it
          User.updateMany(
            { collections: { $in: user.collections } },
            { $pull: { collections: { $in: user.collections } } }
          ),
        ])

        // Finally delete the user
        await User.findByIdAndDelete(user._id)
      }

      return res.status(200).json({ success: true })
    }

    // ── user.created / user.updated ───────────────────────────────────────
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
          $set: {
            email,
            displayName,
            avatar: image_url,
            isActive: true,
          },
          $setOnInsert: {
            clerkId: id,
            username: generatedUsername,
            role: 'user',
            isVerified: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } catch (error: any) {
      if (error.code === 11000) {
        await User.findOneAndUpdate(
          { clerkId: id },
          {
            $set: {
              email,
              displayName,
              avatar: image_url,
              isActive: true,
            },
            $setOnInsert: {
              clerkId: id,
              username: `${generatedUsername}${Date.now()}`,
              role: 'user',
              isVerified: false,
            },
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

export default router