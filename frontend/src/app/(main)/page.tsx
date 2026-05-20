import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { TrendingSection } from '@/components/home/TrendingSection'
import { EditorialBanner } from '@/components/home/EditorialBanner'
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
      <EditorialBanner />
      <Suspense fallback={null}>
        <TrendingSection />
      </Suspense>
      <Suspense fallback={null}>
        <MasonryPreview />
      </Suspense>
    </div>
  )
}