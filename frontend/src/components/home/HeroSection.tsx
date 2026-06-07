'use client'

/**
 * HeroSection — v4 · Shoppin
 *
 * v1 → v2 (structural):  video support, blur-up images, Quick View modal,
 *                         cursor safety, slide preloader, touch swipe, focus trap
 * v2 → v3 (copy):        Shoppin voice — new headlines, "Shop now", "See it",
 *                         "Get it", "Look", "Keep going", "Now in store"
 * v2 → v3 (code polish): removed dead `fmt` helper, fixed stale-closure in
 *                         useSwipe via callback refs, added pause-on-hover,
 *                         aria-busy on skeleton, aria-live on headline
 * v3 → v4 (mobile):       safe-area bottom padding, headline clamp floor 2.5rem,
 *                         progress rail full-width on mobile, "See it" visible on
 *                         mobile, product name less aggressive truncation, modal
 *                         image capped at 40dvh, modal maxHeight 88dvh, scroll cue
 *                         safe-area aware, pause-on-hover touch guard
 *
 * globals.css additions required:
 *   @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
 *   :root { --font-display: 'Cormorant Garamond', serif; }
 *
 *   .can-hover #hero-section { cursor: none; }
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
  videoUrl?: string   // optional: mp4/webm absolute URL
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDE_INTERVAL  = 6000
const KB_DURATION     = SLIDE_INTERVAL / 1000
const FALLBACK_LINES  = [
  'Dressed for right now.',
  'This is what\'s next.',
  'The pieces people keep.',
  'Worth every look.',
  'Nothing basic. Ever.',
] as const
const SEASON_LABEL    = 'Now in store'

// 1×1 transparent gif — used as blur-up placeholder when no blurDataURL supplied
const BLANK_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
}

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
          className="relative h-[1px] flex-1 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          {i === active && (
            <motion.span
              className="absolute inset-y-0 left-0 block"
              style={{ background: 'rgba(255,255,255,0.9)', width: '100%' }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: KB_DURATION, ease: 'linear' }}
            />
          )}
          {i < active && (
            <span className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.9)' }} />
          )}
        </button>
      ))}
    </div>
  )
}

// ─── HeroMedia — handles both image (blur-up) and video ───────────────────────

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

  // Attempt autoplay when media mounts
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.play().catch(() => { /* autoplay blocked — video will show first frame */ })
  }, [])

  // Video hero
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

  // Image hero with blur-up
  const src         = product.images?.[0]?.url
  const blurSrc     = product.images?.[0]?.blurDataURL ?? BLANK_PLACEHOLDER

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
      {/* Blurred placeholder — fades out once real image loads */}
      <Image
        src={blurSrc}
        alt=""
        fill
        aria-hidden
        className="object-cover object-center"
        style={{
          transition: 'opacity 0.6s',
          opacity: imgLoaded ? 0 : 1,
          filter: 'blur(20px)',
          transform: 'scale(1.05)',
        }}
      />
      {/* Full-res image */}
      <Image
        src={src}
        alt={product.title}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover object-center"
        draggable={false}
        style={{
          transition: 'opacity 0.6s',
          opacity: imgLoaded ? 1 : 0,
        }}
        onLoad={() => setImgLoaded(true)}
      />
    </motion.div>
  )
}

// ─── Preloader — kicks off next slide's media silently ────────────────────────

