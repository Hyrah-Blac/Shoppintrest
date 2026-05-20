'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Bookmark } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'

export default function CollectionsPage() {
  const { isSignedIn } = useAuth()
  const [collections, setCollections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.collections.getAll({ limit: 40 })
      .then(({ data }) => setCollections(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="container-wide py-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-[0.2em]
                            text-muted mb-2">
                Discover
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-tight">
                Collections
              </h1>
              <p className="text-muted text-sm mt-2 max-w-md">
                Curated boards from fashion lovers around the world
              </p>
            </div>
            {isSignedIn && (
              <Link href="/collections/new">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus size={15} />}
                >
                  New Collection
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-wide py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                          xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-4xl mb-4">✦</p>
            <p className="font-medium text-foreground mb-2">No collections yet</p>
            <p className="text-sm text-muted mb-6">Be the first to create one</p>
            {isSignedIn && (
              <Link href="/collections/new">
                <Button variant="primary" size="md">Create Collection</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                          xl:grid-cols-4 gap-5">
            {collections.map((col, i) => (
              <motion.div
                key={col._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Link href={`/collections/${col._id}`}>
                  <div className="group rounded-2xl overflow-hidden border
                                  border-border bg-surface hover:shadow-lg
                                  hover:border-foreground/20 transition-all
                                  duration-300">
                    {/* Cover */}
                    <div className="aspect-[4/3] bg-accent relative overflow-hidden">
                      {col.coverImage ? (
                        <Image
                          src={col.coverImage}
                          alt={col.title}
                          fill
                          className="object-cover group-hover:scale-105
                                     transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center
                                        justify-center">
                          <Bookmark size={28} className="text-muted" />
                        </div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t
                                      from-black/30 to-transparent opacity-0
                                      group-hover:opacity-100 transition-opacity
                                      duration-300" />
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {col.title}
                      </h3>
                      {col.description && (
                        <p className="text-xs text-muted line-clamp-2 mb-3">
                          {col.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={col.user?.avatar}
                            name={col.user?.displayName}
                            size="xs"
                          />
                          <span className="text-xs text-muted truncate max-w-[100px]">
                            {col.user?.displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span>{col.products?.length || 0} items</span>
                          <span>·</span>
                          <span>{col.saves} saves</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}