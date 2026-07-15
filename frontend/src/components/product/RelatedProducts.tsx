'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Great_Vibes } from 'next/font/google'
import { apiClient } from '@/lib/api'
import { ProductCard } from './ProductCard'

// Same face as the hero/homepage sections/ReviewSection, self-hosted via
// next/font so it can't silently fall back to a generic serif (see
// HeroSection's v13 changelog for the bug this pattern avoids).
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], display: 'swap' })

export function RelatedProducts({ id }: { id: string }) {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    apiClient.products.getRelated(id)
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
  }, [id])

  if (products.length === 0) return null

  return (
    <section
      className="py-16 border-t"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <div className="container-wide">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <h2
            className={greatVibes.className}
            style={{
              fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
              fontWeight: 400,
              lineHeight: 1.15,
              color: 'hsl(var(--foreground))',
            }}
          >
            You may also like
          </h2>
        </motion.div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
                        xl:grid-cols-5 gap-4 lg:gap-5">
          {products.map((product, i) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                delay:    i * 0.05,
                duration: 0.4,
                ease:     [0.22, 1, 0.36, 1],
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}