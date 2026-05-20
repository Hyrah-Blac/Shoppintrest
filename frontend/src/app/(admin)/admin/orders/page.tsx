'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

const STATUS_OPTIONS = [
  'pending', 'awaiting_payment', 'processing',
  'shipped', 'delivered', 'cancelled', 'refunded',
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setIsLoading(true)
    apiClient.admin.getOrders({ status: statusFilter || undefined })
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [statusFilter])

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await apiClient.admin.updateOrderStatus(orderId, { status })
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o))
      )
      toast.success('Order status updated')
    } catch { toast.error('Could not update order') }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Manage and track all customer orders
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              `px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
               transition-all duration-200`,
              statusFilter === s
                ? 'bg-foreground text-background'
                : 'bg-surface text-muted hover:text-foreground border border-border'
            )}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-4 font-medium">Order ID</th>
                <th className="px-5 py-4 font-medium">Customer</th>
                <th className="px-5 py-4 font-medium">M-Pesa Receipt</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted text-sm">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-surface transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-muted">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">
                        {order.user?.displayName}
                      </p>
                      <p className="text-xs text-muted">{order.user?.email}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      {order.mpesaReceiptNumber || (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order._id, e.target.value)
                        }
                        className="text-xs border border-border rounded-lg px-2 py-1
                                   bg-background text-foreground focus:outline-none
                                   focus:ring-1 focus:ring-ring cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {formatPrice(order.total, 'KES')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}