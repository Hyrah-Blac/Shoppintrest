'use client'

import { useEffect, useState } from 'react'
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
    <section className="border-t border-border py-16">
      <div className="container-wide">
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-8">
          You May Also Like
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
                        xl:grid-cols-5 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}