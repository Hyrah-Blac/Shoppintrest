'use client'

/**
 * TrendingSection — v4 · Shoppin
 *
 * v3 → v4 (top-brand alignment — Mytheresa / Mr Porter / Net-a-Porter):
 *  - Eyebrow pill removed entirely — Mr Porter / Mytheresa use none
 *  - Animated underline bar removed — 2020 trend, gone from all top sites
 *  - Section header: bare label (10px uppercase tracked) + large headline
 *    side by side with right-aligned text CTA — no circle arrow in headers
 *  - Full-width 1px border-top replaces gradient hairline
 *  - Flame icon removed from header — top brands use zero decorative icons
 *    in section headers
 *  - Circle arrow kept only in hero; header CTA is plain text "See all →"
 *  - Rank badge simplified — number only for rank > 3, label only for 1–3
 *  - Section padding tightened: pt-10 pb-0 (content bleeds to next section gap)
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MoveRight } from 'lucide-react'
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
      <p
        className="mt-2.5 px-0.5 tabular-nums"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          color: 'hsl(var(--border))',
        }}
      >
        {String(rank).padStart(2, '0')}
      </p>
    )
  }

  const labels = { 1: 'Top pick', 2: 'Moving fast', 3: 'Worth noting' }

  return (
    <div className="flex items-center gap-2 mt-2.5 px-0.5">
      <span
        className="tabular-nums"
        style={{
          fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
          fontWeight: 600,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          color: rank === 1 ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
        }}
      >
        {rank}
      </span>
      <div className="w-px h-5 shrink-0" style={{ background: 'hsl(var(--border))' }} />
      <span
        style={{
          fontSize: '9px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'hsl(var(--muted))',
        }}
      >
        {labels[rank as 1 | 2 | 3]}
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
      className="pt-10 pb-0"
      aria-label="Trending products"
      style={{ borderTop: '1px solid hsl(var(--border) / 0.5)' }}
    >
      <div className="container-wide">

        {/* ── Header — Mr Porter style: label left, CTA right, headline below ── */}
        <div className="flex items-baseline justify-between mb-6">
          <p
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted))',
            }}
          >
            Trending
          </p>

          <Link
            href="/explore?sort=popular"
            className="hidden sm:inline-flex items-center gap-1.5 group"
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted))',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
            onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted))')}
          >
            See all
            <MoveRight size={11} strokeWidth={1.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <motion.h2
          className="font-display mb-8 md:mb-10"
          style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: 'hsl(var(--foreground))',
          }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          People are{' '}
          <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>buying</em>
        </motion.h2>

        {/* ── Scroll row ── */}
        <div
          className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:-mx-6 md:px-6"
          aria-label="Trending products list"
          tabIndex={0}
        >
          {!loading && products.length === 0 ? (
            <p className="py-8 text-[13px]" style={{ color: 'hsl(var(--muted))' }}>
              Nothing here yet.
            </p>
          ) : (
            <ul
              className="flex gap-4 md:gap-5 pb-10 items-start list-none m-0 p-0"
              style={{ width: 'max-content' }}
              role="list"
            >
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <li key={i} className="w-44 md:w-52 shrink-0" role="listitem">
                      <ProductCardSkeleton />
                    </li>
                  ))
                : products.slice(0, 12).map((product, i) => (
                    <motion.li
                      key={product._id}
                      role="listitem"
                      className="w-44 md:w-52 shrink-0 flex flex-col list-none"
                      initial={{ opacity: 0, x: 16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        delay: Math.min(i, 4) * 0.04,
                        ease: [0.22, 1, 0.36, 1],
                        duration: 0.4,
                      }}
                    >
                      <ProductCard product={product} />
                      <RankBadge rank={i + 1} />
                    </motion.li>
                  ))}
            </ul>
          )}
        </div>

        {/* ── Mobile CTA ── */}
        <div className="sm:hidden pb-8 -mt-2">
          <Link
            href="/explore?sort=popular"
            className="inline-flex items-center gap-1.5 group"
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted))',
              textDecoration: 'none',
            }}
          >
            See all
            <MoveRight size={11} strokeWidth={1.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </section>
  )
}