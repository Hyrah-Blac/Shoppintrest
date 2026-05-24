import { Request, Response, NextFunction } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import { escape } from 'lodash'
import User from '../models/User'
import Product from '../models/Product'
import Notification from '../models/Notification'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess, sendPaginated } from '../utils/apiResponse'

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id)
    .populate('collections', 'title coverImage saves')
    .lean()
  sendSuccess(res, user)
})

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
export const updateMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { displayName, bio, website, avatar } = req.body

  // Block forbidden fields
  const forbidden = ['role', 'clerkId', 'email', 'isVerified', 'isActive']
  for (const field of forbidden) {
    if (req.body[field]) {
      return next(new AppError(`You cannot update ${field}`, 400))
    }
  }

  // Input length limits
  if (displayName && displayName.length > 60)
    return next(new AppError('Display name must be 60 characters or fewer', 400))
  if (bio && bio.length > 500)
    return next(new AppError('Bio must be 500 characters or fewer', 400))
  if (avatar && avatar.length > 500)
    return next(new AppError('Avatar URL too long', 400))

  // Website URL validation — must be http/https only
  if (website) {
    if (website.length > 200)
      return next(new AppError('Website URL must be 200 characters or fewer', 400))
    try {
      const url = new URL(website)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return next(new AppError('Website must be a valid http or https URL', 400))
      }
    } catch {
      return next(new AppError('Website must be a valid URL', 400))
    }
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { displayName, bio, website, avatar },
    { new: true, runValidators: true }
  )

  sendSuccess(res, updated, 'Profile updated successfully')
})

// ─── GET USER BY USERNAME ────────────────────────────────────────────────────
export const getUserByUsername = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.username || req.params.username === 'undefined') {
    return next(new AppError('Username is required', 400))
  }

  const user = await User.findOne({ username: req.params.username })
    .populate('collections', 'title coverImage saves isPrivate')
    .lean()

  if (!user) return next(new AppError('User not found', 404))

  sendSuccess(res, user)
})

// ─── FOLLOW / UNFOLLOW ───────────────────────────────────────────────────────
export const toggleFollow = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const targetUser = await User.findById(req.params.userId)

  if (!targetUser) return next(new AppError('User not found', 404))

  if (targetUser._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot follow yourself', 400))
  }

  const isFollowing = req.user.following.includes(targetUser._id)

  if (isFollowing) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetUser._id } })
    await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: req.user._id } })
    sendSuccess(res, { isFollowing: false }, 'Unfollowed successfully')
  } else {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetUser._id } })
    await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: req.user._id } })

    // Escape displayName before storing to prevent XSS if rendered as HTML
    await Notification.create({
      recipient: targetUser._id,
      sender: req.user._id,
      type: 'follow',
      message: `${escape(req.user.displayName)} started following you`,
      link: `/profile/${req.user.username}`,
    })

    sendSuccess(res, { isFollowing: true }, 'Followed successfully')
  }
})

// ─── GET FOLLOWERS ───────────────────────────────────────────────────────────
export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 24, 100)
  const skip  = (page - 1) * limit

  const user = await User.findOne({ username: req.params.username })
    .select('followers')
    .lean()

  const total = user?.followers?.length || 0

  const populated = await User.findOne({ username: req.params.username })
    .select('followers')
    .populate({
      path: 'followers',
      select: 'username displayName avatar isVerified',
      options: { skip, limit },
    })
    .lean()

  sendPaginated(res, (populated?.followers as any[]) || [], total, page, limit)
})

// ─── GET FOLLOWING ───────────────────────────────────────────────────────────
export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 24, 100)
  const skip  = (page - 1) * limit

  const user = await User.findOne({ username: req.params.username })
    .select('following')
    .lean()

  const total = user?.following?.length || 0

  const populated = await User.findOne({ username: req.params.username })
    .select('following')
    .populate({
      path: 'following',
      select: 'username displayName avatar isVerified',
      options: { skip, limit },
    })
    .lean()

  sendPaginated(res, (populated?.following as any[]) || [], total, page, limit)
})

// ─── SAVE / UNSAVE PRODUCT ───────────────────────────────────────────────────
export const toggleSaveProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.productId)

  if (!product) return next(new AppError('Product not found', 404))

  const isSaved = req.user.savedProducts.includes(product._id)

  if (isSaved) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { savedProducts: product._id } })
    await Product.findByIdAndUpdate(product._id, { $inc: { saves: -1 } })
    sendSuccess(res, { isSaved: false }, 'Product unsaved')
  } else {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedProducts: product._id } })
    await Product.findByIdAndUpdate(product._id, { $inc: { saves: 1 } })
    sendSuccess(res, { isSaved: true }, 'Product saved')
  }
})

// ─── GET SAVED PRODUCTS ──────────────────────────────────────────────────────
export const getSavedProducts = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 24, 100) // cap at 100
  const skip  = (page - 1) * limit

  const user = await User.findById(req.user._id).select('savedProducts')
  const total = user?.savedProducts.length || 0

  const products = await Product.find({
    _id: { $in: user?.savedProducts },
    isPublished: true,
  })
    .skip(skip)
    .limit(limit)
    .lean()

  sendPaginated(res, products, total, page, limit)
})

// ─── SEARCH USERS ────────────────────────────────────────────────────────────
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query

  if (!q) return sendSuccess(res, [])

  // Escape regex special characters to prevent injection
  const escaped = (q as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const users = await User.find({
    $or: [
      { username:    { $regex: escaped, $options: 'i' } },
      { displayName: { $regex: escaped, $options: 'i' } },
    ],
    isActive: true,
  })
    .select('username displayName avatar isVerified')
    .limit(20)
    .lean()

  sendSuccess(res, users)
})

// ─── SYNC CLERK USER ─────────────────────────────────────────────────────────
// Identity is derived from the verified Clerk JWT via getAuth(req).
// The request body is intentionally ignored for all identity fields.
export const syncClerkUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req)
  if (!userId) return next(new AppError('Unauthorised', 401))

  const clerkUser = await clerkClient.users.getUser(userId)

  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) return next(new AppError('No email associated with this account', 400))

  const displayName =
    `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
    clerkUser.username ||
    email.split('@')[0]

  const generatedUsername =
    clerkUser.username ||
    `${email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 1000)}`

  try {
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        clerkId: userId,
        email,
        username: generatedUsername,
        displayName,
        avatar: clerkUser.imageUrl,
        role: 'user',
        isActive: true,
        isVerified: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    return res.status(200).json({ success: true, data: user })
  } catch (error: any) {
    if (error.code === 11000) {
      const user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          clerkId: userId,
          email,
          username: `${generatedUsername}${Date.now()}`,
          displayName,
          avatar: clerkUser.imageUrl,
          role: 'user',
          isActive: true,
          isVerified: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      return res.status(200).json({ success: true, data: user })
    }
    throw error
  }
})