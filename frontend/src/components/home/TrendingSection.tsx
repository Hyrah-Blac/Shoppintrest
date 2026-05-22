'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

export function TrendingSection() {
  const [products,  setProducts]  = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.products.getTrending()
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section
      className="section-padding relative overflow-hidden"
      style={{ background: 'hsl(var(--surface))' }}
    >
      {/* Top accent line — Pinterest red */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.4), transparent)',
        }}
      />

      <div className="container-wide">

        {/* ── Section Header ── */}
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center"
                style={{ background: 'hsl(var(--accent-muted))' }}
              >
                <TrendingUp size={12} style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <span className="eyebrow">Right Now</span>
            </div>

            {/* Headline */}
            <h2
              className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, var(--text-section))' }}
            >
              What's{' '}
              <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
                Trending
              </em>
            </h2>

            {/* Accent underline */}
            <motion.div
              className="mt-4 h-[2px] w-12 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Link
              href="/explore?sort=popular"
              className="group hidden sm:flex items-center gap-2 text-sm font-medium
                         text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]
                         transition-colors duration-[var(--duration-hover)]"
            >
              See all
              <ArrowRight
                size={14}
                className="transition-transform duration-[var(--duration-hover)]
                           group-hover:translate-x-0.5"
              />
            </Link>
          </motion.div>
        </div>

        {/* ── Horizontal Scroll Strip ── */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-48 shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : products.slice(0, 12).map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      delay: i * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                      duration: 0.4,
                    }}
                    className="w-48 sm:w-56 shrink-0"
                  >
                    {/* Rank badge — top 3 only */}
                    <div className="relative">
                      {i < 3 && (
                        <div
                          className="badge badge-red absolute -top-2 -left-2 z-10
                                     w-6 h-6 shadow-[var(--shadow-red)]"
                          style={{ padding: 0 }}
                        >
                          {i + 1}
                        </div>
                      )}
                      <ProductCard product={product} />
                    </div>
                  </motion.div>
                ))}
          </div>
        </div>

        {/* ── Mobile "See all" link ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 sm:hidden text-center"
        >
          <Link
            href="/explore?sort=popular"
            className="group inline-flex items-center gap-2 text-sm font-medium
                       text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]
                       transition-colors duration-[var(--duration-hover)]"
          >
            See all trending
            <ArrowRight
              size={14}
              className="transition-transform duration-[var(--duration-hover)]
                         group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}