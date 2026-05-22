'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, LayoutGrid } from 'lucide-react'
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
    <section
      className="section-padding"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="container-wide">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'hsl(var(--accent-muted))' }}
              >
                <LayoutGrid size={12} style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <span className="eyebrow">Discover</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Just Arrived
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Link
              href="/explore"
              className="group flex items-center gap-1.5 text-sm font-semibold
                         transition-colors duration-200"
              style={{ color: 'hsl(var(--accent))' }}
            >
              See all
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </motion.div>
        </div>

        {/* ── Masonry grid ── */}
        <MasonryGrid
          products={products}
          isLoading={isLoading}
          skeletonCount={10}
        />

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mt-12"
        >
          <Link href="/explore" className="btn-primary">
            Explore Everything
            <ArrowRight size={14} />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}