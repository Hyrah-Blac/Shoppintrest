'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { ProductCard } from './ProductCard'

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
            className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, var(--text-section))' }}
          >
            You May{' '}
            <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
              Also Like
            </em>
          </h2>

          {/* Accent underline */}
          <motion.div
            className="mt-3 h-[2px] w-10 rounded-full"
            style={{ background: 'hsl(var(--accent))' }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
          />
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