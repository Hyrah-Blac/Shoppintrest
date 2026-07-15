'use client'

/**
 * SavedPage · Shoppin
 *
 * A wishlist grid, not an inbox — quiet at rest, with exactly two ways to
 * unsave something and no redundant controls fighting for the same corner
 * of a card:
 *
 *  - Desktop: ProductCard's own heart handles it, one click, nothing added.
 *  - Touch: a swipe-left gesture reveals a red "Unsave" bed behind the
 *    card, plus a solid Pinterest-red pill underneath in the same
 *    calligraphic script Hero uses for "Scroll to shop" / "See it" — the
 *    heart icon is a genuinely hard target to land with a thumb, so touch
 *    gets a second, larger, easy-to-land control that desktop doesn't need.
 *  - Either path is undo-able: a bottom toast holds the item for a few
 *    seconds with an Undo action, so a swipe you didn't mean can't
 *    silently lose the piece. The drain timer reuses Hero's ProgressRail
 *    motif rather than inventing a new one.
 *
 * Design tokens (type, ACCENT, RADIUS_*) match HeroSection's so this reads
 * as the same product, not a different page pasted in.
 *
 * Touch detection uses actual input capability (matchMedia on hover/pointer,
 * same pattern as Hero's CustomCursor) rather than a viewport breakpoint —
 * a resized or docked desktop window shouldn't get treated as mobile.
 *
 * useSavedStore's real method names haven't been confirmed. handleRequestRemove
 * / handleUndo below try a short list of likely candidates and, if none
 * match, log the store's actual keys to the console instead of failing
 * silently — if unsaving does nothing, check there first.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Playfair_Display, DM_Sans, Parisienne, Great_Vibes } from 'next/font/google'
import {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'framer-motion'
import { ArrowRight, Heart } from 'lucide-react'
import { useSavedStore } from '@/store/useSavedStore'
import { ProductCard } from '@/components/product/ProductCard'

// Self-hosted via next/font — matches the DISPLAY/UTILITY split used
// throughout HeroSection so this page can't quietly drift onto a
// different serif/sans pairing than the rest of the site.
const playfair  = Playfair_Display({ weight: ['400', '500', '600'], subsets: ['latin'], display: 'swap' })
const dmSans    = DM_Sans({ weight: ['400', '500', '700'], subsets: ['latin'], display: 'swap' })
// Same script Hero uses for "Scroll to shop" / "See it" — a connecting
// script needs its natural case and letterforms to read as handwriting,
// so it's kept out of the all-caps/tracked-caps treatment everything
// else on this page uses.
const parisienne = Parisienne({ weight: '400', subsets: ['latin'], display: 'swap' })
// The main headline script — same font Hero uses for its own title and
// Notifications now mirrors for "Notifications." Kept to natural case and
// zero letter-spacing here too: negative tracking breaks a connecting
// script's joined strokes.
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], display: 'swap' })

const clipReveal = {
  hidden:  { y: '105%' },
  visible: { y: '0%'   },
}

// The real --accent token (Pinterest red), theme-aware via HSL, with a
// literal fallback so this page never silently loses its one accent color
// if the variable is missing. Identical token to HeroSection's ACCENT.
const ACCENT     = 'hsl(var(--accent, 0 78% 54%))'
const ACCENT_INK = 'hsl(var(--accent-foreground, 0 0% 100%))'
// Same fallback-safe pattern as ACCENT, mirroring Notifications' FG token —
// used for the white half of the two-tone script title below.
const FG = 'hsl(var(--foreground, 0 0% 9%))'

const UNDO_WINDOW_MS = 5000

// Shared curvature — one scale so every rounded thing on the page reads as
// the same hand, rather than each component picking its own radius.
const RADIUS_LG   = 20   // tiles, unsave bed, toast
const RADIUS_PILL = 999  // buttons, badges

// One focus treatment reused on every button on the page, so Tab users get
// the same clear, on-brand ring everywhere instead of each browser's
// inconsistent default outline (or, worse, silence). Composes with an
// element's own resting box-shadow rather than replacing it, since a
// couple of these buttons already use box-shadow for depth.
function useFocusRing(restingShadow = 'none') {
  const ring = `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${ACCENT}`
  return {
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = restingShadow === 'none' ? ring : `${restingShadow}, ${ring}`
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = restingShadow
    },
  }
}

// ─── useIsTouchDevice ─────────────────────────────────────────────────────
// A viewport-width breakpoint (sm:hidden) answers "is the window narrow"
// — not "is this a touch device." A resized or docked desktop browser can
// easily dip under that width and get treated as mobile by mistake. This
// checks actual input capability instead, same pattern as the canHover
// check already used in MagneticButton and Hero's CustomCursor, and stays
// live if the person switches between mouse and touch (e.g. a 2-in-1
// laptop) rather than only checking once on load.

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    setIsTouch(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isTouch
}

type SavedProduct = { _id: string; title?: string; [key: string]: unknown }

// ─── MagneticButton ───────────────────────────────────────────────────────
// Same interaction Hero uses on its "Shop Now" CTA. Feature-detected so it
// stays inert on touch, where there's no cursor to pull toward.

function MagneticButton({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.4 })
  const canHover = useRef(
    typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : false
  )

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover.current) return
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
    <div
      style={{
        overflow:  'hidden',
        display:   'inline-block',
        lineHeight: 1,
        // Script faces like Great Vibes draw well outside the normal glyph
        // box on every side — tall above the line (the S's loop), and
        // wide/low at the finishing stroke (the d's tail swings out to the
        // right and below the baseline more than a normal descender).
        // All four sides get the same headroom-then-cancel treatment:
        // padding buys the room, the matching negative margin gives it
        // back so it doesn't shove the rest of the header around.
        padding: '0.34em 0.14em 0.26em 0.08em',
        margin:  '-0.34em -0.14em -0.26em -0.08em',
      }}
    >
      <motion.h1
        variants={clipReveal}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={greatVibes.className}
        style={{
          // Natural case, zero tracking — negative letter-spacing (what
          // the old Playfair treatment used) breaks a connecting script's
          // joined strokes, same reasoning as Hero and Notifications.
          fontSize:      'clamp(2.75rem, 7vw, 4.5rem)',
          fontWeight:    400,
          margin:        0,
          letterSpacing: '0em',
          display:       'block',
          color:         FG,
        }}
      >
        Sa<span style={{ color: ACCENT }}>ved</span>
      </motion.h1>
    </div>
  )
}

// ─── ExploreCTA (empty state) ─────────────────────────────────────────────

function ExploreCTA() {
  const focusRing = useFocusRing()
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
          borderRadius:   RADIUS_PILL,
          padding:        '14px 32px',
          whiteSpace:     'nowrap',
          transition:     'background 0.35s ease, color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = ACCENT
          e.currentTarget.style.color       = ACCENT_INK
          e.currentTarget.style.borderColor = ACCENT
          e.currentTarget.style.boxShadow   = '0 8px 24px hsl(var(--accent, 0 78% 54%) / 0.35)'
          e.currentTarget.style.transform   = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.color       = 'hsl(var(--foreground))'
          e.currentTarget.style.borderColor = 'hsl(var(--foreground) / 0.35)'
          e.currentTarget.style.boxShadow   = 'none'
          e.currentTarget.style.transform   = 'translateY(0)'
        }}
        {...focusRing}
      >
        <span>Explore the collection</span>
        <ArrowRight size={12} />
      </Link>
    </MagneticButton>
  )
}

// ─── SavedTile ────────────────────────────────────────────────────────────
// Two ways to unsave, neither of which touches ProductCard's own heart:
//  - drag the tile left past the threshold (works with a finger or a mouse)
//  - tap the fancy mobile-only "Unsave" pill underneath — desktop skips
//    this control entirely since the heart already handles it there
// A red "Unsave" bed sits behind the card and only becomes visible as the
// card is dragged off it, so nothing shows at rest on a page that's meant
// to feel like a wardrobe, not an inbox.

const DRAG_REMOVE_THRESHOLD = -90

function SavedTile({
  product,
  index,
  isTouch,
  onRequestRemove,
}: {
  product: SavedProduct
  index: number
  isTouch: boolean
  onRequestRemove: (product: SavedProduct) => void
}) {
  const reduceMotion = useReducedMotion()
  const dragX = useMotionValue(0)
  // Bed is invisible at rest and only fades in as the card actually moves —
  // previously it rendered at full opacity all the time, which bled a solid
  // red panel through any transparent part of ProductCard (and peeked out
  // at the rounded corners) even when nobody was dragging anything.
  const bedOpacity = useTransform(dragX, [0, -20, -70], [0, 0, 1])
  const cardControls = useAnimation()
  const [dismissed, setDismissed] = useState(false)
  const pillRestShadow = '0 6px 18px hsl(var(--accent, 0 78% 54%) / 0.4), inset 0 1px 0 rgba(255,255,255,0.25)'
  const pillFocusRing = useFocusRing(pillRestShadow)

  const fireRemove = useCallback(() => {
    setDismissed(true)
    // Let the exit play, then hand off to the parent, which owns the
    // actual store mutation + undo toast.
    setTimeout(() => onRequestRemove(product), 200)
  }, [onRequestRemove, product])

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < DRAG_REMOVE_THRESHOLD) {
        cardControls.start({ x: '-120%', opacity: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } })
        fireRemove()
      } else {
        cardControls.start({ x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } })
      }
    },
    [cardControls, fireRemove]
  )

  return (
    <motion.div
      layout
      variants={clipReveal}
      initial="hidden"
      animate={dismissed ? { opacity: 0, scale: 0.97 } : 'visible'}
      transition={{
        duration: 0.55,
        delay:    dismissed ? 0 : Math.min(index, 7) * 0.04,
        ease:     [0.22, 1, 0.36, 1],
      }}
    >
      {/* Card + bed share their own positioning context, scoped to just
          the image/card footprint — the unsave pill below lives outside
          this box entirely, so the bed can never bleed into it. */}
      <div style={{ position: 'relative' }}>
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="absolute inset-0 flex items-center justify-end"
            style={{ background: ACCENT, borderRadius: RADIUS_LG, paddingRight: 22, opacity: bedOpacity, pointerEvents: 'none' }}
          >
            <span
              className={dmSans.className}
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT_INK }}
            >
              Unsave
            </span>
          </motion.div>
        )}

        <motion.div
          drag={reduceMotion ? false : 'x'}
          dragDirectionLock
          dragConstraints={{ left: -140, right: 0 }}
          dragElastic={{ left: 0.5, right: 0 }}
          whileHover={isTouch ? undefined : { y: -4, boxShadow: '0 14px 30px rgba(0,0,0,0.22)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            x:            dragX,
            position:     'relative',
            touchAction:  'pan-y',
            // Rounds the whole card into one continuous shape instead of
            // the hard photo-cuts-into-a-square-white-box seam — this is
            // an outer crop on the container, not a restyle of anything
            // ProductCard renders internally (its price/brand/category
            // markup and colors are untouched). Safe to reintroduce now:
            // the earlier bleed-through bug was the unsave bed rendering
            // at full opacity at rest, not this radius/overflow pairing
            // itself — that's fixed independently, further down.
            borderRadius: RADIUS_LG,
            overflow:     'hidden',
          }}
          animate={cardControls}
          onDragEnd={handleDragEnd}
        >
          {/* Everything ProductCard renders — its image, its info panel,
              its own heart button — stays exactly as-is. Only the outer
              corners are being cropped here. */}
          <ProductCard product={product as never} />
        </motion.div>
      </div>

      {/* Unsave control — touch devices only. Desktop already has
          ProductCard's own heart to toggle a save off, so a second
          always-on control there would just be noise; on a touch screen
          that heart is a much smaller target, so this exists as the
          deliberate, easy-to-land alternative. Gated on actual input
          capability (see useIsTouchDevice), not a viewport breakpoint —
          a narrow desktop window shouldn't get treated as mobile. Not
          rendered at all on non-touch, so there's no flash of it before
          a media query kicks in. */}
      {isTouch && (
        <motion.button
          type="button"
          onClick={fireRemove}
          initial={{ opacity: 0, scale: 0.5, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.15 + Math.min(index, 7) * 0.03 }}
          whileTap={{ scale: 0.86 }}
          style={{
            position:        'relative',
            overflow:        'hidden',
            display:         'inline-flex',
            alignItems:      'center',
            marginTop:       10,
            color:           '#fff',
            background:      `linear-gradient(160deg, ${ACCENT}, hsl(var(--accent, 0 78% 54%) / 0.88))`,
            border:          'none',
            borderRadius:    RADIUS_PILL,
            padding:         '8px 22px 10px',
            cursor:          'pointer',
            boxShadow:       pillRestShadow,
          }}
          aria-label={`Unsave ${product.title ?? 'this item'}`}
          {...pillFocusRing}
        >
          {/* One-time glossy sweep after the pill lands — the bit of
              polish that makes solid red read as a considered surface
              instead of a flat fill. */}
          <motion.span
            aria-hidden
            className="absolute inset-y-0 pointer-events-none"
            style={{
              width:      '40%',
              background: 'linear-gradient(115deg, transparent, rgba(255,255,255,0.55), transparent)',
            }}
            initial={{ left: '-45%' }}
            animate={{ left: '130%' }}
            transition={{ duration: 0.9, delay: 0.5 + Math.min(index, 7) * 0.03, ease: [0.22, 1, 0.36, 1] }}
          />
          <span
            className={parisienne.className}
            style={{ position: 'relative', fontSize: 18, lineHeight: 1, transform: 'translateY(1px)' }}
          >
            Unsave
          </span>
        </motion.button>
      )}
    </motion.div>
  )
}