function useSlidePreloader(products: Product[], active: number) {
  useEffect(() => {
    if (products.length < 2) return
    const next = products[(active + 1) % products.length]
    if (!next) return

    if (next.videoUrl) {
      // Preload video by creating a hidden element
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
  const modalId   = useId()
  const closeRef  = useRef<HTMLButtonElement>(null)
  const firstImgSrc = product.images?.[0]?.url

  // Focus close button on open; restore on close
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => { prev?.focus() }
  }, [])

  // Focus trap
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

  // Lock body scroll while open
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
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
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

      {/* Sheet */}
      <motion.div
        id={modalId}
        className="relative z-10 w-full md:w-auto md:max-w-2xl"
        style={{
          background: 'hsl(20 14% 6%)',
          borderTop: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: '0',
        }}
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
            <div className="relative w-full md:w-64 shrink-0" style={{ minHeight: '180px', maxHeight: '40dvh' }}>
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
                <p
                  style={{
                    ...DISPLAY,
                    fontSize: '9px',
                    letterSpacing: '0.38em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.35)',
                    marginBottom: '14px',
                  }}
                >
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
                <p
                  style={{
                    ...DISPLAY,
                    fontSize: '10px',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.32)',
                    marginBottom: '20px',
                  }}
                >
                  {product.collection}
                </p>
              )}

              {product.description && (
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.75,
                    color: 'rgba(255,255,255,0.45)',
                    maxWidth: '320px',
                  }}
                >
                  {product.description}
                </p>
              )}
            </div>

            {/* CTA row — price intentionally on PDP only */}
            <div className="flex items-center gap-4 mt-8">
              <Link
                href={`/product/${product._id}`}
                className="inline-flex items-center gap-3 group"
                style={{
                  ...DISPLAY,
                  fontSize: '10px',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.85)',
                  textDecoration: 'none',
                }}
                onClick={onClose}
              >
                <span style={{ transition: 'opacity 0.3s' }} className="group-hover:opacity-50">
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

        {/* Close button */}
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
            border: '0.5px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            transition: 'background 0.25s, border-color 0.25s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
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
    // Only on true hover-capable devices (not touch)
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    // Signal CSS to hide native cursor inside hero
    document.documentElement.classList.add('can-hover')

    const el = heroRef.current
    if (!el) return

    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (rafId.current) return
      rafId.current = requestAnimationFrame(() => {
        const { x, y } = pos.current
        if (dotRef.current)  dotRef.current.style.transform  = `translate(${x}px,${y}px)`
        if (ringRef.current) ringRef.current.style.transform = `translate(${x}px,${y}px)`
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

    el.querySelectorAll('a, button').forEach(n => {
      n.addEventListener('mouseenter', startExpand)
      n.addEventListener('mouseleave', endExpand)
    })
    el.addEventListener('mousemove', move, { passive: true })
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)

    return () => {
      document.documentElement.classList.remove('can-hover')
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
      el.querySelectorAll('a, button').forEach(n => {
        n.removeEventListener('mouseenter', startExpand)
        n.removeEventListener('mouseleave', endExpand)
      })
      rafId.current && cancelAnimationFrame(rafId.current)
    }
  }, [heroRef])

  const T = 'width 0.35s cubic-bezier(0.22,1,0.36,1), height 0.35s cubic-bezier(0.22,1,0.36,1), margin 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.18s'

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
            ...DISPLAY,
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
    const t = setTimeout(() => setVisible(true), 2200)
    const onScroll = () => { if (window.scrollY > 50) setVisible(false) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          className="absolute left-1/2 z-20 flex flex-col items-center gap-[5px]" style={{ bottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))', translateX: '-50%' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.6 }}
          aria-hidden
        >
          <span style={{ ...DISPLAY, fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Keep going
          </span>
          <motion.div
            animate={reduceMotion ? {} : { y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Touch Swipe Hook ─────────────────────────────────────────────────────────
// Uses refs for callbacks to avoid stale closures — the effect never needs to
// re-run just because advance/retreat were re-created.

function useSwipe(
  ref: RefObject<HTMLElement | null>,
  onLeft: () => void,
  onRight: () => void
) {
  const onLeftRef  = useRef(onLeft)
  const onRightRef = useRef(onRight)
  useEffect(() => { onLeftRef.current  = onLeft  }, [onLeft])
  useEffect(() => { onRightRef.current = onRight }, [onRight])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let startX = 0
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
    const onTouchEnd   = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) < 40) return
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

// ─── HeroSection ──────────────────────────────────────────────────────────────

export function HeroSection() {
  const [products, setProducts]           = useState<Product[]>([])
  const [active, setActive]               = useState(0)
  const [loaded, setLoaded]               = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const { scrollYProgress } = useScroll({
    target: isMounted ? sectionRef : undefined,
    offset: ['start start', 'end start'],
  })
  const bgY   = useTransform(scrollYProgress, [0, 1], ['0%',   '18%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%'])

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
    if (products.length < 2) return
    timerRef.current = setInterval(advance, SLIDE_INTERVAL)
    return () => clearInterval(timerRef.current!)
  }, [advance, products.length])

  const goTo = useCallback((i: number) => {
    clearInterval(timerRef.current!)
    setActive(i)
    timerRef.current = setInterval(advance, SLIDE_INTERVAL)
  }, [advance])

  // ── Touch swipe ───────────────────────────────────────────────────────────
  useSwipe(sectionRef, advance, retreat)

  const current  = products[active]
  const headline = current?.headline ?? FALLBACK_LINES[active % FALLBACK_LINES.length]

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <section
        className="relative w-full overflow-hidden"
        style={{ height: '100dvh', minHeight: '600px' }}
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

      {/* Quick View modal — portalled above everything */}
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
        className="relative w-full overflow-hidden"
        style={{ height: '100dvh', minHeight: '600px' }}
        aria-label="Featured collection"
        onMouseEnter={() => { if (!window.matchMedia('(hover: hover)').matches) return; if (timerRef.current) clearInterval(timerRef.current) }}
        onMouseLeave={() => { if (!window.matchMedia('(hover: hover)').matches) return; if (products.length < 2) return; timerRef.current = setInterval(advance, SLIDE_INTERVAL) }}
      >
        {/* ── Background ── */}
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

        {/* ── Season label — top left ── */}
        <motion.p
          className="absolute top-8 left-8 md:top-10 md:left-12 z-10"
          style={{ ...DISPLAY, fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}
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
                style={{ ...DISPLAY, fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {pad(active + 1)}
              </motion.span>
            </AnimatePresence>
            <span style={{ ...DISPLAY, fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ ...DISPLAY, fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>
              {pad(products.length)}
            </span>
          </motion.div>
        )}

        {/* ── Bottom content block ── */}
        <motion.div
          className="absolute bottom-0 inset-x-0 z-10 px-5 pb-[max(3.5rem,env(safe-area-inset-bottom,3.5rem))] md:px-12 md:pb-16"
          style={{ y: reduceMotion ? 0 : copyY }}
        >
          {/* Progress rail */}
          {products.length > 1 && (
            <div className="mb-8 md:mb-10" style={{ maxWidth: '100%', width: 'min(260px, 100%)'}}>
              <ProgressRail total={products.length} active={active} onSelect={goTo} />
            </div>
          )}

          {/* Headline + CTA row */}
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            {/* Left: editorial copy */}
            <div style={{ maxWidth: '680px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active + '-copy'}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                >
                  {current?.brand && (
                    <p style={{ ...DISPLAY, fontSize: '9px', letterSpacing: '0.36em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: '16px' }}>
                      {current.brand}
                    </p>
                  )}

                  <h1
                    aria-live="polite"
                    style={{
                      ...DISPLAY,
                      fontWeight: 300,
                      lineHeight: 0.9,
                      letterSpacing: '-0.01em',
                      color: '#fff',
                      fontSize: 'clamp(2.5rem, 7.5vw, 7rem)',
                      margin: 0,
                    }}
                  >
                    {headline}
                  </h1>

                  {current?.collection && (
                    <p style={{ ...DISPLAY, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginTop: '20px' }}>
                      {current.collection}
                    </p>
                  )}
                </motion.div>
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
                className="group inline-flex items-center gap-4"
                style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}
              >
                <span
                  style={{ ...DISPLAY, fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', transition: 'opacity 0.35s' }}
                  className="group-hover:opacity-50"
                >
                  Shop now
                </span>
                <span
                  className="inline-flex items-center justify-center rounded-full group-hover:bg-white group-hover:[color:black]"
                  style={{
                    width: '40px', height: '40px',
                    border: '0.5px solid rgba(255,255,255,0.32)',
                    color: 'rgba(255,255,255,0.85)',
                    flexShrink: 0,
                    transition: 'background 0.45s cubic-bezier(0.22,1,0.36,1), color 0.45s',
                  }}
                >
                  <ArrowRight size={13} style={{ transition: 'transform 0.35s' }} className="group-hover:translate-x-[2px]" />
                </span>
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
                {/* Product name — no price; price lives on PDP */}
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

                {/* Quick View — fully wired, desktop only */}
                <button
                  type="button"
                  onClick={() => setQuickViewProduct(current)}
                  className="block"
                  aria-label={`See ${current.title}`}
                  style={{
                    ...DISPLAY,
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