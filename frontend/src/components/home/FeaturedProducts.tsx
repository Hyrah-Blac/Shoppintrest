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
    <section className="section-padding relative overflow-hidden">

      {/* Ambient glow */}
      <div
        className="absolute bottom-0 right-0 w-[50vw] h-64 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at bottom right, hsl(var(--accent) / 0.06) 0%, transparent 70%)',
        }}
      />

      <div className="container-wide relative">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: 'hsl(var(--accent-muted))' }}
              >
                <Star size={11} style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <span className="eyebrow">Handpicked</span>
            </div>

            {/* Headline */}
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl
                           font-semibold tracking-tight leading-tight">
              Featured{' '}
              <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
                Pieces
              </em>
            </h2>

            {/* Accent underline */}
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
              href="/explore?featured=true"
              className="group hidden sm:flex items-center gap-2 text-sm font-medium
                         text-muted hover:text-foreground transition-colors duration-200"
            >
              View all
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </motion.div>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
                        gap-4 lg:gap-6">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.slice(0, 10).map((product, i) => (
                <motion.div
                  key={product._id}
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
                </motion.div>
              ))}
        </div>

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
            className="group inline-flex items-center gap-2.5 text-sm font-medium
                       px-6 py-3 rounded-2xl border transition-all duration-200
                       text-foreground hover:text-background hover:bg-foreground
                       hover:border-foreground"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            View all featured
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}