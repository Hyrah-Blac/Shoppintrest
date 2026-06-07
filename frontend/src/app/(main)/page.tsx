import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { TrendingSection } from '@/components/home/TrendingSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { MasonryPreview } from '@/components/home/MasonryPreview'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <CategoriesSection />
      <Suspense fallback={null}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={null}>
        <TrendingSection />
      </Suspense>
      <Suspense fallback={null}>
        <MasonryPreview />
      </Suspense>
    </div>
  )
}