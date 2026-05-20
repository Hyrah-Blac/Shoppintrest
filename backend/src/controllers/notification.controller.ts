import { Request, Response, NextFunction } from 'express'
import Notification from '../models/Notification'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'

// ─── GET MY NOTIFICATIONS ────────────────────────────────────────────────────
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  sendSuccess(res, notifications)
})

// ─── MARK ALL AS READ ────────────────────────────────────────────────────────
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  )
  sendSuccess(res, null, 'All notifications marked as read')
})

// ─── MARK ONE AS READ ────────────────────────────────────────────────────────
export const markOneRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    )
    if (!notification) return next(new AppError('Notification not found', 404))
    sendSuccess(res, notification)
  }
)

// ─── GET UNREAD COUNT ────────────────────────────────────────────────────────
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  })
  sendSuccess(res, { count })
})