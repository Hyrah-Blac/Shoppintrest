'use client'

/**
 * HeroSection — v5 · Shoppin
 *
 * v4 → v5 (polish):
 *  - Removed isMounted pattern — useScroll accepts sectionRef directly;
 *    Framer Motion handles null element gracefully
 *  - matchMedia('hover') memoized once at component level, not on every mouse event
 *  - restartTimer helper centralises interval logic — no stale closure risk
 *  - QuickViewModal: md:rounded-xl on desktop sheet, slide-up only on mobile
 *  - HeroMedia blur placeholder: unoptimized prop (data URI, no Next opt needed)
 *  - Progress rail: w-full max-w-[260px] (replaces fragile inline min())
 *  - Safe-area bottom: CSS custom property via style tag, not JIT arbitrary value
 *  - Pause-on-hover: clearInterval guard — only restarts if products.length >= 2
 *
 * globals.css additions required:
 *   @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@400;500&display=swap');
 *   :root {
 *     --font-display: 'Cormorant Garamond', serif;
 *     --font-utility: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
 *   }
 *   .can-hover #hero-section { cursor: none; }
 *
 * v5 → v6 (aesthetic pass):
 *  - Introduced --font-utility (Inter) for tiny uppercase tracked labels —
 *    Cormorant Garamond is a display serif and goes thin/hard to read under
 *    12px; utility text now sits on a clean grotesk instead
 *  - One accent color (muted brass) threaded through the active progress
 *    dot and the CTA hover fill, instead of pure black/white throughout
 *  - Added a barely-there film-grain overlay for filmic depth
 *  - CTA circle is now magnetic: it pulls gently toward the cursor within
 *    range, extending the custom-cursor language already built for the hero
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
  type RefObject,
} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { ArrowRight, ChevronDown, X, ArrowUpRight } from 'lucide-react'
import { apiClient } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string
  title: string
  price: number
  brand?: string
  headline?: string
  collection?: string
  description?: string
  images?: { url: string; blurDataURL?: string }[]
  videoUrl?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDE_INTERVAL = 6000
const KB_DURATION    = SLIDE_INTERVAL / 1000
const FALLBACK_LINES = [
  'Dressed for right now.',
  'This is what\'s next.',
  'The pieces people keep.',
  'Worth every look.',
  'Nothing basic. Ever.',
] as const
const SEASON_LABEL = 'Now in store'

const BLANK_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

// Utility face for tiny uppercase tracked labels — a display serif goes
// thin and slightly hard to read under 12px, so small text gets a clean
// grotesk instead. Reserve DISPLAY for headlines and titles.
const UTILITY: React.CSSProperties = {
  fontFamily: 'var(--font-utility, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
}

// One accent, used sparingly: the active progress dot and the CTA hover
// fill. Everything else in the hero stays black/white/gray.
const ACCENT = '#C9A574'
const ACCENT_INK = '#1a1410'

// ─── ProgressRail ─────────────────────────────────────────────────────────────

function ProgressRail({
  total,
  active,
  onSelect,
}: {
  total: number
  active: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="flex gap-[3px]" role="tablist" aria-label="Slide navigation">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onSelect(i)}
          className="relative flex-1 flex items-center py-3 -my-3"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span
            className="relative h-[1px] w-full overflow-hidden block"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            {i === active && (
              <motion.span
                className="absolute inset-y-0 left-0 block"
                style={{ background: ACCENT, width: '100%' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: KB_DURATION, ease: 'linear' }}
              />
            )}
            {i < active && (
              <span
                className="absolute inset-0"
                style={{ background: ACCENT }}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── HeroMedia ────────────────────────────────────────────────────────────────

function HeroMedia({
  product,
  reduceMotion,
  priority,
}: {
  product: Product
  reduceMotion: boolean
  priority?: boolean
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [])

  if (product.videoUrl) {
    return (
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.0 }}
        animate={reduceMotion ? {} : { scale: 1.04 }}
        transition={{ duration: KB_DURATION, ease: 'linear' }}
      >
        <video
          ref={videoRef}
          src={product.videoUrl}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden
        />
      </motion.div>
    )
  }

  const src     = product.images?.[0]?.url
  const blurSrc = product.images?.[0]?.blurDataURL ?? BLANK_PLACEHOLDER

  if (!src) {
    return <div className="absolute inset-0" style={{ background: 'hsl(var(--surface))' }} />
  }

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1.0, x: 0, y: 0 }}
      animate={reduceMotion ? {} : { scale: 1.055, x: '0.8%', y: '0.4%' }}
      transition={{ duration: KB_DURATION, ease: 'linear' }}
    >
      {/* Blur placeholder — data URI, skip Next.js optimisation */}
      <Image
        src={blurSrc}
        alt=""
        fill
        unoptimized
        aria-hidden
        className="object-cover object-center"
        style={{
          transition: 'opacity 0.6s',
          opacity: imgLoaded ? 0 : 1,
          filter: 'blur(20px)',
          transform: 'scale(1.05)',
        }}
      />
      {/* Full-res */}
      <Image
        src={src}
        alt={product.title}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover object-center"
        draggable={false}
        style={{ transition: 'opacity 0.6s', opacity: imgLoaded ? 1 : 0 }}
        onLoad={() => setImgLoaded(true)}
      />
    </motion.div>
  )
}

