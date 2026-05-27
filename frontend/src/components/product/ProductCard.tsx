'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { cn, formatPrice, calculateDiscount } from '@/lib/utils'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'
import { toast } from 'sonner'

interface ProductCardProps {
  product: any
  priority?: boolean
  className?: string
}

const ease = [0.16, 1, 0.3, 1] as const

export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const { isSignedIn }    = useAuth()
  const isSaved           = useUserStore((s) => s.isSaved(product._id))
  const toggleSaveProduct = useUserStore((s) => s.toggleSaveProduct)
  const addItem           = useCartStore((s) => s.addItem)

  const [isHovered,         setIsHovered]         = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSaving,          setIsSaving]          = useState(false)
  const [isAdding,          setIsAdding]          = useState(false)

  const discount    = calculateDiscount(product.price, product.comparePrice)
  const hasMany     = product.images?.length > 1
  const defaultSize = product.variants?.[0]?.size
  const isSoldOut   = product.totalInventory === 0

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!isSignedIn) { toast.error('Sign in to save products'); return }
    setIsSaving(true)
    try {
      await toggleSaveProduct(product._id)
      toast.success(isSaved ? 'Removed from saved' : 'Saved!')
    } catch { toast.error('Something went wrong') }
    finally  { setIsSaving(false) }
  }

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!isSignedIn)  { toast.error('Sign in to add to cart');                   return }
    if (!defaultSize) { toast.error('Please select a size on the product page'); return }
    setIsAdding(true)
    try {
      await addItem(product._id, defaultSize, 1)
      toast.success('Added to cart')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add to cart')
    } finally { setIsAdding(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
      transition={{ duration: 0.45, ease }}
      className={cn('group relative will-change-transform', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentImageIndex(0) }}
    >
      <Link href={`/product/${product._id}`}>

        {/* ══════════════════════════════════════════════════════════════
            IMAGE CONTAINER — card-pin: shadow depth, no hard borders
        ══════════════════════════════════════════════════════════════ */}
        <div className={cn('card-pin relative aspect-[3/4]')}>

          {/* Image layers */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {product.images?.[currentImageIndex]?.url ? (
                <Image
                  src={product.images[currentImageIndex].url}
                  alt={product.images[currentImageIndex].alt || product.title}
                  fill
                  className={cn(
                    'object-cover blur-up loaded',
                    'transition-transform duration-[700ms] ease-out',
                    isHovered && 'scale-[1.055]'
                  )}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={priority}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: 'hsl(var(--surface-inset))',
                    fontSize:   'var(--text-xs)',
                    color:      'hsl(var(--muted-foreground))',
                    fontWeight: 300,
                    letterSpacing: '0.04em',
                  }}
                >
                  No image
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Cinematic gradient overlay */}
          <div className="pin-overlay" />

          {/* Multi-image hover zones — desktop only */}
          {hasMany && isHovered && (
            <div className="hidden md:flex absolute inset-0 z-10">
              {product.images.map((_: any, i: number) => (
                <div
                  key={i}
                  className="flex-1 cursor-pointer"
                  onMouseEnter={() => setCurrentImageIndex(i)}
                />
              ))}
            </div>
          )}

          {/* Image progress — refined pill indicators */}
          {hasMany && isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              className="hidden md:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-1 z-20"
            >
              {product.images.slice(0, 5).map((_: any, i: number) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  style={{
                    height:     '2px',
                    background: 'white',
                  }}
                  animate={{
                    width:   i === currentImageIndex ? '1rem' : '0.3125rem',
                    opacity: i === currentImageIndex ? 1 : 0.45,
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
          )}

          {/* ── Badges — top left ───────────────────────────────────── */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
            {product.isFeatured && (
              <span className="badge badge-red">Featured</span>
            )}
            {discount && !product.isFeatured && (
              <motion.span
                initial={{ opacity: 0, scale: 0.82, y: -4 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                transition={{ duration: 0.32, ease }}
                className="badge badge-red"
              >
                −{discount}%
              </motion.span>
            )}
          </div>

          {/* ── Sold Out overlay — atmospheric, not aggressive ──────── */}
          {isSoldOut && (
            <div
              className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
              style={{ borderRadius: 'var(--radius-xl)' }}
            >
              {/* Dim veil */}
              <div
                className="absolute inset-0"
                style={{ background: 'rgba(0,0,0,0.28)' }}
              />
              {/* Glass ribbon */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top:                  '18%',
                  right:                '-28%',
                  width:                '92%',
                  padding:              '0.4375rem 0',
                  background:           'rgba(8,8,10,0.72)',
                  backdropFilter:       'blur(12px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                  transform:            'rotate(35deg)',
                  borderTop:            '0.5px solid rgba(255,255,255,0.10)',
                  borderBottom:         '0.5px solid rgba(255,255,255,0.10)',
                }}
              >
                <span
                  style={{
                    color:         'rgba(255,255,255,0.88)',
                    fontSize:      '0.5625rem',
                    fontWeight:    500,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                  }}
                >
                  Sold Out
                </span>
              </div>
            </div>
          )}

          {/* ── Hover actions — desktop ──────────────────────────────── */}
          <AnimatePresence>
            {isHovered && (
              <>
                {/* Save — top right glass button */}
                <motion.div
                  initial={{ opacity: 0, y: -8,  scale: 0.92 }}
                  animate={{ opacity: 1, y: 0,   scale: 1    }}
                  exit={{   opacity: 0, y: -6,  scale: 0.94  }}
                  transition={{ duration: 0.2, ease }}
                  className="absolute top-2.5 right-2.5 z-30 hidden md:flex"
                >
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    aria-label={isSaved ? 'Remove from saved' : 'Save product'}
                    style={{
                      width:                '2.125rem',
                      height:               '2.125rem',
                      borderRadius:         '50%',
                      display:              'flex',
                      alignItems:           'center',
                      justifyContent:       'center',
                      backdropFilter:       'blur(12px) saturate(1.6)',
                      WebkitBackdropFilter: 'blur(12px) saturate(1.6)',
                      background:           isSaved
                        ? 'rgba(255,255,255,0.96)'
                        : 'rgba(0,0,0,0.36)',
                      color: isSaved
                        ? 'hsl(var(--accent))'
                        : 'rgba(255,255,255,0.92)',
                      border:     'none',
                      cursor:     'pointer',
                      transition: `background var(--duration-hover) var(--ease-smooth),
                                   transform  var(--duration-fast)  var(--ease-cinematic)`,
                      boxShadow: isSaved
                        ? 'var(--shadow-red), 0 0 0 1px rgba(255,255,255,0.4)'
                        : '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'
                      if (!isSaved)
                        (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.55)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                      if (!isSaved)
                        (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.36)'
                    }}
                  >
                    <Heart
                      size={13}
                      strokeWidth={isSaved ? 0 : 1.75}
                      style={{ fill: isSaved ? 'currentColor' : 'none' }}
                    />
                  </button>
                </motion.div>

                {/* Quick Add — bottom glass bar, desktop only */}
                {!isSoldOut && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0  }}
                    exit={{   opacity: 0, y: 8   }}
                    transition={{ duration: 0.2, ease, delay: 0.03 }}
                    className="absolute bottom-0 left-0 right-0 z-30 p-2.5 hidden md:flex"
                  >
                    <button
                      onClick={handleQuickAdd}
                      disabled={isAdding}
                      className="btn-save w-full justify-center gap-2"
                      style={{ height: '2.25rem', fontSize: 'var(--text-xs)' }}
                    >
                      <ShoppingBag size={12} strokeWidth={2} />
                      {isAdding ? 'Adding…' : 'Quick Add'}
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PRODUCT INFO — editorial hierarchy, no boxing
        ══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            marginTop: '0.875rem',
            paddingInline: '0.125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {/* Brand eyebrow */}
          {product.brand && (
            <p className="eyebrow">{product.brand}</p>
          )}

          {/* Title */}
          <p
            className="line-clamp-2"
            style={{
              fontSize:      'var(--text-sm)',
              fontWeight:    400,
              lineHeight:    1.45,
              color:         'hsl(var(--foreground))',
              letterSpacing: '-0.01em',
            }}
          >
            {product.title}
          </p>

          {/* Price row */}
          <div
            style={{
              display:    'flex',
              alignItems: 'baseline',
              gap:        '0.5rem',
              marginTop:  '0.25rem',
            }}
          >
            {discount ? (
              <>
                <span
                  className="price price-sale"
                  style={{ fontWeight: 600 }}
                >
                  {formatPrice(product.price, 'KES')}
                </span>
                <span className="price-original">
                  {formatPrice(product.comparePrice, 'KES')}
                </span>
              </>
            ) : (
              <span className="price">
                {formatPrice(product.price, 'KES')}
              </span>
            )}
          </div>

          {/* Rating — restrained dots, not stars */}
          {product.rating > 0 && (
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '0.25rem',
                marginTop:  '0.125rem',
              }}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < Math.round(product.rating)
                return (
                  <div
                    key={i}
                    style={{
                      width:        filled ? '0.3125rem' : '0.25rem',
                      height:       filled ? '0.3125rem' : '0.25rem',
                      borderRadius: '50%',
                      background:   filled
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--border))',
                      flexShrink: 0,
                      transition: 'background var(--duration-fast) ease',
                    }}
                  />
                )
              })}
              {product.reviewCount > 0 && (
                <span
                  style={{
                    fontSize:   'var(--text-2xs)',
                    color:      'hsl(var(--muted-foreground))',
                    fontWeight: 300,
                    marginLeft: '0.125rem',
                  }}
                >
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}