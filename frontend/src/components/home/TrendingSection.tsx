'use client'

/**
 * TrendingSection — v2 · Shoppin
 *
 * Brought to HeroSection standard:
 *  - Typed Product interface (no more any[])
 *  - Shoppin voice throughout — badge, headline, CTAs, rank labels
 *  - Rank badge copy: "Top Pick / Moving fast / Worth noting" replaces generic labels
 *  - Removed dead "This week" sublabel
 *  - Section + scroll container aria-labels
 *  - Scroll items wrapped in role="list" / role="listitem" for a11y
 *  - items-start alignment (was items-end — caused bottom-anchored layout)
 *  - CTA style matches hero: text + circle arrow
 *  - isMounted guard removed — not needed here (no useScroll)
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
          style={{ fontSize: '1.1rem', letterSpacing: '-0.04em', color: 'hsl(var(--border))' }}
        >
          {String(rank).padStart(2, '0')}
        </span>
      </div>
    )
  }

  const cfg = {
    1: { color: 'hsl(var(--accent))',      label: 'Top pick'     },
    2: { color: 'hsl(var(--foreground))',  label: 'Moving fast'  },
    3: { color: 'hsl(var(--muted))',       label: 'Worth noting' },
  }[rank as 1 | 2 | 3]

  return (
    <div className="flex items-center gap-2.5 mt-3 px-0.5">
      <span
        className="font-display font-bold leading-none tabular-nums shrink-0"
        style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', letterSpacing: '-0.06em', color: cfg.color }}
      >
        {rank}
      </span>
      <div className="h-7 w-px shrink-0" style={{ background: 'hsl(var(--border))' }} />
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
    apiClient.products.getTrending()
      .then(({ data }) => setProducts(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section
      className="relative overflow-hidden section-padding"
      style={{ background: 'hsl(var(--surface))' }}
      aria-label="Trending products"
    >
      {/* Top hairline accent */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.35) 50%, transparent 100%)',
        }}
      />

      <div className="container-wide">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-12">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow badge */}
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  background: 'hsl(var(--accent-muted))',
                  border: '0.5px solid hsl(var(--accent) / 0.2)',
                }}
              >
                <Flame size={11} strokeWidth={2} style={{ color: 'hsl(var(--accent))' }} aria-hidden />
                <span
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  Now
                </span>
              </span>
            </div>

            {/* Headline */}
            <h2
              className="font-display font-bold tracking-[-0.03em] leading-[1.05]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, var(--text-section))' }}
            >
              People are{' '}
              <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>buying</em>
            </h2>

            {/* Underline reveal */}
            <motion.div
              className="mt-4 h-[1.5px] w-10 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          {/* Desktop CTA — matches hero circle-arrow style */}
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
                  width: '36px',
                  height: '36px',
                  border: '0.5px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
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
        >
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
                    transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
                    className="w-48 sm:w-56 shrink-0 flex flex-col list-none"
                  >
                    <ProductCard product={product} />
                    <RankBadge rank={i + 1} />
                  </motion.li>
                ))}
          </ul>
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