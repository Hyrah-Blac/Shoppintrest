'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrendingUp, Users, Package, ShoppingCart,
  DollarSign, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { apiClient } from '@/lib/api'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

const statusVariant: Record<string, any> = {
  pending:          'warning',
  awaiting_payment: 'warning',
  processing:       'secondary',
  shipped:          'secondary',
  delivered:        'success',
  cancelled:        'destructive',
}

export default function AdminDashboard() {
  const [stats, setStats]       = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.admin.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const chartData = stats?.monthlyRevenue?.map((m: any) => ({
    name: new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' }),
    revenue: m.revenue,
    orders:  m.orders,
  })) || []

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats ? formatPrice(stats.stats.totalRevenue, 'KES') : '—',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg:    'bg-emerald-50 dark:bg-emerald-900/20',
      trend: '+12%',
      up:    true,
    },
    {
      label: 'Total Users',
      value: stats?.stats.totalUsers?.toLocaleString() || '—',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg:    'bg-blue-50 dark:bg-blue-900/20',
      trend: '+8%',
      up:    true,
    },
    {
      label: 'Total Orders',
      value: stats?.stats.totalOrders?.toLocaleString() || '—',
      icon: ShoppingCart,
      color: 'text-violet-600 dark:text-violet-400',
      bg:    'bg-violet-50 dark:bg-violet-900/20',
      trend: '+5%',
      up:    true,
    },
    {
      label: 'Products Listed',
      value: stats?.stats.totalProducts?.toLocaleString() || '—',
      icon: Package,
      color: 'text-amber-600 dark:text-amber-400',
      bg:    'bg-amber-50 dark:bg-amber-900/20',
      trend: '+2%',
      up:    true,
    },
    {
      label: 'Conversion Rate',
      value: stats ? `${stats.stats.conversionRate}%` : '—',
      icon: TrendingUp,
      color: 'text-rose-600 dark:text-rose-400',
      bg:    'bg-rose-50 dark:bg-rose-900/20',
      trend: '-1.2%',
      up:    false,
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* Header */}
      <div>
        <p
          className="text-[10px] font-medium uppercase tracking-[0.12em] mb-1"
          style={{ color: 'hsl(var(--accent))' }}
        >
          Overview
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: 'hsl(var(--foreground))' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted))' }}>
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-5 space-y-4"
            style={{
              background:  'hsl(var(--background))',
              border:      '0.5px solid hsl(var(--border))',
              boxShadow:   'var(--shadow-xs)',
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                {card.label}
              </p>
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', card.bg)}>
                <card.icon size={14} className={card.color} />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight"
                   style={{ color: 'hsl(var(--foreground))' }}>
                  {card.value}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {card.up
                    ? <ArrowUpRight size={11} className="text-emerald-500" />
                    : <ArrowDownRight size={11} className="text-rose-500" />
                  }
                  <span className={cn(
                    'text-[10px] font-medium',
                    card.up ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {card.trend} vs last month
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Revenue Chart */}
        <div
          className="xl:col-span-2 rounded-2xl p-6"
          style={{
            background: 'hsl(var(--background))',
            border:     '0.5px solid hsl(var(--border))',
            boxShadow:  'var(--shadow-xs)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[14px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                Revenue Overview
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
                Last 6 months
              </p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm"
                 style={{ color: 'hsl(var(--muted))' }}>
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background:   'hsl(var(--surface))',
                    border:       '0.5px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize:     '12px',
                    color:        'hsl(var(--foreground))',
                    boxShadow:    'var(--shadow-md)',
                  }}
                  formatter={(value: any) => [formatPrice(value, 'KES'), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--accent))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'hsl(var(--background))',
            border:     '0.5px solid hsl(var(--border))',
            boxShadow:  'var(--shadow-xs)',
          }}
        >
          <h2 className="text-[14px] font-medium mb-5"
              style={{ color: 'hsl(var(--foreground))' }}>
            Top Products
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.topProducts?.map((product: any, i: number) => (
                <div key={product._id} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold w-4"
                        style={{ color: 'hsl(var(--muted))' }}>
                    {i + 1}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl shrink-0 overflow-hidden"
                    style={{ background: 'hsl(var(--surface))' }}
                  >
                    {product.images?.[0]?.url && (
                      <img
                        src={product.images[0].url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate"
                       style={{ color: 'hsl(var(--foreground))' }}>
                      {product.title}
                    </p>
                    <p className="text-[11px] mt-0.5"
                       style={{ color: 'hsl(var(--muted))' }}>
                      {product.saves} saves · ★{product.rating}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold shrink-0"
                     style={{ color: 'hsl(var(--foreground))' }}>
                    {formatPrice(product.price, 'KES')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'hsl(var(--background))',
          border:     '0.5px solid hsl(var(--border))',
          boxShadow:  'var(--shadow-xs)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[14px] font-medium"
              style={{ color: 'hsl(var(--foreground))' }}>
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-[11px] transition-colors duration-[var(--duration-hover)]"
            style={{ color: 'hsl(var(--muted))' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
            onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted))')}
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-[11px]"
                  style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
                >
                  {['Order', 'Customer', 'Status', 'Date', 'Total'].map((h, i) => (
                    <th
                      key={h}
                      className={cn('pb-3 font-medium', i === 4 && 'text-right')}
                      style={{ color: 'hsl(var(--muted))' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.map((order: any) => (
                  <tr
                    key={order._id}
                    className="transition-colors duration-[var(--duration-hover)]"
                    style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface))')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td className="py-3.5 font-mono text-[11px]"
                        style={{ color: 'hsl(var(--muted))' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3.5">
                      <p className="text-[13px] font-medium"
                         style={{ color: 'hsl(var(--foreground))' }}>
                        {order.user?.displayName}
                      </p>
                      <p className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                        {order.user?.email}
                      </p>
                    </td>
                    <td className="py-3.5">
                      <Badge variant={statusVariant[order.status] || 'secondary'} size="sm">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-[11px]"
                        style={{ color: 'hsl(var(--muted))' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3.5 text-right text-[13px] font-semibold"
                        style={{ color: 'hsl(var(--foreground))' }}>
                      {formatPrice(order.total, 'KES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}