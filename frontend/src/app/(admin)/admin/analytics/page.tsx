'use client'

import { BarChart3 } from 'lucide-react'

export default function AdminAnalyticsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <p
          className="text-[10px] font-medium uppercase tracking-[0.12em] mb-1"
          style={{ color: 'hsl(var(--accent))' }}
        >
          Insights
        </p>
        <h1
          className="font-display text-2xl font-semibold tracking-tight"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
          Deep dive into your store performance
        </p>
      </div>

      <div
        className="rounded-2xl p-16 flex flex-col items-center justify-center text-center"
        style={{
          background: 'hsl(var(--background))',
          border:     '0.5px solid hsl(var(--border))',
          boxShadow:  'var(--shadow-xs)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'hsl(var(--surface))' }}
        >
          <BarChart3 size={24} style={{ color: 'hsl(var(--muted))' }} />
        </div>
        <p className="text-[15px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
          Analytics coming soon
        </p>
        <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>
          Advanced reporting and insights will appear here.
        </p>
      </div>
    </div>
  )
}