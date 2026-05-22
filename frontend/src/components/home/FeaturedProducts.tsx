'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

export function FeaturedProducts() {
  const [products,  setProducts]  = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.products.getFeatured()
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
                <Star size={12} style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <span className="eyebrow">Handpicked</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Featured Pieces
            </h2>
          </motion.div>

          <Link
            href="/explore?featured=true"
            className="group hidden sm:flex items-center gap-1.5 text-sm font-semibold
                       transition-colors duration-200"
            style={{ color: 'hsl(var(--accent))' }}
          >
            View all
            <ArrowRight size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* ── Pinterest-style responsive grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.slice(0, 10).map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={product} priority={i < 5} />
                </motion.div>
              ))}
        </div>

        {/* Mobile CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="sm:hidden mt-8 text-center"
        >
          <Link href="/explore?featured=true" className="btn-save">
            View all featured
            <ArrowRight size={13} className="ml-1 inline" />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}