'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, MoreHorizontal } from 'lucide-react'
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
    if (!isSignedIn) { toast.error('Sign in to save'); return }
    setIsSaving(true)
    try {
      await toggleSaveProduct(product._id)
      toast.success(isSaved ? 'Removed' : 'Saved!')
    } catch { toast.error('Something went wrong') }
    finally { setIsSaving(false) }
  }

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!isSignedIn)  { toast.error('Sign in to add to cart');                   return }
    if (!defaultSize) { toast.error('Select a size on the product page'); return }
    setIsAdding(true)
    try {
      await addItem(product._id, defaultSize, 1)
      toast.success('Added to cart!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add to cart')
    } finally { setIsAdding(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn('group relative break-inside-avoid', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentImageIndex(0) }}
    >
      <Link href={`/product/${product._id}`}>

        {/* ── Pinterest-style image card ──
            No fixed aspect ratio — dynamic heights like real Pinterest */}
        <div
          className={cn(
            'relative overflow-hidden',
            'rounded-[var(--radius-xl)]',          /* 24px — Pinterest spec */
            'transition-all duration-300',
            isHovered
              ? 'shadow-[var(--shadow-card-hover)]'
              : 'shadow-[var(--shadow-card)]'
          )}
          style={{ background: 'hsl(var(--surface))' }}
        >
          {/* Image */}
          <div className="relative w-full" style={{ minHeight: '180px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                {product.images?.[currentImageIndex]?.url ? (
                  <Image
                    src={product.images[currentImageIndex].url}
                    alt={product.images[currentImageIndex].alt || product.title}
                    width={400}
                    height={600}
                    className={cn(
                      'w-full h-auto object-cover transition-transform duration-500',
                      isHovered && 'scale-[1.03]'
                    )}
                    style={{ borderRadius: 'var(--radius-xl)' }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority={priority}
                  />
                ) : (
                  <div
                    className="w-full h-48 flex items-center justify-center
                                text-xs font-medium"
                    style={{
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--muted))',
                      borderRadius: 'var(--radius-xl)',
                    }}
                  >
                    No image
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Multi-image hover zones */}
          {hasMany && isHovered && (
            <div className="absolute top-0 left-0 right-0 h-full flex z-10">
              {product.images.map((_: any, i: number) => (
                <div
                  key={i}
                  className="flex-1"
                  onMouseEnter={() => setCurrentImageIndex(i)}
                />
              ))}
            </div>
          )}

          {/* Image progress dots */}
          {hasMany && isHovered && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {product.images.slice(0, 5).map((_: any, i: number) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-200 bg-white/80"
                  style={{ width: i === currentImageIndex ? '1.25rem' : '0.375rem' }}
                />
              ))}
            </div>
          )}

          {/* ── Pinterest-style overlay on hover ── */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 rounded-[var(--radius-xl)]"
                style={{
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)',
                }}
              />
            )}
          </AnimatePresence>

          {/* ── Save button — top right, Pinterest red ── */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                onClick={handleSave}
                disabled={isSaving}
                className="absolute top-3 right-3 z-20 btn-save text-xs px-3 py-1.5"
                aria-label="Save"
              >
                {isSaved ? '✓ Saved' : 'Save'}
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── More options — top left ── */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5"
              >
                {/* Quick add */}
                {product.totalInventory > 0 && (
                  <button
                    onClick={handleQuickAdd}
                    disabled={isAdding}
                    className="w-8 h-8 rounded-full flex items-center justify-center
                               transition-all duration-200 hover:scale-105"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: 'hsl(var(--foreground))',
                      backdropFilter: 'blur(8px)',
                    }}
                    aria-label="Quick add to cart"
                  >
                    <ShoppingBag size={13} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Saved heart indicator (always visible if saved) ── */}
          {isSaved && !isHovered && (
            <div
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full
                         flex items-center justify-center"
              style={{ background: 'hsl(var(--accent))' }}
            >
              <Heart size={13} className="fill-white text-white" />
            </div>
          )}

          {/* ── Badges ── */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {discount && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full
                           text-[10px] font-bold text-white"
                style={{ background: 'hsl(var(--accent))' }}
              >
                -{discount}%
              </span>
            )}
            {product.totalInventory === 0 && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full
                           text-[10px] font-semibold text-white"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              >
                Sold Out
              </span>
            )}
          </div>

          {/* ── Bottom overlay: price + add to cart (glassmorphism) ── */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-3 left-3 right-3 z-20"
              >
                {product.totalInventory > 0 && (
                  <button
                    onClick={handleQuickAdd}
                    disabled={isAdding}
                    className="w-full h-9 rounded-[var(--radius-pill)] text-xs font-semibold
                               flex items-center justify-center gap-2
                               transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      color: 'hsl(var(--foreground))',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.5)',
                    }}
                  >
                    <ShoppingBag size={12} />
                    {isAdding ? 'Adding…' : 'Add to cart'}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Product Info — minimal, Pinterest-style ── */}
        <div className="mt-2.5 px-0.5 space-y-0.5">

          {/* Brand */}
          {product.brand && (
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'hsl(var(--muted))' }}
            >
              {product.brand}
            </p>
          )}

          {/* Title */}
          <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
            {product.title}
          </p>

          {/* Price */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-sm font-bold text-foreground">
              {formatPrice(product.price, 'KES')}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span
                className="text-xs line-through"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {formatPrice(product.comparePrice, 'KES')}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 pt-0.5">
              <div className="flex gap-px">
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
              <span className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>
                ({product.reviewCount})
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}