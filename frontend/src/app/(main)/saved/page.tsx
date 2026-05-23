'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Bookmark } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { apiClient } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'

export default function CollectionsPage() {
  const { isSignedIn } = useAuth()
  const [collections, setCollections] = useState<any[]>([])
  const [isLoading,   setIsLoading]   = useState(true)

  useEffect(() => {
    apiClient.collections.getAll({ limit: 40 })
      .then(({ data }) => setCollections(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════
          Header
      ══════════════════════════════════════════════════ */}
      <div
        className="border-b"
        style={{
          background:  'hsl(var(--surface))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {/* Pinterest red top accent */}
        <div
          className="h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.4), transparent)',
          }}
        />

        <div className="container-wide py-12">
          <div className="flex items-end justify-between gap-6 flex-wrap">

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="eyebrow mb-3 block">Discover</span>
              <h1
                className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
                style={{ fontSize: 'clamp(1.75rem, 4vw, var(--text-hero))' }}
              >
                Collections
              </h1>

              {/* Accent underline */}
              <motion.div
                className="mt-3 mb-3 h-[2px] w-12 rounded-full"
                style={{ background: 'hsl(var(--accent))' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              />

              <p
                className="text-sm max-w-md"
                style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
              >
                Curated boards from fashion lovers around the world
              </p>
            </motion.div>

            {isSignedIn && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Link href="/collections/new" className="btn-save gap-2">
                  <Plus size={15} />
                  New Collection
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Grid
      ══════════════════════════════════════════════════ */}
      <div className="container-wide py-12">

        {/* Loading skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                          xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton
                  className="aspect-[4/3]"
                  style={{ borderRadius: 'var(--radius-xl)' }}
                />
                <Skeleton
                  className="h-4 w-3/4"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
                <Skeleton
                  className="h-3 w-1/2"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
            ))}
          </div>

        ) : collections.length === 0 ? (

          /* Empty state */
          <div className="py-32 text-center">
            <p className="text-4xl mb-4">✦</p>
            <p
              className="font-medium mb-2"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              No collections yet
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
            >
              Be the first to create one
            </p>
            {isSignedIn && (
              <Link href="/collections/new" className="btn-save">
                Create Collection
              </Link>
            )}
          </div>

        ) : (

          /* Collections grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                          xl:grid-cols-4 gap-5">
            {collections.map((col, i) => (
              <motion.div
                key={col._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay:    i * 0.04,
                  duration: 0.4,
                  ease:     [0.22, 1, 0.36, 1],
                }}
              >
                <Link href={`/collections/${col._id}`}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="group border overflow-hidden
                               transition-[box-shadow,border-color]
                               duration-[var(--duration-standard)]
                               shadow-[var(--shadow-card)]
                               hover:shadow-[var(--shadow-card-hover)]"
                    style={{
                      borderRadius: 'var(--radius-xl)',
                      background:   'hsl(var(--surface))',
                      borderColor:  'hsl(var(--border))',
                    }}
                  >
                    {/* Cover image */}
                    <div
                      className="aspect-[4/3] relative overflow-hidden"
                      style={{ background: 'hsl(var(--accent-muted))' }}
                    >
                      {col.coverImage ? (
                        <Image
                          src={col.coverImage}
                          alt={col.title}
                          fill
                          className="object-cover transition-transform
                                     duration-[var(--duration-standard)]
                                     group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw,
                                 (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center
                                        justify-center">
                          <Bookmark
                            size={28}
                            style={{ color: 'hsl(var(--accent))' }}
                          />
                        </div>
                      )}

                      {/* Pinterest gradient overlay */}
                      <div
                        className="absolute inset-0 opacity-0
                                   group-hover:opacity-100
                                   transition-opacity
                                   duration-[var(--duration-standard)]"
                        style={{
                          background:
                            'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%)',
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3
                        className="font-medium truncate mb-1"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        {col.title}
                      </h3>
                      {col.description && (
                        <p
                          className="text-xs line-clamp-2 mb-3"
                          style={{
                            color:      'hsl(var(--muted))',
                            fontWeight: 300,
                          }}
                        >
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
                          <span
                            className="text-xs truncate max-w-[100px]"
                            style={{ color: 'hsl(var(--muted))' }}
                          >
                            {col.user?.displayName}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 text-xs"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                          <span>{col.products?.length || 0} items</span>
                          <span>·</span>
                          <span>{col.saves} saves</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}