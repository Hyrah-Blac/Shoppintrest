'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, ChevronRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

const statusVariant: Record<string, any> = {
  pending: 'warning',
  awaiting_payment: 'warning',
  processing: 'secondary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'destructive',
  refunded: 'destructive',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.orders.getMyOrders()
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-surface">
        <div className="container-narrow py-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            My Orders
          </h1>
          <p className="text-sm text-muted mt-1">
            Track and manage your purchases
          </p>
        </div>
      </div>

      <div className="container-narrow py-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center">
            <Package size={40} className="text-muted mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">No orders yet</p>
            <p className="text-sm text-muted mb-6">
              Your orders will appear here
            </p>
            <Link
              href="/explore"
              className="text-sm font-medium text-foreground underline
                         underline-offset-4 hover:text-[#E60023] transition-colors
                         duration-200"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/orders/${order._id}`} className="group">
                  <div className="p-5 bg-background rounded-2xl border border-border
                                  hover:border-[#E60023]/40 hover:shadow-sm
                                  transition-all duration-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface flex items-center
                                    justify-center shrink-0">
                      <Package size={20} className="text-muted" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <Badge
                          variant={statusVariant[order.status] || 'secondary'}
                          size="sm"
                        >
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {formatDate(order.createdAt)} ·{' '}
                        {order.items.length}{' '}
                        {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                      {order.mpesaReceiptNumber && (
                        <p className="text-xs text-muted font-mono mt-0.5">
                          Receipt: {order.mpesaReceiptNumber}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground">
                        {formatPrice(order.total, 'KES')}
                      </p>
                      <ChevronRight
                        size={16}
                        className="text-muted ml-auto mt-1 group-hover:text-[#E60023]
                                   group-hover:translate-x-0.5 transition-all duration-200"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}