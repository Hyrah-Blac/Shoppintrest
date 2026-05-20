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
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'

interface ProductCardProps {
  product: any
  priority?: boolean
  className?: string
}

export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const { isSignedIn } = useAuth()
  const isSaved = useUserStore((s) => s.isSaved(product._id))
  const toggleSaveProduct = useUserStore((s) => s.toggleSaveProduct)
  const addItem = useCartStore((s) => s.addItem)

  const [isHovered, setIsHovered] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const discount = calculateDiscount(product.price, product.comparePrice)
  const hasMultipleImages = product.images?.length > 1
  const defaultSize = product.variants?.[0]?.size

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isSignedIn) {
      toast.error('Sign in to save products')
      return
    }
    setIsSaving(true)
    try {
      await toggleSaveProduct(product._id)
      toast.success(isSaved ? 'Removed from saved' : 'Saved!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isSignedIn) {
      toast.error('Sign in to add to cart')
      return
    }
    if (!defaultSize) {
      toast.error('Please select a size on the product page')
      return
    }
    setIsAdding(true)
    try {
      await addItem(product._id, defaultSize, 1)
      toast.success('Added to cart')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('group relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setCurrentImageIndex(0)
      }}
    >
      <Link href={`/product/${product._id}`}>
        {/* Image Container */}
        <div className="relative overflow-hidden rounded-2xl bg-surface aspect-[3/4]">
          {/* Main Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {product.images?.[currentImageIndex]?.url ? (
                <Image
                  src={product.images[currentImageIndex].url}
                  alt={product.images[currentImageIndex].alt || product.title}
                  fill
                  className={cn(
                    'object-cover transition-transform duration-700',
                    isHovered && 'scale-105'
                  )}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={priority}
                />
              ) : (
                <div className="w-full h-full bg-surface flex items-center
                                justify-center text-muted text-sm">
                  No image
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Image dots nav */}
          {hasMultipleImages && isHovered && (
            <div className="absolute top-0 left-0 right-0 flex h-1.5 z-10">
              {product.images.map((_: any, i: number) => (
                <div
                  key={i}
                  className="flex-1 cursor-pointer"
                  onMouseEnter={() => setCurrentImageIndex(i)}
                />
              ))}
            </div>
          )}

          {/* Hover image indicators */}
          {hasMultipleImages && isHovered && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2
                            flex gap-1 z-10">
              {product.images.slice(0, 4).map((_: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    'w-1 h-1 rounded-full transition-all duration-200',
                    i === currentImageIndex
                      ? 'bg-white w-3'
                      : 'bg-white/60'
                  )}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.isFeatured && (
              <Badge size="sm" variant="default">
                Featured
              </Badge>
            )}
            {discount && (
              <Badge size="sm" variant="destructive">
                -{discount}%
              </Badge>
            )}
            {product.totalInventory === 0 && (
              <Badge size="sm" variant="secondary">
                Sold Out
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="absolute top-3 right-3 flex flex-col gap-2 z-10"
              >
                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={cn(
                    `w-9 h-9 rounded-xl flex items-center justify-center
                     transition-all duration-200 shadow-sm`,
                    isSaved
                      ? 'bg-foreground text-background'
                      : 'bg-background/90 text-foreground hover:bg-background'
                  )}
                  aria-label="Save product"
                >
                  <Heart
                    size={15}
                    className={cn(isSaved && 'fill-current')}
                  />
                </button>

                {/* Quick View */}
                <Link
                  href={`/product/${product._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 h-9 rounded-xl bg-background/90 text-foreground
                             hover:bg-background flex items-center justify-center
                             transition-all duration-200 shadow-sm"
                  aria-label="View product"
                >
                  <Eye size={15} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Add to Cart */}
          <AnimatePresence>
            {isHovered && product.totalInventory > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-3 left-3 right-3 z-10"
              >
                <button
                  onClick={handleQuickAdd}
                  disabled={isAdding}
                  className="w-full h-10 rounded-xl bg-background/95 backdrop-blur-sm
                             text-foreground text-xs font-medium flex items-center
                             justify-center gap-2 hover:bg-background transition-all
                             duration-200 shadow-sm"
                >
                  <ShoppingBag size={13} />
                  {isAdding ? 'Adding...' : 'Quick Add'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product Info */}
        <div className="mt-3 px-0.5 space-y-0.5">
          <p className="text-2xs text-muted uppercase tracking-wider font-medium">
            {product.brand}
          </p>
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {product.title}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-sm font-semibold text-foreground">
              {formatPrice(product.price, 'KES')}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-muted line-through">
                {formatPrice(product.comparePrice, 'KES')}
              </span>
            )}
          </div>
          {product.rating > 0 && (
            <div className="flex items-center gap-1 pt-0.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-2xs',
                      i < Math.round(product.rating)
                        ? 'text-foreground'
                        : 'text-border'
                    )}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-2xs text-muted">
                ({product.reviewCount})
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}