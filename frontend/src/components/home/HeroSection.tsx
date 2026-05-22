'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

const slides = [
  {
    id: 1,
    eyebrow: 'New Arrivals',
    headline: 'Discover Your\nNext Obsession',
    sub: 'Millions of curated pieces from the world\'s best brands — all in one place.',
    cta: 'Explore Now',
    ctaHref: '/explore',
    secondaryCta: 'Browse Collections',
    secondaryHref: '/collections',
    tag: 'Trending Today',
    stats: [
      { value: '2M+',  label: 'Products' },
      { value: '50K+', label: 'Brands' },
      { value: '1M+',  label: 'Saves' },
    ],
  },
  {
    id: 2,
    eyebrow: 'Style Boards',
    headline: 'Save. Collect.\nInspire.',
    sub: 'Build boards that reflect your aesthetic. Share your taste with a community that gets it.',
    cta: 'Start a Board',
    ctaHref: '/collections/new',
    secondaryCta: 'See Collections',
    secondaryHref: '/collections',
    tag: 'For You',
    stats: [
      { value: '860+', label: 'Collections' },
      { value: '12K+', label: 'Curators' },
      { value: '99K+', label: 'Followers' },
    ],
  },
  {
    id: 3,
    eyebrow: 'Trending Now',
    headline: 'What Everyone\'s\nSaving Right Now',
    sub: 'Real-time trending pieces from across fashion, beauty, home and more.',
    cta: 'See Trending',
    ctaHref: '/explore?sort=popular',
    secondaryCta: 'Join Free',
    secondaryHref: '/sign-up',
    tag: 'Live',
    stats: [
      { value: '#1',   label: 'Fashion App' },
      { value: '4.9★', label: 'Rated' },
      { value: '500K', label: 'Daily Users' },
    ],
  },
]

export function HeroSection() {
  const [current,   setCurrent]   = useState(0)
  const [direction, setDirection] = useState(1)
  const intervalRef               = useRef<ReturnType<typeof setInterval>>()

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1)
    setCurrent(idx)
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(advance, 7000)
  }

  const advance = () => {
    setDirection(1)
    setCurrent((p) => (p + 1) % slides.length)
  }

  useEffect(() => {
    intervalRef.current = setInterval(advance, 7000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const slide = slides[current]

  const contentVariants = {
    enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 20 : -20 }),
    center: { opacity: 1, y: 0 },
    exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -20 : 20 }),
  }

  return (
    <section
      className="relative min-h-[88vh] flex flex-col overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* ── Soft background blob (Pinterest discovery feel) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, hsl(240 80% 65%) 0%, transparent 70%)',
          }}
        />
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="container-wide relative z-10 flex-1 flex items-center">
        <div className="w-full py-16 lg:py-24">

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl"
            >
              {/* Tag pill */}
              <div className="flex items-center gap-2 mb-6">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5
                             rounded-full text-xs font-semibold"
                  style={{
                    background: 'hsl(var(--accent-muted))',
                    color: 'hsl(var(--accent))',
                  }}
                >
                  <Sparkles size={11} />
                  {slide.tag}
                </span>
              </div>

              {/* Eyebrow */}
              <p className="eyebrow mb-4">{slide.eyebrow}</p>

              {/* Headline — Pinterest uses large, bold Inter */}
              <h1
                className="font-semibold tracking-tight text-foreground
                           whitespace-pre-line leading-[1.05] mb-5"
                style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}
              >
                {slide.headline}
              </h1>

              {/* Subtext */}
              <p
                className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
                style={{ color: 'hsl(var(--muted))' }}
              >
                {slide.sub}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-12">
                <Link href={slide.ctaHref} className="btn-save">
                  {slide.cta}
                  <ArrowRight size={14} className="ml-1 inline" />
                </Link>
                <Link href={slide.secondaryHref} className="btn-ghost">
                  {slide.secondaryCta}
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-8">
                {slide.stats.map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {stat.value}
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div className="container-wide relative z-10 pb-8 flex items-center justify-between">

        {/* Slide dots — Pinterest style */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className="transition-all duration-400"
              style={{
                width: i === current ? '2rem' : '0.5rem',
                height: '0.375rem',
                borderRadius: '9999px',
                background: i === current
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--border))',
              }}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <div
          className="hidden sm:flex items-center gap-2 text-xs font-medium uppercase tracking-widest"
          style={{ color: 'hsl(var(--muted))' }}
        >
          Scroll to explore
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-6 rounded-full"
            style={{ background: 'linear-gradient(to bottom, hsl(var(--muted)), transparent)' }}
          />
        </div>
      </div>
    </section>
  )
}