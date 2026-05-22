'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

export function TrendingSection() {
  const [products,  setProducts]  = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.products.getTrending()
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section
      className="section-padding"
      style={{ background: 'hsl(var(--background-secondary))' }}
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
                <TrendingUp size={12} style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <span className="eyebrow">Right Now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Trending
            </h2>
          </motion.div>

          <Link
            href="/explore?sort=popular"
            className="group hidden sm:flex items-center gap-1.5 text-sm font-semibold
                       transition-colors duration-200"
            style={{ color: 'hsl(var(--accent))' }}
          >
            See all
            <ArrowRight size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* ── Horizontal scroll strip ── */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-44 shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : products.slice(0, 12).map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="w-44 sm:w-52 shrink-0 relative"
                  >
                    {/* Rank badge for top 3 */}
                    {i < 3 && (
                      <div
                        className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full
                                   flex items-center justify-center text-[10px] font-bold
                                   text-white shadow-md"
                        style={{ background: 'hsl(var(--accent))' }}
                      >
                        {i + 1}
                      </div>
                    )}
                    <ProductCard product={product} />
                  </motion.div>
                ))}
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden mt-6 text-center">
          <Link
            href="/explore?sort=popular"
            className="group inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'hsl(var(--accent))' }}
          >
            See all trending
            <ArrowRight size={13}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

      </div>
    </section>
  )
}