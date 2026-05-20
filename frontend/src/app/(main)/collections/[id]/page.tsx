'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Globe, Plus, Trash2,
  ArrowLeft, BookmarkPlus, Share2, Heart,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { use } from 'react'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/product/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, cn } from '@/lib/utils'

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { isSignedIn } = useAuth()
  const currentUser = useUserStore((s) => s.user)

  const [collection, setCollection] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const isOwner = collection?.user?._id === currentUser?._id

  useEffect(() => {
    if (!id) return
    apiClient.collections.getOne(id)
      .then(({ data }) => setCollection(data.data))
      .catch(() => toast.error('Collection not found'))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleRemoveProduct = async (productId: string) => {
    setIsDeleting(productId)
    try {
      await apiClient.collections.toggleProduct(id, productId)
      setCollection((prev: any) => ({
        ...prev,
        products: prev.products.filter((p: any) => p._id !== productId),
      }))
      toast.success('Removed from collection')
    } catch {
      toast.error('Could not remove product')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: collection?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  const handleSaveCollection = () => {
    if (!isSignedIn) {
      toast.error('Sign in to save collections')
      return
    }
    setIsSaved(!isSaved)
    setCollection((prev: any) => ({
      ...prev,
      saves: isSaved ? prev.saves - 1 : prev.saves + 1,
    }))
    toast.success(isSaved ? 'Removed from saved' : 'Collection saved')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="bg-surface border-b border-border">
          <div className="container-wide py-12 space-y-4">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-10 w-80 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
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

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-32">
        <BookmarkPlus size={40} className="text-muted mb-4" />
        <p className="font-medium text-foreground mb-2">Collection not found</p>
        <p className="text-sm text-muted mb-6">
          This collection may have been removed or made private
        </p>
        <Link href="/collections">
          <Button variant="outline" size="md" leftIcon={<ArrowLeft size={14} />}>
            All Collections
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      {/* Hero Header */}
      <div className="relative bg-surface border-b border-border overflow-hidden">
        {collection.coverImage && (
          <div className="absolute inset-0">
            <Image
              src={collection.coverImage}
              alt={collection.title}
              fill
              className="object-cover opacity-[0.07] blur-sm scale-105"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/50 to-surface" />
          </div>
        )}

        <div className="relative container-wide py-12">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            All Collections
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

            {/* Left info */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                {collection.isPrivate ? (
                  <Badge variant="secondary" size="sm">
                    <Lock size={10} className="mr-1" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="sm">
                    <Globe size={10} className="mr-1" />
                    Public
                  </Badge>
                )}
                {collection.products?.length > 0 && (
                  <span className="text-xs text-muted">
                    {collection.products.length}{' '}
                    {collection.products.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
                {collection.title}
              </h1>

              {collection.description && (
                <p className="text-muted text-sm sm:text-base leading-relaxed max-w-lg">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Avatar
                  src={collection.user?.avatar}
                  name={collection.user?.displayName}
                  size="sm"
                />
                <div>
                  <Link
                    href={`/profile/${collection.user?.username}`}
                    className="text-sm font-medium hover:opacity-70 transition-opacity"
                  >
                    {collection.user?.displayName}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    {collection.saves} saves · {formatDate(collection.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Save collection — non-owners only */}
              {!isOwner && (
                <button
                  onClick={handleSaveCollection}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200',
                    isSaved
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted hover:text-foreground hover:border-foreground bg-background'
                  )}
                  title={isSaved ? 'Unsave' : 'Save collection'}
                >
                  <Heart size={16} className={cn(isSaved && 'fill-current')} />
                </button>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-border text-muted hover:text-foreground hover:border-foreground bg-background transition-all duration-200"
                title="Share collection"
              >
                <Share2 size={16} />
              </button>

              {/* Owner — add products */}
              {isOwner && (
                <Link href="/explore">
                  <Button variant="primary" size="md" leftIcon={<Plus size={14} />}>
                    Add Products
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container-wide py-10">
        {collection.products?.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <BookmarkPlus size={24} className="text-muted" />
            </div>
            <p className="font-medium text-foreground mb-2">No products yet</p>
            <p className="text-sm text-muted mb-6 max-w-xs mx-auto">
              {isOwner
                ? 'Browse products and save them to this collection'
                : 'This collection is empty for now'}
            </p>
            {isOwner && (
              <Link href="/explore">
                <Button variant="primary" size="md">Browse Products</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted mb-6">
              {collection.products.length}{' '}
              {collection.products.length === 1 ? 'product' : 'products'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              <AnimatePresence>
                {collection.products.map((product: any, i: number) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="relative group"
                  >
                    <ProductCard product={product} priority={i < 5} />

                    {isOwner && (
                      <button
                        onClick={() => handleRemoveProduct(product._id)}
                        disabled={isDeleting === product._id}
                        className={cn(
                          'absolute top-3 left-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                          isDeleting === product._id
                            ? 'bg-destructive text-white opacity-100'
                            : 'bg-background/90 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white'
                        )}
                        title="Remove from collection"
                      >
                        {isDeleting === product._id ? (
                          <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  )
}