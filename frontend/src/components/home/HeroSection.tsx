'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

const slides = [
  {
    id: 1,
    issue: '№ 01',
    eyebrow: 'New Season',
    headline: 'Curated\nLuxury',
    sub: "Discover fashion from the world's most iconic houses — handpicked, beautifully presented.",
    cta: 'Shop the Edit',
    ctaHref: '/explore',
    stat: { value: '2,400+', label: 'Products' },
    tag: 'SS 2025',
    accentHue: '36',
  },
  {
    id: 2,
    issue: '№ 02',
    eyebrow: 'Collections',
    headline: 'Build Your\nAesthetic',
    sub: 'Save, organise, and share the looks that define your personal world.',
    cta: 'Explore Collections',
    ctaHref: '/collections',
    stat: { value: '860+', label: 'Collections' },
    tag: 'Curated',
    accentHue: '200',
  },
  {
    id: 3,
    issue: '№ 03',
    eyebrow: 'Community',
    headline: 'Follow\nTastemakers',
    sub: 'Connect with curators who inspire your personal style every single day.',
    cta: 'Discover People',
    ctaHref: '/explore',
    stat: { value: '12K+', label: 'Creators' },
    tag: 'Live',
    accentHue: '340',
  },
]

export function HeroSection() {
  const [current,   setCurrent]   = useState(0)
  const [direction, setDirection] = useState(1)
  const intervalRef               = useRef<ReturnType<typeof setInterval>>()

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1)
    setCurrent(idx)
  }

  const advance = () => {
    setDirection(1)
    setCurrent((p) => (p + 1) % slides.length)
  }

  useEffect(() => {
    intervalRef.current = setInterval(advance, 7000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const slide       = slides[current]
  const accentColor = `hsl(${slide.accentHue} 55% 52%)`
  const accentMuted = `hsl(${slide.accentHue} 40% 92%)`

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ?  40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -40 :  40 }),
  }

  return (
    <section className="relative min-h-[96vh] flex flex-col overflow-hidden bg-background">

      {/* ── Background architectural lines ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Horizontal rule */}
        <div
          className="absolute top-[38%] left-0 right-0 h-px opacity-[0.07]"
          style={{ background: 'hsl(var(--foreground))' }}
        />
        {/* Vertical rule */}
        <div
          className="absolute left-[55%] top-0 bottom-0 w-px opacity-[0.05]"
          style={{ background: 'hsl(var(--foreground))' }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* ── Large ghost issue number ── */}
      <div
        className="absolute right-6 top-1/2 -translate-y-1/2 font-display font-bold
                   leading-none select-none pointer-events-none opacity-[0.04] tracking-tighter"
        style={{ fontSize: 'clamp(7rem, 18vw, 18rem)' }}
        aria-hidden="true"
      >
        {current + 1 < 10 ? `0${current + 1}` : current + 1}
      </div>

      {/* ── Main content ── */}
      <div className="container-wide relative z-10 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-24
                        items-center py-20 lg:py-0">

          {/* Left: editorial copy */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              {/* Issue + tag row */}
              <div className="flex items-center gap-4 mb-8">
                <span
                  className="font-mono-refined text-xs tracking-wider"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {slide.issue}
                </span>
                <div
                  className="h-px flex-1 max-w-[3rem] opacity-30"
                  style={{ background: 'hsl(var(--foreground))' }}
                />
                <span
                  className="text-xs font-medium uppercase tracking-[0.14em] px-2.5 py-1 rounded-full"
                  style={{
                    background: accentMuted,
                    color: accentColor,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {slide.tag}
                </span>
              </div>

              {/* Eyebrow */}
              <p
                className="text-xs font-medium uppercase tracking-[0.2em] mb-5"
                style={{ color: accentColor }}
              >
                {slide.eyebrow}
              </p>

              {/* Headline */}
              <h1
                className="font-display font-semibold tracking-tight text-foreground
                           whitespace-pre-line leading-[1.02]"
                style={{ fontSize: 'clamp(3.2rem, 8vw, 7rem)' }}
              >
                {slide.headline}
              </h1>

              {/* Animated accent underline */}
              <motion.div
                key={`line-${current}`}
                className="mt-4 mb-7 h-[2px] w-16 rounded-full"
                style={{ background: accentColor }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />

              {/* Subtext */}
              <p className="text-base text-muted max-w-[32rem] leading-relaxed mb-10">
                {slide.sub}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={slide.ctaHref}
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5
                             rounded-xl text-sm font-medium text-background
                             transition-opacity duration-200 hover:opacity-85"
                  style={{ background: 'hsl(var(--foreground))' }}
                >
                  {slide.cta}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>

                <Link
                  href="/collections"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium
                             text-muted hover:text-foreground transition-colors duration-200"
                >
                  View Collections
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-200
                               group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right: stat card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`stat-${current}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="hidden lg:flex flex-col items-end gap-2 shrink-0"
            >
              <div
                className="w-44 rounded-2xl p-6 border"
                style={{
                  background: 'hsl(var(--surface))',
                  borderColor: 'hsl(var(--border-subtle))',
                }}
              >
                <p
                  className="font-display text-4xl font-semibold text-foreground
                             tracking-tight leading-none mb-1"
                >
                  {slide.stat.value}
                </p>
                <p className="text-xs text-muted uppercase tracking-[0.12em]">
                  {slide.stat.label}
                </p>
                <div
                  className="mt-4 h-0.5 w-8 rounded-full"
                  style={{ background: accentColor }}
                />
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* ── Bottom bar: slide controls + scroll hint ── */}
      <div className="container-wide relative z-10 pb-10 flex items-center justify-between">

        {/* Slide selectors */}
        <div className="flex items-center gap-5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="flex items-center gap-2.5"
              aria-label={`Slide ${i + 1}`}
            >
              <span
                className="font-mono-refined text-[10px] tracking-wider transition-colors duration-200"
                style={{
                  color: i === current
                    ? 'hsl(var(--foreground))'
                    : 'hsl(var(--muted))',
                }}
              >
                {i + 1 < 10 ? `0${i + 1}` : i + 1}
              </span>
              <span
                className="block h-px transition-all duration-500"
                style={{
                  width: i === current ? '2.5rem' : '0.75rem',
                  background: i === current
                    ? accentColor
                    : 'hsl(var(--border))',
                }}
              />
            </button>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="flex items-center gap-2.5" style={{ color: 'hsl(var(--muted))' }}>
          <span
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-8 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, hsl(var(--muted)), transparent)',
            }}
          />
        </div>

      </div>
    </section>
  )
}