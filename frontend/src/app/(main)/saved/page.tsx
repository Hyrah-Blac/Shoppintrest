'use client'

/**
 * SavedPage — v2 · Shoppin
 *
 * Brought up to the same bar as HeroSection v14:
 *  - Self-hosted type via next/font/google (Playfair Display for display
 *    copy, DM Sans for utility/caption text) instead of `var(--font-serif)`
 *    with a bare `serif` fallback — same fix Hero made for Great Vibes, so
 *    the title can't silently fall back to the browser default.
 *  - The one accent color (--accent, Pinterest red) is now used sparingly
 *    here too: the piece count, the empty-state CTA hover fill, and the
 *    remove-from-saved affordance — matching how Hero spends it on the
 *    active progress dot and "Shop Now" hover only.
 *  - Skeleton now breathes (opacity pulse) instead of sitting static, same
 *    motion language as Hero's loading skeleton.
 *  - Empty-state CTA rebuilt as a magnetic bordered rectangle (Hero's
 *    "Shop Now" language) instead of the old hairline-underline link, so
 *    the two pages read as one product.
 *  - Grid items get a quiet hover lift + a "Remove" affordance that only
 *    appears on hover/focus, echoing the "Tap the heart to save" copy in
 *    the empty state without adding a second saving mechanism to learn.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import Link from 'next/link'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { motion, useAnimation, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Heart, ArrowRight } from 'lucide-react'
import { useSavedStore } from '@/store/useSavedStore'
import { ProductCard } from '@/components/product/ProductCard'

// Self-hosted via next/font — matches the DISPLAY/UTILITY split used
// throughout HeroSection so this page can't quietly drift onto a
// different serif/sans pairing than the rest of the site.
const playfair = Playfair_Display({ weight: ['400', '500', '600'], subsets: ['latin'], display: 'swap' })
const dmSans   = DM_Sans({ weight: ['400', '500', '700'], subsets: ['latin'], display: 'swap' })

const clipReveal = {
  hidden:  { y: '105%' },
  visible: { y: '0%'   },
}

// The real --accent token (Pinterest red), theme-aware via HSL, with a
// literal fallback so this page never silently loses its one accent color
// if the variable is missing. Identical token to HeroSection's ACCENT.
const ACCENT     = 'hsl(var(--accent, 0 78% 54%))'
const ACCENT_INK = 'hsl(var(--accent-foreground, 0 0% 100%))'

// ─── MagneticButton ───────────────────────────────────────────────────────
// Same interaction Hero uses on its "Shop Now" CTA — the button pulls
// gently toward the cursor as it approaches, then springs back on leave.
// Inert on touch devices, there's no mousemove to react to.

function MagneticButton({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.4 })

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.3)
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.3)
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

// ─── PageTitle ────────────────────────────────────────────────────────────

function PageTitle() {
  return (
    <div style={{ overflow: 'hidden', display: 'inline-block', lineHeight: 1 }}>
      <motion.h1
        variants={clipReveal}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={playfair.className}
        style={{
          fontSize:      32,
          fontWeight:    500,
          margin:        0,
          letterSpacing: '-0.02em',
          display:       'block',
        }}
      >
        Saved
      </motion.h1>
    </div>
  )
}

// ─── ExploreCTA (empty state) ─────────────────────────────────────────────
// Rebuilt as the bordered-rectangle CTA from Hero, rather than the old
// underline-circle link, so both pages share one CTA language.

function ExploreCTA() {
  return (
    <MagneticButton>
      <Link
        href="/explore"
        className={dmSans.className}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            10,
          fontSize:       11,
          fontWeight:     500,
          letterSpacing:  '0.2em',
          textTransform:  'uppercase',
          color:          'hsl(var(--foreground))',
          textDecoration: 'none',
          border:         '1px solid hsl(var(--foreground) / 0.35)',
          padding:        '14px 32px',
          whiteSpace:     'nowrap',
          transition:     'background 0.35s ease, color 0.35s ease, border-color 0.35s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = ACCENT
          e.currentTarget.style.color       = ACCENT_INK
          e.currentTarget.style.borderColor = ACCENT
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.color       = 'hsl(var(--foreground))'
          e.currentTarget.style.borderColor = 'hsl(var(--foreground) / 0.35)'
        }}
      >
        <span>Explore the collection</span>
        <ArrowRight size={12} />
      </Link>
    </MagneticButton>
  )
}

// ─── SavedTile ────────────────────────────────────────────────────────────
// Wraps ProductCard with the quiet hover lift + hover-only remove
// affordance. Doesn't touch ProductCard itself, so its own internal
// save/heart logic keeps working — this just adds a second, obvious exit
// from the page that doesn't require finding the heart on the card.

function SavedTile({
  product,
  index,
  onRemove,
}: {
  product: { _id: string; title?: string }
  index: number
  onRemove: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setRemoving(true)
      // Let the exit animation play before it actually leaves the list.
      setTimeout(() => onRemove(product._id), 220)
    },
    [onRemove, product._id]
  )

  return (
    <motion.div
      key={product._id}
      layout
      variants={clipReveal}
      initial="hidden"
      animate={removing ? { opacity: 0, scale: 0.96 } : 'visible'}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.55,
        delay:    removing ? 0 : Math.min(index, 7) * 0.04,
        ease:     [0.22, 1, 0.36, 1],
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      <motion.div
        animate={{ y: hovered ? -3 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <ProductCard product={product as never} />
      </motion.div>

      <button
        type="button"
        onClick={handleRemove}
        aria-label={`Remove ${product.title ?? 'item'} from saved`}
        className={dmSans.className}
        style={{
          position:        'absolute',
          top:              10,
          right:            10,
          display:          'flex',
          alignItems:       'center',
          justifyContent:   'center',
          width:            30,
          height:           30,
          borderRadius:     '50%',
          border:           '0.5px solid hsl(var(--border) / 0.7)',
          background:       'hsl(var(--background) / 0.85)',
          backdropFilter:   'blur(6px)',
          cursor:           'pointer',
          opacity:          hovered ? 1 : 0,
          transform:        hovered ? 'scale(1)' : 'scale(0.9)',
          transition:       'opacity 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
        }}
        onFocus={() => setHovered(true)}
        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.7)' }}
      >
        <Heart size={13} fill={ACCENT} color={ACCENT} strokeWidth={0} />
      </button>
    </motion.div>
  )
}

// ─── SkeletonGrid ─────────────────────────────────────────────────────────
// Now breathes instead of sitting flat — same opacity-pulse language as
// HeroSection's loading state, so the two loading moments feel related.

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem 1.5rem' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
        >
          <div style={{ aspectRatio: '3/4', background: 'hsl(var(--border) / 0.4)', marginBottom: 12 }} />
          <div style={{ height: 10, width: '35%', background: 'hsl(var(--border) / 0.4)', marginBottom: 8 }} />
          <div style={{ height: 13, width: '75%', background: 'hsl(var(--border) / 0.4)', marginBottom: 8 }} />
          <div style={{ height: 13, width: '25%', background: 'hsl(var(--border) / 0.4)' }} />
        </motion.div>
      ))}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ padding: '6rem 1rem', textAlign: 'center' }}>
      <div style={{ overflow: 'hidden', display: 'inline-block', marginBottom: 12 }}>
        <motion.p
          variants={clipReveal}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={playfair.className}
          style={{
            fontSize:      28,
            fontWeight:    500,
            color:         'hsl(var(--foreground))',
            margin:        0,
            letterSpacing: '-0.01em',
          }}
        >
          Nothing saved yet
        </motion.p>
      </div>
      <div style={{ overflow: 'hidden', display: 'block', marginBottom: '2rem' }}>
        <motion.p
          variants={clipReveal}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className={dmSans.className}
          style={{
            fontSize:   13,
            color:      'hsl(var(--muted))',
            margin:     0,
            lineHeight: 1.6,
          }}
        >
          Tap the heart on any piece to save it here.
        </motion.p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      >
        <ExploreCTA />
      </motion.div>
    </div>
  )
}

// ─── SavedPage ────────────────────────────────────────────────────────────

export default function SavedPage() {
  const { savedProducts, isLoaded, loadSaved, removeSaved } = useSavedStore() as {
    savedProducts: { _id: string; title?: string }[]
    isLoaded: boolean
    loadSaved: () => void
    removeSaved?: (id: string) => void
  }

  useEffect(() => {
    if (!isLoaded) loadSaved()
  }, [isLoaded, loadSaved])

  const handleRemove = useCallback(
    (id: string) => {
      removeSaved?.(id)
    },
    [removeSaved]
  )

  return (
    <div className={dmSans.className} style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ overflow: 'hidden', display: 'block', lineHeight: 1, marginBottom: 8 }}>
              <motion.p
                variants={clipReveal}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize:      10,
                  fontWeight:    500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color:         'hsl(var(--muted))',
                  margin:        0,
                  display:       'block',
                }}
              >
                Your collection
              </motion.p>
            </span>
            <PageTitle />
          </div>

          {isLoaded && savedProducts.length > 0 && (
            <span style={{ overflow: 'hidden', display: 'block', lineHeight: 1, paddingBottom: 4 }}>
              <motion.span
                variants={clipReveal}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display:            'flex',
                  alignItems:         'center',
                  gap:                6,
                  fontSize:           11,
                  fontWeight:         500,
                  letterSpacing:      '0.1em',
                  textTransform:      'uppercase',
                  color:              'hsl(var(--muted))',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span style={{ color: ACCENT }}>{String(savedProducts.length).padStart(2, '0')}</span>
                {savedProducts.length === 1 ? 'piece' : 'pieces'}
              </motion.span>
            </span>
          )}
        </div>

        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '0.5px', background: 'hsl(var(--border) / 0.6)', marginTop: '1.5rem' }}
        />
      </div>

      {/* ── Body ── */}
      {!isLoaded ? (
        <SkeletonGrid />
      ) : savedProducts.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem 1.5rem' }}>
          <AnimatePresence initial={false}>
            {savedProducts.map((product, i) => (
              <SavedTile key={product._id} product={product} index={i} onRemove={handleRemove} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}