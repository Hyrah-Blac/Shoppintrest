import { Request, Response, NextFunction } from 'express'
import Product from '../models/Product'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess, sendPaginated } from '../utils/apiResponse'

// ─── GET ALL PRODUCTS ────────────────────────────────────────────────────────
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 24
  const skip = (page - 1) * limit

  const filter: Record<string, any> = { isPublished: true }

  if (req.query.category) filter.category = req.query.category
  if (req.query.brand) filter.brand = { $regex: req.query.brand, $options: 'i' }
  if (req.query.featured === 'true') filter.isFeatured = true

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {}
    if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice as string)
    if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice as string)
  }

  const sortOptions: Record<string, any> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { saves: -1 },
    rating: { rating: -1 },
  }
  const sort = sortOptions[req.query.sort as string] || { createdAt: -1 }

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ])

  sendPaginated(res, products, total, page, limit)
})

// ─── SEARCH PRODUCTS ─────────────────────────────────────────────────────────
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query
  if (!q) return sendSuccess(res, [])

  const products = await Product.find({
    $text: { $search: q as string },
    isPublished: true,
  })
    .select('title price images brand category rating')
    .limit(30)
    .lean()

  sendSuccess(res, products)
})

// ─── GET SINGLE PRODUCT ──────────────────────────────────────────────────────
export const getProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findOne({
      _id: req.params.id,
      isPublished: true,
    })
      .populate('seller', 'username displayName avatar isVerified')
      .lean()

    if (!product) return next(new AppError('Product not found', 404))

    sendSuccess(res, product)
  }
)

// ─── GET FEATURED PRODUCTS ───────────────────────────────────────────────────
export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ isFeatured: true, isPublished: true })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean()

  sendSuccess(res, products)
})

// ─── GET RELATED PRODUCTS ────────────────────────────────────────────────────
export const getRelatedProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id)
    if (!product) return next(new AppError('Product not found', 404))

    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isPublished: true,
    })
      .limit(8)
      .lean()

    sendSuccess(res, related)
  }
)

// ─── CREATE PRODUCT (admin) ───────────────────────────────────────────────────
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.create({
    ...req.body,
    seller: req.user._id,
  })

  sendSuccess(res, product, 'Product created successfully', 201)
})

// ─── UPDATE PRODUCT (admin) ───────────────────────────────────────────────────
export const updateProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!product) return next(new AppError('Product not found', 404))

    sendSuccess(res, product, 'Product updated successfully')
  }
)

// ─── DELETE PRODUCT (admin) ───────────────────────────────────────────────────
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return next(new AppError('Product not found', 404))

    sendSuccess(res, null, 'Product deleted successfully')
  }
)

// ─── GET TRENDING PRODUCTS ───────────────────────────────────────────────────
export const getTrendingProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ isPublished: true })
    .sort({ saves: -1, rating: -1 })
    .limit(16)
    .lean()

  sendSuccess(res, products)
})