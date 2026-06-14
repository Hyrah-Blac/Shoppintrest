import { Request, Response, NextFunction } from 'express'
import User from '../models/User'
import Product from '../models/Product'
import Order from '../models/Order'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess, sendPaginated } from '../utils/apiResponse'

// FIX 1 — whitelist of valid roles so updateUserRole can't set arbitrary values
const VALID_ROLES = new Set(['user', 'admin'])

// FIX 2 — explicit field allowlist for user listings so internal fields
// (clerkId, raw tokens, etc.) are never returned even if the model changes
const USER_SAFE_FIELDS = 'username email displayName avatar role isActive isVerified createdAt'

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    paidOrders,
    revenueData,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Product.countDocuments({ isPublished: true }),
    Order.countDocuments(),
    Order.countDocuments({ isPaid: true }),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.find()
      .populate('user', 'username email displayName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Product.find({ isPublished: true })
      .sort({ saves: -1, reviewCount: -1 })
      .limit(5)
      .select('title price images rating reviewCount saves')
      .lean(),
  ])

  const totalRevenue = revenueData[0]?.total || 0

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  sendSuccess(res, {
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      paidOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      conversionRate:
        totalOrders > 0
          ? parseFloat(((paidOrders / totalOrders) * 100).toFixed(1))
          : 0,
    },
    monthlyRevenue,
    recentOrders,
    topProducts,
  })
})

// ─── ADMIN — GET ALL USERS ────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find()
      // FIX 2 — explicit allowlist instead of .select('-__v')
      // clerkId and any internal fields are excluded by default
      .select(USER_SAFE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ])

  sendPaginated(res, users, total, page, limit)
})

// ─── ADMIN — TOGGLE USER ACTIVE ───────────────────────────────────────────────
export const toggleUserActive = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id).select(USER_SAFE_FIELDS)
  if (!user) return next(new AppError('User not found', 404))

  user.isActive = !user.isActive
  await user.save()

  sendSuccess(
    res,
    user,
    user.isActive ? 'User activated' : 'User deactivated'
  )
})

// ─── ADMIN — UPDATE USER ROLE ─────────────────────────────────────────────────
export const updateUserRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body

  // FIX 1 — validate role against whitelist before writing to DB
  if (!role || !VALID_ROLES.has(role)) {
    return next(new AppError(`Invalid role. Must be one of: ${[...VALID_ROLES].join(', ')}`, 400))
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select(USER_SAFE_FIELDS)

  if (!user) return next(new AppError('User not found', 404))

  sendSuccess(res, user, 'User role updated')
})