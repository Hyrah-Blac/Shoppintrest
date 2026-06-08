'use client'

/**
 * MasonryGrid — v2 · Shoppin
 *
 * v1 → v2:
 *  - Typed Product interface (no more any[])
 *  - mb-4 → mb-5 (20px gap — matches Mytheresa/Net-a-Porter card spacing)
 *  - Skeleton gap matches: mb-5 consistent with loaded state
 */

import Masonry from 'react-masonry-css'
import { motion } from 'framer-motion'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string
  title: string
  price: number
  brand?: string
  images?: { url: string; blurDataURL?: string }[]
}

interface MasonryGridProps {
  products: Product[]
  isLoading?: boolean
  skeletonCount?: number
}

// ─── Breakpoints ──────────────────────────────────────────────────────────────

const breakpointCols = {
  default: 5,
  1536:    5,
  1280:    4,
  1024:    3,
  768:     3,
  640:     2,
  480:     2,
}

// ─── MasonryGrid ──────────────────────────────────────────────────────────────

export function MasonryGrid({
  products,
  isLoading,
  skeletonCount = 12,
}: MasonryGridProps) {

  if (isLoading) {
    return (
      <Masonry
        breakpointCols={breakpointCols}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="mb-5">
            <div
              className="skeleton"
              style={{
                aspectRatio:  i % 3 === 0 ? '2/3' : i % 3 === 1 ? '1/1' : '3/4',
                borderRadius: 'var(--radius-xl)',
              }}
            />
          </div>
        ))}
      </Masonry>
    )
  }

  return (
    <Masonry
      breakpointCols={breakpointCols}
      className="masonry-grid"
      columnClassName="masonry-grid-column"
    >
      {products.map((product, i) => (
        <motion.div
          key={product._id}
          className="mb-5"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{
            delay:    (i % 5) * 0.06,
            duration: 0.45,
            ease:     [0.22, 1, 0.36, 1],
          }}
        >
          <ProductCard
            product={product}
            priority={i < 6}
          />
        </motion.div>
      ))}
    </Masonry>
  )
}