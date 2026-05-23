'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
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

  /* Infinite scroll */
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
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════
          Sticky filter bar
      ══════════════════════════════════════════════════ */}
      <div
        className="border-b sticky top-[72px] z-30"
        style={{
          background:  'hsl(var(--background))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div className="container-wide py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setParam('category', cat.value)}
                  className={cn(
                    'pill whitespace-nowrap shrink-0',
                    category === cat.value && 'active'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort + Filters */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sort select — blueprint styled */}
              <select
                value={sort}
                onChange={(e) => setParam('sort', e.target.value)}
                className="h-9 px-3 text-sm outline-none cursor-pointer
                           transition-[border-color,box-shadow]
                           duration-[var(--duration-hover)]"
                style={{
                  borderRadius: 'var(--radius-pill)',
                  border:       '1.5px solid hsl(var(--border))',
                  background:   'hsl(var(--background))',
                  color:        'hsl(var(--foreground))',
                  fontFamily:   "'DM Sans', sans-serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.6)'
                  e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.12)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                  e.currentTarget.style.boxShadow   = 'none'
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {}}
                className="btn-ghost gap-2 h-9 px-3 text-sm"
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {(category || featured) && (
            <div className="flex items-center gap-2 mt-3">
              <span
                className="text-xs"
                style={{ color: 'hsl(var(--muted))' }}
              >
                Active:
              </span>
              {category && (
                <button
                  onClick={() => setParam('category', '')}
                  className="badge badge-red flex items-center gap-1 cursor-pointer
                             hover:opacity-80 transition-opacity"
                >
                  {category}
                  <X size={9} />
                </button>
              )}
              {featured && (
                <button
                  onClick={() => setParam('featured', '')}
                  className="badge badge-red flex items-center gap-1 cursor-pointer
                             hover:opacity-80 transition-opacity"
                >
                  Featured
                  <X size={9} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Main content
      ══════════════════════════════════════════════════ */}
      <div className="container-wide py-8">

        {/* Result count */}
        {!isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm mb-6"
            style={{ color: 'hsl(var(--muted))' }}
          >
            {total.toLocaleString()} {total === 1 ? 'product' : 'products'}
            {category && ` in ${category}`}
          </motion.p>
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
                  transition={{
                    duration: 0.6,
                    repeat:   Infinity,
                    delay:    i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* End of results */}
        {!hasMore && products.length > 0 && (
          <p
            className="text-center text-sm py-10"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            You&apos;ve seen everything ✦
          </p>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">✦</p>
            <p
              className="font-medium mb-2"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              No products found
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
            >
              Try adjusting your filters
            </p>
            <button
              onClick={() => router.push('/explore')}
              className="btn-ghost"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}