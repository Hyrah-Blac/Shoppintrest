'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { MasonryGrid } from '@/components/product/MasonryGrid'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Womenswear', value: 'womenswear' },
  { label: 'Menswear', value: 'menswear' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Bags', value: 'bags' },
  { label: 'Jewelry', value: 'jewelry' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Beauty', value: 'beauty' },
  { label: 'Home', value: 'home' },
]

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Trending', value: 'popular' },
  { label: 'Price: Low', value: 'price_asc' },
  { label: 'Price: High', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
]

export default function ExplorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)

  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'newest'
  const featured = searchParams.get('featured') === 'true'

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/explore?${params.toString()}`)
  }

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) setIsLoading(true)
      else setIsFetchingMore(true)

      try {
        const { data } = await apiClient.products.getAll({
          page: pageNum,
          limit: 24,
          ...(category && { category }),
          ...(sort && { sort }),
          ...(featured && { featured: 'true' }),
        })

        const incoming = data.data || []
        setTotal(data.total || 0)
        setHasMore(pageNum < (data.totalPages || 1))

        if (append) {
          setProducts((prev) => [...prev, ...incoming])
        } else {
          setProducts(incoming)
        }
      } catch {
        // silent
      } finally {
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
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 800 &&
        hasMore &&
        !isFetchingMore &&
        !isLoading
      ) {
        loadMore()
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isFetchingMore, isLoading, page])

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="border-b border-border bg-background sticky top-[72px] z-30">
        <div className="container-wide py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setParam('category', cat.value)}
                  className={cn(
                    `px-4 py-2 rounded-xl text-sm font-medium transition-all
                     duration-200 whitespace-nowrap shrink-0`,
                    category === cat.value
                      ? 'bg-foreground text-background'
                      : 'text-muted hover:text-foreground hover:bg-accent'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort + Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={sort}
                onChange={(e) => setParam('sort', e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background
                           text-sm text-foreground focus:outline-none focus:ring-2
                           focus:ring-ring cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<SlidersHorizontal size={14} />}
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-xl"
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Active filters */}
          {(category || featured) && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted">Active:</span>
              {category && (
                <button
                  onClick={() => setParam('category', '')}
                  className="flex items-center gap-1 text-xs bg-foreground
                             text-background px-2.5 py-1 rounded-lg"
                >
                  {category}
                  <X size={10} />
                </button>
              )}
              {featured && (
                <button
                  onClick={() => setParam('featured', '')}
                  className="flex items-center gap-1 text-xs bg-foreground
                             text-background px-2.5 py-1 rounded-lg"
                >
                  Featured
                  <X size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container-wide py-8">
        {/* Result count */}
        {!isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted mb-6"
          >
            {total.toLocaleString()} {total === 1 ? 'product' : 'products'}
            {category && ` in ${category}`}
          </motion.p>
        )}

        {/* Grid */}
        <MasonryGrid
          products={products}
          isLoading={isLoading}
          skeletonCount={24}
        />

        {/* Loading more indicator */}
        {isFetchingMore && (
          <div className="flex justify-center py-10">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* No more products */}
        {!hasMore && products.length > 0 && (
          <p className="text-center text-sm text-muted py-10">
            You&apos;ve seen everything ✦
          </p>
        )}

        {/* Empty */}
        {!isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">✦</p>
            <p className="font-medium text-foreground mb-2">No products found</p>
            <p className="text-sm text-muted mb-6">
              Try adjusting your filters
            </p>
            <Button
              variant="secondary"
              onClick={() => router.push('/explore')}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}