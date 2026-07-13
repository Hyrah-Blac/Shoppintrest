'use client'

/**
 * MasonryPreview — Shoppin
 *
 * Note: not currently imported on the homepage (see HomePage's v3
 * changelog — trimmed to Hero + FeaturedProducts only). Kept as a
 * candidate for a full /explore browse experience or its own page.
 *
 * Style-alignment pass — matches the hero / FeaturedProducts /
 * TrendingSection conventions:
 *  - Eyebrow "New": Ultra + accent color, same outlined-chip treatment as
 *    "New Drops" / "Trending" / the hero's "Fresh Drop" badge.
 *  - Headline: Great Vibes, single color — dropped the old split
 *    accent-color emphasis on "today."
 *  - Both CTAs ("See all" header, "See everything" bottom): rebuilt as the
 *    bordered-rectangle button used everywhere else, generalized with a
 *    `label` prop since this file's two CTAs use different copy — the
 *    button itself is otherwise identical to FeaturedProducts'/
 *    TrendingSection's local copy. Same open note applies: if more than
 *    one of these three sections ever renders on the same page, extract
 *    SeeAllButton into components/ui/ instead of a third local copy.
 *  - "That's not all" is left as plain muted text, not a badge — it's a
 *    closing quip, not a section-identity label, so giving it the Ultra
 *    treatment would dilute what makes that badge distinct rather than
 *    extend it consistently.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Ultra, Great_Vibes } from 'next/font/google'
import { apiClient } from '@/lib/api'
import { MasonryGrid } from '@/components/product/MasonryGrid'

// Same faces as the hero + FeaturedProducts + TrendingSection, self-hosted
// via next/font so they can't silently fall back to a generic serif (see
// HeroSection's v13 changelog for the bug this pattern avoids).
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

// ─── SeeAllButton ─────────────────────────────────────────────────────────────
// Same button as FeaturedProducts'/TrendingSection's, generalized with a
// `label` prop since this file's two CTAs use different copy. See header
// note re: extracting a shared one if these ever share a page.

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
  label = 'See All',
}: {
  className?: string
  padding: string
  label?: string
}) {
  return (
    <Link
      href="/explore"
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
      {label}
    </Link>
  )
}

// ─── MasonryPreview ───────────────────────────────────────────────────────────

export function MasonryPreview() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient.products
      .getAll({ limit: 20, sort: 'newest' })
      .then(({ data }) => { if (!cancelled) setProducts(data.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <section
      className="pt-10"
      aria-label="New arrivals"
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
            New
          </span>

          <SeeAllButton
            className="hidden sm:inline-flex items-center justify-center"
            padding="10px 24px"
          />
        </div>

        <motion.h2
          className={`${greatVibes.className} mb-8 md:mb-12`}
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
          In today
        </motion.h2>

        {/* ── Masonry Grid ── */}
        <MasonryGrid
          products={products}
          isLoading={loading}
          skeletonCount={10}
        />

        {/* ── Bottom CTA ── */}
        <motion.div
          className="mt-12 mb-4 flex items-center justify-between"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{ borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: '24px' }}
        >
          <p
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted))',
            }}
          >
            That's not all
          </p>

          <SeeAllButton
            className="inline-flex items-center justify-center"
            padding="10px 24px"
            label="See everything"
          />
        </motion.div>

      </div>
    </section>
  )
}