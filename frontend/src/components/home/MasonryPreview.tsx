'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { MasonryGrid } from '@/components/product/MasonryGrid'

export function MasonryPreview() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.products.getAll({ limit: 20, sort: 'newest' })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              Discover
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Just Arrived
            </h2>
          </div>
          <Link
            href="/explore"
            className="flex items-center gap-2 text-sm font-medium
                       text-muted hover:text-foreground transition-colors duration-200"
          >
            Explore all
            <ArrowRight size={14} />
          </Link>
        </div>

        <MasonryGrid
          products={products}
          isLoading={isLoading}
          skeletonCount={10}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-foreground text-background
                       px-8 py-4 rounded-2xl text-sm font-medium hover:opacity-80
                       transition-opacity"
          >
            Explore Everything
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}