'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { MasonryGrid } from '@/components/product/MasonryGrid'

export function MasonryPreview() {
  const [products,  setProducts]  = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.products
      .getAll({ limit: 20, sort: 'newest' })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section className="section-padding relative overflow-hidden">

      {/* Ambient background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-64 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(var(--accent) / 0.07) 0%, transparent 70%)',
        }}
      />

      <div className="container-wide relative">

        {/* ── Section Header ── */}
        <div className="flex items-end justify-between mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow with icon */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center"
                style={{ background: 'hsl(var(--accent-muted))' }}
              >
                <Sparkles size={12} style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <span className="eyebrow">Discover</span>
            </div>

            {/* Headline */}
            <h2
              className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
              style={{ fontSize: 'clamp(1.75rem, 3vw, var(--text-section))' }}
            >
              Just{' '}
              <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
                Arrived
              </em>
            </h2>

            {/* Accent underline */}
            <motion.div
              className="mt-4 h-[2px] w-12 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Link
              href="/explore"
              className="group hidden sm:flex items-center gap-2 text-sm font-medium
                         text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]
                         transition-colors duration-[var(--duration-hover)]"
            >
              Explore all
              <ArrowRight
                size={14}
                className="transition-transform duration-[var(--duration-hover)]
                           group-hover:translate-x-0.5"
              />
            </Link>
          </motion.div>
        </div>

        {/* ── Masonry Grid ── */}
        <MasonryGrid
          products={products}
          isLoading={isLoading}
          skeletonCount={10}
        />

        {/* ── CTA Button ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mt-14"
        >
          <Link
            href="/explore"
            className="btn-primary group gap-3 px-8 py-4 text-sm"
          >
            Explore Everything
            <ArrowRight
              size={15}
              className="transition-transform duration-[var(--duration-hover)]
                         group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}