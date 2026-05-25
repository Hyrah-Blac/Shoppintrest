import express, { Request, Response, NextFunction } from 'express'
import { Webhook } from 'svix'
import User from '../models/User'
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

    // ── Extract user fields (only present on user.* events) ───────────────
    const { id, email_addresses, username, image_url, first_name, last_name } = event.data

    if (event.type === 'user.deleted') {
      if (!id) return next(new AppError('Missing user id', 400))
      await User.findOneAndUpdate(
        { clerkId: id },
        { isActive: false },
        { new: true }
      )
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