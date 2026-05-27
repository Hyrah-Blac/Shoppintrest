'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { MasonryGrid } from '@/components/product/MasonryGrid'
import { cn } from '@/lib/utils'

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

const ease = [0.16, 1, 0.3, 1] as const

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
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'pill gap-1.5 shrink-0',
          open && 'active'
        )}
        style={{ height: '2.125rem', paddingRight: '0.625rem' }}
      >
        <span style={{ fontWeight: open ? 500 : 400 }}>
          {current?.label ?? 'Sort'}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={11} strokeWidth={2} />
        </motion.span>
      </button>

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
              /* VOID: ambient edge light */
            }}
          >
            {/* Top edge highlight — VOID UI signature */}
            <div
              style={{
                height:     '1px',
                background: 'linear-gradient(90deg, transparent, hsl(var(--border)) 40%, transparent)',
              }}
            />

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
          STICKY FILTER BAR — glass atmospheric, no hard border walls
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="sticky z-30 glass"
        style={{ top: '72px' }}
      >
        <div className="container-wide" style={{ paddingBlock: '0.75rem' }}>

          {/* Categories + Sort — single unified row */}
          <div className="flex items-center gap-3">

            {/* Category pills — scrollable, no scrollbar */}
            <div
              className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1"
              style={{ paddingBottom: '1px' }} /* prevent clipping on pill shadow */
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setParam('category', cat.value)}
                  className={cn('pill shrink-0', category === cat.value && 'active')}
                  style={{ height: '2.125rem', fontSize: 'var(--text-xs)' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

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
                  className="flex items-center gap-2"
                  style={{ paddingTop: '0.625rem' }}
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
                    className="badge badge-red flex items-center gap-1 cursor-pointer capitalize"
                    style={{ transition: 'opacity var(--duration-fast) ease' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.72')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                  >
                    {category}
                    <X size={8} strokeWidth={2.5} />
                  </motion.button>

                  <button
                    onClick={() => router.push('/explore')}
                    style={{
                      fontSize:         'var(--text-xs)',
                      color:            'hsl(var(--muted-foreground))',
                      textDecoration:   'underline',
                      textUnderlineOffset: '3px',
                      fontWeight:       300,
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
        <AnimatePresence>
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="flex items-baseline gap-2"
              style={{ marginBottom: 'clamp(1rem, 2vw, 1.75rem)' }}
            >
              <span
                style={{
                  fontFamily:    "'Playfair Display', Georgia, serif",
                  fontWeight:    600,
                  fontSize:      'clamp(1rem, 1.5vw, 1.125rem)',
                  letterSpacing: '-0.025em',
                  color:         'hsl(var(--foreground))',
                }}
              >
                {total.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize:   'var(--text-sm)',
                  color:      'hsl(var(--muted-foreground))',
                  fontWeight: 300,
                }}
              >
                {total === 1 ? 'product' : 'products'}
                {category && (
                  <> in <span style={{ fontStyle: 'italic' }} className="capitalize">{category}</span></>
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Masonry grid */}
        <MasonryGrid
          products={products}
          isLoading={isLoading}
          skeletonCount={24}
        />

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
                  boxShadow:    'var(--shadow-red)',
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
            {/* Void vessel */}
            <div
              className="void-glow mb-7"
              style={{
                width:        '4rem',
                height:       '4rem',
                borderRadius: 'var(--radius-xl)',
                background:   'hsl(var(--surface-elevated))',
                boxShadow:    'var(--shadow-md)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     '1.375rem',
                opacity:      0.5,
              }}
            >
              ✦
            </div>

            <p
              style={{
                fontFamily:    "'Playfair Display', Georgia, serif",
                fontWeight:    600,
                fontSize:      '1.25rem',
                letterSpacing: '-0.03em',
                color:         'hsl(var(--foreground))',
                marginBottom:  '0.5rem',
              }}
            >
              Nothing found
            </p>
            <p
              style={{
                fontSize:   'var(--text-sm)',
                color:      'hsl(var(--muted-foreground))',
                fontWeight: 300,
                maxWidth:   '20rem',
                lineHeight: 1.65,
                marginBottom: '2rem',
              }}
            >
              Try a different category or adjust your sort order.
            </p>

            <button
              onClick={() => router.push('/explore')}
              className="btn-ghost"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              Reset explore
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}