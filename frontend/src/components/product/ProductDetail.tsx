'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ShoppingBag, Share2, ChevronLeft,
  ChevronRight, Star, Check, Bookmark,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { formatPrice, formatRelativeTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ReviewSection } from '@/components/product/ReviewSection'

interface Props { id: string }

export function ProductDetail({ id }: Props) {
  const { isSignedIn } = useAuth()
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
    if (!selectedSize) { toast.error('Please select a size');  return }
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
    finally { setIsSaving(false) }
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
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    })
  }

  const selectedVariant = product?.variants?.find((v: any) => v.size === selectedSize)
  const isOutOfStock    = !selectedVariant || selectedVariant.inventory === 0

  if (isLoading) return null
  if (!product) return (
    <div className="container-wide py-32 text-center" style={{ color: 'hsl(var(--muted))' }}>
      Product not found
    </div>
  )

  return (
    <div className="container-wide py-8 lg:py-12">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs mb-8" style={{ color: 'hsl(var(--muted))' }}>
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link>
        <span>/</span>
        <Link
          href={`/explore?category=${product.category}`}
          className="hover:text-foreground transition-colors capitalize"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

        {/* ── LEFT: Images ── */}
        <div className="space-y-3">
          {/* Main image */}
          <div
            className="relative aspect-[4/5] overflow-hidden bg-surface cursor-zoom-in select-none"
            style={{ borderRadius: 'var(--radius-2xl)' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
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
                        ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(1.8)', transition: 'transform 0.1s ease' }
                        : { transform: 'scale(1)', transition: 'transform 0.3s ease' }
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Arrows */}
            {product.images?.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((p) => p === 0 ? product.images.length - 1 : p - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9
                             rounded-full flex items-center justify-center
                             transition-all shadow-sm hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setSelectedImage((p) => p === product.images.length - 1 ? 0 : p + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9
                             rounded-full flex items-center justify-center
                             transition-all shadow-sm hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.isFeatured && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full
                             text-[11px] font-bold text-white"
                  style={{ background: 'hsl(var(--accent))' }}
                >
                  Featured
                </span>
              )}
              {isOutOfStock && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full
                             text-[11px] font-semibold text-white"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                >
                  Sold Out
                </span>
              )}
            </div>

            {/* Pinterest-style save button on image */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-save text-xs px-4 py-1.5"
              >
                {isSaved ? '✓ Saved' : 'Save'}
              </button>
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
                    'relative w-16 h-20 shrink-0 overflow-hidden transition-all duration-200',
                    i === selectedImage
                      ? 'ring-2 opacity-100'
                      : 'opacity-55 hover:opacity-80'
                  )}
                  style={{
                    borderRadius: 'var(--radius)',
                    outline: i === selectedImage ? '2px solid hsl(var(--foreground))' : 'none',
                    outlineOffset: '2px',
                  }}
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

        {/* ── RIGHT: Info ── */}
        <div className="lg:sticky lg:top-28 lg:self-start space-y-5">

          {/* Brand + action row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href={`/explore?brand=${product.brand}`}
                className="text-xs font-bold uppercase tracking-widest
                           transition-colors hover:opacity-70"
                style={{ color: 'hsl(var(--accent))' }}
              >
                {product.brand}
              </Link>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight
                           text-foreground mt-1 leading-snug"
              >
                {product.title}
              </h1>
            </div>

            {/* Icon buttons */}
            <div className="flex gap-2 shrink-0">
              <IconBtn onClick={handleShare} label="Share">
                <Share2 size={15} />
              </IconBtn>

              {isSignedIn && (
                <div className="relative">
                  <IconBtn
                    onClick={() => setShowCollectionPicker(!showCollectionPicker)}
                    label="Add to collection"
                  >
                    <Bookmark size={15} />
                  </IconBtn>

                  <AnimatePresence>
                    {showCollectionPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 z-20 w-56 border shadow-xl overflow-hidden"
                        style={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius-xl)',
                        }}
                      >
                        <div className="p-3">
                          <p className="text-xs font-semibold px-2 pb-2"
                             style={{ color: 'hsl(var(--muted))' }}>
                            Save to collection
                          </p>
                          {collections.length === 0 ? (
                            <Link
                              href="/collections/new"
                              className="block px-3 py-2.5 text-sm text-foreground
                                         hover:bg-background-secondary transition-colors"
                              style={{ borderRadius: 'var(--radius)' }}
                            >
                              + Create collection
                            </Link>
                          ) : (
                            collections.map((col) => (
                              <button
                                key={col._id}
                                onClick={() => handleAddToCollection(col._id)}
                                className="w-full text-left px-3 py-2.5 text-sm
                                           text-foreground hover:bg-background-secondary
                                           transition-colors truncate"
                                style={{ borderRadius: 'var(--radius)' }}
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
              <div className="flex gap-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    style={{
                      color: i < Math.round(product.rating)
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--border))',
                      fill: 'currentColor',
                    }}
                  />
                ))}
              </div>
              <span className="text-sm" style={{ color: 'hsl(var(--muted))' }}>
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {formatPrice(product.price, 'KES')}
            </span>
            {product.comparePrice > product.price && (
              <>
                <span className="text-lg line-through" style={{ color: 'hsl(var(--muted))' }}>
                  {formatPrice(product.comparePrice, 'KES')}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'hsl(var(--accent))' }}
                >
                  Save {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted))' }}>
            {product.description}
          </p>

          {/* Size selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Size</span>
              <button
                className="text-xs underline underline-offset-2 transition-colors hover:opacity-70"
                style={{ color: 'hsl(var(--muted))' }}
              >
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants?.map((variant: any) => {
                const inStock   = variant.inventory > 0
                const isSelected = selectedSize === variant.size
                return (
                  <button
                    key={variant.size}
                    onClick={() => inStock && setSelectedSize(variant.size)}
                    disabled={!inStock}
                    className={cn(
                      'relative h-11 min-w-[3rem] px-4 text-sm font-semibold transition-all duration-200',
                      !inStock && 'line-through opacity-35 cursor-not-allowed'
                    )}
                    style={{
                      borderRadius: 'var(--radius)',
                      border: isSelected
                        ? '2px solid hsl(var(--foreground))'
                        : '1.5px solid hsl(var(--border))',
                      background: isSelected
                        ? 'hsl(var(--foreground))'
                        : 'transparent',
                      color: isSelected
                        ? 'hsl(var(--background))'
                        : 'hsl(var(--foreground))',
                    }}
                  >
                    {variant.size}
                    {inStock && variant.inventory <= 3 && (
                      <span
                        className="absolute -top-1.5 -right-1.5 text-white
                                   text-[9px] font-bold px-1 rounded-full"
                        style={{ background: 'hsl(var(--accent))' }}
                      >
                        {variant.inventory}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedVariant && (
              <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>
                {selectedVariant.inventory > 0
                  ? `${selectedVariant.inventory} in stock`
                  : 'Out of stock'}
              </p>
            )}
          </div>

          {/* Add to cart */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              className="flex-1 h-12 rounded-[var(--radius-pill)] text-sm font-bold
                         flex items-center justify-center gap-2.5
                         transition-all duration-200 disabled:opacity-50"
              style={{
                background: isOutOfStock ? 'hsl(var(--border))' : 'hsl(var(--accent))',
                color: 'white',
                boxShadow: isOutOfStock ? 'none' : '0 4px 16px hsl(var(--accent) / 0.35)',
              }}
            >
              <ShoppingBag size={17} />
              {isAddingToCart ? 'Adding…' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-12 h-12 rounded-[var(--radius-pill)] flex items-center
                         justify-center border-2 transition-all duration-200 hover:scale-105"
              style={{
                borderColor: isSaved ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                background: isSaved ? 'hsl(var(--accent-muted))' : 'transparent',
                color: isSaved ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
              }}
              aria-label="Save product"
            >
              <Heart size={16} className={cn(isSaved && 'fill-current')} />
            </button>
          </div>

          {/* Trust badges */}
          <div
            className="grid grid-cols-3 gap-3 p-4 rounded-[var(--radius-xl)]"
            style={{ background: 'hsl(var(--background-secondary))' }}
          >
            {[
              { icon: '🔒', label: 'Secure Checkout', sub: 'M-Pesa protected' },
              { icon: '↩️', label: 'Free Returns',    sub: 'Within 30 days' },
              { icon: '🚚', label: 'Fast Delivery',   sub: 'Nairobi same day' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center gap-1">
                <span className="text-lg">{item.icon}</span>
                <p className="text-xs font-semibold text-foreground leading-tight">{item.label}</p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/explore?q=${tag}`}
                  className="text-xs px-3 py-1 rounded-full border transition-all duration-200
                             hover:border-foreground hover:text-foreground"
                  style={{
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--muted))',
                  }}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Seller card */}
          {product.seller && (
            <div
              className="flex items-center gap-3 p-4 rounded-[var(--radius-xl)] border"
              style={{
                background: 'hsl(var(--background-secondary))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <Avatar
                src={product.seller.avatar}
                name={product.seller.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Sold by</p>
                <Link
                  href={`/profile/${product.seller.username}`}
                  className="text-sm font-semibold text-foreground hover:opacity-70 transition-opacity"
                >
                  {product.seller.displayName}
                </Link>
              </div>
              {product.saves > 0 && (
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{product.saves}</p>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>saves</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-20">
        <ReviewSection productId={id} />
      </div>
    </div>
  )
}

/* ── Small helper ── */
function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-10 h-10 rounded-full flex items-center justify-center
                 border transition-all duration-200 hover:scale-105"
      style={{
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--muted))',
        background: 'hsl(var(--background-secondary))',
      }}
    >
      {children}
    </button>
  )
}