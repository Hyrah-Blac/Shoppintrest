'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Lock, Globe, Plus, Trash2,
  ArrowLeft, BookmarkPlus, Share2, Heart,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { use } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Avatar } from '@/components/ui/Avatar'
import { ProductCard } from '@/components/product/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, cn } from '@/lib/utils'

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }         = use(params)
  const { isSignedIn } = useAuth()
  const currentUser    = useUserStore((s) => s.user)

  const [collection, setCollection] = useState<any>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaved,    setIsSaved]    = useState(false)

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
    } finally { setIsDeleting(null) }
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
    if (!isSignedIn) { toast.error('Sign in to save collections'); return }
    setIsSaved(!isSaved)
    setCollection((prev: any) => ({
      ...prev,
      saves: isSaved ? prev.saves - 1 : prev.saves + 1,
    }))
    toast.success(isSaved ? 'Removed from saved' : 'Collection saved')
  }

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div
          className="border-b"
          style={{
            background:  'hsl(var(--surface))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <div className="container-wide py-12 space-y-4">
            <Skeleton className="h-4 w-32 rounded-[var(--radius-sm)]" />
            <Skeleton className="h-10 w-80 rounded-[var(--radius)]" />
            <Skeleton className="h-4 w-96 rounded-[var(--radius-sm)]" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-[var(--radius-sm)]" />
              <Skeleton className="h-4 w-40 rounded-[var(--radius-sm)]" />
            </div>
          </div>
        </div>
        <div className="container-wide py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-[3/4]"
                style={{ borderRadius: 'var(--radius-xl)' }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Not found ── */
  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center
                      text-center px-6 py-32">
        <div
          className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center
                     justify-center mb-5 border shadow-[var(--shadow-card)]"
          style={{
            background:  'hsl(var(--surface))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <BookmarkPlus size={24} style={{ color: 'hsl(var(--muted))' }} />
        </div>
        <p
          className="font-medium mb-2"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Collection not found
        </p>
        <p
          className="text-sm mb-6"
          style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
        >
          This collection may have been removed or made private
        </p>
        <Link
          href="/collections"
          className="btn-ghost gap-2"
        >
          <ArrowLeft size={14} />
          All Collections
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════
          Hero Header
      ══════════════════════════════════════════════════ */}
      <div
        className="relative border-b overflow-hidden"
        style={{
          background:  'hsl(var(--surface))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {/* Blurred cover bg */}
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
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, hsl(var(--surface)/0.5), hsl(var(--surface)))',
              }}
            />
          </div>
        )}

        {/* Pinterest red top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.5), transparent)',
          }}
        />

        <div className="relative container-wide py-12">

          {/* Back link */}
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm mb-8
                       transition-colors duration-[var(--duration-hover)]"
            style={{ color: 'hsl(var(--muted))' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'hsl(var(--foreground))')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'hsl(var(--muted))')}
          >
            <ArrowLeft size={14} />
            All Collections
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

            {/* ── Left info ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 max-w-2xl"
            >
              {/* Privacy + count badges */}
              <div className="flex items-center gap-2">
                <span className="badge badge-muted gap-1">
                  {collection.isPrivate
                    ? <><Lock size={10} /> Private</>
                    : <><Globe size={10} /> Public</>}
                </span>
                {collection.products?.length > 0 && (
                  <span
                    className="text-xs"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    {collection.products.length}{' '}
                    {collection.products.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-display font-bold tracking-[-0.03em] leading-[1.05]"
                style={{ fontSize: 'clamp(1.75rem, 4vw, var(--text-hero))' }}
              >
                {collection.title}
              </h1>

              {/* Accent underline */}
              <motion.div
                className="h-[2px] w-12 rounded-full"
                style={{ background: 'hsl(var(--accent))' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />

              {collection.description && (
                <p
                  className="text-sm sm:text-base leading-relaxed max-w-lg"
                  style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                >
                  {collection.description}
                </p>
              )}

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar
                  src={collection.user?.avatar}
                  name={collection.user?.displayName}
                  size="sm"
                />
                <div>
                  <Link
                    href={`/profile/${collection.user?.username}`}
                    className="text-sm font-medium transition-opacity
                               duration-[var(--duration-hover)] hover:opacity-70"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {collection.user?.displayName}
                  </Link>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    {collection.saves} saves · {formatDate(collection.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Right actions ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 shrink-0"
            >
              {!isOwner && (
                <button
                  type="button"
                  onClick={handleSaveCollection}
                  aria-label={isSaved ? 'Unsave' : 'Save collection'}
                  className="btn-icon"
                  style={isSaved ? {
                    background:  'hsl(var(--foreground))',
                    color:       'hsl(var(--background))',
                    borderColor: 'hsl(var(--foreground))',
                  } : undefined}
                >
                  <Heart size={16} className={cn(isSaved && 'fill-current')} />
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                aria-label="Share collection"
                className="btn-icon"
              >
                <Share2 size={16} />
              </button>

              {isOwner && (
                <Link
                  href="/explore"
                  className="btn-save gap-2"
                >
                  <Plus size={14} />
                  Add Products
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Products Grid
      ══════════════════════════════════════════════════ */}
      <div className="container-wide py-10">
        {collection.products?.length === 0 ? (

          /* Empty state */
          <div className="py-24 text-center">
            <div
              className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center
                         justify-center mx-auto mb-5 border shadow-[var(--shadow-card)]"
              style={{
                background:  'hsl(var(--surface))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <BookmarkPlus size={24} style={{ color: 'hsl(var(--muted))' }} />
            </div>
            <p
              className="font-medium mb-2"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              No products yet
            </p>
            <p
              className="text-sm mb-6 max-w-xs mx-auto"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
            >
              {isOwner
                ? 'Browse products and save them to this collection'
                : 'This collection is empty for now'}
            </p>
            {isOwner && (
              <Link href="/explore" className="btn-save">
                Browse Products
              </Link>
            )}
          </div>

        ) : (
          <>
            <p
              className="text-sm mb-6"
              style={{ color: 'hsl(var(--muted))' }}
            >
              {collection.products.length}{' '}
              {collection.products.length === 1 ? 'product' : 'products'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
                            xl:grid-cols-5 gap-4 lg:gap-5">
              {collection.products.map((product: any, i: number) => (
                <motion.div
                  key={product._id}
                  className="relative group"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay:    i * 0.04,
                    duration: 0.4,
                    ease:     [0.22, 1, 0.36, 1],
                  }}
                >
                  <ProductCard product={product} />

                  {/* Owner remove button */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product._id)}
                      disabled={isDeleting === product._id}
                      aria-label="Remove from collection"
                      className={cn(
                        'absolute top-3 left-3 z-20 w-7 h-7 rounded-[var(--radius-sm)]',
                        'flex items-center justify-center',
                        'transition-all duration-[var(--duration-hover)]',
                        isDeleting === product._id
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      )}
                      style={{
                        background: isDeleting === product._id
                          ? 'hsl(var(--destructive))'
                          : 'hsl(var(--background) / 0.92)',
                        color: isDeleting === product._id
                          ? 'white'
                          : 'hsl(var(--destructive))',
                        backdropFilter: 'blur(8px)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'hsl(var(--destructive))'
                        e.currentTarget.style.color      = 'white'
                      }}
                      onMouseLeave={(e) => {
                        if (isDeleting !== product._id) {
                          e.currentTarget.style.background =
                            'hsl(var(--background) / 0.92)'
                          e.currentTarget.style.color =
                            'hsl(var(--destructive))'
                        }
                      }}
                    >
                      {isDeleting === product._id ? (
                        <div className="w-3 h-3 border border-white/50
                                        border-t-white rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}