// ─── Preloader ────────────────────────────────────────────────────────────────

function useSlidePreloader(products: Product[], active: number) {
  useEffect(() => {
    if (products.length < 2) return
    const next = products[(active + 1) % products.length]
    if (!next) return
    if (next.videoUrl) {
      const v = document.createElement('video')
      v.src = next.videoUrl
      v.preload = 'auto'
      v.muted = true
    } else if (next.images?.[0]?.url) {
      const img = new window.Image()
      img.src = next.images[0].url
    }
  }, [active, products])
}

// ─── Quick View Modal ─────────────────────────────────────────────────────────

function QuickViewModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const modalId     = useId()
  const closeRef    = useRef<HTMLButtonElement>(null)
  const firstImgSrc = product.images?.[0]?.url

  // Focus management
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => { prev?.focus() }
  }, [])

  // Focus trap + Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const modal = document.getElementById(modalId)
      if (!modal) return
      const focusable = modal.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modalId, onClose])

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
        aria-hidden
      />

      {/* Sheet — slides up on mobile, centred card on desktop */}
      <motion.div
        id={modalId}
        className="relative z-10 w-full md:w-auto md:max-w-2xl md:rounded-xl overflow-hidden"
        style={{ background: 'hsl(20 14% 6%)', border: '0.5px solid rgba(255,255,255,0.1)' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="flex flex-col md:flex-row"
          style={{ minHeight: '320px', maxHeight: '88dvh', overflow: 'hidden' }}
        >
          {/* Image panel */}
          {firstImgSrc && (
            <div
              className="relative w-full md:w-64 shrink-0"
              style={{ minHeight: '180px', maxHeight: '40dvh' }}
            >
              <Image
                src={firstImgSrc}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover object-center"
              />
            </div>
          )}

          {/* Copy panel */}
          <div
            className="flex flex-col justify-between p-8 md:p-10 overflow-y-auto"
            style={{ flex: 1 }}
          >
            <div>
              {product.brand && (
                <p style={{
                  ...UTILITY,
                  fontSize: '9px',
                  letterSpacing: '0.38em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '14px',
                }}>
                  {product.brand}
                </p>
              )}

              <h2
                id={`${modalId}-title`}
                style={{
                  ...DISPLAY,
                  fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                  fontWeight: 300,
                  lineHeight: 1.05,
                  color: '#fff',
                  margin: '0 0 16px',
                }}
              >
                {product.title}
              </h2>

              {product.collection && (
                <p style={{
                  ...UTILITY,
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.32)',
                  marginBottom: '20px',
                }}>
                  {product.collection}
                </p>
              )}

              {product.description && (
                <p style={{
                  fontSize: '13px',
                  lineHeight: 1.75,
                  color: 'rgba(255,255,255,0.45)',
                  maxWidth: '320px',
                }}>
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 mt-8">
              <Link
                href={`/product/${product._id}`}
                className="inline-flex items-center gap-3 group"
                style={{
                  ...UTILITY,
                  fontSize: '10px',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.85)',
                  textDecoration: 'none',
                }}
                onClick={onClose}
              >
                <span
                  style={{ transition: 'opacity 0.3s' }}
                  className="group-hover:opacity-50"
                >
                  Get it
                </span>
                <ArrowUpRight
                  size={13}
                  style={{ transition: 'transform 0.3s' }}
                  className="group-hover:translate-x-[2px] group-hover:-translate-y-[2px]"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Close */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex items-center justify-center"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '0.5px solid rgba(255,255,255,0.35)',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background 0.25s, border-color 0.25s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background    = 'rgba(0,0,0,0.65)'
            e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.6)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background    = 'rgba(0,0,0,0.45)'
            e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.35)'
          }}
        >
          <X size={14} />
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Custom Cursor ────────────────────────────────────────────────────────────

