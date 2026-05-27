'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, Eye } from 'lucide-react'
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

export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const router            = useRouter()
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('group relative will-change-transform', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentImageIndex(0) }}
    >
      <Link href={`/product/${product._id}`}>

        {/* ── Image Container ── */}
        <div
          className={cn(
            'card-pin relative aspect-[3/4]',
            'transition-[box-shadow,transform] duration-[var(--duration-standard)]',
          )}
        >
          {/* Images */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              {product.images?.[currentImageIndex]?.url ? (
                <Image
                  src={product.images[currentImageIndex].url}
                  alt={product.images[currentImageIndex].alt || product.title}
                  fill
                  className={cn(
                    'object-cover transition-transform duration-700 ease-out blur-up loaded',
                    isHovered && 'scale-[1.06]'
                  )}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={priority}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs tracking-wide"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  No image
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Pinterest-style gradient overlay */}
          <div className="pin-overlay" />

          {/* Hover zones for multi-image swap — desktop only */}
          {hasMany && isHovered && (
            <div className="hidden md:flex absolute top-0 left-0 right-0 h-full z-10">
              {product.images.map((_: any, i: number) => (
                <div
                  key={i}
                  className="flex-1 cursor-pointer"
                  onMouseEnter={() => setCurrentImageIndex(i)}
                />
              ))}
            </div>
          )}

          {/* Image progress dots — desktop only */}
          {hasMany && isHovered && (
            <div className="hidden md:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-1 z-20">
              {product.images.slice(0, 5).map((_: any, i: number) => (
                <motion.div
                  key={i}
                  className="h-[3px] rounded-full bg-white transition-all duration-200"
                  animate={{
                    width:   i === currentImageIndex ? 16 : 6,
                    opacity: i === currentImageIndex ? 1  : 0.5,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Badges (top-left) ── */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
            {product.isFeatured && (
              <span className="badge badge-red">Featured</span>
            )}
            {discount && !product.isFeatured && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8, y: -4 }}
                animate={{ opacity: 1, scale: 1,   y: 0  }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="inline-flex items-center font-bold"
                style={{
                  fontSize:      '0.68rem',
                  padding:       '0.22rem 0.55rem',
                  borderRadius:  'var(--radius-pill)',
                  background:    'hsl(var(--accent))',
                  color:         'white',
                  boxShadow:     'var(--shadow-red)',
                  letterSpacing: '0.01em',
                }}
              >
                −{discount}%
              </motion.span>
            )}
          </div>

          {/* ── Sold Out diagonal ribbon ── */}
          {product.totalInventory === 0 && (
            <div
              className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
              style={{ borderRadius: 'var(--radius-xl)' }}
            >
              <div
                className="absolute inset-0"
                style={{ background: 'rgba(0,0,0,0.22)' }}
              />
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top:                  '16%',
                  right:                '-30%',
                  width:                '95%',
                  padding:              '0.38rem 0',
                  background:           'rgba(12,12,12,0.80)',
                  backdropFilter:       'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transform:            'rotate(35deg)',
                  borderTop:            '0.5px solid rgba(255,255,255,0.12)',
                  borderBottom:         '0.5px solid rgba(255,255,255,0.12)',
                }}
              >
                <span
                  style={{
                    color:         'white',
                    fontSize:      '0.58rem',
                    fontWeight:    700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}
                >
                  Sold Out
                </span>
              </div>
            </div>
          )}

          {/* ── Actions — desktop hover only, driven by JS state
               NOT the CSS .pin-actions class (which is always in DOM).
               Using isHovered state means they truly don't exist on mobile. ── */}
          <AnimatePresence>
            {isHovered && (
              <>
                {/* Save + View — top right */}
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0  }}
                  exit={{   opacity: 0, y: -6  }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-2.5 right-2.5 z-30 flex-col gap-1.5 hidden md:flex"
                >
                  {/* Save */}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    aria-label="Save product"
                    className={cn(
                      'w-9 h-9 flex items-center justify-center rounded-full',
                      'backdrop-blur-sm transition-colors duration-[var(--duration-hover)]',
                      isSaved
                        ? 'bg-white text-[hsl(var(--accent))]'
                        : 'bg-black/40 hover:bg-black/60 text-white',
                    )}
                  >
                    <Heart size={14} className={cn(isSaved && 'fill-current')} />
                  </button>

                  {/* View */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      router.push(`/product/${product._id}`)
                    }}
                    aria-label="View product"
                    className="w-9 h-9 flex items-center justify-center rounded-full
                               bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white
                               transition-colors duration-[var(--duration-hover)]"
                  >
                    <Eye size={14} />
                  </button>
                </motion.div>

                {/* Quick Add — bottom, desktop only */}
                {product.totalInventory > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8  }}
                    animate={{ opacity: 1, y: 0  }}
                    exit={{   opacity: 0, y: 8   }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-0 left-0 right-0 z-30 p-3 hidden md:flex"
                  >
                    <button
                      onClick={handleQuickAdd}
                      disabled={isAdding}
                      className="btn-save w-full h-9 text-xs justify-center gap-2"
                    >
                      <ShoppingBag size={13} />
                      {isAdding ? 'Adding…' : 'Quick Add'}
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>

        </div>

        {/* ── Product Info ── */}
        <div className="mt-3.5 space-y-1 px-0.5">

          {product.brand && (
            <p className="eyebrow">{product.brand}</p>
          )}

          <p
            className="text-sm font-medium line-clamp-2 leading-snug"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {product.title}
          </p>

          {/* Price */}
          <div className="flex items-center gap-2 pt-1">
            {discount ? (
              <>
                <span
                  className="price"
                  style={{ color: 'hsl(var(--accent))', fontWeight: 700 }}
                >
                  {formatPrice(product.price, 'KES')}
                </span>
                <span
                  style={{
                    fontSize:            '0.78rem',
                    fontWeight:          400,
                    color:               'hsl(var(--muted))',
                    textDecoration:      'line-through',
                    textDecorationColor: 'hsl(var(--muted) / 0.6)',
                    letterSpacing:       '-0.01em',
                  }}
                >
                  {formatPrice(product.comparePrice, 'KES')}
                </span>
              </>
            ) : (
              <span className="price">
                {formatPrice(product.price, 'KES')}
              </span>
            )}
          </div>

          {/* Rating — stars only, no text */}
          {product.rating > 0 && (
            <div className="flex gap-px pt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="text-[11px] leading-none"
                  style={{
                    color: i < Math.round(product.rating)
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--border))',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}