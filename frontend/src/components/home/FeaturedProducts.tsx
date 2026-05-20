'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

export function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.products.getFeatured()
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section className="section-padding">
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              Handpicked
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Featured Pieces
            </h2>
          </div>
          <Link
            href="/explore?featured=true"
            className="hidden sm:flex items-center gap-2 text-sm font-medium
                       text-muted hover:text-foreground transition-colors duration-200"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
                        gap-4 lg:gap-6">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.slice(0, 10).map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <ProductCard product={product} priority={i < 5} />
                </motion.div>
              ))}
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/explore?featured=true"
            className="inline-flex items-center gap-2 text-sm font-medium
                       text-foreground border border-border px-6 py-3 rounded-2xl
                       hover:bg-accent transition-all duration-200"
          >
            View all featured
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}