function CustomCursor({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) {
  const dotRef   = useRef<HTMLDivElement>(null)
  const ringRef  = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const rafId    = useRef<number | null>(null)
  const pos      = useRef({ x: -999, y: -999 })
  const inside   = useRef(false)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.documentElement.classList.add('can-hover')

    const el = heroRef.current
    if (!el) return

    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (rafId.current) return
      rafId.current = requestAnimationFrame(() => {
        const { x, y } = pos.current
        dotRef.current  && (dotRef.current.style.transform  = `translate(${x}px,${y}px)`)
        ringRef.current && (ringRef.current.style.transform = `translate(${x}px,${y}px)`)
        rafId.current = null
      })
    }

    const enter = () => {
      inside.current = true
      dotRef.current  && (dotRef.current.style.opacity  = '1')
      ringRef.current && (ringRef.current.style.opacity = '1')
    }
    const leave = () => {
      inside.current = false
      dotRef.current  && (dotRef.current.style.opacity  = '0')
      ringRef.current && (ringRef.current.style.opacity = '0')
    }

    const startExpand = () => {
      if (!ringRef.current) return
      Object.assign(ringRef.current.style, {
        width: '72px', height: '72px',
        marginLeft: '-36px', marginTop: '-36px',
      })
      dotRef.current   && (dotRef.current.style.opacity   = '0')
      labelRef.current && (labelRef.current.style.opacity = '1')
    }
    const endExpand = () => {
      if (!ringRef.current) return
      Object.assign(ringRef.current.style, {
        width: '14px', height: '14px',
        marginLeft: '-7px', marginTop: '-7px',
      })
      dotRef.current   && (dotRef.current.style.opacity   = inside.current ? '1' : '0')
      labelRef.current && (labelRef.current.style.opacity = '0')
    }

    const interactables = el.querySelectorAll('a, button')
    interactables.forEach(n => {
      n.addEventListener('mouseenter', startExpand)
      n.addEventListener('mouseleave', endExpand)
    })
    el.addEventListener('mousemove',  move,  { passive: true })
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)

    return () => {
      document.documentElement.classList.remove('can-hover')
      el.removeEventListener('mousemove',  move)
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
      interactables.forEach(n => {
        n.removeEventListener('mouseenter', startExpand)
        n.removeEventListener('mouseleave', endExpand)
      })
      rafId.current && cancelAnimationFrame(rafId.current)
    }
  }, [heroRef])

  const T = [
    'width 0.35s cubic-bezier(0.22,1,0.36,1)',
    'height 0.35s cubic-bezier(0.22,1,0.36,1)',
    'margin 0.35s cubic-bezier(0.22,1,0.36,1)',
    'opacity 0.18s',
  ].join(', ')

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block"
        style={{
          width: '6px', height: '6px',
          marginLeft: '-3px', marginTop: '-3px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)',
          opacity: 0,
          transform: 'translate(-999px,-999px)',
          willChange: 'transform',
          transition: 'opacity 0.18s',
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:flex items-center justify-center"
        style={{
          width: '14px', height: '14px',
          marginLeft: '-7px', marginTop: '-7px',
          borderRadius: '50%',
          border: '0.75px solid rgba(255,255,255,0.75)',
          opacity: 0,
          transform: 'translate(-999px,-999px)',
          willChange: 'transform',
          transition: T,
          backdropFilter: 'blur(2px)',
        }}
      >
        <span
          ref={labelRef}
          style={{
            ...UTILITY,
            fontSize: '8px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.9)',
            opacity: 0,
            transition: 'opacity 0.2s 0.12s',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Look
        </span>
      </div>
    </>
  )
}

// ─── Scroll Cue ───────────────────────────────────────────────────────────────

function ScrollCue() {
  const [visible, setVisible] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    // Shows quickly (was 2200ms) — on mobile the hero is the whole screen,
    // so the cue is the only signal that products live below the fold.
    const t = setTimeout(() => setVisible(true), 700)
    // Slightly higher threshold than before so a small accidental nudge
    // doesn't hide it before the visitor has actually started scrolling.
    const onScroll = () => { if (window.scrollY > 80) setVisible(false) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.button
          type="button"
          onClick={() => {
            document.getElementById('hero-section')
              ?.scrollIntoView({ block: 'end', behavior: 'smooth' })
          }}
          className="absolute left-1/2 z-20 flex flex-col items-center gap-[6px]"
          // Generous invisible hit area — a real tap target, not just a label,
          // and a click here scrolls straight past the fold for anyone stuck.
          style={{
            bottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
            translateX: '-50%',
            padding: '14px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.6 }}
          aria-label="Scroll to shop the collection"
        >
          <span style={{
            ...UTILITY,
            fontSize: '9px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}>
            Scroll to shop
          </span>
          <motion.div
            animate={reduceMotion ? {} : { y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ─── Touch Swipe ──────────────────────────────────────────────────────────────

function useSwipe(
  ref: RefObject<HTMLElement | null>,
  onLeft: () => void,
  onRight: () => void,
) {
  const onLeftRef  = useRef(onLeft)
  const onRightRef = useRef(onRight)
  useEffect(() => { onLeftRef.current  = onLeft  }, [onLeft])
  useEffect(() => { onRightRef.current = onRight }, [onRight])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let startX = 0
    let startY = 0
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const onTouchEnd   = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      // Ignore gestures that are more vertical than horizontal — those are
      // the visitor trying to scroll down to the rest of the page, not swipe.
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
      dx < 0 ? onLeftRef.current() : onRightRef.current()
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [ref])
}

// ─── Magnetic Circle ──────────────────────────────────────────────────────────
// Wraps the CTA circle so it pulls gently toward the cursor as it approaches,
// then springs back on leave. Extends the custom-cursor language already
// built for this hero rather than adding an unrelated new interaction.
// Inert on touch devices — there's no mousemove to react to.

function MagneticCircle({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.4 })

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.35)
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.35)
  }
  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <span
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ display: 'inline-flex', padding: '10px', margin: '-10px' }}
    >
      <motion.span style={{ x: springX, y: springY, display: 'inline-flex' }}>
        {children}
      </motion.span>
    </span>
  )
}

// ─── HeroSection ──────────────────────────────────────────────────────────────

export function HeroSection() {
  const [products, setProducts]             = useState<Product[]>([])
  const [active,   setActive]               = useState(0)
  const [loaded,   setLoaded]               = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const grainId = useId()

  // Memoised hover-device check — not called on every mouse event
  const canHover = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover)').matches
      : false
  )

  // Parallax — sectionRef is always a stable object; Framer handles null el
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const bgY   = useTransform(scrollYProgress, [0, 1], ['0%',   '18%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%'])

  // ── Timer helpers ─────────────────────────────────────────────────────────
  // Centralised so every caller gets the same logic
  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const startTimer = useCallback((advanceFn: () => void, count: number) => {
    if (count < 2) return
    stopTimer()
    timerRef.current = setInterval(advanceFn, SLIDE_INTERVAL)
  }, [stopTimer])

  // ── Data ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiClient.products.getFeatured()
        if (!cancelled) setProducts((res.data?.data ?? []).slice(0, 5))
      } catch { /* fail silently */ }
      finally { if (!cancelled) setLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Preload next slide ────────────────────────────────────────────────────
  useSlidePreloader(products, active)

  // ── Auto-advance ──────────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setActive(p => products.length > 0 ? (p + 1) % products.length : 0)
  }, [products.length])

  const retreat = useCallback(() => {
    setActive(p => products.length > 0 ? (p - 1 + products.length) % products.length : 0)
  }, [products.length])

  useEffect(() => {
    startTimer(advance, products.length)
    return stopTimer
  }, [advance, products.length, startTimer, stopTimer])

  const goTo = useCallback((i: number) => {
    setActive(i)
    startTimer(advance, products.length)
  }, [advance, products.length, startTimer])

  // ── Touch swipe ───────────────────────────────────────────────────────────
  useSwipe(sectionRef, advance, retreat)

  const current  = products[active]
  const headline = current?.headline ?? FALLBACK_LINES[active % FALLBACK_LINES.length]

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <section
        className="relative w-full overflow-hidden h-[90dvh] md:h-[100dvh] rounded-b-[28px] md:rounded-b-[40px]"
        style={{ minHeight: '520px' }}
        aria-label="Featured collection"
        aria-busy="true"
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'hsl(var(--surface, 20 14% 8%))' }}
          animate={{ opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </section>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <CustomCursor heroRef={sectionRef} />

      <AnimatePresence>
        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
          />
        )}
      </AnimatePresence>

      <section
        id="hero-section"
        ref={sectionRef}
        className="relative w-full overflow-hidden h-[90dvh] md:h-[100dvh] rounded-b-[28px] md:rounded-b-[40px]"
        style={{ minHeight: '520px' }}
        aria-label="Featured collection"
        onMouseEnter={() => { if (canHover.current) stopTimer() }}
        onMouseLeave={() => { if (canHover.current) startTimer(advance, products.length) }}
      >

        {/* ── Background — parallax + crossfade ── */}
        <motion.div
          className="absolute inset-0"
          style={{ y: reduceMotion ? 0 : bgY, top: '-6%', bottom: '-6%' }}
        >
          <AnimatePresence mode="sync">
            <motion.div
              key={current?._id ?? 'placeholder'}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {current ? (
                <HeroMedia
                  product={current}
                  reduceMotion={!!reduceMotion}
                  priority={active === 0}
                />
              ) : (
                <div className="absolute inset-0" style={{ background: 'hsl(var(--surface))' }} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Gradient veils ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: [
              'linear-gradient(to top,',
              '  rgba(0,0,0,0.88) 0%,',
              '  rgba(0,0,0,0.44) 38%,',
              '  rgba(0,0,0,0.12) 62%,',
              '  transparent 78%)',
            ].join(''),
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-44 z-[1]"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 100%)' }}
        />

        {/* ── Film grain — barely visible, separates flat gradient from
             photographic depth. Static SVG noise, no runtime cost. ── */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] w-full h-full"
          style={{ opacity: 0.035, mixBlendMode: 'overlay' }}
        >
          <filter id={grainId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${grainId})`} />
        </svg>

        {/* ── Season label — top left ── */}
        <motion.p
          className="absolute top-8 left-8 md:top-10 md:left-12 z-10"
          style={{ ...UTILITY, fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {SEASON_LABEL}
        </motion.p>

        {/* ── Slide counter — top right ── */}
        {products.length > 1 && (
          <motion.div
            className="absolute top-8 right-8 md:top-10 md:right-12 z-10 flex items-center gap-[7px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={active}
                style={{ ...UTILITY, fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {pad(active + 1)}
              </motion.span>
            </AnimatePresence>
            <span style={{ ...UTILITY, fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ ...UTILITY, fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>
              {pad(products.length)}
            </span>
          </motion.div>
        )}

        {/* ── Bottom content block ── */}
        <motion.div
          className="absolute bottom-0 inset-x-0 z-10 px-5 md:px-12 md:pb-16"
          style={{
            y: reduceMotion ? 0 : copyY,
            paddingBottom: 'max(3.5rem, calc(env(safe-area-inset-bottom, 0px) + 3.5rem))',
          }}
        >
          {/* Progress rail — full width on mobile, max 260px on desktop */}
          {products.length > 1 && (
            <div className="mb-8 md:mb-10 w-full md:max-w-[260px]">
              <ProgressRail total={products.length} active={active} onSelect={goTo} />
            </div>
          )}

          {/* Headline + CTA row */}
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            {/* Left: editorial copy */}
            <div style={{ maxWidth: '680px' }}>
              <AnimatePresence mode="wait">
                <div key={active + '-copy'}>
                  {current?.brand && (
                    <motion.p
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      style={{ ...UTILITY, fontSize: '9px', letterSpacing: '0.36em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: '16px' }}
                    >
                      {current.brand}
                    </motion.p>
                  )}

                  {/* Masked reveal: the headline rises up through its own
                      baseline like a curtain lifting, instead of just fading
                      in place. This is the one deliberately showy motion in
                      the hero — everything else stays quiet around it. */}
                  <div style={{ overflow: 'hidden' }}>
                    <motion.h1
                      aria-live="polite"
                      initial={reduceMotion ? { opacity: 0 } : { y: '105%' }}
                      animate={{ y: '0%', opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { y: '-105%' }}
                      transition={{ duration: 0.8, delay: reduceMotion ? 0 : 0.06, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        ...DISPLAY,
                        fontWeight: 300,
                        lineHeight: 0.9,
                        letterSpacing: '-0.01em',
                        color: '#fff',
                        fontSize: 'clamp(2.15rem, 7.5vw, 7rem)',
                        margin: 0,
                      }}
                    >
                      {headline}
                    </motion.h1>
                  </div>

                  {current?.collection && (
                    <motion.p
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ ...UTILITY, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginTop: '20px' }}
                    >
                      {current.collection}
                    </motion.p>
                  )}
                </div>
              </AnimatePresence>
            </div>

            {/* Right: CTA */}
            <motion.div
              className="shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href="/explore"
                className="group inline-flex items-center justify-center gap-3 md:gap-4 w-full md:w-auto rounded-full md:rounded-none px-6 py-4 md:px-0 md:py-0 bg-white/[0.08] md:bg-transparent"
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  textDecoration: 'none',
                }}
                // Mobile gets a filled pill: a bigger, more obvious tap target
                // than the desktop text+circle pairing, since thumbs need a
                // clearer invitation than a hover-revealed cursor does.
              >
                <span
                  style={{ ...UTILITY, letterSpacing: '0.24em', textTransform: 'uppercase', transition: 'opacity 0.35s' }}
                  className="text-[11px] md:text-[10px] group-hover:opacity-50"
                >
                  Shop now
                </span>
                <MagneticCircle>
                  <span
                    className="inline-flex items-center justify-center rounded-full w-8 h-8 md:w-10 md:h-10"
                    style={{
                      border: '0.5px solid rgba(255,255,255,0.4)',
                      color: 'rgba(255,255,255,0.9)',
                      flexShrink: 0,
                      transition: 'background 0.45s cubic-bezier(0.22,1,0.36,1), color 0.45s, border-color 0.45s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background   = ACCENT
                      e.currentTarget.style.color         = ACCENT_INK
                      e.currentTarget.style.borderColor   = ACCENT
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background   = 'transparent'
                      e.currentTarget.style.color         = 'rgba(255,255,255,0.9)'
                      e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.4)'
                    }}
                  >
                    <ArrowRight
                      size={13}
                      style={{ transition: 'transform 0.35s' }}
                      className="group-hover:translate-x-[2px]"
                    />
                  </span>
                </MagneticCircle>
              </Link>
            </motion.div>
          </div>

          {/* ── Product strip ── */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current._id + '-strip'}
                className="mt-10 pt-5 flex items-center justify-between"
                style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
              >
                {/* Product name */}
                <Link
                  href={`/product/${current._id}`}
                  className="group flex items-center gap-3 min-w-0"
                  style={{ textDecoration: 'none' }}
                >
                  <span
                    className="group-hover:opacity-40 truncate"
                    style={{
                      ...DISPLAY,
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      color: 'rgba(255,255,255,0.65)',
                      transition: 'opacity 0.25s',
                      maxWidth: 'min(320px, 55vw)',
                      display: 'block',
                    }}
                  >
                    {current.title}
                  </span>
                  <ArrowRight
                    size={10}
                    className="opacity-0 group-hover:opacity-40 -translate-x-1 group-hover:translate-x-0"
                    style={{ color: 'rgba(255,255,255,0.65)', flexShrink: 0, transition: 'opacity 0.25s, transform 0.3s' }}
                  />
                </Link>

                {/* Quick View — visible on all screen sizes */}
                <button
                  type="button"
                  onClick={() => setQuickViewProduct(current)}
                  aria-label={`Quick view: ${current.title}`}
                  style={{
                    ...UTILITY,
                    fontSize: '9px',
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.35)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'opacity 0.25s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  See it
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Scroll cue ── */}
        <ScrollCue />

      </section>
    </>
  )
}