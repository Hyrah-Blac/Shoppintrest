'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Lock, Globe, Plus, Trash2,
  ArrowLeft, BookmarkPlus,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
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
  params: { id: string }
}) {
  const { isSignedIn } = useAuth()
  const currentUser = useUserStore((s) => s.user)

  const [collection, setCollection] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const isOwner = collection?.user?._id === currentUser?._id

  useEffect(() => {
    apiClient.collections.getOne(params.id)
      .then(({ data }) => setCollection(data.data))
      .catch(() => toast.error('Collection not found'))
      .finally(() => setIsLoading(false))
  }, [params.id])

  const handleRemoveProduct = async (productId: string) => {
    setIsDeleting(productId)
    try {
      await apiClient.collections.toggleProduct(params.id, productId)
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

  if (isLoading) {
    return (
      <div className="container-wide py-12 space-y-8">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container-wide py-32 text-center">
        <p className="text-muted text-sm">Collection not found</p>
        <Link href="/collections" className="text-foreground underline mt-2 text-sm">
          Back to collections
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-surface border-b border-border">
        {collection.coverImage && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={collection.coverImage}
              alt={collection.title}
              fill
              className="object-cover opacity-10"
              sizes="100vw"
            />
          </div>
        )}

        <div className="relative container-wide py-12">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm text-muted
                       hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            All Collections
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end
                          justify-between gap-6">
            <div className="space-y-3">
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
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-semibold
                             tracking-tight">
                {collection.title}
              </h1>

              {collection.description && (
                <p className="text-muted text-sm max-w-xl leading-relaxed">
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
                  <p className="text-xs text-muted">
                    {collection.products?.length || 0} items ·{' '}
                    {collection.saves} saves ·{' '}
                    {formatDate(collection.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="md"
                        leftIcon={<Plus size={14} />}>
                  Add Products
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container-wide py-10">
        {collection.products?.length === 0 ? (
          <div className="py-24 text-center">
            <BookmarkPlus size={40} className="text-muted mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">
              No products yet
            </p>
            <p className="text-sm text-muted mb-6">
              {isOwner
                ? 'Start adding products to this collection'
                : 'This collection is empty'}
            </p>
            {isOwner && (
              <Link href="/explore">
                <Button variant="primary" size="md">
                  Browse Products
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
                          xl:grid-cols-5 gap-4 lg:gap-6">
            {collection.products.map((product: any, i: number) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative group"
              >
                <ProductCard product={product} priority={i < 5} />
                {isOwner && (
                  <button
                    onClick={() => handleRemoveProduct(product._id)}
                    disabled={isDeleting === product._id}
                    className="absolute top-3 left-3 z-20 w-7 h-7 rounded-lg
                               bg-background/90 text-destructive flex items-center
                               justify-center opacity-0 group-hover:opacity-100
                               transition-all duration-200 hover:bg-destructive
                               hover:text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}