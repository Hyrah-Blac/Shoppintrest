'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Settings, Heart, ShoppingBag, CalendarDays, UserX, UserCheck, Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Avatar } from '@/components/ui/Avatar'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { cn, formatDate } from '@/lib/utils'

type Tab = 'saved'

export function ProfileView({ username }: { username: string }) {
  const currentUser     = useUserStore((s) => s.user)

  const [profile,        setProfile]        = useState<any>(null)
  const [isLoading,      setIsLoading]      = useState(true)
  const [tab,            setTab]            = useState<Tab>('saved')
  const [savedProducts,  setSavedProducts]  = useState<any[]>([])
  const [savedLoading,   setSavedLoading]   = useState(false)
  const [removing,       setRemoving]       = useState<Set<string>>(new Set())
  const [togglingActive, setTogglingActive] = useState(false)

  const isOwnProfile = currentUser?.username === username
  const isAdmin      = currentUser?.role === 'admin'

  useEffect(() => {
    setIsLoading(true)
    apiClient.users.getByUsername(username)
      .then(({ data }) => setProfile(data.data))
      .catch(() => toast.error('User not found'))
      .finally(() => setIsLoading(false))
  }, [username])

  useEffect(() => {
    if (tab === 'saved' && isOwnProfile) {
      setSavedLoading(true)
      apiClient.users.getSaved()
        .then(({ data }) => setSavedProducts(data.data || []))
        .catch(() => {})
        .finally(() => setSavedLoading(false))
    }
  }, [tab, isOwnProfile])

  const handleRemove = async (productId: string) => {
    setSavedProducts(prev => prev.filter(p => p._id !== productId))
    setRemoving(prev => new Set(prev).add(productId))
    try {
      await apiClient.users.saveProduct(productId)
      toast.success('Removed from saved')
    } catch {
      toast.error('Could not remove, please try again')
      apiClient.users.getSaved().then(({ data }) => setSavedProducts(data.data || [])).catch(() => {})
    } finally {
      setRemoving(prev => { const n = new Set(prev); n.delete(productId); return n })
    }
  }

  const handleToggleActive = async () => {
    if (!profile) return
    setTogglingActive(true)
    const next = !profile.isActive
    setProfile((p: any) => ({ ...p, isActive: next }))
    try {
      await apiClient.admin.toggleUserActive(profile._id)
      toast.success(next ? 'User activated' : 'User deactivated')
    } catch {
      setProfile((p: any) => ({ ...p, isActive: !next }))
      toast.error('Could not update user')
    } finally {
      setTogglingActive(false)
    }
  }

  const handleRoleChange = async (role: string) => {
    if (!profile) return
    const prev = profile.role
    setProfile((p: any) => ({ ...p, role }))
    try {
      await apiClient.admin.updateUserRole(profile._id, role)
      toast.success('Role updated')
    } catch {
      setProfile((p: any) => ({ ...p, role: prev }))
      toast.error('Could not update role')
    }
  }

  if (isLoading) return <ProfileSkeleton />

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
      <p style={{ color: 'hsl(var(--muted))' }}>User not found</p>
    </div>
  )

  const savedCount = profile.savedProducts?.length ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <div className="relative">
        <div className="container-narrow px-5 sm:px-8 pt-10 sm:pt-16 pb-10 sm:pb-14">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-5 sm:gap-10">

            {/* Avatar — plain, no ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative shrink-0"
            >
              <Avatar
                src={profile.avatar}
                name={profile.displayName}
                size="xl"
                className="w-24 h-24 sm:w-28 sm:h-28 text-2xl sm:text-3xl rounded-2xl"
              />
              {profile.isVerified && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--accent))' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 min-w-0 w-full"
            >
              {/* Name row */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                <div>
                  <h1 className="font-semibold tracking-tight" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', lineHeight: 1.1, color: 'hsl(var(--foreground))' }}>
                    {profile.displayName}
                  </h1>
                  <p className="text-sm mt-1.5 tracking-wide" style={{ color: 'hsl(var(--muted))' }}>
                    @{profile.username}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                  {isOwnProfile && (
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-75 whitespace-nowrap"
                      style={{
                        background: 'hsl(var(--foreground) / 0.08)',
                        color:      'hsl(var(--foreground) / 0.9)',
                        border:     '1px solid hsl(var(--foreground) / 0.1)',
                      }}
                    >
                      <Settings size={13} />
                      Edit profile
                    </Link>
                  )}
                  {isAdmin && !isOwnProfile && (
                    <button
                      onClick={handleToggleActive}
                      disabled={togglingActive}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-40 hover:opacity-75 whitespace-nowrap"
                      style={{
                        background: profile.isActive ? 'hsl(var(--destructive) / 0.08)' : 'hsl(var(--success) / 0.08)',
                        color:      profile.isActive ? 'hsl(var(--destructive))' : 'hsl(var(--success))',
                        border:     `1px solid ${profile.isActive ? 'hsl(var(--destructive) / 0.2)' : 'hsl(var(--success) / 0.2)'}`,
                      }}
                    >
                      {profile.isActive
                        ? <><UserX size={13} /> Deactivate</>
                        : <><UserCheck size={13} /> Activate</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-4 text-sm leading-relaxed max-w-md mx-auto sm:mx-0" style={{ color: 'hsl(var(--foreground) / 0.5)', fontWeight: 300 }}>
                  {profile.bio}
                </p>
              )}

              {/* Meta chips */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-5 flex-wrap">
                {profile.createdAt && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                    style={{
                      background: 'hsl(var(--foreground) / 0.05)',
                      color:      'hsl(var(--foreground) / 0.45)',
                      border:     '1px solid hsl(var(--foreground) / 0.07)',
                    }}
                  >
                    <CalendarDays size={11} />
                    Joined {formatDate(profile.createdAt)}
                  </span>
                )}

                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-70"
                    style={{
                      background: 'hsl(var(--foreground) / 0.05)',
                      color:      'hsl(var(--accent))',
                      border:     '1px solid hsl(var(--foreground) / 0.07)',
                    }}
                  >
                    <Globe size={11} />
                    {profile.website.replace(/https?:\/\//, '')}
                  </a>
                )}

                {isAdmin && !isOwnProfile && (
                  <select
                    value={profile.role}
                    onChange={e => handleRoleChange(e.target.value)}
                    className="h-8 px-3 rounded-lg text-xs focus:outline-none transition-all cursor-pointer"
                    style={{
                      background: 'hsl(var(--foreground) / 0.05)',
                      border:     '1px solid hsl(var(--foreground) / 0.07)',
                      color:      'hsl(var(--foreground) / 0.45)',
                    }}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>

              {/* Saved stat */}
              <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-8">
                <span className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                  {savedCount.toLocaleString()}
                </span>
                <span className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                  saved
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-5 sm:mx-8" style={{ background: 'hsl(var(--foreground) / 0.07)' }} />
      </div>

      {/* ── Tabs ── */}
      {isOwnProfile && (
        <div className="relative" style={{ borderBottom: '1px solid hsl(var(--foreground) / 0.07)' }}>
          <div className="container-narrow px-5 sm:px-8 overflow-x-auto">
            <div className="flex">
              {([{ id: 'saved', label: 'Saved', icon: Bookmark }] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className="relative flex items-center gap-2 px-1 py-4 mr-8 text-sm font-medium transition-colors duration-150"
                  style={{ color: tab === t.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted))' }}
                >
                  <t.icon size={13} />
                  {t.label}
                  {savedCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[10px] font-medium tabular-nums"
                      style={{
                        background: 'hsl(var(--foreground) / 0.07)',
                        color:      'hsl(var(--foreground) / 0.35)',
                      }}
                    >
                      {savedCount}
                    </span>
                  )}
                  {tab === t.id && (
                    <motion.div
                      layoutId="tab-line"
                      className="absolute bottom-0 left-0 right-0 h-px"
                      style={{ background: 'hsl(var(--foreground))' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="container-narrow px-5 sm:px-8 py-6 sm:py-8">

        {isOwnProfile && tab === 'saved' && (
          <>
            {savedLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : savedProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-20 sm:py-32 text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'hsl(var(--foreground) / 0.04)', border: '1px solid hsl(var(--foreground) / 0.07)' }}
                >
                  <Heart size={20} style={{ color: 'hsl(var(--muted))' }} />
                </div>
                <p className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Nothing saved yet</p>
                <p className="text-sm mb-7 max-w-xs leading-relaxed" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                  Products you save will appear here
                </p>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                >
                  Explore products
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <AnimatePresence mode="popLayout">
                  {savedProducts.map((product, i) => (
                    <motion.div
                      key={product._id}
                      layout
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, y: -8, transition: { duration: 0.22, ease: 'easeIn' } }}
                      transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="relative group/saved"
                    >
                      <ProductCard product={product} />

                      <div className="absolute top-2.5 right-2.5 z-50 hidden md:block
                                      opacity-0 group-hover/saved:opacity-100 transition-opacity duration-150
                                      pointer-events-none group-hover/saved:pointer-events-auto">
                        <UnsaveButton isRemoving={removing.has(product._id)} onRemove={() => handleRemove(product._id)} showTooltip />
                      </div>

                      <div className="absolute bottom-[4.5rem] left-0 right-0 z-50 flex justify-center md:hidden">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={e => { e.preventDefault(); e.stopPropagation(); handleRemove(product._id) }}
                          disabled={removing.has(product._id)}
                          aria-label="Remove from saved"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-pill)] disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ background: 'hsl(var(--accent))', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
                        >
                          {removing.has(product._id) ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                              className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white" />
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          )}
                          <span className="text-white leading-none" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                            {removing.has(product._id) ? 'Removing…' : 'Unsave'}
                          </span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {!isOwnProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 sm:py-32 text-center"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'hsl(var(--foreground) / 0.04)', border: '1px solid hsl(var(--foreground) / 0.07)' }}
            >
              <ShoppingBag size={20} style={{ color: 'hsl(var(--muted))' }} />
            </div>
            <p className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>{profile.displayName}'s profile</p>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
              This user's activity is private.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

/* ── Unsave Button ── */
function UnsaveButton({ isRemoving, onRemove, showTooltip = false }: {
  isRemoving: boolean; onRemove: () => void; showTooltip?: boolean
}) {
  return (
    <div className="relative group/btn">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
        onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove() }}
        disabled={isRemoving}
        aria-label="Remove from saved"
        className="flex items-center justify-center rounded-full disabled:cursor-not-allowed"
        style={{
          width: '2.25rem', height: '2.25rem',
          background: isRemoving ? 'rgba(0,0,0,0.6)' : 'hsl(var(--accent))',
          boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
        }}
      >
        <AnimatePresence mode="wait">
          {isRemoving ? (
            <motion.div key="spinner"
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
              className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white"
              style={{ animation: 'spin 0.7s linear infinite' }}
            />
          ) : (
            <motion.svg key="heart"
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              width="15" height="15" viewBox="0 0 24 24" fill="white"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
      {showTooltip && (
        <div
          className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium
                     px-2 py-1 rounded-[var(--radius-sm)] pointer-events-none opacity-0 group-hover/btn:opacity-100
                     transition-opacity delay-300 duration-150"
          style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
        >
          Unsave
        </div>
      )}
    </div>
  )
}

/* ── Profile Skeleton ── */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <div className="container-narrow px-5 sm:px-8 pt-10 sm:pt-16 pb-10 sm:pb-14">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-5 sm:gap-10">
          <div className="skeleton w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl" />
          <div className="flex-1 w-full space-y-4 pt-1 flex flex-col items-center sm:items-start">
            <div className="skeleton h-8 w-48 rounded-xl" />
            <div className="skeleton h-3.5 w-28 rounded-lg" />
            <div className="skeleton h-10 w-full max-w-sm rounded-xl" />
            <div className="flex gap-2">
              <div className="skeleton h-7 w-32 rounded-lg" />
              <div className="skeleton h-7 w-20 rounded-lg" />
            </div>
            <div className="skeleton h-8 w-14 rounded-lg mt-3" />
          </div>
        </div>
      </div>
      <div className="container-narrow px-5 sm:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/3]" style={{ borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const _style = <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>