'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import {
  Globe, UserCheck, UserPlus, Settings,
  Grid3x3, Heart, Bookmark,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

type Tab = 'collections' | 'saved'

export function ProfileView({ username }: { username: string }) {
  const { isSignedIn } = useAuth()
  const currentUser = useUserStore((s) => s.user)

  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('collections')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [savedProducts, setSavedProducts] = useState<any[]>([])
  const [savedLoading, setSavedLoading] = useState(false)

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
    } finally {
      setIsFollowLoading(false)
    }
  }

  if (isLoading) return <ProfileSkeleton />

  if (!profile) {
    return (
      <div className="container-narrow py-32 text-center text-muted">
        User not found
      </div>
    )
  }

  const publicCollections = profile.collections?.filter(
    (c: any) => !c.isPrivate
  ) || []

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="border-b border-border bg-surface">
        <div className="container-narrow py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar
                src={profile.avatar}
                name={profile.displayName}
                size="xl"
                className="w-24 h-24 text-2xl"
              />
              {profile.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6
                                bg-foreground rounded-full flex items-center
                                justify-center">
                  <UserCheck size={12} className="text-background" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name + Actions row */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight">
                    {profile.displayName}
                  </h1>
                  <p className="text-sm text-muted mt-0.5">
                    @{profile.username}
                  </p>
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Link href="/profile/edit">
                      <Button
                        variant="outline"
                        size="md"
                        leftIcon={<Settings size={14} />}
                      >
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant={isFollowing ? 'outline' : 'primary'}
                      size="md"
                      isLoading={isFollowLoading}
                      onClick={handleFollow}
                      leftIcon={
                        isFollowing
                          ? <UserCheck size={14} />
                          : <UserPlus size={14} />
                      }
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                  {!isOwnProfile && (
                    <Link href={`/messages?user=${profile._id}`}>
                      <Button variant="outline" size="md">
                        Message
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-foreground mt-3 leading-relaxed max-w-lg">
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
    className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
  >
    <Globe size={12} />
    {profile.website.replace(/https?:\/\//, '')}
  </a>
)}
                <Badge variant="secondary" size="sm">
                  {profile.role}
                </Badge>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                {[
                  {
                    label: 'Followers',
                    value: profile.followers?.length || 0,
                    href: `/profile/${username}/followers`,
                  },
                  {
                    label: 'Following',
                    value: profile.following?.length || 0,
                    href: `/profile/${username}/following`,
                  },
                  {
                    label: 'Collections',
                    value: publicCollections.length,
                    href: null,
                  },
                ].map((stat) =>
                  stat.href ? (
                    <Link
                      key={stat.label}
                      href={stat.href}
                      className="text-center hover:opacity-70 transition-opacity"
                    >
                      <p className="font-semibold text-foreground">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted">{stat.label}</p>
                    </Link>
                  ) : (
                    <div key={stat.label} className="text-center">
                      <p className="font-semibold text-foreground">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted">{stat.label}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-border">
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
                  `flex items-center gap-2 px-6 py-4 text-sm font-medium
                   border-b-2 transition-all duration-200`,
                  tab === t.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
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
                    <Link href="/collections/new">
                      <Button variant="primary" size="md">
                        Create Collection
                      </Button>
                    </Link>
                  ) : null
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {publicCollections.map((col: any) => (
                  <CollectionCard key={col._id} collection={col} />
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
                  <Link href="/explore">
                    <Button variant="primary" size="md">
                      Explore Products
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {savedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Collection Card ──────────────────────────────────────────────────────────

function CollectionCard({ collection }: { collection: any }) {
  return (
    <Link href={`/collections/${collection._id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group rounded-2xl overflow-hidden border border-border
                   bg-surface hover:border-foreground/20 transition-all duration-300"
      >
        {/* Cover image */}
        <div className="aspect-[4/3] bg-accent relative overflow-hidden">
          {collection.coverImage ? (
            <Image
              src={collection.coverImage}
              alt={collection.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Bookmark size={24} className="text-muted" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-medium text-foreground truncate">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2">
              {collection.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted">
              {collection.products?.length || 0} items
            </p>
            <p className="text-xs text-muted">
              {collection.saves} saves
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl mb-4">{icon}</p>
      <p className="font-medium text-foreground mb-2">{title}</p>
      <p className="text-sm text-muted mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  )
}

// ── Profile Skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-surface">
        <div className="container-narrow py-12">
          <div className="flex gap-6">
            <div className="skeleton w-24 h-24 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-7 w-48 rounded-xl" />
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-16 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="container-narrow py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}