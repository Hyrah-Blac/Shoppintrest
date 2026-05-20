'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Package, MapPin, CreditCard,
  CheckCircle2, Clock, Truck, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

const statusSteps = [
  { key: 'processing', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
]

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
  params: { id: string }
}) {
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.orders.getOne(params.id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setIsLoading(false))
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container-narrow py-12 space-y-6">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container-narrow py-32 text-center">
        <p className="text-muted">Order not found</p>
        <Link href="/orders" className="text-foreground underline text-sm mt-2">
          Back to orders
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
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm text-muted
                     hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          My Orders
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center
                        justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-muted mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge
            variant={statusVariant[order.status] || 'secondary'}
            size="lg"
          >
            {order.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Status Tracker */}
            {!['cancelled', 'refunded', 'pending', 'awaiting_payment'].includes(
              order.status
            ) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background rounded-2xl border border-border p-6"
              >
                <h2 className="font-medium text-foreground mb-5">
                  Order Progress
                </h2>
                <div className="relative">
                  {/* Track line */}
                  <div className="absolute top-5 left-5 right-5 h-px bg-border" />
                  <div
                    className="absolute top-5 left-5 h-px bg-foreground transition-all duration-700"
                    style={{
                      width: `${
                        currentStepIndex >= 0
                          ? (currentStepIndex / (statusSteps.length - 1)) * 100
                          : 0
                      }%`,
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
                          <div
                            className={cn(
                              `w-10 h-10 rounded-full flex items-center
                               justify-center border-2 transition-all duration-300`,
                              isDone
                                ? 'bg-foreground border-foreground'
                                : 'bg-background border-border'
                            )}
                          >
                            <step.icon
                              size={16}
                              className={
                                isDone ? 'text-background' : 'text-muted'
                              }
                            />
                          </div>
                          <p
                            className={cn(
                              'text-xs font-medium',
                              isCurrent ? 'text-foreground' : 'text-muted'
                            )}
                          >
                            {step.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="mt-5 p-3 bg-surface rounded-xl border border-border">
                    <p className="text-xs text-muted">Tracking Number</p>
                    <p className="text-sm font-mono font-semibold mt-0.5">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Items */}
            <div className="bg-background rounded-2xl border border-border p-6">
              <h2 className="font-medium text-foreground mb-4">
                Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div
                    key={`${item.product}-${item.size}`}
                    className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-20 rounded-xl overflow-hidden
                                    bg-surface shrink-0">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={64}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        Size {item.size} · Qty {item.quantity}
                      </p>
                      <p className="text-sm font-semibold mt-2">
                        {formatPrice(item.price * item.quantity, 'KES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-background rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={15} className="text-muted" />
                <h2 className="font-medium text-foreground">Shipping Address</h2>
              </div>
              <div className="text-sm text-muted space-y-0.5">
                <p className="text-foreground font-medium">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && (
                  <p>{order.shippingAddress.line2}</p>
                )}
                <p>
                  {order.shippingAddress.city},{' '}
                  {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div className="space-y-5">
            {/* Payment */}
            <div className="bg-background rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={15} className="text-muted" />
                <h2 className="font-medium text-foreground">Payment</h2>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(order.subtotal, 'KES')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span>
                    {order.shippingCost === 0
                      ? 'Free'
                      : formatPrice(order.shippingCost, 'KES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">VAT</span>
                  <span>{formatPrice(order.tax, 'KES')}</span>
                </div>
                <div className="border-t border-border pt-2.5 flex justify-between
                                font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total, 'KES')}</span>
                </div>
              </div>

              {order.mpesaReceiptNumber && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20
                                rounded-xl border border-green-200
                                dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                    M-Pesa Receipt
                  </p>
                  <p className="font-mono font-bold text-sm text-green-800
                                dark:text-green-300">
                    {order.mpesaReceiptNumber}
                  </p>
                  {order.paidAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Paid on {formatDate(order.paidAt)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Help */}
            <div className="bg-background rounded-2xl border border-border p-6">
              <h2 className="font-medium text-foreground mb-3">Need Help?</h2>
              <div className="space-y-2">
                <Link
                  href="/help"
                  className="block text-sm text-muted hover:text-foreground
                             transition-colors"
                >
                  Contact support →
                </Link>
                <Link
                  href="/returns"
                  className="block text-sm text-muted hover:text-foreground
                             transition-colors"
                >
                  Return policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}