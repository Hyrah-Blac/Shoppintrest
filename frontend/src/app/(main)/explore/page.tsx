'use client'

/**
 * ExplorePage — v3 · Shoppin
 *
 * Brought up to the same standard as HeroSection:
 *  - An editorial opener (eyebrow + Great Vibes script reveal) using the
 *    same font and masked "curtain lift" motion as the hero headline, so
 *    the page has a thesis moment instead of starting cold on a filter bar.
 *  - Category pills carry a single `layoutId` highlight that slides between
 *    the active pill via spring physics — the same shared-layout language
 *    as the hero's progress rail — instead of a flat class swap, filled
 *    with the shared ACCENT_GRADIENT rather than a thin outline.
 *  - The sticky filter bar sits in an elevated glass "toolbar card" with
 *    the same top edge-light hairline the sort dropdown uses, and a
 *    divider ties the sort control to the category row.
 *  - Switching category/sort crossfades the grid + result count together
 *    (mirrors the hero's slide crossfade) instead of snapping.
 *  - The empty state reuses the opener's script headline + curtain lift
 *    so a no-results view still feels like the same considered surface.
 *
 * Everything else — data fetching, infinite scroll, MasonryGrid — is
 * unchanged; only the presentation layer was touched.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'
import { Great_Vibes } from 'next/font/google'
import { apiClient } from '@/lib/api'
import { MasonryGrid } from '@/components/product/MasonryGrid'

// Same script family + loading strategy as the hero's headline — self-hosted
// via next/font so it can't silently fall back to generic cursive if a
// stylesheet import is missing or blocked.
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], display: 'swap' })

const CATEGORIES = [
  { label: 'All',         value: ''            },
  { label: 'Womenswear',  value: 'womenswear'  },
  { label: 'Menswear',    value: 'menswear'    },
  { label: 'Shoes',       value: 'shoes'       },
  { label: 'Bags',        value: 'bags'        },
  { label: 'Jewelry',     value: 'jewelry'     },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Beauty',      value: 'beauty'      },
  { label: 'Home',        value: 'home'        },
]

const SORT_OPTIONS = [
  { label: 'Newest',       value: 'newest'     },
  { label: 'Trending',     value: 'popular'    },
  { label: 'Price: Low',   value: 'price_asc'  },
  { label: 'Price: High',  value: 'price_desc' },
  { label: 'Top Rated',    value: 'rating'     },
]

// Rotates with the active category so the opener isn't a static label —
// small editorial gesture, not a full copy system. Built around the
// "Freshly found" motif so the script headline reads as one family of
// phrases rather than a generic tagline per filter.
const HEADLINES: Record<string, string> = {
  '':            'Freshly found',
  womenswear:    'Freshly styled',
  menswear:      'Freshly styled',
  shoes:         'Freshly stepped',
  bags:          'Freshly carried',
  jewelry:       'Freshly adorned',
  accessories:   'Freshly finished',
  beauty:        'Freshly glowing',
  home:          'Freshly arranged',
}

const EYEBROW = 'The Selection'

const ease = [0.16, 1, 0.3, 1] as const

// ─── Shared style tokens ────────────────────────────────────────────────────
// Pulled out because the accent treatment now appears in four places
// (active category pill, showing-chip, reset button hover, meta dot) and
// previously each one hand-typed its own copy of the gradient/shadow —
// one source of truth here means a color tweak only happens once.
const ACCENT_GRADIENT = 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.84) 100%)'
const ACCENT_GLOW      = 'var(--shadow-red)'
const EDGE_LIGHT        = 'linear-gradient(90deg, transparent, hsl(var(--border)) 40%, transparent)'

// Common hover-state transition for pill-style controls (color/background/
// border swap together, no box-shadow — pass that separately when needed).
const PILL_TRANSITION = `color var(--duration-fast) var(--ease-smooth),
  background var(--duration-fast) var(--ease-smooth),
  border-color var(--duration-fast) var(--ease-smooth)`

/* ═══════════════════════════════════════════════════════════════════════════
   SORT DROPDOWN — atmospheric glass panel, no hard dashboard borders
   ═══════════════════════════════════════════════════════════════════════════ */
function SortDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const current         = SORT_OPTIONS.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-1.5 shrink-0"
        style={{
          height:        '2.25rem',
          padding:       '0 0.75rem 0 1.125rem',
          borderRadius:  '999px',
          fontSize:      'var(--text-xs)',
          fontWeight:    open ? 550 : 450,
          letterSpacing: '0.01em',
          color:         open ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
          background:    open ? 'hsl(var(--surface-elevated))' : 'hsl(var(--surface-elevated) / 0.55)',
          border:        open ? '1px solid hsl(var(--border))' : '1px solid hsl(var(--border-subtle))',
          boxShadow:     open ? 'var(--shadow-sm)' : 'none',
          cursor:        'pointer',
          whiteSpace:    'nowrap',
          transition:    `${PILL_TRANSITION}, box-shadow var(--duration-fast) var(--ease-smooth)`,
        }}
      >
        <span>
          {current?.label ?? 'Sort'}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          style={{ display: 'flex', alignItems: 'center', color: 'hsl(var(--accent))' }}
        >
          <ChevronDown size={11} strokeWidth={2.25} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8,  scale: 0.96, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' }}
            exit={{   opacity: 0, y: 4,  scale: 0.97, filter: 'blur(1px)' }}
            transition={{ duration: 0.22, ease }}
            className="absolute right-0 z-50 overflow-hidden"
            style={{
              top:          'calc(100% + 8px)',
              minWidth:     '11rem',
              borderRadius: 'var(--radius-lg)',
              background:   'hsl(var(--surface-float))',
              border:       '1px solid hsl(var(--border-subtle))',
              boxShadow:    'var(--shadow-float)',
            }}
          >
            {/* Top edge highlight — VOID UI signature */}
            <div style={{ height: '1px', background: EDGE_LIGHT }} />

            <div style={{ padding: '0.375rem' }}>
              {SORT_OPTIONS.map((opt, i) => {
                const isActive = opt.value === value
                return (
                  <motion.button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.028, duration: 0.22, ease }}
                    className="w-full text-left flex items-center justify-between gap-3"
                    style={{
                      padding:      '0.5625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize:     'var(--text-sm)',
                      fontWeight:   isActive ? 500 : 300,
                      color:        isActive
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--foreground))',
                      background:   isActive
                        ? 'hsl(var(--accent-muted))'
                        : 'transparent',
                      transition:   `background var(--duration-fast) var(--ease-smooth),
                                     color    var(--duration-fast) var(--ease-smooth)`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background =
                          'hsl(var(--surface-elevated))'
                    }}
                    onMouseLeave={e => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    <span>{opt.label}</span>
                    {isActive && (
                      <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>✦</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CATEGORY PILL / RAIL — shared-layout sliding highlight, same language as
   the hero's progress rail: one moving element, physics-driven, rather than
   a class swap that snaps. Fully self-styled (not dependent on the global
   .pill/.active classes) so the active state reads as a real selection —
   a rich gradient fill with a soft glow — rather than a thin outline.
   ═══════════════════════════════════════════════════════════════════════════ */
function CategoryPill({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={!isActive ? { y: -1 } : undefined}
      className="relative shrink-0 overflow-hidden"
      style={{
        height:        '2.25rem',
        padding:       '0 1.125rem',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        borderRadius:  '999px',
        fontSize:      'var(--text-xs)',
        fontWeight:    isActive ? 600 : 450,
        letterSpacing: '0.01em',
        whiteSpace:    'nowrap',
        color:         isActive ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))',
        border:        isActive ? '1px solid transparent' : '1px solid hsl(var(--border-subtle))',
        background:    isActive ? 'transparent' : 'hsl(var(--surface-elevated) / 0.55)',
        cursor:        'pointer',
        transition:    PILL_TRANSITION,
      }}
      onMouseEnter={e => {
        if (isActive) return
        const el = e.currentTarget as HTMLElement
        el.style.color      = 'hsl(var(--foreground))'
        el.style.borderColor = 'hsl(var(--border))'
        el.style.background  = 'hsl(var(--surface-elevated))'
      }}
      onMouseLeave={e => {
        if (isActive) return
        const el = e.currentTarget as HTMLElement
        el.style.color      = 'hsl(var(--muted-foreground))'
        el.style.borderColor = 'hsl(var(--border-subtle))'
        el.style.background  = 'hsl(var(--surface-elevated) / 0.55)'
      }}
    >
      {isActive && (
        <motion.span
          layoutId="categoryHighlight"
          className="absolute inset-0"
          style={{
            borderRadius: 'inherit',
            background:   ACCENT_GRADIENT,
            boxShadow:    `${ACCENT_GLOW}, 0 0 0 1px hsl(var(--accent) / 0.45)`,
            zIndex: 0,
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        />
      )}
      <span className="relative" style={{ zIndex: 1 }}>{label}</span>
    </motion.button>
  )
}

function CategoryRail({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
      style={{ paddingBlock: '2px' }} /* prevent clipping on pill shadow/glow */
    >
      {CATEGORIES.map((cat) => (
        <CategoryPill
          key={cat.value}
          label={cat.label}
          isActive={cat.value === value}
          onClick={() => onChange(cat.value)}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EDITORIAL OPENER — small eyebrow + masked Great Vibes script reveal,
   the same font and "curtain lift" motion the hero uses on its headline.
   Kept quiet: no parallax, no video, no cursor — this page's job is
   browsing, not arrival, so the moment is brief and then gets out of the way.
   ═══════════════════════════════════════════════════════════════════════════ */
function ExploreOpener({ category }: { category: string }) {
  const headline = HEADLINES[category] ?? 'Freshly found'

  return (
    <div className="container-wide" style={{ paddingBlock: 'clamp(2rem, 5vw, 3.25rem) clamp(1.25rem, 3vw, 2rem)' }}>
      <motion.p
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        style={{
          fontSize:      'var(--text-2xs)',
          fontWeight:    500,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color:         'hsl(var(--muted-foreground))',
          marginBottom:  '0.625rem',
        }}
      >
        {EYEBROW}
      </motion.p>

      <div style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.h1
            key={headline}
            className={greatVibes.className}
            initial={{ y: '105%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-105%' }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontWeight:    400,
              letterSpacing: '0.01em',
              fontSize:      'clamp(2.75rem, 7vw, 5rem)',
              lineHeight:    1.2,
              color:         'hsl(var(--foreground))',
              margin:        0,
              paddingBottom: '0.1em', // clears descenders (the 'y', 'f') from the mask
            }}
          >
            {headline}
          </motion.h1>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ExplorePage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [products,       setProducts]       = useState<any[]>([])
  const [isLoading,      setIsLoading]      = useState(true)
  const [page,           setPage]           = useState(1)
  const [hasMore,        setHasMore]        = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [total,          setTotal]          = useState(0)

  const category = searchParams.get('category') || ''
  const sort     = searchParams.get('sort')     || 'newest'

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else       params.delete(key)
    params.delete('page')
    router.push(`/explore?${params.toString()}`)
  }

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) setIsLoading(true)
      else               setIsFetchingMore(true)
      try {
        const { data } = await apiClient.products.getAll({
          page:  pageNum,
          limit: 24,
          ...(category && { category }),
          ...(sort     && { sort }),
        })
        const incoming = data.data || []
        setTotal(data.total || 0)
        setHasMore(pageNum < (data.totalPages || 1))
        if (append) setProducts((prev) => [...prev, ...incoming])
        else        setProducts(incoming)
      } catch { /* silent */ }
      finally {
        setIsLoading(false)
        setIsFetchingMore(false)
      }
    },
    [category, sort]
  )

  useEffect(() => {
    setPage(1)
    fetchProducts(1, false)
  }, [fetchProducts])

  const loadMore = async () => {
    const next = page + 1
    setPage(next)
    await fetchProducts(next, true)
  }

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 800 &&
        hasMore && !isFetchingMore && !isLoading
      ) { loadMore() }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isFetchingMore, isLoading, page])

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

      {/* ══════════════════════════════════════════════════════════════════
          EDITORIAL OPENER — the page's thesis moment
      ══════════════════════════════════════════════════════════════════ */}
      <ExploreOpener category={category} />

      {/* ══════════════════════════════════════════════════════════════════
          STICKY FILTER BAR — glass atmospheric, top edge-light hairline
          to match the sort dropdown / VOID glass system
      ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky z-30 glass" style={{ top: '72px' }}>
        {/* Top edge highlight — same signature as the sort dropdown panel */}
        <div aria-hidden style={{ height: '1px', background: EDGE_LIGHT }} />

        <div className="container-wide" style={{ paddingBlock: '0.75rem' }}>

          {/* Toolbar card — lifts the controls off the page background so
              the bar reads as a considered surface, not raw buttons on
              black. Categories + Sort share one row, joined by a hairline
              divider so Sort no longer floats disconnected in empty space. */}
          <div
            className="flex items-center gap-3"
            style={{
              padding:      '0.5rem 0.625rem',
              borderRadius: 'var(--radius-xl)',
              background:   'hsl(var(--surface-elevated) / 0.4)',
              border:       '1px solid hsl(var(--border-subtle))',
              boxShadow:    'var(--shadow-sm)',
            }}
          >
            <CategoryRail value={category} onChange={(v) => setParam('category', v)} />

            {/* Divider — visually ties the sort control to the pill row */}
            <div
              aria-hidden
              className="hidden sm:block shrink-0"
              style={{ width: '1px', height: '1.375rem', background: 'hsl(var(--border))' }}
            />

            {/* Sort dropdown — always visible, right-anchored */}
            <div className="shrink-0">
              <SortDropdown
                value={sort}
                onChange={(v) => setParam('sort', v)}
              />
            </div>
          </div>

          {/* Active category chip — appears below when a non-All category is active */}
          <AnimatePresence>
            {category && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{   opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease }}
                className="overflow-hidden"
              >
                <div
                  className="flex items-center gap-2.5"
                  style={{ paddingTop: '0.75rem', paddingLeft: '0.625rem' }}
                >
                  <span
                    style={{
                      fontSize:      'var(--text-2xs)',
                      fontWeight:    500,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color:         'hsl(var(--muted-foreground))',
                    }}
                  >
                    Showing
                  </span>

                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{   opacity: 0, scale: 0.88 }}
                    transition={{ duration: 0.2, ease }}
                    onClick={() => setParam('category', '')}
                    className="flex items-center gap-1.5 cursor-pointer capitalize"
                    style={{
                      fontSize:     'var(--text-xs)',
                      fontWeight:   600,
                      padding:      '0.3125rem 0.75rem',
                      borderRadius: '999px',
                      color:        'hsl(var(--accent-foreground))',
                      background:   ACCENT_GRADIENT,
                      boxShadow:    ACCENT_GLOW,
                      transition:   'opacity var(--duration-fast) ease, transform var(--duration-fast) ease',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                  >
                    {category}
                    <X size={9} strokeWidth={2.75} />
                  </motion.button>

                  <button
                    onClick={() => router.push('/explore')}
                    style={{
                      fontSize:         'var(--text-xs)',
                      color:            'hsl(var(--muted-foreground))',
                      textDecoration:   'underline',
                      textUnderlineOffset: '3px',
                      fontWeight:       400,
                      transition:       `color var(--duration-hover) var(--ease-smooth)`,
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))')}
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      <div className="container-wide" style={{ paddingBlock: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

        {/* Result meta — editorial weight, not dashboard */}
        <AnimatePresence mode="wait">
          {!isLoading && (
            <motion.div
              key={`${category}-${sort}-meta`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="flex items-center gap-2.5"
              style={{ marginBottom: 'clamp(1rem, 2vw, 1.75rem)' }}
            >
              {/* Pulsing accent dot — small "freshly updated" signal, ties
                  the meta line back to the same accent used on active pills */}
              <motion.span
                aria-hidden
                style={{
                  width:        '5px',
                  height:       '5px',
                  borderRadius: '50%',
                  background:   'hsl(var(--accent))',
                  boxShadow:    '0 0 6px hsl(var(--accent) / 0.65)',
                  flexShrink:   0,
                }}
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="flex items-baseline gap-1.5">
                {/* Count rolls independently when it changes, rather than
                    only fading with the whole line */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={total}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{   opacity: 0, y: 4 }}
                    transition={{ duration: 0.25, ease }}
                    style={{
                      fontFamily:         "'Playfair Display', Georgia, serif",
                      fontWeight:         600,
                      fontSize:           'clamp(1.0625rem, 1.6vw, 1.1875rem)',
                      letterSpacing:      '-0.02em',
                      color:              'hsl(var(--foreground))',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {total.toLocaleString()}
                  </motion.span>
                </AnimatePresence>

                <span
                  style={{
                    fontSize:      'var(--text-sm)',
                    color:         'hsl(var(--muted-foreground))',
                    fontWeight:    300,
                    letterSpacing: '0.01em',
                  }}
                >
                  {total === 1 ? 'product' : 'products'}
                  {category && (
                    <>
                      {' '}in{' '}
                      <span
                        className="capitalize"
                        style={{ fontStyle: 'italic', fontWeight: 500, color: 'hsl(var(--accent))' }}
                      >
                        {category}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Masonry grid — crossfades on filter change, same beat as the
            hero's background crossfade between slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${category}-${sort}-grid`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <MasonryGrid
              products={products}
              isLoading={isLoading}
              skeletonCount={24}
            />
          </motion.div>
        </AnimatePresence>

        {/* Load more — breathing loader, matches Liquid Glass system */}
        {isFetchingMore && (
          <div className="flex justify-center" style={{ padding: '3rem 0' }}>
            <div
              className="void-glow"
              style={{
                width:        '2.5rem',
                height:       '2.5rem',
                borderRadius: '50%',
                background:   'hsl(var(--surface-elevated))',
                boxShadow:    'var(--shadow-sm)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
              }}
            >
              {/* Inner pulsing core */}
              <motion.div
                style={{
                  width:        '0.625rem',
                  height:       '0.625rem',
                  borderRadius: '50%',
                  background:   'hsl(var(--accent))',
                  boxShadow:    ACCENT_GLOW,
                }}
                animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}

        {/* End of feed — editorial terminal mark */}
        {!hasMore && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="flex items-center justify-center gap-4"
            style={{ padding: '3.5rem 0 1rem' }}
          >
            <div className="divider" style={{ width: '3rem' }} />
            <span
              style={{
                fontSize:      'var(--text-xs)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color:         'hsl(var(--subtle))',
                fontWeight:    400,
              }}
            >
              End of results
            </span>
            <div className="divider" style={{ width: '3rem' }} />
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease }}
            className="flex flex-col items-center justify-center text-center"
            style={{ paddingBlock: 'clamp(4rem, 10vw, 7rem)' }}
          >
            {/* Void vessel — soft breathing glow behind a glass tile */}
            <div className="relative mb-8" style={{ width: '5rem', height: '5rem' }}>
              <motion.div
                aria-hidden
                className="absolute inset-0"
                style={{
                  borderRadius: '50%',
                  background:   'radial-gradient(circle, hsl(var(--accent) / 0.22) 0%, transparent 72%)',
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div
                className="void-glow absolute inset-0 flex items-center justify-center"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  background:   'hsl(var(--surface-elevated))',
                  border:       '1px solid hsl(var(--border-subtle))',
                  boxShadow:    'var(--shadow-md)',
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 18, 0, -18, 0], opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: '1.375rem', color: 'hsl(var(--accent))' }}
                >
                  ✦
                </motion.span>
              </div>
            </div>

            {/* Headline — same Great Vibes script + curtain-lift reveal as
                the page opener, so the empty state still feels like the
                same considered surface rather than a bare fallback. */}
            <div style={{ overflow: 'hidden' }}>
              <motion.p
                className={greatVibes.className}
                initial={{ y: '105%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize:      'clamp(2.5rem, 6vw, 3.5rem)',
                  fontWeight:    400,
                  letterSpacing: '0.01em',
                  lineHeight:    1.2,
                  color:         'hsl(var(--foreground))',
                  margin:        0,
                  paddingBottom: '0.12em', // clears descenders from the mask
                }}
              >
                Nothing found
              </motion.p>
            </div>

            <p
              style={{
                fontSize:     'var(--text-sm)',
                color:        'hsl(var(--muted-foreground))',
                fontWeight:   300,
                maxWidth:     '20rem',
                lineHeight:   1.65,
                marginTop:    '0.375rem',
                marginBottom: '2.25rem',
              }}
            >
              Try a different category or adjust your sort order.
            </p>

            <motion.button
              onClick={() => router.push('/explore')}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -1 }}
              style={{
                fontSize:      'var(--text-sm)',
                fontWeight:    500,
                padding:       '0.75rem 1.875rem',
                borderRadius:  '999px',
                color:         'hsl(var(--foreground))',
                background:    'transparent',
                border:        '1px solid hsl(var(--border))',
                cursor:        'pointer',
                transition:    `background var(--duration-fast) var(--ease-smooth),
                                 color var(--duration-fast) var(--ease-smooth),
                                 border-color var(--duration-fast) var(--ease-smooth),
                                 box-shadow var(--duration-fast) var(--ease-smooth)`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background   = ACCENT_GRADIENT
                el.style.color        = 'hsl(var(--accent-foreground))'
                el.style.borderColor  = 'transparent'
                el.style.boxShadow    = ACCENT_GLOW
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background   = 'transparent'
                el.style.color        = 'hsl(var(--foreground))'
                el.style.borderColor  = 'hsl(var(--border))'
                el.style.boxShadow    = 'none'
              }}
            >
              Reset explore
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}