'use client'

/**
 * FeaturedProducts — Shoppin
 *
 * The homepage's one product section (see HomePage's v3 changelog for why
 * it's alone here — CategoriesSection moved to the Navbar, TrendingSection
 * and MasonryPreview were removed to keep the homepage lean).
 *
 * Design notes:
 *  - FEATURED_LIMIT is a hard cap, not just a render-time slice — the
 *    point is a curated handful, not a teaser for a bigger feed.
 *  - "New Drops" eyebrow: Ultra + accent color, deliberately matching the
 *    hero's "Fresh Drop" badge — same face, same treatment, on purpose.
 *  - Headline: Great Vibes, the same headline-scale script used in the
 *    hero (not Parisienne — that's scoped to small accent labels like
 *    "Scroll to shop"). Keep any future copy here short; long phrases
 *    fight connected script letterforms.
 *  - "See All" buttons intentionally use DM Sans (inherited, not set
 *    explicitly) rather than the hero CTA's Inter — Inter was a one-off
 *    from a specific reference image for the hero, not a sitewide button
 *    convention. Every other .btn-* on the site is DM Sans.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Ultra, Great_Vibes } from 'next/font/google'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

// Same face as the hero's "Fresh Drop" badge, self-hosted via next/font so
// it can't silently fall back to a generic serif the way a manual
// globals.css @import can (see HeroSection's v13 changelog for the bug
// this pattern avoids).
const ultra = Ultra({ weight: '400', subsets: ['latin'], display: 'swap' })

// Great Vibes is the headline-scale script already established in the
// hero — reused here rather than Parisienne, which is scoped to small
// accent labels ("Scroll to shop," "See it"), not section headlines.
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], display: 'swap' })

// Hard cap, not just a render-time slice — see header design notes.
const FEATURED_LIMIT = 6

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string
  title: string
  price: number
  brand?: string
  images?: { url: string; blurDataURL?: string }[]
}

// ─── SeeAllButton ─────────────────────────────────────────────────────────────
// Desktop and mobile were repeating the same style object and hover
// handlers with only padding/visibility differing — collapsed into one.

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
      href="/explore?featured=true"
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

// ─── FeaturedProducts ─────────────────────────────────────────────────────────

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient.products.getFeatured()
      .then(({ data }) => { if (!cancelled) setProducts(data.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <section
      className="pt-10 pb-0"
      aria-label="Featured products"
      style={{ borderTop: '1px solid hsl(var(--border) / 0.5)' }}
    >
      <div className="container-wide">

        {/* ── Header ── */}
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
            New Drops
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
          Freshly found
        </motion.h2>

        {/* ── Grid — capped at FEATURED_LIMIT, not a teaser for a bigger feed ── */}
        <ul
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6
                     gap-5 md:gap-6 list-none m-0 p-0 pb-10"
          role="list"
          aria-label="Featured products grid"
        >
          {loading
            ? Array.from({ length: FEATURED_LIMIT }).map((_, i) => (
                <li key={i} role="listitem">
                  <ProductCardSkeleton />
                </li>
              ))
            : products.slice(0, FEATURED_LIMIT).map((product, i) => (
                <motion.li
                  key={product._id}
                  role="listitem"
                  className="list-none"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <ProductCard product={product} priority />
                </motion.li>
              ))}
        </ul>

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