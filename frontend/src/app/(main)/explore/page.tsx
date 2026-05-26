'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
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
  { label: 'Newest',      value: 'newest'     },
  { label: 'Trending',    value: 'popular'    },
  { label: 'Price: Low',  value: 'price_asc'  },
  { label: 'Price: High', value: 'price_desc' },
  { label: 'Top Rated',   value: 'rating'     },
]

// ─── Custom sort dropdown — matches pill style, works in dark mode ─────────
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

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'pill gap-1.5 h-9 pr-2.5',
          open && 'border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))]'
        )}
      >
        {current?.label ?? 'Sort'}
        <ChevronDown
          size={12}
          className={cn(
            'transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{   opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[160px]
                       rounded-[var(--radius-lg)] overflow-hidden"
            style={{
              background:  'hsl(var(--surface-elevated))',
              border:      '1px solid hsl(var(--border))',
              boxShadow:   'var(--shadow-float)',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm',
                  'transition-colors duration-[var(--duration-fast)]',
                  'hover:bg-[hsl(var(--background-secondary))]',
                  opt.value === value
                    ? 'font-semibold text-[hsl(var(--accent))]'
                    : 'font-normal text-[hsl(var(--foreground))]'
                )}
              >
                {opt.value === value && (
                  <span className="mr-2 text-[hsl(var(--accent))]">✦</span>
                )}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
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
  const featured = searchParams.get('featured') === 'true'

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
          ...(featured && { featured: 'true' }),
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
    [category, sort, featured]
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

  const activeFilterCount = [category, featured].filter(Boolean).length

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════
          Sticky filter bar
      ══════════════════════════════════════════════════ */}
      <div
        className="sticky top-[72px] z-30 border-b"
        style={{
          background:  'hsl(var(--background) / 0.92)',
          borderColor: 'hsl(var(--border))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="container-wide py-3">

          {/* ── Row 1: categories + desktop sort/filter ── */}
          <div className="flex items-center gap-3">

            {/* Category pills — scrollable */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 pb-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setParam('category', cat.value)}
                  className={cn(
                    'pill whitespace-nowrap shrink-0 text-xs h-8',
                    category === cat.value && 'active'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort + Filters — DESKTOP ONLY */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <SortDropdown
                value={sort}
                onChange={(v) => setParam('sort', v)}
              />

              <button
                onClick={() => {}}
                className={cn(
                  'pill gap-2 h-9',
                  activeFilterCount > 0 && 'active'
                )}
              >
                <SlidersHorizontal size={13} />
                Filters
                {activeFilterCount > 0 && (
                  <span
                    className="badge badge-red ml-0.5"
                    style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Active filter chips ── */}
          <AnimatePresence>
            {(category || featured) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{   opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pt-2.5">
                  <span
                    className="text-[11px] font-medium tracking-wide uppercase"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    Active
                  </span>

                  {category && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{   opacity: 0, scale: 0.85 }}
                      onClick={() => setParam('category', '')}
                      className="badge badge-red flex items-center gap-1 cursor-pointer
                                 hover:opacity-80 transition-opacity capitalize"
                    >
                      {category}
                      <X size={9} />
                    </motion.button>
                  )}

                  {featured && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{   opacity: 0, scale: 0.85 }}
                      onClick={() => setParam('featured', '')}
                      className="badge badge-red flex items-center gap-1 cursor-pointer
                                 hover:opacity-80 transition-opacity"
                    >
                      Featured
                      <X size={9} />
                    </motion.button>
                  )}

                  {/* Clear all */}
                  <button
                    onClick={() => router.push('/explore')}
                    className="text-[11px] underline underline-offset-2
                               transition-colors duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Main content
      ══════════════════════════════════════════════════ */}
      <div className="container-wide py-8">

        {/* Result count + mobile sort row */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-6"
          >
            <p
              className="text-sm"
              style={{ color: 'hsl(var(--muted))' }}
            >
              <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {total.toLocaleString()}
              </span>{' '}
              {total === 1 ? 'product' : 'products'}
              {category && (
                <span> in <span className="capitalize">{category}</span></span>
              )}
            </p>

            {/* Sort — MOBILE ONLY — shown inline with count */}
            {/* Sort is intentionally desktop-only per design decision.
                On mobile, the default sort (newest) is applied silently.
                This prevents accidental sort changes on small screens. */}
          </motion.div>
        )}

        {/* Masonry grid */}
        <MasonryGrid
          products={products}
          isLoading={isLoading}
          skeletonCount={24}
        />

        {/* Loading more — Pinterest dot bounce */}
        {isFetchingMore && (
          <div className="flex justify-center py-10">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'hsl(var(--accent))' }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* End of results */}
        {!hasMore && products.length > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm py-10 tracking-wider"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            ✦ &nbsp; You&apos;ve seen everything &nbsp; ✦
          </motion.p>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <p className="text-5xl mb-5 opacity-30">✦</p>
            <p
              className="font-display font-bold text-xl mb-2 tracking-tight"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Nothing here yet
            </p>
            <p
              className="text-sm mb-8 font-light"
              style={{ color: 'hsl(var(--muted))' }}
            >
              Try a different category or clear your filters
            </p>
            <button
              onClick={() => router.push('/explore')}
              className="btn-save"
            >
              Clear filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}