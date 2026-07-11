import { Request, Response, NextFunction } from 'express'
import Cart from '../models/Cart'
import Product from '../models/Product'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess } from '../utils/apiResponse'

// ─── GET CART ────────────────────────────────────────────────────────────────
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: 'items.product',
      select: 'title price images brand variants totalInventory isPublished',
    })
    .lean()

  if (!cart) {
    cart = { user: req.user._id, items: [], updatedAt: new Date() } as any
  }

  sendSuccess(res, cart)
})

// ─── ADD TO CART ─────────────────────────────────────────────────────────────
export const addToCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { productId, size, quantity = 1 } = req.body

    const product = await Product.findOne({ _id: productId, isPublished: true })
    if (!product) return next(new AppError('Product not found', 404))

    const variant = product.variants.find((v) => v.size === size)
    if (!variant) return next(new AppError('Size not available', 400))
    if (variant.inventory < quantity) {
      return next(new AppError(`Only ${variant.inventory} items left in stock`, 400))
    }

    let cart = await Cart.findOne({ user: req.user._id })

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, size, quantity }],
      })
    } else {
      const existingIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId && item.size === size
      )

      if (existingIndex > -1) {
        const newQty = cart.items[existingIndex].quantity + quantity
        if (newQty > 10) return next(new AppError('Maximum 10 items per product', 400))
        // FIX — the total requested quantity could now exceed stock even
        // though the initial add-to-cart passed. Re-check against the same
        // variant before committing the bump.
        if (newQty > variant.inventory) {
          return next(new AppError(`Only ${variant.inventory} items left in stock`, 400))
        }
        cart.items[existingIndex].quantity = newQty
      } else {
        cart.items.push({ product: productId as any, size, quantity })
      }

      await cart.save()
    }

    const populated = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'title price images brand variants',
    })

    sendSuccess(res, populated, 'Added to cart')
  }
)

// ─── UPDATE CART ITEM ────────────────────────────────────────────────────────
export const updateCartItem = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { quantity } = req.body
    const { productId, size } = req.params

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) return next(new AppError('Cart not found', 404))

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    )

    if (itemIndex === -1) return next(new AppError('Item not found in cart', 404))

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1)
    } else {
      // FIX — this previously only capped quantity at 10 without checking
      // whether that many units are actually still in stock. A customer
      // could sit on a cart, stock could sell out or drop elsewhere, and
      // bumping the quantity here wouldn't surface that until checkout
      // failed. Re-check the same variant used by addToCart.
      const product = await Product.findOne({ _id: productId, isPublished: true })
      if (!product) return next(new AppError('Product is no longer available', 400))

      const variant = product.variants.find((v) => v.size === size)
      if (!variant) return next(new AppError('Size no longer available', 400))

      const cappedQuantity = Math.min(quantity, 10)
      if (cappedQuantity > variant.inventory) {
        return next(new AppError(`Only ${variant.inventory} items left in stock`, 400))
      }

      cart.items[itemIndex].quantity = cappedQuantity
    }

    await cart.save()

    const populated = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'title price images brand variants',
    })

    sendSuccess(res, populated, 'Cart updated')
  }
)

// ─── REMOVE FROM CART ────────────────────────────────────────────────────────
export const removeFromCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { productId, size } = req.params

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) return next(new AppError('Cart not found', 404))

    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === productId && item.size === size)
    )

    await cart.save()
    sendSuccess(res, cart, 'Item removed from cart')
  }
)

// ─── CLEAR CART ───────────────────────────────────────────────────────────────
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [] },
    { new: true }
  )
  sendSuccess(res, null, 'Cart cleared')
})