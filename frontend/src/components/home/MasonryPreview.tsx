'use client'

/**
 * MasonryPreview — v3 · Shoppin
 *
 * v2 → v3 (top-brand alignment):
 *  - Eyebrow pill + Sparkles icon removed
 *  - Animated underline bar removed
 *  - Header: bare label + headline, CTA right — same pattern as other sections
 *  - Full-width 1px border-top replaces gradient hairline
 *  - Bottom CTA simplified — plain text, no circle arrow (hero only)
 *  - Section padding: pt-10, bottom CTA has its own spacing
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MoveRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { MasonryGrid } from '@/components/product/MasonryGrid'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string
  title: string
  price: number
  brand?: string
  images?: { url: string; blurDataURL?: string }[]
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
          <p
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted))',
            }}
          >
            New
          </p>

          <Link
            href="/explore"
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
          className="font-display mb-8 md:mb-12"
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
          In{' '}
          <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
            today.
          </em>
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

          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 group"
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.5')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            See everything
            <MoveRight size={11} strokeWidth={1.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}