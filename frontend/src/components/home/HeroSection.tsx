'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const slides = [
  {
    id: 1,
    eyebrow: 'New Season',
    headline: 'Curated Luxury,\nDelivered to You',
    sub: 'Discover fashion from the world\'s most iconic houses',
    cta: 'Shop Now',
    ctaHref: '/explore',
    bg: 'from-stone-100 to-stone-200 dark:from-zinc-900 dark:to-zinc-800',
    accent: '#c9a96e',
  },
  {
    id: 2,
    eyebrow: 'Editorial',
    headline: 'Build Your\nAesthetic World',
    sub: 'Save, collect, and share the looks that define you',
    cta: 'Explore Collections',
    ctaHref: '/collections',
    bg: 'from-zinc-100 to-neutral-200 dark:from-stone-900 dark:to-stone-800',
    accent: '#8b9cb0',
  },
  {
    id: 3,
    eyebrow: 'Community',
    headline: 'Follow the\nTastemakers',
    sub: 'Connect with curators who inspire your personal style',
    cta: 'Discover People',
    ctaHref: '/explore',
    bg: 'from-neutral-100 to-stone-200 dark:from-neutral-900 dark:to-neutral-800',
    accent: '#a8a8a8',
  },
]

export function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
        setIsTransitioning(false)
      }, 300)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <section
      className={`relative min-h-[92vh] flex items-center bg-gradient-to-br
                  ${slide.bg} transition-all duration-1000`}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="container-wide relative z-10">
        <div className="max-w-3xl">
          {/* Slide indicators */}
          <div className="flex gap-2 mb-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-px transition-all duration-500 ${
                  i === current
                    ? 'w-12 bg-foreground'
                    : 'w-4 bg-muted hover:bg-foreground/50'
                }`}
              />
            ))}
          </div>

          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isTransitioning ? 0 : 1, y: isTransitioning ? -10 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Eyebrow */}
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-5">
              {slide.eyebrow}
            </p>

            {/* Headline */}
            <h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl
                         font-semibold tracking-tight text-foreground leading-[1.05]
                         mb-6 whitespace-pre-line"
            >
              {slide.headline}
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-muted max-w-md leading-relaxed mb-10">
              {slide.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href={slide.ctaHref}>
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight size={16} />}
                  className="rounded-2xl"
                >
                  {slide.cta}
                </Button>
              </Link>
              <Link href="/collections">
                <Button size="lg" variant="outline" className="rounded-2xl">
                  View Collections
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col
                      items-center gap-2 text-muted">
        <span className="text-2xs uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-muted to-transparent"
        />
      </div>
    </section>
  )
}