'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ShoppingBag, Share2, ChevronLeft,
  ChevronRight, Star, Bookmark,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ReviewSection } from '@/components/product/ReviewSection'

interface Props { id: string }

export function ProductDetail({ id }: Props) {
  const { isSignedIn }    = useAuth()
  const addItem           = useCartStore((s) => s.addItem)
  const isSaved           = useUserStore((s) => s.isSaved(id))
  const toggleSaveProduct = useUserStore((s) => s.toggleSaveProduct)

  const [product,             setProduct]             = useState<any>(null)
  const [isLoading,           setIsLoading]           = useState(true)
  const [selectedSize,        setSelectedSize]        = useState<string>('')
  const [selectedImage,       setSelectedImage]       = useState(0)
  const [isAddingToCart,      setIsAddingToCart]      = useState(false)
  const [isSaving,            setIsSaving]            = useState(false)
  const [isZoomed,            setIsZoomed]            = useState(false)
  const [zoomPos,             setZoomPos]             = useState({ x: 50, y: 50 })
  const [collections,         setCollections]         = useState<any[]>([])
  const [showCollectionPicker,setShowCollectionPicker]= useState(false)

  useEffect(() => {
    setIsLoading(true)
    apiClient.products.getOne(id)
      .then(({ data }) => {
        setProduct(data.data)
        if (data.data?.variants?.length > 0) {
          const inStock = data.data.variants.find((v: any) => v.inventory > 0)
          setSelectedSize(inStock?.size || data.data.variants[0].size)
        }
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setIsLoading(false))
  }, [id])

  useEffect(() => {
    if (isSignedIn) {
      apiClient.collections.getAll()
        .then(({ data }) => setCollections(data.data || []))
        .catch(() => {})
    }
  }, [isSignedIn])

  const handleAddToCart = async () => {
    if (!isSignedIn)   { toast.error('Sign in to add to cart'); return }
    if (!selectedSize) { toast.error('Please select a size');   return }
    setIsAddingToCart(true)
    try {
      await addItem(id, selectedSize, 1)
      toast.success('Added to cart')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add to cart')
    } finally { setIsAddingToCart(false) }
  }

  const handleSave = async () => {
    if (!isSignedIn) { toast.error('Sign in to save products'); return }
    setIsSaving(true)
    try {
      await toggleSaveProduct(id)
      toast.success(isSaved ? 'Removed from saved' : 'Saved!')
    } catch { toast.error('Something went wrong') }
    finally  { setIsSaving(false) }
  }

  const handleAddToCollection = async (collectionId: string) => {
    try {
      await apiClient.collections.toggleProduct(collectionId, id)
      toast.success('Collection updated')
      setShowCollectionPicker(false)
    } catch { toast.error('Could not update collection') }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: product?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setZoomPos({
      x: ((e.clientX - rect.left)  / rect.width)  * 100,
      y: ((e.clientY - rect.top)   / rect.height) * 100,
    })
  }

  const selectedVariant = product?.variants?.find((v: any) => v.size === selectedSize)
  const isOutOfStock    = !selectedVariant || selectedVariant.inventory === 0

  if (isLoading) return null
  if (!product)  return (
    <div className="container-wide py-32 text-center"
         style={{ color: 'hsl(var(--muted))' }}>
      Product not found
    </div>
  )

  return (
    <div className="container-wide py-8 lg:py-12">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 mb-8"
           style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted))' }}>
        {[
          { href: '/',                                   label: 'Home' },
          { href: '/explore',                            label: 'Explore' },
          { href: `/explore?category=${product.category}`, label: product.category, capitalize: true },
        ].map((crumb, i, arr) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <Link
              href={crumb.href}
              className={cn(
                'transition-colors duration-[var(--duration-hover)]',
                crumb.capitalize && 'capitalize'
              )}
              style={{ color: 'hsl(var(--muted))' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--muted))')}
            >
              {crumb.label}
            </Link>
            {i < arr.length - 1 && <span>/</span>}
          </span>
        ))}
        <span>/</span>
        <span
          className="truncate max-w-[200px]"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {product.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

        {/* ══════════════════════════════════════════════════
            LEFT — Images
        ══════════════════════════════════════════════════ */}
        <div className="space-y-3">

          {/* Main image */}
          <div
            className="relative aspect-[4/5] rounded-[var(--radius-2xl)] overflow-hidden
                       cursor-zoom-in select-none shadow-[var(--shadow-card)]"
            style={{ background: 'hsl(var(--surface))' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{   opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                {product.images?.[selectedImage]?.url && (
                  <Image
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].alt || product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    style={
                      isZoomed
                        ? {
                            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                            transform:       'scale(1.8)',
                            transition:      'transform 0.1s ease',
                          }
                        : {
                            transform:  'scale(1)',
                            transition: 'transform 0.3s ease',
                          }
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav arrows */}
            {product.images?.length > 1 && (
              <>
                {[
                  {
                    side: 'left',
                    icon: <ChevronLeft size={16} />,
                    onClick: () => setSelectedImage((p) =>
                      p === 0 ? product.images.length - 1 : p - 1),
                  },
                  {
                    side: 'right',
                    icon: <ChevronRight size={16} />,
                    onClick: () => setSelectedImage((p) =>
                      p === product.images.length - 1 ? 0 : p + 1),
                  },
                ].map(({ side, icon, onClick }) => (
                  <button
                    key={side}
                    onClick={onClick}
                    className="btn-glass absolute top-1/2 -translate-y-1/2 w-9 h-9 p-0
                               flex items-center justify-center rounded-full"
                    style={{ [side]: '1rem' }}
                  >
                    {icon}
                  </button>
                ))}
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.isFeatured && (
                <span className="badge badge-red">Featured</span>
              )}
              {isOutOfStock && (
                <span className="badge badge-muted">Sold Out</span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {product.images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'relative w-16 h-20 rounded-[var(--radius)] overflow-hidden shrink-0',
                    'border-2 transition-all duration-[var(--duration-hover)]',
                    i === selectedImage
                      ? 'border-[hsl(var(--accent))] shadow-[var(--shadow-red)]'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `Image ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT — Info
        ══════════════════════════════════════════════════ */}
        <div className="lg:sticky lg:top-28 lg:self-start space-y-6">

          {/* Brand + action icons */}
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={`/explore?brand=${product.brand}`}
                className="eyebrow hover:opacity-70 transition-opacity
                           duration-[var(--duration-hover)]"
              >
                {product.brand}
              </Link>
              <h1
                className="font-display font-bold tracking-[-0.03em] leading-[1.1] mt-1"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
              >
                {product.title}
              </h1>
            </div>

            <div className="flex gap-2 shrink-0 ml-4">
              {/* Save */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-icon"
                style={isSaved ? {
                  background:  'hsl(var(--foreground))',
                  color:       'hsl(var(--background))',
                  borderColor: 'hsl(var(--foreground))',
                } : undefined}
                aria-label="Save product"
              >
                <Heart size={16} className={cn(isSaved && 'fill-current')} />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="btn-icon"
                aria-label="Share"
              >
                <Share2 size={16} />
              </button>

              {/* Collection picker */}
              {isSignedIn && (
                <div className="relative">
                  <button
                    onClick={() => setShowCollectionPicker(!showCollectionPicker)}
                    className="btn-icon"
                    aria-label="Add to collection"
                  >
                    <Bookmark size={16} />
                  </button>

                  <AnimatePresence>
                    {showCollectionPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{   opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="glass-surface absolute right-0 top-12 z-20 w-56
                                   rounded-[var(--radius-lg)] overflow-hidden"
                      >
                        <div className="p-3">
                          <p
                            className="text-xs font-semibold px-2 pb-2"
                            style={{ color: 'hsl(var(--muted))' }}
                          >
                            Save to collection
                          </p>
                          {collections.length === 0 ? (
                            <Link
                              href="/collections/new"
                              className="block px-3 py-2.5 text-sm rounded-[var(--radius-sm)]
                                         transition-colors duration-[var(--duration-hover)]"
                              style={{ color: 'hsl(var(--foreground))' }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = 'hsl(var(--accent-muted))')}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = 'transparent')}
                            >
                              + Create collection
                            </Link>
                          ) : (
                            collections.map((col) => (
                              <button
                                key={col._id}
                                onClick={() => handleAddToCollection(col._id)}
                                className="w-full text-left px-3 py-2.5 text-sm
                                           rounded-[var(--radius-sm)] truncate
                                           transition-colors duration-[var(--duration-hover)]"
                                style={{ color: 'hsl(var(--foreground))' }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = 'hsl(var(--accent-muted))')}
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = 'transparent')}
                              >
                                {col.title}
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    style={{
                      color: i < Math.round(product.rating)
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--border))',
                      fill: 'currentColor',
                    }}
                  />
                ))}
              </div>
              <span
                className="text-sm"
                style={{ color: 'hsl(var(--muted))' }}
              >
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span
              className="font-display font-bold tracking-[-0.03em]"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
            >
              {formatPrice(product.price, 'KES')}
            </span>
            {product.comparePrice > product.price && (
              <>
                <span className="price-original text-lg">
                  {formatPrice(product.comparePrice, 'KES')}
                </span>
                <span className="badge badge-red">
                  Save {Math.round(
                    ((product.comparePrice - product.price) / product.comparePrice) * 100
                  )}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
          >
            {product.description}
          </p>

          {/* Size selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Select Size
              </span>
              <button
                className="text-xs underline underline-offset-2
                           transition-colors duration-[var(--duration-hover)]"
                style={{ color: 'hsl(var(--muted))' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'hsl(var(--muted))')}
              >
                Size Guide
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.variants?.map((variant: any) => {
                const inStock    = variant.inventory > 0
                const isSelected = selectedSize === variant.size
                return (
                  <button
                    key={variant.size}
                    onClick={() => inStock && setSelectedSize(variant.size)}
                    disabled={!inStock}
                    className={cn(
                      'relative h-11 min-w-[3rem] px-4 rounded-[var(--radius-pill)]',
                      'border text-sm font-medium',
                      'transition-all duration-[var(--duration-hover)]',
                      isSelected
                        ? 'border-[hsl(var(--accent))] shadow-[var(--shadow-red)]'
                        : inStock
                          ? 'border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))]'
                          : 'border-[hsl(var(--border))] opacity-40 cursor-not-allowed line-through',
                    )}
                    style={
                      isSelected
                        ? {
                            background: 'hsl(var(--accent))',
                            color:      'hsl(var(--accent-foreground))',
                          }
                        : {
                            color: inStock
                              ? 'hsl(var(--foreground))'
                              : 'hsl(var(--muted))',
                          }
                    }
                  >
                    {variant.size}
                    {inStock && variant.inventory <= 3 && (
                      <span
                        className="badge badge-red absolute -top-1.5 -right-1.5"
                        style={{ fontSize: '0.5rem', padding: '0.1rem 0.35rem' }}
                      >
                        {variant.inventory}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedVariant && (
              <p
                className="text-xs"
                style={{ color: 'hsl(var(--muted))' }}
              >
                {selectedVariant.inventory > 0
                  ? `${selectedVariant.inventory} in stock`
                  : 'Out of stock'}
              </p>
            )}
          </div>

          {/* Add to Cart */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              className={cn(
                'btn-save flex-1 gap-2.5 py-4 text-sm justify-center',
                (isOutOfStock || isAddingToCart) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ShoppingBag size={18} />
              {isAddingToCart
                ? 'Adding…'
                : isOutOfStock
                  ? 'Out of Stock'
                  : 'Add to Cart'}
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: '🔒', label: 'Secure Checkout', sub: 'M-Pesa protected' },
              { icon: '↩️', label: 'Free Returns',    sub: 'Within 30 days'   },
              { icon: '🚚', label: 'Fast Delivery',   sub: 'Nairobi same day' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center p-3
                           rounded-[var(--radius)] gap-1
                           border shadow-[var(--shadow-card)]"
                style={{
                  background:  'hsl(var(--surface))',
                  borderColor: 'hsl(var(--border))',
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <p
                  className="text-xs font-medium leading-tight"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {item.label}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {item.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {product.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/explore?q=${tag}`}
                  className="pill text-xs px-3 py-1"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Seller */}
          {product.seller && (
            <div
              className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)]
                         border shadow-[var(--shadow-card)]"
              style={{
                background:  'hsl(var(--surface))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <Avatar
                src={product.seller.avatar}
                name={product.seller.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  Sold by
                </p>
                <Link
                  href={`/profile/${product.seller.username}`}
                  className="text-sm font-medium transition-opacity
                             duration-[var(--duration-hover)] hover:opacity-70"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {product.seller.displayName}
                </Link>
              </div>
              {product.saves > 0 && (
                <div className="text-right">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {product.saves}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    saves
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      <div className="mt-20">
        <ReviewSection productId={id} />
      </div>
    </div>
  )
}