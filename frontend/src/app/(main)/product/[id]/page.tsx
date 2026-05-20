import { Suspense } from 'react'
import { ProductDetail } from '@/components/product/ProductDetail'
import { RelatedProducts } from '@/components/product/RelatedProducts'

interface Props {
  params: { id: string }
}

export default function ProductPage({ params }: Props) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail id={params.id} />
      </Suspense>
      <Suspense fallback={null}>
        <RelatedProducts id={params.id} />
      </Suspense>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="container-wide py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="skeleton aspect-[4/5] rounded-3xl" />
        <div className="space-y-6 py-4">
          <div className="skeleton h-5 w-24 rounded-lg" />
          <div className="skeleton h-10 w-3/4 rounded-xl" />
          <div className="skeleton h-8 w-1/3 rounded-xl" />
          <div className="skeleton h-32 w-full rounded-xl" />
          <div className="flex gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton h-11 w-16 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}