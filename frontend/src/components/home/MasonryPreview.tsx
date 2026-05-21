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
            transition={{ duration: 0.5 }}
          >
            {/* Eyebrow with icon */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles
                size={13}
                style={{ color: 'hsl(var(--accent))' }}
              />
              <span className="eyebrow">Discover</span>
            </div>

            {/* Headline with italic accent word */}
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
              Just{' '}
              <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
                Arrived
              </em>
            </h2>

            {/* Decorative accent line */}
            <motion.div
              className="mt-4 h-[2px] w-12 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
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
              className="group flex items-center gap-2 text-sm font-medium
                         text-muted hover:text-foreground transition-colors duration-200"
            >
              Explore all
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
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
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl
                       text-sm font-medium text-background transition-opacity
                       duration-200 hover:opacity-85"
            style={{ background: 'hsl(var(--foreground))' }}
          >
            Explore Everything
            <ArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}