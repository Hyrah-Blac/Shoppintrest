'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, ShoppingCart, Users, Package,
  DollarSign, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertTriangle,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { apiClient } from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

const PIE_COLORS = [
  'hsl(0 78% 54%)',
  'hsl(220 78% 54%)',
  'hsl(152 48% 38%)',
  'hsl(36 88% 50%)',
  'hsl(280 60% 54%)',
  'hsl(195 78% 42%)',
]

const ORDER_STATUSES = [
  'pending', 'awaiting_payment', 'processing',
  'shipped', 'delivered', 'cancelled',
]

export default function AdminAnalyticsPage() {
  const [stats, setStats]         = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [range, setRange]         = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    apiClient.admin.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const revenueChart = stats?.monthlyRevenue?.map((m: any) => ({
    name:    new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' }),
    revenue: m.revenue,
    orders:  m.orders,
  })) || []

  const statusData = ORDER_STATUSES.map((s) => ({
    name:  s.replace(/_/g, ' '),
    value: stats?.ordersByStatus?.[s] || 0,
  })).filter((d) => d.value > 0)

  const kpis = [
    {
      label: 'Gross Revenue',
      value: stats ? formatPrice(stats.stats.totalRevenue, 'KES') : '—',
      sub:   'All time',
      icon:  DollarSign,
      color: 'hsl(152 48% 38%)',
      bg:    'hsl(152 48% 38% / 0.1)',
      trend: '+12.4%',
      up:    true,
    },
    {
      label: 'Total Orders',
      value: stats?.stats.totalOrders?.toLocaleString() || '—',
      sub:   'All time',
      icon:  ShoppingCart,
      color: 'hsl(220 78% 54%)',
      bg:    'hsl(220 78% 54% / 0.1)',
      trend: '+8.1%',
      up:    true,
    },
    {
      label: 'Customers',
      value: stats?.stats.totalUsers?.toLocaleString() || '—',
      sub:   'Registered',
      icon:  Users,
      color: 'hsl(280 60% 54%)',
      bg:    'hsl(280 60% 54% / 0.1)',
      trend: '+5.3%',
      up:    true,
    },
    {
      label: 'Avg Order Value',
      value: stats
        ? formatPrice(stats.stats.totalRevenue / (stats.stats.totalOrders || 1), 'KES')
        : '—',
      sub:   'Per order',
      icon:  TrendingUp,
      color: 'hsl(36 88% 50%)',
      bg:    'hsl(36 88% 50% / 0.1)',
      trend: '+3.8%',
      up:    true,
    },
    {
      label: 'Conversion Rate',
      value: stats ? `${stats.stats.conversionRate}%` : '—',
      sub:   'Visit → order',
      icon:  TrendingUp,
      color: 'hsl(0 78% 54%)',
      bg:    'hsl(0 78% 54% / 0.1)',
      trend: '-1.2%',
      up:    false,
    },
    {
      label: 'Products Listed',
      value: stats?.stats.totalProducts?.toLocaleString() || '—',
      sub:   'In catalogue',
      icon:  Package,
      color: 'hsl(195 78% 42%)',
      bg:    'hsl(195 78% 42% / 0.1)',
      trend: '+2.0%',
      up:    true,
    },
  ]

  const card = {
    background: 'hsl(var(--background))',
    border:     '0.5px solid hsl(var(--border))',
    boxShadow:  'var(--shadow-xs)',
  }

  const tooltipStyle = {
    contentStyle: {
      background:   'hsl(var(--surface))',
      border:       '0.5px solid hsl(var(--border))',
      borderRadius: '12px',
      fontSize:     '12px',
      color:        'hsl(var(--foreground))',
      boxShadow:    'var(--shadow-md)',
    },
  }

  const healthMetrics = [
    { label: 'Order Defect Rate',   value: '0.4%', target: '< 1%',   ok: true,  desc: 'Cancelled, returned or disputed' },
    { label: 'Late Shipment Rate',  value: '1.2%', target: '< 4%',   ok: true,  desc: 'Shipped after promised date'     },
    { label: 'Cancellation Rate',   value: '0.8%', target: '< 2.5%', ok: true,  desc: 'Pre-fulfilment cancellations'   },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.12em]"
             style={{ color: 'hsl(var(--accent))' }}>
            Insights
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: 'hsl(var(--foreground))' }}>
            Analytics
          </h1>
          <motion.div
            className="h-[2px] w-10 rounded-full"
            style={{ background: 'hsl(var(--accent))' }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          />
          <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
            Business performance overview
          </p>
        </motion.div>

        {/* Range selector */}
        <div
          className="flex rounded-[var(--radius-pill)] p-1 gap-1 self-start mt-1"
          style={{ background: 'hsl(var(--surface))', border: '0.5px solid hsl(var(--border))' }}
        >
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1.5 rounded-[var(--radius-pill)] text-[11px] font-medium
                         transition-all duration-[var(--duration-hover)]"
              style={
                range === r
                  ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }
                  : { color: 'hsl(var(--muted))' }
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-5 transition-all duration-[var(--duration-hover)]"
            style={card}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                {kpi.label}
              </p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ background: kpi.bg }}>
                <kpi.icon size={14} style={{ color: kpi.color }} />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-28 rounded-lg" />
            ) : (
              <>
                <p className="font-display text-2xl font-semibold tracking-tight"
                   style={{ color: 'hsl(var(--foreground))' }}>
                  {kpi.value}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                    {kpi.sub}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {kpi.up
                      ? <ArrowUpRight size={11} className="text-emerald-500" />
                      : <ArrowDownRight size={11} className="text-rose-500" />
                    }
                    <span className={cn('text-[10px] font-medium',
                      kpi.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                      {kpi.trend}
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Revenue chart + Orders by status ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Revenue over time */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-2 rounded-2xl p-6"
          style={card}
        >
          <div className="mb-6">
            <h2 className="text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Revenue Over Time
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
              Monthly gross revenue
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : revenueChart.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm"
                 style={{ color: 'hsl(var(--muted))' }}>
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueChart}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(0 78% 54%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(0 78% 54%)" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name"
                       tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }}
                       axisLine={false} tickLine={false}
                       tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle}
                  formatter={(v: any) => [formatPrice(v, 'KES'), 'Revenue']} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(0 78% 54%)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: 'hsl(0 78% 54%)', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Orders by status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-6"
          style={card}
        >
          <div className="mb-6">
            <h2 className="text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Orders by Status
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
              Current breakdown
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : statusData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm"
                 style={{ color: 'hsl(var(--muted))' }}>
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="42%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  formatter={(v) => (
                    <span style={{ fontSize: '10px', color: 'hsl(var(--muted))' }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* ── Order volume + Top products ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Monthly order volume */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-6"
          style={card}
        >
          <div className="mb-6">
            <h2 className="text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Order Volume
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
              Monthly order count
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : revenueChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm"
                 style={{ color: 'hsl(var(--muted))' }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChart} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name"
                       tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }}
                       axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Orders']} />
                <Bar dataKey="orders" fill="hsl(var(--foreground))"
                     radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Top products */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-6"
          style={card}
        >
          <div className="mb-5">
            <h2 className="text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Top Performing Products
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
              By saves and rating
            </p>
          </div>
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
            <div className="space-y-1">
              {stats?.topProducts?.slice(0, 6).map((p: any, i: number) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-xl
                             transition-colors duration-[var(--duration-hover)]"
                  style={{ borderBottom: i < 5 ? '0.5px solid hsl(var(--border-subtle))' : 'none' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface))')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <span className="text-[10px] font-bold w-4 shrink-0 text-right"
                        style={{ color: 'hsl(var(--muted))' }}>
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
                       style={{ background: 'hsl(var(--surface))' }}>
                    {p.images?.[0]?.url && (
                      <img src={p.images[0].url} alt={p.title}
                           className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate"
                       style={{ color: 'hsl(var(--foreground))' }}>
                      {p.title}
                    </p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>
                      {p.saves} saves · ★ {p.rating}
                    </p>
                  </div>
                  <p className="text-[12px] font-semibold shrink-0"
                     style={{ color: 'hsl(var(--foreground))' }}>
                    {formatPrice(p.price, 'KES')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Store Health ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl p-6"
        style={card}
      >
        <div className="mb-5">
          <h2 className="text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Store Health
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
            Key operational performance indicators
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {healthMetrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-4"
              style={{
                background: m.ok ? 'hsl(152 48% 38% / 0.06)' : 'hsl(var(--destructive) / 0.06)',
                border:     `0.5px solid ${m.ok ? 'hsl(152 48% 38% / 0.2)' : 'hsl(var(--destructive) / 0.2)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                  {m.label}
                </p>
                {m.ok
                  ? <CheckCircle2 size={13} className="text-emerald-500" />
                  : <AlertTriangle size={13} className="text-rose-500" />
                }
              </div>
              <p className="font-display text-2xl font-semibold"
                 style={{ color: m.ok ? 'hsl(152 48% 38%)' : 'hsl(var(--destructive))' }}>
                {m.value}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted))' }}>
                Target: {m.target}
              </p>
              <p className="text-[10px] mt-1.5" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}