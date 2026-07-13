'use client'

/**
 * FeaturedProducts — v4 · Shoppin
 *
 * v3 → v4 (aligned to the lean-homepage redesign + hero styling standards):
 *  - Hard-capped at FEATURED_LIMIT (6) instead of slicing 10 into a
 *    5-column grid — this is now the homepage's one product section, so it
 *    needs to actually read as curated, not as a teaser for a bigger feed
 *  - Eyebrow relabeled "Selected" → "New Drops", tying this section's
 *    identity to the hero's "NOW IN STORE" tag and "Fresh Drop" badge
 *    instead of reading as an unrelated section
 *  - Both "See all" CTAs (desktop + mobile) rebuilt to match the hero's
 *    bordered-rectangle button: thin border, small tracked caps, no icon,
 *    fills to the accent color on hover — was previously a plain
 *    text+arrow link with its own separate visual language
 *  - Grid breakpoints simplified (2 → 3 → 6 cols) since there are only
 *    ever 6 items now; the old 5-col track was sized for 10 items
 *
 * v2 → v3 (top-brand alignment — Mytheresa / Net-a-Porter):
 *  - Eyebrow pill + Crown icon removed — bare header, no decoration
 *  - Animated underline bar removed
 *  - Header: small uppercase label + headline left, text CTA right
 *  - Full-width 1px border-top replaces gradient hairline
 *  - Grid gap increased to 5–6 (20–24px) — Mytheresa standard spacing
 *  - Section padding: pt-10 pb-0 — content bleeds to section gap
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

// A hard cap, not just a slice at render time — this is the whole point of
// the redesign: a curated handful, not a teaser grid. Six reads as "a
// selection" without tipping into "here's the catalog."
const FEATURED_LIMIT = 6

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string
  title: string
  price: number
  brand?: string
  images?: { url: string; blurDataURL?: string }[]
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
          <p
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted))',
            }}
          >
            New Drops
          </p>

          <Link
            href="/explore?featured=true"
            className="hidden sm:inline-flex items-center justify-center"
            style={{
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              border: '1px solid hsl(var(--border))',
              padding: '10px 24px',
              whiteSpace: 'nowrap',
              transition: 'background 0.35s ease, color 0.35s ease, border-color 0.35s ease',
            }}
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
          Worth{' '}
          <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
            your time
          </em>
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
          <Link
            href="/explore?featured=true"
            className="flex items-center justify-center w-full"
            style={{
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              border: '1px solid hsl(var(--border))',
              padding: '13px 24px',
            }}
          >
            See All
          </Link>
        </div>

      </div>
    </section>
  )
}