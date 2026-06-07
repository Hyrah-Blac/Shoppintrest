import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { TrendingSection } from '@/components/home/TrendingSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { MasonryPreview } from '@/components/home/MasonryPreview'

/**
 * HomePage — v2 · Shoppin
 *
 * Section blending based on Mytheresa / Net-a-Porter / SSENSE pattern:
 *
 *  1. Single continuous background — no background-switching between sections.
 *     All sections sit on `hsl(var(--background))`. The jarring surface/background
 *     alternation is removed; sections breathe through spacing only.
 *
 *  2. Hero exit gradient — a full-width gradient bridge fades the hero's dark
 *     overlay into the page background so the transition feels continuous, not cut.
 *
 *  3. CategoriesSection runs edge-to-edge with no section-padding top — it sits
 *     flush under the hero exit, acting as a visual landing strip.
 *
 *  4. Content sections separated by a consistent vertical gap (--section-gap)
 *     rather than background color changes.
 *
 *  5. MasonryPreview gets extra top breathing room as the final section before
 *     the footer — mirrors how SSENSE pads the editorial close of their homepage.
 *
 * globals.css additions:
 *   :root { --section-gap: 6rem; }
 *   @media (max-width: 768px) { :root { --section-gap: 4rem; } }
 */

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

      {/* ── Hero — full bleed, owns its own background ── */}
      <HeroSection />

      {/* ── Hero exit gradient — bridges dark hero into page background ── */}
      <div
        aria-hidden
        className="pointer-events-none h-16 md:h-24 -mt-16 md:-mt-24 relative z-10"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)',
        }}
      />

      {/* ── Categories — flush strip, no top padding, acts as visual anchor ── */}
      <CategoriesSection />

      {/* ── Content sections — consistent gap, single background ── */}
      <div
        className="flex flex-col"
        style={{ gap: 'var(--section-gap, 5rem)' }}
      >
        <Suspense fallback={null}>
          <FeaturedProducts />
        </Suspense>

        <Suspense fallback={null}>
          <TrendingSection />
        </Suspense>

        {/* MasonryPreview — extra bottom clearance before footer */}
        <Suspense fallback={null}>
          <div className="pb-8 md:pb-16">
            <MasonryPreview />
          </div>
        </Suspense>
      </div>

    </main>
  )
}