// ─────────────────────────────────────────────────────────────────────────────
// PATH: src/routes/chat.routes.ts   (add alongside your existing route files)
// ─────────────────────────────────────────────────────────────────────────────
//
// Imports use the same relative style as all your other route files.
// Resolves to:
//   ../lib/stream       → src/lib/stream.ts          (new file you just created)
//   ../utils/asyncHandler → src/utils/asyncHandler.ts  (already exists)
//   ../utils/apiResponse  → src/utils/apiResponse.ts   (already exists)
//   ../middleware/auth    → src/middleware/auth.ts      (already exists)
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express'
import { getStreamServer } from '../lib/stream'
import asyncHandler from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { protect } from '../middleware/auth'

const router = Router()

/**
 * POST /api/chat/token
 *
 * Verifies the Clerk-authenticated user (via the existing `protect` middleware),
 * upserts their profile into Stream, and returns a signed Stream auth token.
 *
 * Response shape: { data: { token: string } }
 */
router.post(
  '/token',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user   // populated by your existing protect middleware

    const streamClient = getStreamServer()

    // Keep the Stream user record in sync with your MongoDB User document
    await streamClient.upsertUser({
      id:       user._id.toString(),
      name:     user.displayName,
      username: user.username,
      image:    user.avatar ?? '',
    })

    const token = streamClient.createToken(user._id.toString())

    sendSuccess(res, { token })
  })
)

export default router