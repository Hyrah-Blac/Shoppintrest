'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Package, MapPin, CreditCard,
  CheckCircle2, Truck, Copy, Star, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { use } from 'react'
import { apiClient } from '@/lib/api'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

const statusSteps = [
  { key: 'processing', label: 'Confirmed', icon: CheckCircle2, dateField: 'paidAt' as const },
  { key: 'shipped', label: 'Shipped', icon: Truck, dateField: 'shippedAt' as const },
  { key: 'delivered', label: 'Delivered', icon: Package, dateField: 'deliveredAt' as const },
]

// A simple, honest estimate — not a guarantee — shown only while an order
// is in transit and not yet marked delivered. Research on post-purchase
// anxiety (Narvar, Baymard) consistently finds that concrete, dated
// progress reduces "where is my order" uncertainty far more than a status
// label alone, even when nothing about actual shipping speed changes.
const ESTIMATED_DELIVERY_DAYS = 3

const statusVariant: Record<string, any> = {
  pending: 'warning',
  awaiting_payment: 'warning',
  processing: 'secondary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'destructive',
  refunded: 'destructive',
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchOrder = (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setIsLoading(true)
    return apiClient.orders.getOne(id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => {
        setIsLoading(false)
        setIsRefreshing(false)
      })
  }

  useEffect(() => {
    if (!id) return
    fetchOrder()
  }, [id])

  const handleRefreshStatus = () => {
    setIsRefreshing(true)
    fetchOrder({ silent: true })
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Could not copy')
    }
  }

  if (isLoading) {
    return (
      <div className="container-narrow py-12 space-y-6">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container-narrow py-32 text-center">
        <p className="text-4xl mb-4">📦</p>
        <p className="font-medium text-foreground mb-2">Order not found</p>
        <p className="text-sm text-muted mb-6">
          This order may have been removed or doesn&apos;t exist
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium
                     text-foreground border border-border px-5 py-2.5
                     rounded-xl hover:bg-accent transition-all"
        >
          <ArrowLeft size={14} />
          Back to Orders
        </Link>
      </div>
    )
  }

  const currentStepIndex = statusSteps.findIndex(
    (s) => s.key === order.status
  )

  return (
    <div className="min-h-screen bg-surface">
      <div className="container-narrow py-10">

        {/* Back */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm text-muted
                     hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          My Orders
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center
                        justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <button
                onClick={() => copyToClipboard(order._id.slice(-8).toUpperCase(), 'Order number')}
                className="p-1.5 rounded-lg text-muted hover:text-[#E60023]
                           hover:bg-accent transition-all duration-200"
                aria-label="Copy order number"
              >
                <Copy size={13} />
              </button>
            </div>
            <p className="text-sm text-muted mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge
            variant={statusVariant[order.status] || 'secondary'}
            size="lg"
          >
            {order.status.replace(/_/g, ' ')}
          </Badge>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Status Tracker */}
            {!['cancelled', 'refunded', 'pending', 'awaiting_payment'].includes(
              order.status
            ) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-background rounded-2xl border border-border p-6"
              >
                <h2 className="font-medium text-foreground mb-6">
                  Order Progress
                </h2>

                <div className="relative">
                  {/* Background track */}
                  <div className="absolute top-5 left-5 right-5 h-px bg-border" />

                  {/* Progress fill */}
                  <div
                    className="absolute top-5 left-5 h-px bg-[#E60023]
                               transition-all duration-700 ease-out"
                    style={{
                      width:
                        currentStepIndex >= 0
                          ? `${(currentStepIndex / (statusSteps.length - 1)) * 90}%`
                          : '0%',
                    }}
                  />

                  <div className="relative flex justify-between">
                    {statusSteps.map((step, i) => {
                      const isDone = i <= currentStepIndex
                      const isCurrent = i === currentStepIndex
                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center gap-2"
                        >
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                              `w-10 h-10 rounded-full flex items-center
                               justify-center border-2 transition-all duration-500`,
                              isDone
                                ? 'bg-[#E60023] border-[#E60023] shadow-sm'
                                : 'bg-background border-border'
                            )}
                          >
                            <step.icon
                              size={16}
                              className={
                                isDone ? 'text-background' : 'text-muted'
                              }
                            />
                          </motion.div>
                          <p
                            className={cn(
                              'text-xs font-medium transition-colors',
                              isCurrent
                                ? 'text-foreground'
                                : isDone
                                ? 'text-foreground'
                                : 'text-muted'
                            )}
                          >
                            {step.label}
                          </p>
                          {isDone && order[step.dateField] && (
                            <p className="text-[10px] text-muted">
                              {formatDate(order[step.dateField])}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="mt-6 p-4 bg-surface rounded-xl border border-border">
                    <p className="text-xs text-muted mb-1">Tracking Number</p>
                    <p className="text-sm font-mono font-bold tracking-wider">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}

                {order.status === 'shipped' && order.shippedAt && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                    <Truck size={12} />
                    <span>
                      Estimated delivery: {formatDate(
                        new Date(
                          new Date(order.shippedAt).getTime() +
                            ESTIMATED_DELIVERY_DAYS * 24 * 60 * 60 * 1000
                        )
                      )}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Cancelled / Refunded Banner */}
            {['cancelled', 'refunded'].includes(order.status) && (
              <div className="bg-destructive/10 border border-destructive/20
                              rounded-2xl p-5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex
                                items-center justify-center shrink-0">
                  <span className="text-sm">✕</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Order {order.status === 'cancelled' ? 'Cancelled' : 'Refunded'}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {order.status === 'cancelled'
                      ? 'This order was cancelled. No payment was taken.'
                      : 'A refund has been processed to your original payment method.'}
                  </p>
                </div>
              </div>
            )}

            {/* Awaiting Payment — previously this status showed nothing at
                all here (the tracker deliberately excludes it). Give it its
                own panel with a real action instead of leaving the page
                looking stuck with no explanation. */}
            {order.status === 'awaiting_payment' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border
                              border-amber-200 dark:border-amber-800
                              rounded-2xl p-5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex
                                items-center justify-center shrink-0">
                  <CreditCard size={15} className="text-amber-700 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Waiting for M-Pesa payment
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                    If you already entered your M-Pesa PIN, this can take a
                    little while to confirm. Refresh to check the latest status.
                  </p>
                  <button
                    onClick={handleRefreshStatus}
                    disabled={isRefreshing}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs
                               font-medium text-amber-800 dark:text-amber-300
                               border border-amber-300 dark:border-amber-700
                               rounded-lg px-3 py-1.5 hover:bg-amber-100
                               dark:hover:bg-amber-900/40 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-[#E60023]' : ''} />
                    {isRefreshing ? 'Checking…' : 'Refresh status'}
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-background rounded-2xl border border-border p-6"
            >
              <h2 className="font-medium text-foreground mb-5">
                Items ({order.items.length})
              </h2>
              <div className="space-y-5">
                {order.items.map((item: any, i: number) => (
                  <div
                    key={`${item.product}-${item.size}-${i}`}
                    className="flex gap-4 pb-5 border-b border-border
                               last:border-0 last:pb-0"
                  >
                    {/* Product Image */}
                    <Link
                      href={`/product/${item.product}`}
                      className="shrink-0"
                    >
                      <div className="w-16 h-20 rounded-xl overflow-hidden
                                      bg-surface hover:opacity-80 transition-opacity">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={64}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center
                                          justify-center">
                            <Package size={16} className="text-muted" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product}`}>
                        <p className="text-sm font-medium text-foreground
                                       truncate hover:opacity-70 transition-opacity">
                          {item.title}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs bg-surface border border-border
                                         px-2 py-0.5 rounded-lg text-muted">
                          Size {item.size}
                        </span>
                        <span className="text-xs text-muted">
                          Qty {item.quantity}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-2">
                        {formatPrice(item.price * item.quantity, 'KES')}
                      </p>
                      <p className="text-xs text-muted">
                        {formatPrice(item.price, 'KES')} each
                      </p>
                      {order.status === 'delivered' && (
                        <Link
                          href={`/product/${item.product}#reviews`}
                          className="inline-flex items-center gap-1 text-xs
                                     font-medium text-foreground mt-2
                                     hover:text-[#E60023] transition-colors
                                     duration-200 group"
                        >
                          <Star size={11} className="text-[#E60023] group-hover:fill-[#E60023]" />
                          Write a review
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-background rounded-2xl border border-border p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={15} className="text-muted" />
                <h2 className="font-medium text-foreground">
                  Shipping Address
                </h2>
              </div>
              <div className="text-sm space-y-1">
                <p className="font-medium text-foreground">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-muted">{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && (
                  <p className="text-muted">{order.shippingAddress.line2}</p>
                )}
                <p className="text-muted">
                  {order.shippingAddress.city},{' '}
                  {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="text-muted">{order.shippingAddress.country}</p>
              </div>
            </motion.div>
          </div>

          {/* ── Right Column ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-5"
          >

            {/* Summary — order info + payment breakdown together, so
                everything about the order lives in one place instead of
                being split across three separate cards. */}
            <div className="bg-background rounded-2xl border border-border p-6
                            lg:sticky lg:top-28 space-y-5">
              <div className="flex items-center gap-2">
                <CreditCard size={15} className="text-muted" />
                <h2 className="font-medium text-foreground">Order Summary</h2>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Order ID</span>
                  <button
                    onClick={() => copyToClipboard(order._id.slice(-8).toUpperCase(), 'Order number')}
                    className="flex items-center gap-1 font-mono text-xs text-foreground
                               hover:text-[#E60023] transition-colors duration-200 group"
                  >
                    #{order._id.slice(-8).toUpperCase()}
                    <Copy size={10} className="text-muted group-hover:text-[#E60023]" />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Date</span>
                  <span className="text-foreground">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Payment method</span>
                  <span className="text-foreground">M-Pesa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Items</span>
                  <span className="text-foreground">{order.items.length}</span>
                </div>
              </div>

              <div className="border-t border-border" />

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-foreground">
                    {formatPrice(order.subtotal, 'KES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span className="text-foreground">
                    {order.shippingCost === 0
                      ? 'Free'
                      : formatPrice(order.shippingCost, 'KES')}
                  </span>
                </div>
                {/* No tax/VAT is charged, so no line item for it here. */}
                <div className="border-t border-border pt-2.5 flex justify-between
                                font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(order.total, 'KES')}</span>
                </div>
              </div>

              {/* M-Pesa Receipt */}
              {order.mpesaReceiptNumber && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20
                                rounded-xl border border-green-200
                                dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex
                                    items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                    <p className="text-xs font-medium text-green-700
                                  dark:text-green-400">
                      M-Pesa Payment Confirmed
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(order.mpesaReceiptNumber, 'Receipt number')}
                    className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                  >
                    <span className="font-mono font-bold text-base text-green-800
                                     dark:text-green-300 tracking-wider">
                      {order.mpesaReceiptNumber}
                    </span>
                    <Copy size={12} className="text-green-700 dark:text-green-400" />
                  </button>
                  {order.paidAt && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Paid on {formatDate(order.paidAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}