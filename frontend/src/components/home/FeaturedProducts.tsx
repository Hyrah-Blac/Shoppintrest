'use client'

/**
 * FeaturedProducts — v2 · Shoppin
 *
 * Brought to standard:
 *  - Typed Product interface (no more any[])
 *  - Shoppin voice: "Handpicked" → "Selected", "Featured Pieces" → "Worth your time",
 *    "View all" → "See all", "View all featured" → "See all"
 *  - isLoading → loading
 *  - CTA matches hero/trending: circle ArrowRight, same sizing (36px)
 *  - aria-label on section and grid
 *  - Grid items wrapped in ul/li for screen reader item count
 *  - aria-hidden on decorative hairline
 *  - Redundant animate-pin-drop class removed (duplication with whileInView)
 *  - data || [] → data ?? [] (consistent null-coalescing)
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Crown, ArrowRight, MoveRight } from 'lucide-react'
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
    apiClient.products.getFeatured()
      .then(({ data }) => setProducts(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section
      className="section-padding relative overflow-hidden"
      aria-label="Featured products"
    >

      {/* Top hairline accent */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.35) 50%, transparent 100%)',
        }}
      />

      <div className="container-wide relative">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-12">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow pill */}
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  background: 'hsl(var(--accent-muted))',
                  border: '0.5px solid hsl(var(--accent) / 0.2)',
                }}
              >
                <Crown size={11} strokeWidth={2} style={{ color: 'hsl(var(--accent))' }} aria-hidden />
                <span
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  Selected
                </span>
              </span>
            </div>

            {/* Headline */}
            <h2
              className="font-display font-bold tracking-[-0.03em] leading-[1.05]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, var(--text-section))' }}
            >
              Worth{' '}
              <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
                your time
              </em>
            </h2>

            {/* Accent underline */}
            <motion.div
              className="mt-4 h-[1.5px] w-10 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          {/* Desktop CTA — matches hero/trending circle-arrow style */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="hidden sm:block"
          >
            <Link
              href="/explore?featured=true"
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

        {/* ── Grid ── */}
        <ul
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
                     gap-4 lg:gap-5 list-none m-0 p-0"
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <ProductCard product={product} priority={i < 5} />
                </motion.li>
              ))}
        </ul>

        {/* ── Mobile CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="sm:hidden mt-10 text-center"
        >
          <Link
            href="/explore?featured=true"
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