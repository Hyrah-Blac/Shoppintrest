'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

const RANK_META: Record<number, { label: string; sublabel: string }> = {
  1: { label: '#1',  sublabel: 'Top Pick'      },
  2: { label: '#2',  sublabel: 'Hot Right Now'  },
  3: { label: '#3',  sublabel: 'Rising'         },
}

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
      {/* Top accent line */}
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
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center"
                style={{ background: 'hsl(var(--accent-muted))' }}
              >
                <TrendingUp size={12} style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <span className="eyebrow">Right Now</span>
            </div>

            <h2
              className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, var(--text-section))' }}
            >
              What&apos;s{' '}
              <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
                Trending
              </em>
            </h2>

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

        {/* ── Scroll strip ── */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-5 pb-4 items-end" style={{ width: 'max-content' }}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-48 shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : products.slice(0, 12).map((product, i) => {
                  const rank = i + 1
                  const meta = RANK_META[rank]

                  return (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        delay:    i * 0.04,
                        ease:     [0.22, 1, 0.36, 1],
                        duration: 0.4,
                      }}
                      className="w-48 sm:w-56 shrink-0 flex flex-col"
                    >
                      {/* Product card — untouched, no wrapper that clips */}
                      <ProductCard product={product} />

                      {/* ── Rank row — outside card, never clipped ── */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay:    0.2 + i * 0.06,
                          duration: 0.35,
                          ease:     [0.22, 1, 0.36, 1],
                        }}
                        className="flex items-center gap-2.5 mt-3 px-0.5"
                      >
                        {meta ? (
                          <>
                            {/* Large editorial number */}
                            <span
                              className="font-display font-bold leading-none shrink-0"
                              style={{
                                fontSize:      'clamp(2rem, 3vw, 2.5rem)',
                                letterSpacing: '-0.06em',
                                color: rank === 1
                                  ? 'hsl(var(--accent))'
                                  : rank === 2
                                    ? 'hsl(var(--foreground))'
                                    : 'hsl(var(--muted))',
                                textShadow: rank === 1
                                  ? '0 2px 16px rgba(230,0,35,0.25)'
                                  : 'none',
                              }}
                            >
                              {rank}
                            </span>

                            {/* Divider */}
                            <div
                              className="h-7 w-px shrink-0"
                              style={{ background: 'hsl(var(--border))' }}
                            />

                            {/* Label stack */}
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span
                                className="text-[9px] font-bold uppercase tracking-[0.16em] leading-none"
                                style={{
                                  color: rank === 1
                                    ? 'hsl(var(--accent))'
                                    : 'hsl(var(--muted))',
                                }}
                              >
                                {rank === 1 ? 'Top Pick' : rank === 2 ? 'Hot Right Now' : 'Rising'}
                              </span>
                              <span
                                className="text-[9px] uppercase tracking-[0.12em] leading-none"
                                style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 300 }}
                              >
                                This week
                              </span>
                            </div>
                          </>
                        ) : (
                          /* Ranks 4–12 — quiet ghost number */
                          <span
                            className="font-display font-bold leading-none"
                            style={{
                              fontSize:      '1.25rem',
                              letterSpacing: '-0.04em',
                              color:         'hsl(var(--border))',
                            }}
                          >
                            {rank}
                          </span>
                        )}
                      </motion.div>
                    </motion.div>
                  )
                })}
          </div>
        </div>

        {/* ── Mobile "See all" ── */}
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