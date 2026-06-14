import { Request, Response, NextFunction } from 'express'
import { escape } from 'lodash'
import Review from '../models/Review'
import Product from '../models/Product'
import Order from '../models/Order'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess, sendPaginated } from '../utils/apiResponse'
import { createNotification } from './notification.controller'

// ─── GET REVIEWS FOR PRODUCT ─────────────────────────────────────────────────
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip  = (page - 1) * limit

  const [reviews, total] = await Promise.all([
    Review.find({ product: req.params.productId })
      .populate('user', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: req.params.productId }),
  ])

  sendPaginated(res, reviews, total, page, limit)
})

// ─── CREATE REVIEW ────────────────────────────────────────────────────────────
export const createReview = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { productId } = req.params
    const { rating, title, body, images } = req.body

    // FIX 1 — validate rating is an integer between 1 and 5
    const parsedRating = parseInt(rating, 10)
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return next(new AppError('Rating must be a whole number between 1 and 5', 400))
    }

    // FIX 2 — validate images array: max 5 entries, each must be a valid URL
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return next(new AppError('Images must be an array', 400))
      }
      if (images.length > 5) {
        return next(new AppError('Maximum 5 images allowed per review', 400))
      }
      for (const img of images) {
        if (typeof img !== 'string' || img.length > 500) {
          return next(new AppError('Each image must be a valid URL string', 400))
        }
        try {
          const url = new URL(img)
          if (!['http:', 'https:'].includes(url.protocol)) {
            return next(new AppError('Image URLs must use http or https', 400))
          }
        } catch {
          return next(new AppError(`Invalid image URL: ${img}`, 400))
        }
      }
    }

    const product = await Product.findById(productId)
      .populate('seller', 'username displayName avatar')
    if (!product) return next(new AppError('Product not found', 404))

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    })
    if (existingReview) {
      return next(new AppError('You have already reviewed this product', 400))
    }

    // Check if verified purchase
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      isPaid: true,
    })

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: parsedRating,
      title,
      body,
      images: images || [],
      isVerifiedPurchase: !!hasPurchased,
    })

    // Update product rating
    const allReviews = await Review.find({ product: productId })
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await Product.findByIdAndUpdate(productId, {
      rating:      parseFloat(avgRating.toFixed(1)),
      reviewCount: allReviews.length,
    })

    // Notify the product seller (if not reviewing your own product)
    if (product.seller && product.seller._id.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId:  product.seller._id.toString(),
        senderId:     req.user._id.toString(),
        senderName:   req.user.displayName,
        senderAvatar: req.user.avatar ?? '',
        type:         'review',
        message:      `${escape(req.user.displayName)} left a ${parsedRating}★ review on "${product.title}"`,
        link:         `/product/${productId}`,
      })
    }

    const populated = await review.populate('user', 'username displayName avatar')
    sendSuccess(res, populated, 'Review submitted', 201)
  }
)

// ─── DELETE REVIEW ────────────────────────────────────────────────────────────
export const deleteReview = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Ownership enforced in the query — can't delete someone else's review
    const review = await Review.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    })

    if (!review) return next(new AppError('Review not found', 404))

    // Recalculate rating
    const allReviews = await Review.find({ product: review.product })
    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0

    await Product.findByIdAndUpdate(review.product, {
      rating:      parseFloat(avgRating.toFixed(1)),
      reviewCount: allReviews.length,
    })

    sendSuccess(res, null, 'Review deleted')
  }
)

// ─── MARK REVIEW HELPFUL ─────────────────────────────────────────────────────
export const markHelpful = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const review = await Review.findById(req.params.id)
    if (!review) return next(new AppError('Review not found', 404))

    // FIX 3 — prevent marking your own review as helpful
    if (review.user.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot mark your own review as helpful', 400))
    }

    // FIX 3 — prevent voting more than once by tracking who has voted.
    // helpfulVoters should be a [ObjectId] array on the Review model.
    // If the field doesn't exist yet, add it: helpfulVoters: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    const alreadyVoted = (review as any).helpfulVoters?.some(
      (id: any) => id.toString() === req.user._id.toString()
    )
    if (alreadyVoted) {
      return next(new AppError('You have already marked this review as helpful', 400))
    }

    const updated = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $inc:  { helpful: 1 },
        $push: { helpfulVoters: req.user._id },
      },
      { new: true }
    )

    sendSuccess(res, updated)
  }
)