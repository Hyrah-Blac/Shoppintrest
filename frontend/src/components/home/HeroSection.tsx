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
  },
]

export function HeroSection() {
  const [current,   setCurrent]   = useState(0)
  const [direction, setDirection] = useState(1)
 const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const slide = slides[current]

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ?  40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -40 :  40 }),
  }

  return (
    <section className="relative min-h-[96vh] flex flex-col overflow-hidden
                        bg-[hsl(var(--background))]">

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
        {/* Pinterest red ambient glow — top left */}
        <div
          className="absolute -top-32 -left-32 w-[40vw] h-[40vw] rounded-full
                     pointer-events-none opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Large ghost issue number ── */}
      <div
        className="absolute right-6 top-1/2 -translate-y-1/2 font-display font-bold
                   leading-none select-none pointer-events-none opacity-[0.04]
                   tracking-tighter text-[hsl(var(--foreground))]"
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
                  className="text-xs tracking-wider font-medium"
                  style={{
                    color: 'hsl(var(--muted))',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {slide.issue}
                </span>
                <div
                  className="h-px flex-1 max-w-[3rem] opacity-30"
                  style={{ background: 'hsl(var(--foreground))' }}
                />
                {/* Tag pill — uses blueprint accent system */}
                <span
                  className="pill active text-xs px-2.5 py-1"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  {slide.tag}
                </span>
              </div>

              {/* Eyebrow */}
              <p className="eyebrow mb-5">{slide.eyebrow}</p>

              {/* Headline */}
              <h1
                className="font-display font-bold tracking-[-0.03em]
                           text-[hsl(var(--foreground))] whitespace-pre-line leading-[1.02]"
                style={{ fontSize: 'clamp(3.2rem, 8vw, var(--text-hero))' }}
              >
                {slide.headline}
              </h1>

              {/* Animated accent underline — Pinterest red */}
              <motion.div
                key={`line-${current}`}
                className="mt-4 mb-7 h-[2px] w-16 rounded-full"
                style={{ background: 'hsl(var(--accent))' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* Subtext */}
              <p
                className="text-base max-w-[32rem] leading-relaxed mb-10"
                style={{
                  color: 'hsl(var(--muted))',
                  fontWeight: 300,
                }}
              >
                {slide.sub}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Primary — Pinterest red save style */}
                <Link
                  href={slide.ctaHref}
                  className="btn-save group gap-2.5 px-7 py-3.5 text-sm"
                >
                  {slide.cta}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-[var(--duration-hover)]
                               group-hover:translate-x-0.5"
                  />
                </Link>

                {/* Secondary — ghost link */}
                <Link
                  href="/collections"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium
                             text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]
                             transition-colors duration-[var(--duration-hover)]"
                >
                  View Collections
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-[var(--duration-hover)]
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
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex flex-col items-end gap-2 shrink-0"
            >
              <div
                className="w-44 rounded-[var(--radius-xl)] p-6 border
                           shadow-[var(--shadow-card)]"
                style={{
                  background:   'hsl(var(--surface))',
                  borderColor:  'hsl(var(--border-subtle))',
                }}
              >
                <p
                  className="font-display text-4xl font-bold
                             text-[hsl(var(--foreground))]
                             tracking-[-0.03em] leading-none mb-1"
                >
                  {slide.stat.value}
                </p>
                <p
                  className="text-xs uppercase tracking-[0.12em]"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {slide.stat.label}
                </p>
                {/* Pinterest red accent bar */}
                <div
                  className="mt-4 h-0.5 w-8 rounded-full"
                  style={{ background: 'hsl(var(--accent))' }}
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
              className="flex items-center gap-2.5 transition-opacity
                         duration-[var(--duration-hover)] hover:opacity-100"
              style={{ opacity: i === current ? 1 : 0.45 }}
              aria-label={`Slide ${i + 1}`}
            >
              <span
                className="text-[10px] tracking-wider font-medium transition-colors
                           duration-[var(--duration-standard)]"
                style={{
                  color: i === current
                    ? 'hsl(var(--foreground))'
                    : 'hsl(var(--muted))',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {i + 1 < 10 ? `0${i + 1}` : i + 1}
              </span>
              <span
                className="block h-px transition-all duration-[var(--duration-standard)]"
                style={{
                  width: i === current ? '2.5rem' : '0.75rem',
                  background: i === current
                    ? 'hsl(var(--accent))'
                    : 'hsl(var(--border))',
                }}
              />
            </button>
          ))}
        </div>

        {/* Scroll hint */}
        <div
          className="flex items-center gap-2.5"
          style={{ color: 'hsl(var(--muted))' }}
        >
          <span
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
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