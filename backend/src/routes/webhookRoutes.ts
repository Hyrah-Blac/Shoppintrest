import express, { Request, Response, NextFunction } from 'express'
import { Webhook } from 'svix'
import User from '../models/User'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

const router = express.Router()

// Clerk webhook — raw body already parsed by app.ts before this route
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

    // ── Handle events ──────────────────────────────────────────────────────
    const { id, email_addresses, username, image_url, first_name, last_name } = event.data

    const email = email_addresses?.[0]?.email_address
    if (!id || !email) return next(new AppError('Missing required fields', 400))

    const displayName =
      `${first_name || ''} ${last_name || ''}`.trim() || username || email.split('@')[0]

    const generatedUsername =
      username ||
      `${email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 1000)}`

    if (event.type === 'user.created' || event.type === 'user.updated') {
      try {
        await User.findOneAndUpdate(
          { clerkId: id },
          {
            clerkId: id,
            email,
            username: generatedUsername,
            displayName,
            avatar: image_url,
            ...(event.type === 'user.created' && { role: 'user', isActive: true, isVerified: false }),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      } catch (error: any) {
        if (error.code === 11000) {
          await User.findOneAndUpdate(
            { clerkId: id },
            {
              clerkId: id,
              email,
              username: `${generatedUsername}${Date.now()}`,
              displayName,
              avatar: image_url,
            },
            { upsert: true, new: true }
          )
        } else {
          throw error
        }
      }
    }

    if (event.type === 'user.deleted') {
      await User.findOneAndUpdate(
        { clerkId: id },
        { isActive: false },
        { new: true }
      )
    }

    return res.status(200).json({ success: true })
  })
)

export default router