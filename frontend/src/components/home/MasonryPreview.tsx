'use client'

/**
 * MasonryPreview — v3 · Shoppin
 *
 * v2 → v3:
 *  - Accent color removed from all decorative uses (pill bg, pill text,
 *    underline bar, italic word). Monochromatic system matches SSENSE/Mytheresa.
 *  - Eyebrow pill: accent → muted border + muted text
 *  - Underline bar: accent → border color
 *  - "In today." italic: accent → foreground
 *  - Top hairline: accent gradient → solid border color
 *  - Sparkles icon: accent → muted
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
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
      className="section-padding relative overflow-hidden"
      aria-label="New arrivals"
    >
      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'hsl(var(--border))' }}
      />

      <div className="container-wide relative">

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
                <Sparkles
                  size={11}
                  strokeWidth={2}
                  style={{ color: 'hsl(var(--muted))' }}
                  aria-hidden
                />
                <span
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  New
                </span>
              </span>
            </div>

            {/* Headline — no accent italic */}
            <h2
              className="font-display font-bold tracking-[-0.03em] leading-[1.05]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, var(--text-section))' }}
            >
              In today.
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
              href="/explore"
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

        {/* ── Masonry Grid ── */}
        <MasonryGrid
          products={products}
          isLoading={loading}
          skeletonCount={10}
        />

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 flex items-center justify-center"
        >
          <Link
            href="/explore"
            className="group inline-flex items-center gap-3"
            style={{ textDecoration: 'none' }}
          >
            <span
              className="text-[10px] font-medium tracking-[0.2em] uppercase transition-opacity duration-300 group-hover:opacity-50"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              See everything
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
    </section>
  )
}