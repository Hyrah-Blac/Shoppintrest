'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'

export default function SavedPage() {
  const { isSignedIn } = useAuth()
  const [products, setProducts]   = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removing, setRemoving]   = useState<Set<string>>(new Set())

  useEffect(() => {
    apiClient.users.getSaved({ limit: 40 })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleRemove = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== productId))
    setRemoving((prev) => new Set(prev).add(productId))
    try {
      await apiClient.users.saveProduct(productId)
      toast.success('Removed from saved')
    } catch {
      toast.error('Could not remove, please try again')
      apiClient.users.getSaved({ limit: 40 })
        .then(({ data }) => setProducts(data.data || []))
        .catch(() => {})
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

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
        <div
          className="h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.4), transparent)',
          }}
        />

        <div className="container-wide py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow mb-3 block">Your</span>
            <h1
              className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
              style={{ fontSize: 'clamp(1.75rem, 4vw, var(--text-hero))' }}
            >
              Saved
            </h1>

            <motion.div
              className="mt-3 mb-3 h-[2px] w-12 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            />

            <div className="flex items-center gap-3">
              <p
                className="text-sm"
                style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
              >
                Products you've loved and saved
              </p>
              <AnimatePresence>
                {products.length > 0 && !isLoading && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1   }}
                    exit={{   opacity: 0, scale: 0.8  }}
                    className="text-xs px-2 py-0.5 rounded-[var(--radius-pill)]"
                    style={{
                      background: 'hsl(var(--accent-muted))',
                      color:      'hsl(var(--accent))',
                      fontWeight: 600,
                    }}
                  >
                    {products.length} item{products.length !== 1 ? 's' : ''}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Grid
      ══════════════════════════════════════════════════ */}
      <div className="container-wide py-12">

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>

        ) : !isSignedIn ? (

          <div className="py-32 text-center">
            <p className="text-4xl mb-4">♡</p>
            <p className="font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Sign in to see your saved items
            </p>
            <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
              Save products you love and find them here
            </p>
            <Link href="/sign-in" className="btn-save">Sign in</Link>
          </div>

        ) : products.length === 0 ? (

          <div className="py-32 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <p className="text-5xl mb-4">♡</p>
            </motion.div>
            <p className="font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Nothing saved yet
            </p>
            <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
              Tap the heart on any product to save it here
            </p>
            <Link href="/explore" className="btn-save">Start exploring</Link>
          </div>

        ) : (

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => (
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

                  {/* ══════════════════════════════════════
                      DESKTOP — red filled heart, top-right,
                      visible only on hover
                  ══════════════════════════════════════ */}
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

                  {/* ══════════════════════════════════════
                      MOBILE — always-visible pill at the
                      bottom of the card, never needs hover
                  ══════════════════════════════════════ */}
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
                        background:          'hsl(var(--accent))',
                        boxShadow:           '0 2px 12px rgba(0,0,0,0.28)',
                        backdropFilter:      'blur(8px)',
                        WebkitBackdropFilter:'blur(8px)',
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
                        <svg
                          width="11" height="11"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
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
    </div>
  )
}

/* ─────────────────────────────────────────────
   Shared unsave button — desktop hover version
───────────────────────────────────────────── */
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

      {/* Tooltip — desktop only */}
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

/* Spin keyframe */
const _style = (
  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
)