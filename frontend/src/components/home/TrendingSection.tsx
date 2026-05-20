'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

export function TrendingSection() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.products.getTrending()
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section className="section-padding bg-surface">
      <div className="container-wide">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-muted" />
              <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-muted">
                Right Now
              </p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Trending
            </h2>
          </div>
          <Link
            href="/explore?sort=popular"
            className="hidden sm:flex items-center gap-2 text-sm font-medium
                       text-muted hover:text-foreground transition-colors duration-200"
          >
            See all
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-48 shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : products.slice(0, 12).map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="w-48 sm:w-56 shrink-0"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
          </div>
        </div>
      </div>
    </section>
  )
}