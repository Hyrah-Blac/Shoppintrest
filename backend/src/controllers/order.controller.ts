import { Request, Response, NextFunction } from 'express'
import Order from '../models/Order'
import Cart from '../models/Cart'
import Product from '../models/Product'
import { initiateStkPush, queryStkStatus } from '../config/mpesa'
import asyncHandler from '../utils/asyncHandler'
import AppError from '../utils/AppError'
import { sendSuccess, sendPaginated } from '../utils/apiResponse'
import logger from '../utils/logger'

const SHIPPING_FREE_THRESHOLD = 200   // KES equivalent threshold
const SHIPPING_STANDARD_COST = 300    // KES
const TAX_RATE = 0.16                 // 16% VAT Kenya

const calculateOrderTotals = (items: { price: number; quantity: number }[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_STANDARD_COST
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2))
  const total = parseFloat((subtotal + shippingCost + tax).toFixed(2))
  return { subtotal, shippingCost, tax, total }
}

// ─── INITIATE STK PUSH ────────────────────────────────────────────────────────
export const initiateMpesaPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shippingAddress, phone } = req.body

    if (!phone) return next(new AppError('Phone number is required for M-Pesa payment', 400))

    // Validate phone format
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 9 || cleaned.length > 12) {
      return next(new AppError('Invalid phone number. Use format: 07XXXXXXXX or 254XXXXXXXXX', 400))
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product')
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Your cart is empty', 400))
    }

    // Build order items — server-side prices only
    const orderItems = await Promise.all(
      cart.items.map(async (item: any) => {
        const product = await Product.findOne({
          _id: item.product._id,
          isPublished: true,
        })

        if (!product) {
          throw new AppError(`"${item.product.title}" is no longer available`, 400)
        }

        const variant = product.variants.find((v) => v.size === item.size)
        if (!variant || variant.inventory < item.quantity) {
          throw new AppError(
            `Not enough stock for "${product.title}" in size ${item.size}`,
            400
          )
        }

        return {
          product: product._id,
          title: product.title,
          image: product.images[0]?.url || '',
          price: product.price,       // SERVER price — never trust frontend
          size: item.size,
          quantity: item.quantity,
        }
      })
    )

    const { subtotal, shippingCost, tax, total } = calculateOrderTotals(orderItems)

    // Create pending order first
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      tax,
      total,
      status: 'awaiting_payment',
      mpesaPhone: phone,
      isPaid: false,
      isDelivered: false,
    })

    // Initiate STK Push
    try {
      const stkResponse = await initiateStkPush({
        phone,
        amount: total,
        orderId: order._id.toString(),
        description: `Shoppintrest Order #${order._id.toString().slice(-6).toUpperCase()}`,
      })

      if (stkResponse.ResponseCode !== '0') {
        await Order.findByIdAndDelete(order._id)
        return next(new AppError(stkResponse.ResponseDescription || 'M-Pesa request failed', 400))
      }

      // Save M-Pesa request IDs to order
      order.mpesaCheckoutRequestId = stkResponse.CheckoutRequestID
      order.mpesaMerchantRequestId = stkResponse.MerchantRequestID
      await order.save()

      sendSuccess(
        res,
        {
          orderId: order._id,
          checkoutRequestId: stkResponse.CheckoutRequestID,
          merchantRequestId: stkResponse.MerchantRequestID,
          message: stkResponse.CustomerMessage,
          total,
          subtotal,
          shippingCost,
          tax,
        },
        'STK Push sent to your phone. Enter your M-Pesa PIN to complete payment.',
        201
      )
    } catch (err: any) {
      // Clean up pending order if STK push fails
      await Order.findByIdAndDelete(order._id)
      logger.error('STK Push error:', err?.response?.data || err.message)
      return next(
        new AppError(
          err?.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment. Try again.',
          500
        )
      )
    }
  }
)

