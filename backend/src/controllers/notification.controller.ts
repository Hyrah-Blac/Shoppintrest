import { Request, Response, NextFunction } from 'express'
import Notification from '../models/Notification'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'
import { syncSubscriber, triggerNotification, NotificationType } from '../config/novu'

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
    { isRead: true },
  )
  sendSuccess(res, null, 'All notifications marked as read')
})

// ─── MARK ONE AS READ ────────────────────────────────────────────────────────
export const markOneRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true },
    )
    if (!notification) return next(new AppError('Notification not found', 404))
    sendSuccess(res, notification)
  },
)

// ─── GET UNREAD COUNT ────────────────────────────────────────────────────────
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  })
  sendSuccess(res, { count })
})

// ─── CREATE NOTIFICATION (internal helper used by other controllers) ──────────
/**
 * Creates a MongoDB notification record and triggers the corresponding
 * Novu workflow for realtime delivery.
 *
 * Call this from any controller that needs to emit a notification
 * (e.g. follow, order, message controllers).
 *
 * @example
 * await createNotification({
 *   recipientId:   targetUser._id.toString(),
 *   senderId:      req.user._id.toString(),
 *   senderName:    req.user.displayName,
 *   senderAvatar:  req.user.avatar ?? '',
 *   type:          'follow',
 *   message:       `${req.user.displayName} started following you`,
 *   link:          `/profile/${req.user.username}`,
 * })
 */
export async function createNotification(params: {
  recipientId:  string
  senderId:     string
  senderName:   string
  senderAvatar: string
  type:         NotificationType
  message:      string
  link:         string
}): Promise<void> {
  const { recipientId, senderId, senderName, senderAvatar, type, message, link } = params

  // 1. Persist to MongoDB — source of truth
  const notif = await Notification.create({
    recipient: recipientId,
    sender:    senderId,
    type,
    message,
    link,
    isRead:    false,
  })

  // 2. Fire Novu trigger — realtime delivery + future email/push
  //    We don't await so the calling request isn't blocked.
  triggerNotification({
    recipientId,
    type,
    senderName,
    senderAvatar,
    message,
    link,
    createdAt: notif.createdAt.toISOString(),
    notifId:   notif._id.toString(),  // forwarded for frontend deduplication
  }).catch(err =>
    console.error('[createNotification] Novu trigger failed', err),
  )
}

// ─── SYNC NOVU SUBSCRIBER ─────────────────────────────────────────────────────
/**
 * Call after Clerk authentication to upsert the subscriber in Novu.
 * Attach to your auth middleware or a dedicated /auth/sync route.
 */
export const syncNovuSubscriber = asyncHandler(async (req: Request, res: Response) => {
  const { _id: userId, displayName, email, avatar } = req.user

  await syncSubscriber({
    userId:      userId.toString(),
    displayName: displayName ?? 'User',
    email,
    avatarUrl:   avatar,
  })

  sendSuccess(res, null, 'Subscriber synced')
})