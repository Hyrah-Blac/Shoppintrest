'use client'

/**
 * TrendingSection — Shoppin
 *
 * Note: not currently imported on the homepage (see HomePage's v3
 * changelog and FeaturedProducts' header — the homepage was trimmed to
 * Hero + FeaturedProducts only). This still exists as a candidate for
 * /explore's sort=popular view or a dedicated /trending page.
 *
 * Style-alignment pass — brought in line with the hero/FeaturedProducts
 * typography and CTA conventions:
 *  - Eyebrow "Trending": Ultra + accent color, matching the outlined-chip
 *    treatment used for "New Drops" and the hero's "Fresh Drop" badge.
 *  - Headline: Great Vibes (the same headline-scale script as the hero and
 *    FeaturedProducts), single color — dropped the old split accent-color
 *    emphasis on "buying" since a script face carries its own visual
 *    weight without needing a color split.
 *  - "See all" CTA (desktop + mobile): rebuilt as the bordered-rectangle
 *    button used everywhere else now (hero, FeaturedProducts) — no icon,
 *    fills to accent on hover. Replaces the old MoveRight-arrow text link,
 *    which was the one CTA style left over from the pre-alignment pass.
 *  - This duplicates the button markup FeaturedProducts also has locally.
 *    If both ever render on the same page, worth extracting a shared
 *    SeeAllButton into components/ui/ instead of keeping two copies.
 *
 * Layout untouched: the horizontal scroll + rank-badge structure is a
 * legitimate content-specific pattern for ranked/trending items, not a
 * leftover inconsistency, so it wasn't forced into FeaturedProducts' grid.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Ultra, Great_Vibes } from 'next/font/google'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

// Same faces as the hero + FeaturedProducts, self-hosted via next/font so
// they can't silently fall back to a generic serif (see HeroSection's v13
// changelog for the bug this pattern avoids).
const ultra = Ultra({ weight: '400', subsets: ['latin'], display: 'swap' })
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], display: 'swap' })

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

// ─── SeeAllButton ─────────────────────────────────────────────────────────────
// Matches FeaturedProducts' component of the same name — see header note
// re: extracting a shared one if both ever render on the same page.

const SEE_ALL_BASE_STYLE: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'hsl(var(--foreground))',
  textDecoration: 'none',
  border: '1px solid hsl(var(--border))',
  whiteSpace: 'nowrap',
  transition: 'background 0.35s ease, color 0.35s ease, border-color 0.35s ease',
}

function SeeAllButton({
  className,
  padding,
}: {
  className?: string
  padding: string
}) {
  return (
    <Link
      href="/explore?sort=popular"
      className={className}
      style={{ ...SEE_ALL_BASE_STYLE, padding }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'hsl(var(--accent))'
        e.currentTarget.style.color       = 'hsl(var(--accent-foreground))'
        e.currentTarget.style.borderColor = 'hsl(var(--accent))'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color       = 'hsl(var(--foreground))'
        e.currentTarget.style.borderColor = 'hsl(var(--border))'
      }}
    >
      See All
    </Link>
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

        {/* ── Header — bare label + headline left, CTA right ── */}
        <div className="flex items-baseline justify-between mb-6">
          <span
            className={ultra.className}
            style={{
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'hsl(var(--accent))',
              border: '1px solid hsl(var(--accent) / 0.5)',
              borderRadius: '3px',
              padding: '5px 9px',
              lineHeight: 1,
              display: 'inline-block',
            }}
          >
            Trending
          </span>

          <SeeAllButton
            className="hidden sm:inline-flex items-center justify-center"
            padding="10px 24px"
          />
        </div>

        <motion.h2
          className={`${greatVibes.className} mb-8 md:mb-10`}
          style={{
            fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
            fontWeight: 400,
            lineHeight: 1.15,
            color: 'hsl(var(--foreground))',
          }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          People are buying
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

        {/* ── Mobile CTA — same bordered treatment as desktop, full width ── */}
        <div className="sm:hidden pb-8 -mt-4">
          <SeeAllButton
            className="flex items-center justify-center w-full"
            padding="13px 24px"
          />
        </div>

      </div>
    </section>
  )
}