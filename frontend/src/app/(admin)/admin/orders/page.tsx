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
  pending:          'warning',
  awaiting_payment: 'warning',
  processing:       'secondary',
  shipped:          'secondary',
  delivered:        'success',
  cancelled:        'destructive',
  refunded:         'destructive',
}

export default function AdminOrdersPage() {
  const [orders, setOrders]         = useState<any[]>([])
  const [isLoading, setIsLoading]   = useState(true)
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
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)))
      toast.success('Order status updated')
    } catch { toast.error('Could not update order') }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div>
        <p
          className="text-[10px] font-medium uppercase tracking-[0.12em] mb-1"
          style={{ color: 'hsl(var(--accent))' }}
        >
          Management
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: 'hsl(var(--foreground))' }}>
          Orders
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
          Manage and track all customer orders
        </p>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-4 py-2 rounded-[var(--radius-pill)] text-[12px] font-medium
                       whitespace-nowrap transition-all duration-[var(--duration-hover)]"
            style={
              statusFilter === s
                ? {
                    background: 'hsl(var(--foreground))',
                    color:      'hsl(var(--background))',
                  }
                : {
                    background:  'hsl(var(--background))',
                    color:       'hsl(var(--muted))',
                    border:      '0.5px solid hsl(var(--border))',
                  }
            }
            onMouseEnter={e => {
              if (statusFilter !== s) {
                e.currentTarget.style.color = 'hsl(var(--foreground))'
                e.currentTarget.style.borderColor = 'hsl(var(--foreground) / 0.3)'
              }
            }}
            onMouseLeave={e => {
              if (statusFilter !== s) {
                e.currentTarget.style.color = 'hsl(var(--muted))'
                e.currentTarget.style.borderColor = 'hsl(var(--border))'
              }
            }}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(var(--background))',
          border:     '0.5px solid hsl(var(--border))',
          boxShadow:  'var(--shadow-xs)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-[11px]"
                style={{
                  borderBottom: '0.5px solid hsl(var(--border))',
                  color: 'hsl(var(--muted))',
                }}
              >
                {['Order ID', 'Customer', 'M-Pesa Receipt', 'Date', 'Status', 'Total'].map((h, i) => (
                  <th
                    key={h}
                    className={cn('px-5 py-4 font-medium', i === 5 && 'text-right')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-20 text-center text-sm"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="transition-colors duration-[var(--duration-hover)]"
                    style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface))')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td className="px-5 py-4 font-mono text-[11px]"
                        style={{ color: 'hsl(var(--muted))' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-medium"
                         style={{ color: 'hsl(var(--foreground))' }}>
                        {order.user?.displayName}
                      </p>
                      <p className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                        {order.user?.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px]"
                        style={{ color: 'hsl(var(--foreground))' }}>
                      {order.mpesaReceiptNumber || (
                        <span style={{ color: 'hsl(var(--muted))' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[11px]"
                        style={{ color: 'hsl(var(--muted))' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="text-[11px] rounded-[8px] px-2 py-1.5 cursor-pointer
                                   focus:outline-none transition-all duration-[var(--duration-hover)]"
                        style={{
                          border:     '0.5px solid hsl(var(--border))',
                          background: 'hsl(var(--surface))',
                          color:      'hsl(var(--foreground))',
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right text-[13px] font-semibold"
                        style={{ color: 'hsl(var(--foreground))' }}>
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