// ─── M-PESA CALLBACK (Safaricom calls this) ───────────────────────────────────
export const mpesaCallback = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('M-Pesa callback received:', JSON.stringify(req.body, null, 2))

    const callbackData = req.body?.Body?.stkCallback

    if (!callbackData) {
      logger.warn('Invalid M-Pesa callback payload')
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callbackData

    const order = await Order.findOne({ mpesaCheckoutRequestId: CheckoutRequestID })

    if (!order) {
      logger.warn(`No order found for CheckoutRequestID: ${CheckoutRequestID}`)
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    // Payment successful
    if (ResultCode === 0) {
      // Extract metadata items
      const metadata: Record<string, any> = {}
      CallbackMetadata?.Item?.forEach((item: { Name: string; Value: any }) => {
        metadata[item.Name] = item.Value
      })

      order.isPaid = true
      order.paidAt = new Date()
      order.status = 'processing'
      order.mpesaReceiptNumber = metadata['MpesaReceiptNumber']
      order.mpesaResultCode = ResultCode
      order.mpesaResultDesc = ResultDesc

      await order.save()

      // Deduct inventory
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'variants.size': item.size },
          {
            $inc: {
              'variants.$.inventory': -item.quantity,
              totalInventory: -item.quantity,
            },
          }
        )
      }

      // Clear user cart
      await Cart.findOneAndUpdate({ user: order.user }, { items: [] })

      logger.info(
        `✅ M-Pesa payment confirmed — Order ${order._id} — Receipt: ${metadata['MpesaReceiptNumber']}`
      )
    } else {
      // Payment failed or cancelled
      order.status = 'cancelled'
      order.mpesaResultCode = ResultCode
      order.mpesaResultDesc = ResultDesc
      await order.save()

      logger.warn(`❌ M-Pesa payment failed — Order ${order._id} — ${ResultDesc}`)
    }

    // Always respond 200 to Safaricom
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
)

// ─── POLL PAYMENT STATUS (frontend polls this) ────────────────────────────────
export const checkPaymentStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    })

    if (!order) return next(new AppError('Order not found', 404))

    // If still pending, query Safaricom directly
    if (!order.isPaid && order.status === 'awaiting_payment' && order.mpesaCheckoutRequestId) {
      try {
        const queryResult = await queryStkStatus(order.mpesaCheckoutRequestId)

        // 0 = success, 1032 = cancelled by user, 1037 = timeout
        if (queryResult.ResultCode === '0') {
          // Callback may not have fired yet — mark paid optimistically
          sendSuccess(res, {
            status: 'processing',
            isPaid: true,
            orderId: order._id,
          })
          return
        }

        if (['1032', '1037'].includes(queryResult.ResultCode)) {
          sendSuccess(res, {
            status: 'cancelled',
            isPaid: false,
            orderId: order._id,
            message: queryResult.ResultDesc,
          })
          return
        }
      } catch {
        // Query failed — return current DB state
      }
    }

    sendSuccess(res, {
      status: order.status,
      isPaid: order.isPaid,
      orderId: order._id,
      mpesaReceiptNumber: order.mpesaReceiptNumber,
      paidAt: order.paidAt,
    })
  }
)

// ─── GET MY ORDERS ────────────────────────────────────────────────────────────
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ])

  sendPaginated(res, orders, total, page, limit)
})

// ─── GET SINGLE ORDER ─────────────────────────────────────────────────────────
export const getOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean()

    if (!order) return next(new AppError('Order not found', 404))
    sendSuccess(res, order)
  }
)

// ─── ADMIN — GET ALL ORDERS ───────────────────────────────────────────────────
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const filter: Record<string, any> = {}
  if (req.query.status) filter.status = req.query.status

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'username email displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ])

  sendPaginated(res, orders, total, page, limit)
})

// ─── ADMIN — UPDATE ORDER STATUS ─────────────────────────────────────────────
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, trackingNumber } = req.body

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(trackingNumber && { trackingNumber }),
        ...(status === 'delivered' && {
          isDelivered: true,
          deliveredAt: new Date(),
        }),
      },
      { new: true }
    )

    if (!order) return next(new AppError('Order not found', 404))
    sendSuccess(res, order, 'Order status updated')
  }
)