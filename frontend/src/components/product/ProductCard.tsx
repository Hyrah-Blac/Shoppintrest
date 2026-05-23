'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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

        {/* ── Image Container — card-pin blueprint component ── */}
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
                  className="w-full h-full flex items-center justify-center
                              text-xs tracking-wide"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  No image
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Pinterest-style gradient overlay */}
          <div className="pin-overlay" />

          {/* Hover zones for multi-image swap */}
          {hasMany && isHovered && (
            <div className="absolute top-0 left-0 right-0 flex h-full z-10">
              {product.images.map((_: any, i: number) => (
                <div
                  key={i}
                  className="flex-1 cursor-pointer"
                  onMouseEnter={() => setCurrentImageIndex(i)}
                />
              ))}
            </div>
          )}

          {/* Image progress dots */}
          {hasMany && isHovered && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-20">
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
              <span
                className="badge"
                style={{
                  background: 'hsl(var(--destructive))',
                  color:      'white',
                }}
              >
                −{discount}%
              </span>
            )}
            {product.totalInventory === 0 && (
              <span
                className="badge badge-muted"
              >
                Sold Out
              </span>
            )}
          </div>

          {/* ── pin-actions (top-right) — blueprint overlay component ── */}
          <div className="pin-actions z-20">
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              aria-label="Save product"
              className={cn(
                'btn-glass w-9 h-9 p-0 flex items-center justify-center rounded-full',
                isSaved && 'text-[hsl(var(--accent))]'
              )}
              style={
                isSaved
                  ? { background: 'rgba(255,255,255,1)' }
                  : undefined
              }
            >
              <Heart size={14} className={cn(isSaved && 'fill-current')} />
            </button>

           {/* Quick view */}
<button
  type="button"
  onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/product/${product._id}`
  }}
  aria-label="View product"
  className="btn-glass w-9 h-9 p-0 flex items-center justify-center rounded-full"
>
  <Eye size={14} />
</button>
          </div>

          {/* ── pin-bottom-action — Quick Add ── */}
          {product.totalInventory > 0 && (
            <div className="pin-bottom-action z-20">
              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="btn-save w-full h-9 text-xs justify-center gap-2"
              >
                <ShoppingBag size={13} />
                {isAdding ? 'Adding…' : 'Quick Add'}
              </button>
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="mt-3.5 space-y-1 px-0.5">

          {/* Brand — eyebrow style */}
          {product.brand && (
            <p className="eyebrow">{product.brand}</p>
          )}

          {/* Title */}
          <p
            className="text-sm font-medium line-clamp-2 leading-snug"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {product.title}
          </p>

          {/* Price row */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="price">
              {formatPrice(product.price, 'KES')}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="price-original">
                {formatPrice(product.comparePrice, 'KES')}
              </span>
            )}
            {discount && (
              <span className="price-sale text-xs font-semibold">
                −{discount}%
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5">
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
              <span
                className="text-[10px]"
                style={{ color: 'hsl(var(--muted))' }}
              >
                ({product.reviewCount})
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}