// ─── SkeletonGrid ─────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
        >
          <div style={{ aspectRatio: '3/4', background: 'hsl(var(--border) / 0.4)', borderRadius: RADIUS_LG, marginBottom: 12 }} />
          <div style={{ height: 10, width: '35%', background: 'hsl(var(--border) / 0.4)', borderRadius: RADIUS_PILL, marginBottom: 8 }} />
          <div style={{ height: 13, width: '75%', background: 'hsl(var(--border) / 0.4)', borderRadius: RADIUS_PILL, marginBottom: 8 }} />
          <div style={{ height: 13, width: '25%', background: 'hsl(var(--border) / 0.4)', borderRadius: RADIUS_PILL }} />
        </motion.div>
      ))}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────

function EmptyState() {
  const reduceMotion = useReducedMotion()
  return (
    <div style={{ padding: '6rem 1rem', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
        style={{ display: 'inline-flex', marginBottom: 20 }}
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Heart size={30} strokeWidth={1.25} style={{ color: 'hsl(var(--muted) / 0.4)' }} />
        </motion.div>
      </motion.div>

      <div style={{ overflow: 'hidden', display: 'inline-block', marginBottom: 12 }}>
        <motion.p
          variants={clipReveal}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={playfair.className}
          style={{
            fontSize:      'clamp(1.5rem, 4vw, 1.75rem)',
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
          style={{ fontSize: 13, color: 'hsl(var(--muted))', margin: 0, lineHeight: 1.6 }}
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

// ─── UndoToast ────────────────────────────────────────────────────────────
// Reuses Hero's ProgressRail drain as the dismiss timer instead of a plain
// countdown number, so the two moments feel like the same product.

function UndoToast({
  label,
  onUndo,
  onExpire,
}: {
  label: string
  onUndo: () => void
  onExpire: () => void
}) {
  const focusRing = useFocusRing()
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={dmSans.className}
      style={{
        position:       'fixed',
        left:            '50%',
        transform:       'translateX(-50%)',
        bottom:          'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
        zIndex:          200,
        display:         'flex',
        alignItems:      'center',
        gap:             16,
        padding:         '12px 18px',
        background:      'hsl(var(--foreground))',
        color:           'hsl(var(--background))',
        borderRadius:    RADIUS_PILL,
        boxShadow:       '0 8px 30px rgba(0,0,0,0.25)',
        overflow:        'hidden',
        maxWidth:        'calc(100vw - 2.5rem)',
      }}
      role="status"
    >
      <span style={{ fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
      <button
        type="button"
        onClick={onUndo}
        style={{
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color:         ACCENT,
          background:    'none',
          border:        'none',
          borderRadius:  4,
          padding:       '2px 1px',
          cursor:        'pointer',
          whiteSpace:    'nowrap',
          transition:    'opacity 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        {...focusRing}
      >
        Undo
      </button>

      {/* Drain rail — same visual grammar as Hero's ProgressRail, sitting
          just inside the pill's own curve rather than a flat edge. */}
      <span
        className="absolute inset-x-3 bottom-[3px] h-[2px] block"
        style={{ background: 'hsl(var(--background) / 0.15)', borderRadius: RADIUS_PILL }}
      >
        <motion.span
          className="absolute inset-y-0 left-0 block"
          style={{ background: ACCENT, borderRadius: RADIUS_PILL }}
          initial={{ scaleX: 1, originX: 0 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: UNDO_WINDOW_MS / 1000, ease: 'linear' }}
          onAnimationComplete={onExpire}
        />
      </span>
    </motion.div>
  )
}

// ─── SavedPage ────────────────────────────────────────────────────────────

export default function SavedPage() {
  // Cast loosely rather than to a fixed shape — the actual method names on
  // useSavedStore haven't been confirmed, so this tries a short list of
  // likely candidates instead of assuming one and failing silently.
  const store = useSavedStore() as Record<string, unknown> & {
    savedProducts: SavedProduct[]
    isLoaded: boolean
    loadSaved: () => void
  }
  const { savedProducts, isLoaded, loadSaved } = store
  const isTouch = useIsTouchDevice()

  const removeSaved = (store.removeSaved ?? store.unsaveProduct ?? store.removeFromSaved ?? store.deleteSaved ?? store.unsave) as
    | ((id: string) => void)
    | undefined
  const saveProduct = (store.saveProduct ?? store.addSaved ?? store.saveItem ?? store.save) as
    | ((product: SavedProduct) => void)
    | undefined

  const [pendingRemoval, setPendingRemoval] = useState<SavedProduct | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isLoaded) loadSaved()
  }, [isLoaded, loadSaved])

  const handleRequestRemove = useCallback(
    (product: SavedProduct) => {
      if (!removeSaved) {
        // Loud on purpose — a silent optional-chain no-op here looks
        // exactly like "the button doesn't work" with nothing in the
        // console to explain why. This prints the store's real shape so
        // the actual method name is one console open away.
        console.error(
          '[SavedPage] useSavedStore has no removeSaved/unsaveProduct/removeFromSaved/deleteSaved/unsave method. ' +
          'Available store keys:', Object.keys(store)
        )
        return
      }
      removeSaved(product._id)
      setPendingRemoval(product)
      // JS-level fallback for the toast's own drain-bar timer — the visual
      // one is enough on its own most of the time, but a backgrounded tab
      // can pause its rAF-driven animation without pausing setTimeout, so
      // this guarantees the toast can't get stuck open indefinitely.
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      undoTimerRef.current = setTimeout(() => setPendingRemoval(null), UNDO_WINDOW_MS + 400)
    },
    [removeSaved, store]
  )

  const handleUndo = useCallback(() => {
    if (!pendingRemoval) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    if (!saveProduct) {
      console.warn(
        '[SavedPage] useSavedStore has no saveProduct/addSaved/saveItem/save method — Undo can\'t restore the item. ' +
        'Available store keys:', Object.keys(store)
      )
      setPendingRemoval(null)
      return
    }
    saveProduct(pendingRemoval)
    setPendingRemoval(null)
  }, [pendingRemoval, saveProduct, store])

  const handleExpire = useCallback(() => {
    setPendingRemoval(null)
  }, [])

  return (
    <div
      className={dmSans.className}
      style={{
        maxWidth: 1280,
        margin:   '0 auto',
        padding:  '3rem 1.5rem 6rem',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))',
      }}
    >

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
          style={{ height: '0.5px', background: 'hsl(var(--border) / 0.6)', marginTop: '2rem' }}
        />

        {/* Swipe hint — only shown once there's something to swipe, and
            only worth saying on an actual touch device where swipe isn't
            obvious from the UI alone. */}
        {isLoaded && savedProducts.length > 0 && isTouch && (
          <p
            style={{ fontSize: 10.5, color: 'hsl(var(--muted) / 0.7)', marginTop: 10, letterSpacing: '0.02em' }}
          >
            Swipe a piece left, or tap Unsave, to take it off your list.
          </p>
        )}
      </div>

      {/* ── Body ── */}
      {!isLoaded ? (
        <SkeletonGrid />
      ) : savedProducts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
          <AnimatePresence initial={false}>
            {savedProducts.map((product, i) => (
              <SavedTile key={product._id} product={product} index={i} isTouch={isTouch} onRequestRemove={handleRequestRemove} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {pendingRemoval && (
          <UndoToast
            key={pendingRemoval._id}
            label={`Unsaved ${pendingRemoval.title ?? 'item'}`}
            onUndo={handleUndo}
            onExpire={handleExpire}
          />
        )}
      </AnimatePresence>
    </div>
  )
}