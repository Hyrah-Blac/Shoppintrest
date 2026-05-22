'use client'

import Masonry from 'react-masonry-css'
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
          <div
            key={i}
            className="mb-4"
            style={{ marginBottom: i % 3 === 0 ? '24px' : '16px' }}
          >
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
        <div key={product._id} className="mb-4">
          <ProductCard
            product={product}
            priority={i < 6}
          />
        </div>
      ))}
    </Masonry>
  )
}