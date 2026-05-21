'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, ArrowLeft, Heart } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/product/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'

export default function SavedPage() {
  const { isSignedIn } = useAuth()
  const currentUser = useUserStore((s) => s.user)

  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  useEffect(() => {
    if (!isSignedIn) return
    fetchSaved(1)
  }, [isSignedIn])

  const fetchSaved = async (pageNum: number) => {
    if (pageNum === 1) setIsLoading(true)
    else setIsFetchingMore(true)

    try {
      const { data } = await apiClient.users.getSaved({ page: pageNum, limit: 24 })
      const incoming = data.data ?? []
      setProducts((prev) => pageNum === 1 ? incoming : [...prev, ...incoming])
      setTotalPages(data.totalPages ?? 1)
      setPage(pageNum)
    } catch {
      toast.error('Could not load saved products')
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }

  // ─── LOADING ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="bg-surface border-b border-border">
          <div className="container-wide py-12 space-y-4">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
        </div>
        <div className="container-wide py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── NOT SIGNED IN ──────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Bookmark size={24} className="text-muted" />
        </div>
        <p className="font-medium text-foreground mb-2">Sign in to view saved products</p>
        <p className="text-sm text-muted mb-6">
          Save products you love and find them all in one place
        </p>
        <Link href="/sign-in">
          <Button variant="primary" size="md">Sign In</Button>
        </Link>
      </div>
    )
  }

  // ─── EMPTY STATE ────────────────────────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="bg-surface border-b border-border">
          <div className="container-wide py-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft size={14} />
              Home
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Saved
            </h1>
            <p className="text-muted text-sm mt-2">
              Products you've saved
            </p>
          </div>
        </div>

        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-32">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
            <Heart size={24} className="text-muted" />
          </div>
          <p className="font-medium text-foreground mb-2">Nothing saved yet</p>
          <p className="text-sm text-muted mb-6 max-w-xs mx-auto">
            Browse products and tap the save button to collect your favourites here
          </p>
          <Link href="/explore">
            <Button variant="primary" size="md">Browse Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ─── MAIN VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="container-wide py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Home
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
                Saved
              </h1>
              <p className="text-muted text-sm">
                {products.length}{' '}
                {products.length === 1 ? 'product' : 'products'} saved
              </p>
            </div>

            {currentUser?.username && (
              <Link href={`/profile/${currentUser.username}`}>
                <Button variant="outline" size="md">
                  View Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-wide py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {products.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* Load More */}
        {page < totalPages && (
          <div className="flex justify-center mt-12">
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchSaved(page + 1)}
              disabled={isFetchingMore}
            >
              {isFetchingMore ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}