import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'

/**
 * HomePage — v3 · Shoppin
 *
 * v2 → v3 (lean-homepage redesign):
 *  Homepage went from 5 stacked sections (Hero, CategoriesSection,
 *  FeaturedProducts, TrendingSection, MasonryPreview) down to 2. The pattern
 *  now matches top fashion e-commerce: sell one curated moment on the
 *  homepage, push everything else behind navigation instead of an endless
 *  scroll of sections.
 *
 *  - CategoriesSection moved into the Navbar (desktop dropdown + mobile
 *    drawer section) — category browsing is a navigation action, not a
 *    homepage section. Component file itself hasn't been deleted, just no
 *    longer imported here.
 *  - TrendingSection and MasonryPreview removed from the homepage. Neither
 *    is deleted — if you want them to live somewhere, /explore (which
 *    already does sort=popular via the Sort dropdown) or a dedicated
 *    /trending page are the natural homes, rather than the homepage.
 *  - FeaturedProducts kept as the one homepage section, on the assumption
 *    it's a small curated set ("New Drops" style) rather than a full grid —
 *    worth confirming that's actually true once this is live; if it's
 *    rendering more than ~8 products it defeats the point of this change.
 *
 * globals.css addition still relevant:
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

      {/* ── The one curated section — everything else lives behind
             navigation now, not on the homepage ── */}
      <Suspense fallback={null}>
        <div className="pb-16 md:pb-24">
          <FeaturedProducts />
        </div>
      </Suspense>

    </main>
  )
}