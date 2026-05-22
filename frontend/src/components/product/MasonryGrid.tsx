'use client'

import Masonry from 'react-masonry-css'
import { motion } from 'framer-motion'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

interface MasonryGridProps {
  products: any[]
  isLoading?: boolean
  skeletonCount?: number
}

const breakpointCols = {
  default: 5,
  1536: 5,
  1280: 4,
  1024: 3,
  768: 3,
  640: 2,
  480: 2,
}

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
          <div key={i} className="mb-4">
            <ProductCardSkeleton />
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
          className="mb-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{
            duration: 0.35,
            delay: Math.min(i * 0.04, 0.3),
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ProductCard product={product} priority={i < 6} />
        </motion.div>
      ))}
    </Masonry>
  )
}