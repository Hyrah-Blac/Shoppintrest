import { Request, Response, NextFunction } from 'express'
import Collection from '../models/Collection'
import User from '../models/User'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess, sendPaginated } from '../utils/apiResponse'

// ─── GET PUBLIC COLLECTIONS ───────────────────────────────────────────────────
export const getCollections = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const [collections, total] = await Promise.all([
    Collection.find({ isPrivate: false })
      .populate('user', 'username displayName avatar')
      .sort({ saves: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Collection.countDocuments({ isPrivate: false }),
  ])

  sendPaginated(res, collections, total, page, limit)
})

// ─── GET SINGLE COLLECTION ───────────────────────────────────────────────────
export const getCollection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const collection = await Collection.findById(req.params.id)
      .populate('user', 'username displayName avatar')
      .populate('products', 'title price images brand category')
      .lean()

    if (!collection) return next(new AppError('Collection not found', 404))
    if (
      collection.isPrivate &&
      collection.user._id.toString() !== req.user?._id?.toString()
    ) {
      return next(new AppError('This collection is private', 403))
    }

    sendSuccess(res, collection)
  }
)

// ─── CREATE COLLECTION ────────────────────────────────────────────────────────
export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, isPrivate } = req.body

  const collection = await Collection.create({
    user: req.user._id,
    title,
    description,
    isPrivate: isPrivate || false,
  })

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { collections: collection._id },
  })

  sendSuccess(res, collection, 'Collection created', 201)
})

// ─── UPDATE COLLECTION ────────────────────────────────────────────────────────
export const updateCollection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const collection = await Collection.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!collection) return next(new AppError('Collection not found', 404))

    const { title, description, isPrivate, coverImage } = req.body
    if (title) collection.title = title
    if (description !== undefined) collection.description = description
    if (isPrivate !== undefined) collection.isPrivate = isPrivate
    if (coverImage) collection.coverImage = coverImage

    await collection.save()
    sendSuccess(res, collection, 'Collection updated')
  }
)

// ─── DELETE COLLECTION ────────────────────────────────────────────────────────
export const deleteCollection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const collection = await Collection.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!collection) return next(new AppError('Collection not found', 404))

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { collections: collection._id },
    })

    sendSuccess(res, null, 'Collection deleted')
  }
)

// ─── ADD / REMOVE PRODUCT FROM COLLECTION ─────────────────────────────────────
export const toggleProductInCollection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const collection = await Collection.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!collection) return next(new AppError('Collection not found', 404))

    const { productId } = req.body
    const hasProduct = collection.products.some(
      (p) => p.toString() === productId
    )

    if (hasProduct) {
      collection.products = collection.products.filter(
        (p) => p.toString() !== productId
      )
      await collection.save()
      sendSuccess(res, collection, 'Product removed from collection')
    } else {
      collection.products.push(productId)
      if (!collection.coverImage) {
        const Product = require('../models/Product').default
        const product = await Product.findById(productId)
        if (product?.images?.[0]?.url) {
          collection.coverImage = product.images[0].url
        }
      }
      await collection.save()
      sendSuccess(res, collection, 'Product added to collection')
    }
  }
)