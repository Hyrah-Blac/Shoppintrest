import { Request, Response, NextFunction } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import User from '../models/User'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

declare global {
  namespace Express {
    interface Request {
      user?: any
      clerkUserId?: string
    }
  }
}

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = getAuth(req)

    if (!userId) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401))
    }

    const user = await User.findOne({ clerkId: userId })

    if (!user) {
      return next(new AppError('User not found. Please sign up.', 404))
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 403))
    }

    req.user = user
    req.clerkUserId = userId
    next()
  }
)

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403))
    }
    next()
  }
}

export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = getAuth(req)
      if (userId) {
        const user = await User.findOne({ clerkId: userId })
        if (user) {
          req.user = user
          req.clerkUserId = userId
        }
      }
    } catch {
      // silent — optional auth means we proceed without user
    }
    next()
  }
)