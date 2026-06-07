'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, ArrowUpRight, MoveRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { MasonryGrid } from '@/components/product/MasonryGrid'

export function MasonryPreview() {
  const [products,  setProducts]  = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.products
      .getAll({ limit: 20, sort: 'newest' })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section className="section-padding relative overflow-hidden">

      {/* Top hairline accent — matches TrendingSection */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.35) 50%, transparent 100%)',
        }}
      />

      <div className="container-wide relative">

        {/* ── Section Header ── */}
        <div className="flex items-end justify-between mb-12 lg:mb-16">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow pill — matches TrendingSection */}
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  background: 'hsl(var(--accent-muted))',
                  border:     '0.5px solid hsl(var(--accent) / 0.2)',
                }}
              >
                <Sparkles
                  size={11}
                  strokeWidth={2}
                  style={{ color: 'hsl(var(--accent))' }}
                />
                <span
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  Discover
                </span>
              </span>
            </div>

            {/* Headline */}
            <h2
              className="font-display font-bold tracking-[-0.03em] leading-[1.05]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, var(--text-section))' }}
            >
              Just{' '}
              <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
                Arrived
              </em>
            </h2>

            {/* Accent underline */}
            <motion.div
              className="mt-4 h-[1.5px] w-10 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          {/* Desktop "Explore all" — circle arrow, matches TrendingSection */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="hidden sm:block"
          >
            <Link
              href="/explore"
              className="group inline-flex items-center gap-3 text-[11px] font-medium
                         tracking-[0.1em] uppercase transition-colors duration-200"
              style={{ color: 'hsl(var(--muted))' }}
            >
              Explore all
              <span
                className="inline-flex items-center justify-center rounded-full
                           transition-all duration-300
                           group-hover:border-[hsl(var(--foreground))]
                           group-hover:text-[hsl(var(--foreground))]"
                style={{
                  width:  '32px',
                  height: '32px',
                  border: '0.5px solid hsl(var(--border))',
                  color:  'hsl(var(--muted))',
                }}
              >
                <ArrowUpRight size={12} strokeWidth={1.75} />
              </span>
            </Link>
          </motion.div>
        </div>

        {/* ── Masonry Grid ── */}
        <MasonryGrid
          products={products}
          isLoading={isLoading}
          skeletonCount={10}
        />

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 flex flex-col items-center gap-4"
        >
          {/* Primary CTA — circle arrow style matching hero */}
          <Link
            href="/explore"
            className="group inline-flex items-center gap-3
                       text-[12px] font-medium tracking-[0.12em] uppercase
                       transition-all duration-300"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            Explore Everything
            <span
              className="inline-flex items-center justify-center rounded-full
                         transition-all duration-300
                         group-hover:bg-[hsl(var(--foreground))]
                         group-hover:text-[hsl(var(--background))]"
              style={{
                width:  '36px',
                height: '36px',
                border: '0.5px solid hsl(var(--border))',
                color:  'hsl(var(--foreground))',
              }}
            >
              <ArrowUpRight size={13} strokeWidth={1.75} />
            </span>
          </Link>

          {/* Mobile secondary "See all" text link */}
          <div className="sm:hidden">
            <Link
              href="/explore"
              className="group inline-flex items-center gap-2 text-[11px] font-medium
                         tracking-[0.1em] uppercase transition-colors duration-200"
              style={{ color: 'hsl(var(--muted))' }}
            >
              See all new arrivals
              <MoveRight
                size={13}
                strokeWidth={1.5}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  )
}