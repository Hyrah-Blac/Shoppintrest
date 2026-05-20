import { Request, Response } from 'express'
import User from '../models/User'
import Product from '../models/Product'
import Order from '../models/Order'
import asyncHandler from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'

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

  // Monthly revenue (last 6 months)
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
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ])

  res.status(200).json({
    success: true,
    data: users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

// ─── ADMIN — TOGGLE USER ACTIVE ───────────────────────────────────────────────
export const toggleUserActive = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })

  user.isActive = !user.isActive
  await user.save()

  sendSuccess(
    res,
    user,
    user.isActive ? 'User activated' : 'User deactivated'
  )
})

// ─── ADMIN — UPDATE USER ROLE ─────────────────────────────────────────────────
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  )
  sendSuccess(res, user, 'User role updated')
})