'use client'

/**
 * TrendingSection — v4 · Shoppin
 *
 * v3 → v4:
 *  - Accent color removed from all decorative uses. Monochromatic system.
 *  - Eyebrow pill: accent → muted border + muted text
 *  - Underline bar: accent → border color
 *  - "buying" italic: accent → foreground
 *  - RankBadge: accent/foreground color on rank 1/2 → foreground/muted only;
 *    no accent anywhere in rank display
 *  - Top hairline: accent gradient → solid border color
 *  - Flame icon: accent → muted
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flame, ArrowRight, MoveRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string
  title: string
  price: number
  brand?: string
  images?: { url: string; blurDataURL?: string }[]
}

// ─── RankBadge ────────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) {
    return (
      <div className="flex items-center gap-2 mt-3 px-0.5">
        <span
          className="font-display font-bold leading-none tabular-nums"
          style={{
            fontSize:      '1.1rem',
            letterSpacing: '-0.04em',
            color:         'hsl(var(--border))',
          }}
        >
          {String(rank).padStart(2, '0')}
        </span>
      </div>
    )
  }

  // Top 3 — monochromatic: foreground for #1, muted for #2 and #3
  const cfg = {
    1: { color: 'hsl(var(--foreground))', label: 'Top pick'     },
    2: { color: 'hsl(var(--muted))',      label: 'Moving fast'  },
    3: { color: 'hsl(var(--muted))',      label: 'Worth noting' },
  }[rank as 1 | 2 | 3]

  return (
    <div className="flex items-center gap-2.5 mt-3 px-0.5">
      <span
        className="font-display font-bold leading-none tabular-nums shrink-0"
        style={{
          fontSize:      'clamp(2rem, 3vw, 2.5rem)',
          letterSpacing: '-0.06em',
          color:         cfg.color,
        }}
      >
        {rank}
      </span>
      <div
        className="h-7 w-px shrink-0"
        style={{ background: 'hsl(var(--border))' }}
      />
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.18em] leading-none"
        style={{ color: cfg.color }}
      >
        {cfg.label}
      </span>
    </div>
  )
}

// ─── TrendingSection ──────────────────────────────────────────────────────────

export function TrendingSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient.products.getTrending()
      .then(({ data }) => { if (!cancelled) setProducts(data.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <section
      className="relative overflow-hidden section-padding"
      aria-label="Trending products"
    >
      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'hsl(var(--border))' }}
      />

      <div className="container-wide">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-8 md:mb-12">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow pill — monochromatic */}
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  border:     '0.5px solid hsl(var(--border))',
                  background: 'transparent',
                }}
              >
                <Flame
                  size={11}
                  strokeWidth={2}
                  style={{ color: 'hsl(var(--muted))' }}
                  aria-hidden
                />
                <span
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  Now
                </span>
              </span>
            </div>

            {/* Headline — no accent italic */}
            <h2
              className="font-display font-bold tracking-[-0.03em] leading-[1.05]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, var(--text-section))' }}
            >
              People are buying
            </h2>

            {/* Underline — border color, not accent */}
            <motion.div
              className="mt-4 h-[1.5px] w-10 rounded-full"
              style={{ background: 'hsl(var(--border))' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          {/* Desktop CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="hidden sm:block"
          >
            <Link
              href="/explore?sort=popular"
              className="group inline-flex items-center gap-3"
              style={{ textDecoration: 'none' }}
            >
              <span
                className="text-[10px] font-medium tracking-[0.2em] uppercase transition-opacity duration-300 group-hover:opacity-50"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                See all
              </span>
              <span
                className="inline-flex items-center justify-center rounded-full
                           group-hover:bg-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))]"
                style={{
                  width:      '36px',
                  height:     '36px',
                  border:     '0.5px solid hsl(var(--border))',
                  color:      'hsl(var(--foreground))',
                  transition: 'background 0.35s cubic-bezier(0.22,1,0.36,1), color 0.35s',
                  flexShrink: 0,
                }}
              >
                <ArrowRight size={13} strokeWidth={1.5} />
              </span>
            </Link>
          </motion.div>
        </div>

        {/* ── Scroll row ── */}
        <div
          className="overflow-x-auto scrollbar-hide -mx-4 px-4"
          aria-label="Trending products list"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          {!loading && products.length === 0 ? (
            <p
              className="text-[13px] py-8"
              style={{ color: 'hsl(var(--muted))' }}
            >
              Nothing here yet.
            </p>
          ) : (
            <ul
              className="flex gap-5 pb-4 items-start list-none m-0 p-0"
              style={{ width: 'max-content' }}
              role="list"
            >
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <li key={i} className="w-48 shrink-0" role="listitem">
                      <ProductCardSkeleton />
                    </li>
                  ))
                : products.slice(0, 12).map((product, i) => (
                    <motion.li
                      key={product._id}
                      role="listitem"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        delay:    Math.min(i, 4) * 0.04,
                        ease:     [0.22, 1, 0.36, 1],
                        duration: 0.4,
                      }}
                      className="w-48 sm:w-56 shrink-0 flex flex-col list-none"
                    >
                      <ProductCard product={product} />
                      <RankBadge rank={i + 1} />
                    </motion.li>
                  ))}
            </ul>
          )}
        </div>

        {/* ── Mobile CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 sm:hidden text-center"
        >
          <Link
            href="/explore?sort=popular"
            className="group inline-flex items-center gap-2 text-[11px] font-medium
                       tracking-[0.1em] uppercase transition-colors duration-200"
            style={{ color: 'hsl(var(--muted))' }}
          >
            See all
            <MoveRight
              size={13}
              strokeWidth={1.5}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}