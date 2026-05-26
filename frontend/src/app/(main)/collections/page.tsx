'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, BookmarkPlus, Lock, Globe, Search } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'

export default function CollectionsPage() {
  const { isSignedIn } = useAuth()
  const currentUser    = useUserStore((s) => s.user)

  const [collections, setCollections] = useState<any[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [search,      setSearch]      = useState('')

  useEffect(() => {
    apiClient.collections.getAll()
      .then(({ data }) => setCollections(data.data))
      .catch(() => toast.error('Could not load collections'))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = collections.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'hsl(var(--surface))' }}>
        <div
          className="border-b"
          style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}
        >
          <div className="container-wide py-12 space-y-4">
            <Skeleton className="h-10 w-56 rounded-[var(--radius)]" />
            <Skeleton className="h-4 w-72 rounded-[var(--radius-sm)]" />
          </div>
        </div>
        <div className="container-wide py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-56"
                style={{ borderRadius: 'var(--radius-2xl)' }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--surface))' }}>

      {/* ══════════════════════════════════════════
          Header
      ══════════════════════════════════════════ */}
      <div
        className="relative border-b overflow-hidden"
        style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.5), transparent)',
          }}
        />

        <div className="container-wide py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              <h1
                className="font-display font-bold tracking-[-0.03em] leading-[1.05]"
                style={{ fontSize: 'clamp(1.75rem, 4vw, var(--text-hero))' }}
              >
                Collections
              </h1>

              {/* Accent underline */}
              <motion.div
                className="h-[2px] w-12 rounded-full"
                style={{ background: 'hsl(var(--accent))' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              />

              <p
                className="text-sm"
                style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
              >
                {collections.length} curated{' '}
                {collections.length === 1 ? 'board' : 'boards'}
              </p>
            </motion.div>

            {/* Search + New button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3"
            >
              {/* Search */}
              <div
                className="relative flex items-center"
                style={{ minWidth: 200 }}
              >
                <Search
                  size={14}
                  className="absolute left-3 pointer-events-none"
                  style={{ color: 'hsl(var(--muted))' }}
                />
                <input
                  type="text"
                  placeholder="Search collections…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-sm outline-none
                             transition-[border-color,box-shadow]
                             duration-[var(--duration-hover)]"
                  style={{
                    background:   'hsl(var(--background))',
                    border:       '1.5px solid hsl(var(--input))',
                    borderRadius: 'var(--radius)',
                    color:        'hsl(var(--foreground))',
                    fontFamily:   "'DM Sans', sans-serif",
                    fontWeight:   300,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.6)'
                    e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--input))'
                    e.currentTarget.style.boxShadow   = 'none'
                  }}
                />
              </div>

              {isSignedIn && (
                <Link href="/collections/new" className="btn-save gap-2">
                  <Plus size={14} />
                  New Collection
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          Grid
      ══════════════════════════════════════════ */}
      <div className="container-wide py-10">

        {filtered.length === 0 ? (

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
              {search ? 'No collections match your search' : 'No collections yet'}
            </p>
            <p
              className="text-sm mb-6 max-w-xs mx-auto"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
            >
              {search
                ? 'Try a different keyword'
                : 'Be the first to curate a board of your favourite pieces'}
            </p>
            {isSignedIn && !search && (
              <Link href="/collections/new" className="btn-save gap-2">
                <Plus size={14} />
                Create Collection
              </Link>
            )}
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((collection, i) => (
              <CollectionCard key={collection._id} collection={collection} index={i} currentUser={currentUser} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
    Collection Card
══════════════════════════════════════════ */
function CollectionCard({
  collection,
  index,
  currentUser,
}: {
  collection: any
  index: number
  currentUser: any
}) {
  const isOwner = collection.user?._id === currentUser?._id

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay:    index * 0.04,
        duration: 0.4,
        ease:     [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/collections/${collection._id}`}
        className="group block h-full"
        style={{ textDecoration: 'none' }}
      >
        <div
          className="h-full border overflow-hidden
                     transition-all duration-[var(--duration-hover)]
                     shadow-[var(--shadow-card)]"
          style={{
            background:   'hsl(var(--background))',
            borderColor:  'hsl(var(--border))',
            borderRadius: 'var(--radius-2xl)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--accent) / 0.4)'
            ;(e.currentTarget as HTMLElement).style.boxShadow  = 'var(--shadow-red)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'
            ;(e.currentTarget as HTMLElement).style.boxShadow  = 'var(--shadow-card)'
          }}
        >
          {/* Cover mosaic */}
          <div className="relative h-40 overflow-hidden bg-[hsl(var(--surface))]">
            {collection.products?.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5 h-full">
                {collection.products.slice(0, 3).map((p: any, pi: number) => (
                  <div
                    key={p._id}
                    className={`relative overflow-hidden bg-[hsl(var(--surface))] ${
                      pi === 0 ? 'col-span-2 row-span-2' : ''
                    }`}
                    style={{ aspectRatio: pi === 0 ? undefined : '1/1' }}
                  >
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-full object-cover
                                   transition-transform duration-500
                                   group-hover:scale-105"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookmarkPlus size={28} style={{ color: 'hsl(var(--muted))' }} />
              </div>
            )}

            {/* Privacy badge overlay */}
            <div className="absolute top-3 left-3">
              <span className="badge badge-muted gap-1 text-[10px]">
                {collection.isPrivate
                  ? <><Lock size={9} /> Private</>
                  : <><Globe size={9} /> Public</>}
              </span>
            </div>

            {/* Owner badge */}
            {isOwner && (
              <div className="absolute top-3 right-3">
                <span className="badge badge-muted text-[10px]">Yours</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            {/* Title + accent line */}
            <div>
              <h2
                className="font-display font-semibold tracking-[-0.02em]
                           leading-snug line-clamp-1 transition-colors
                           duration-[var(--duration-hover)] group-hover:text-[hsl(var(--accent))]"
                style={{
                  fontSize: '0.9375rem',
                  color:    'hsl(var(--foreground))',
                }}
              >
                {collection.title}
              </h2>
              {collection.description && (
                <p
                  className="text-xs mt-1 line-clamp-2 leading-relaxed"
                  style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                >
                  {collection.description}
                </p>
              )}
            </div>

            {/* Footer: avatar + meta */}
            <div
              className="flex items-center justify-between pt-2 border-t"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <div className="flex items-center gap-2">
                <Avatar
                  src={collection.user?.avatar}
                  name={collection.user?.displayName}
                  size="xs"
                />
                <span
                  className="text-xs truncate max-w-[100px]"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {collection.user?.displayName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-xs"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {collection.products?.length ?? 0}{' '}
                  {(collection.products?.length ?? 0) === 1 ? 'item' : 'items'}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'hsl(var(--muted) / 0.5)' }}
                >
                  ·
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {collection.saves} saves
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}