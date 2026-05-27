'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import {
  Globe, UserCheck, UserPlus, Settings,
  Grid3x3, Heart, Bookmark,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Avatar } from '@/components/ui/Avatar'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

type Tab = 'collections' | 'saved'

export function ProfileView({ username }: { username: string }) {
  const { isSignedIn } = useAuth()
  const currentUser    = useUserStore((s) => s.user)

  const [profile,        setProfile]        = useState<any>(null)
  const [isLoading,      setIsLoading]      = useState(true)
  const [tab,            setTab]            = useState<Tab>('collections')
  const [isFollowing,    setIsFollowing]    = useState(false)
  const [isFollowLoading,setIsFollowLoading]= useState(false)
  const [savedProducts,  setSavedProducts]  = useState<any[]>([])
  const [savedLoading,   setSavedLoading]   = useState(false)
  const [removing,       setRemoving]       = useState<Set<string>>(new Set())

  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    setIsLoading(true)
    apiClient.users.getByUsername(username)
      .then(({ data }) => {
        setProfile(data.data)
        setIsFollowing(
          data.data?.followers?.some(
            (f: any) => f._id === currentUser?._id || f === currentUser?._id
          ) || false
        )
      })
      .catch(() => toast.error('User not found'))
      .finally(() => setIsLoading(false))
  }, [username, currentUser])

  useEffect(() => {
    if (tab === 'saved' && isOwnProfile) {
      setSavedLoading(true)
      apiClient.users.getSaved()
        .then(({ data }) => setSavedProducts(data.data || []))
        .catch(() => {})
        .finally(() => setSavedLoading(false))
    }
  }, [tab, isOwnProfile])

  const handleFollow = async () => {
    if (!isSignedIn) { toast.error('Sign in to follow users'); return }
    setIsFollowLoading(true)
    try {
      const { data } = await apiClient.users.follow(profile._id)
      setIsFollowing(data.data.isFollowing)
      setProfile((p: any) => ({
        ...p,
        followers: data.data.isFollowing
          ? [...(p.followers || []), currentUser?._id]
          : (p.followers || []).filter((id: string) => id !== currentUser?._id),
      }))
    } catch {
      toast.error('Could not follow user')
    } finally { setIsFollowLoading(false) }
  }

  const handleRemove = async (productId: string) => {
    setSavedProducts((prev) => prev.filter((p) => p._id !== productId))
    setRemoving((prev) => new Set(prev).add(productId))
    try {
      await apiClient.users.saveProduct(productId)
      toast.success('Removed from saved')
    } catch {
      toast.error('Could not remove, please try again')
      apiClient.users.getSaved()
        .then(({ data }) => setSavedProducts(data.data || []))
        .catch(() => {})
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  if (isLoading) return <ProfileSkeleton />

  if (!profile) return (
    <div
      className="container-narrow py-32 text-center"
      style={{ color: 'hsl(var(--muted))' }}
    >
      User not found
    </div>
  )

  const publicCollections = profile.collections?.filter(
    (c: any) => !c.isPrivate
  ) || []

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════
          Profile Header
      ══════════════════════════════════════════════════ */}
      <div
        className="border-b"
        style={{
          background:  'hsl(var(--surface))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {/* Subtle top accent */}
        <div
          className="h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.3), transparent)',
          }}
        />

        <div className="container-narrow py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar — circular */}
            <div className="relative shrink-0">
              <Avatar
                src={profile.avatar}
                name={profile.displayName}
                size="xl"
                className="w-24 h-24 text-2xl rounded-full"
              />
              {profile.isVerified && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6
                             rounded-full flex items-center justify-center
                             shadow-[var(--shadow-red)]"
                  style={{ background: 'hsl(var(--accent))' }}
                >
                  <UserCheck size={12} style={{ color: 'white' }} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">

              {/* Name + Actions */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1
                    className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
                    style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
                  >
                    {profile.displayName}
                  </h1>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    @{profile.username}
                  </p>
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Link href="/profile/edit" className="btn-ghost gap-2">
                      <Settings size={14} />
                      Edit Profile
                    </Link>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className={cn(
                        'gap-2',
                        isFollowing ? 'btn-ghost' : 'btn-save',
                        isFollowLoading && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                      {isFollowLoading ? '…' : isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {!isOwnProfile && (
                    <Link href={`/messages?user=${profile._id}`} className="btn-ghost">
                      Message
                    </Link>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p
                  className="text-sm mt-3 leading-relaxed max-w-lg"
                  style={{ color: 'hsl(var(--foreground))', fontWeight: 300 }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs
                               transition-colors duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--muted))' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'hsl(var(--muted))')}
                  >
                    <Globe size={12} />
                    {profile.website.replace(/https?:\/\//, '')}
                  </a>
                )}
                <span className="badge badge-muted capitalize">{profile.role}</span>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                {[
                  {
                    label: 'Followers',
                    value: profile.followers?.length || 0,
                    href:  `/profile/${username}/followers`,
                  },
                  {
                    label: 'Following',
                    value: profile.following?.length || 0,
                    href:  `/profile/${username}/following`,
                  },
                  {
                    label: 'Collections',
                    value: publicCollections.length,
                    href:  null,
                  },
                ].map((stat) =>
                  stat.href ? (
                    <Link
                      key={stat.label}
                      href={stat.href}
                      className="text-center transition-opacity
                                 duration-[var(--duration-hover)] hover:opacity-70"
                    >
                      <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>
                        {stat.label}
                      </p>
                    </Link>
                  ) : (
                    <div key={stat.label} className="text-center">
                      <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>
                        {stat.label}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Tabs
      ══════════════════════════════════════════════════ */}
      <div className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="container-narrow">
          <div className="flex gap-0">
            {[
              { id: 'collections', label: 'Collections', icon: Grid3x3 },
              ...(isOwnProfile
                ? [{ id: 'saved', label: 'Saved', icon: Heart }]
                : []),
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium',
                  'border-b-2 transition-all duration-[var(--duration-hover)]',
                  tab === t.id
                    ? 'border-[hsl(var(--accent))] text-[hsl(var(--foreground))]'
                    : 'border-transparent text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Content
      ══════════════════════════════════════════════════ */}
      <div className="container-narrow py-10">

        {/* Collections Tab */}
        {tab === 'collections' && (
          <div>
            {publicCollections.length === 0 ? (
              <EmptyState
                icon="✦"
                title="No collections yet"
                description={
                  isOwnProfile
                    ? 'Start saving products to build your first collection'
                    : `${profile.displayName} hasn't created any public collections yet`
                }
                action={
                  isOwnProfile ? (
                    <Link href="/collections/new" className="btn-save">
                      Create Collection
                    </Link>
                  ) : null
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {publicCollections.map((col: any, i: number) => (
                  <motion.div
                    key={col._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay:    i * 0.06,
                      duration: 0.4,
                      ease:     [0.22, 1, 0.36, 1],
                    }}
                  >
                    <CollectionCard collection={col} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Tab */}
        {tab === 'saved' && isOwnProfile && (
          <div>
            {savedLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : savedProducts.length === 0 ? (
              <EmptyState
                icon="♡"
                title="No saved products"
                description="Save products you love to find them here"
                action={
                  <Link href="/explore" className="btn-save">
                    Explore Products
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {savedProducts.map((product, i) => (
                    <motion.div
                      key={product._id}
                      layout
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0,  scale: 1    }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        y: -8,
                        transition: { duration: 0.22, ease: 'easeIn' },
                      }}
                      transition={{
                        delay:    i * 0.04,
                        duration: 0.4,
                        ease:     [0.22, 1, 0.36, 1],
                      }}
                      className="relative group/saved"
                    >
                      <ProductCard product={product} />

                      {/* Desktop — red filled heart, top-right, on hover */}
                      <div
                        className="absolute top-2.5 right-2.5 z-50
                                   hidden md:block
                                   opacity-0 group-hover/saved:opacity-100
                                   transition-opacity duration-150
                                   pointer-events-none
                                   group-hover/saved:pointer-events-auto"
                      >
                        <UnsaveButton
                          isRemoving={removing.has(product._id)}
                          onRemove={() => handleRemove(product._id)}
                          showTooltip
                        />
                      </div>

                      {/* Mobile — always-visible pill at bottom of card */}
                      <div className="absolute bottom-[4.5rem] left-0 right-0 z-50
                                      flex justify-center md:hidden">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemove(product._id)
                          }}
                          disabled={removing.has(product._id)}
                          aria-label="Remove from saved"
                          className="flex items-center gap-1.5 px-3 py-1.5
                                     rounded-[var(--radius-pill)]
                                     disabled:opacity-60 disabled:cursor-not-allowed
                                     transition-opacity duration-150"
                          style={{
                            background:           'hsl(var(--accent))',
                            boxShadow:            '0 2px 12px rgba(0,0,0,0.28)',
                            backdropFilter:       'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                          }}
                        >
                          {removing.has(product._id) ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                              className="w-3 h-3 rounded-full border-2
                                         border-white/30 border-t-white"
                            />
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                                       2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                                       C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42
                                       22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          )}
                          <span
                            className="text-white leading-none"
                            style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.01em' }}
                          >
                            {removing.has(product._id) ? 'Removing…' : 'Unsave'}
                          </span>
                        </motion.button>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Collection Card ── */
function CollectionCard({ collection }: { collection: any }) {
  return (
    <Link href={`/collections/${collection._id}`}>
      <motion.div
        whileHover={{ y: -3, boxShadow: 'var(--shadow-card-hover)' }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="group rounded-[var(--radius-xl)] overflow-hidden border
                   transition-[border-color] duration-[var(--duration-hover)]
                   shadow-[var(--shadow-card)]"
        style={{
          background:  'hsl(var(--surface))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div
          className="aspect-[4/3] relative overflow-hidden"
          style={{ background: 'hsl(var(--accent-muted))' }}
        >
          {collection.coverImage ? (
            <Image
              src={collection.coverImage}
              alt={collection.title}
              fill
              className="object-cover transition-transform duration-[var(--duration-standard)]
                         group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Bookmark size={24} style={{ color: 'hsl(var(--accent))' }} />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
            {collection.title}
          </h3>
          {collection.description && (
            <p
              className="text-xs mt-1 line-clamp-2"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
            >
              {collection.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>
              {collection.products?.length || 0} items
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>
              {collection.saves} saves
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

/* ── Unsave Button (desktop hover) ── */
function UnsaveButton({
  isRemoving,
  onRemove,
  showTooltip = false,
}: {
  isRemoving:   boolean
  onRemove:     () => void
  showTooltip?: boolean
}) {
  return (
    <div className="relative group/btn">
      <motion.button
        whileHover={{ scale: 1.1  }}
        whileTap={{   scale: 0.88 }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove()
        }}
        disabled={isRemoving}
        aria-label="Remove from saved"
        className="flex items-center justify-center rounded-full
                   disabled:cursor-not-allowed transition-colors duration-150"
        style={{
          width:      '2.25rem',
          height:     '2.25rem',
          background: isRemoving ? 'rgba(0,0,0,0.45)' : 'hsl(var(--accent))',
          boxShadow:  '0 2px 12px rgba(0,0,0,0.28)',
        }}
      >
        <AnimatePresence mode="wait">
          {isRemoving ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1   }}
              exit={{   opacity: 0, scale: 0.6  }}
              className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white"
              style={{ animation: 'spin 0.7s linear infinite' }}
            />
          ) : (
            <motion.svg
              key="heart"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{    scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              width="15" height="15"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                       2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                       C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42
                       22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {showTooltip && (
        <div
          className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2
                     whitespace-nowrap text-[10px] font-medium
                     px-2 py-1 rounded-[var(--radius-sm)]
                     pointer-events-none
                     opacity-0 group-hover/btn:opacity-100
                     transition-opacity delay-300 duration-150"
          style={{
            background: 'hsl(var(--foreground))',
            color:      'hsl(var(--background))',
          }}
        >
          Unsave
        </div>
      )}
    </div>
  )
}

/* ── Empty State ── */
function EmptyState({
  icon, title, description, action,
}: {
  icon:        string
  title:       string
  description: string
  action?:     React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl mb-4">{icon}</p>
      <p className="font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
        {title}
      </p>
      <p
        className="text-sm mb-6 max-w-xs"
        style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
      >
        {description}
      </p>
      {action}
    </div>
  )
}

/* ── Profile Skeleton ── */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <div
        className="border-b"
        style={{
          background:  'hsl(var(--surface))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div className="container-narrow py-12">
          <div className="flex gap-6">
            <div className="skeleton w-24 h-24 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-7 w-48" style={{ borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton h-4 w-24" style={{ borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton h-16 w-full" style={{ borderRadius: 'var(--radius)' }} />
            </div>
          </div>
        </div>
      </div>
      <div className="container-narrow py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton aspect-[4/3]"
              style={{ borderRadius: 'var(--radius-xl)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* Spin keyframe */
const _style = (
  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
)