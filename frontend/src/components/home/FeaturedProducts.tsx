'use client'

/**
 * FeaturedProducts — v3 · Shoppin
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
            Selected
          </p>

          <Link
            href="/explore?featured=true"
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
          Worth{' '}
          <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
            your time
          </em>
        </motion.h2>

        {/* ── Grid ── */}
        <ul
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
                     gap-5 md:gap-6 list-none m-0 p-0 pb-10"
          role="list"
          aria-label="Featured products grid"
        >
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <li key={i} role="listitem">
                  <ProductCardSkeleton />
                </li>
              ))
            : products.slice(0, 10).map((product, i) => (
                <motion.li
                  key={product._id}
                  role="listitem"
                  className="list-none"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    delay: Math.min(i, 4) * 0.05,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <ProductCard product={product} priority={i < 5} />
                </motion.li>
              ))}
        </ul>

        {/* ── Mobile CTA ── */}
        <div className="sm:hidden pb-8 -mt-4">
          <Link
            href="/explore?featured=true"
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