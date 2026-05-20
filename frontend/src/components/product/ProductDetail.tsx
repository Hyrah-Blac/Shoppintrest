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
  const addItem = useCartStore((s) => s.addItem)
  const isSaved = useUserStore((s) => s.isSaved(id))
  const toggleSaveProduct = useUserStore((s) => s.toggleSaveProduct)

  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [collections, setCollections] = useState<any[]>([])
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    apiClient.products.getOne(id)
      .then(({ data }) => {
        setProduct(data.data)
        if (data.data?.variants?.length > 0) {
          const inStock = data.data.variants.find(
            (v: any) => v.inventory > 0
          )
          setSelectedSize(inStock?.size || data.data.variants[0].size)
        }
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setIsLoading(false))
  }, [id])

  useEffect(() => {
    if (isSignedIn) {
      apiClient.collections.getAll().then(({ data }) => {
        setCollections(data.data || [])
      }).catch(() => {})
    }
  }, [isSignedIn])

  const handleAddToCart = async () => {
    if (!isSignedIn) { toast.error('Sign in to add to cart'); return }
    if (!selectedSize) { toast.error('Please select a size'); return }
    setIsAddingToCart(true)
    try {
      await addItem(id, selectedSize, 1)
      toast.success('Added to cart')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add to cart')
    } finally {
      setIsAddingToCart(false)
    }
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
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  const selectedVariant = product?.variants?.find(
    (v: any) => v.size === selectedSize
  )
  const isOutOfStock =
    !selectedVariant || selectedVariant.inventory === 0

  if (isLoading) return null
  if (!product) return (
    <div className="container-wide py-32 text-center text-muted">
      Product not found
    </div>
  )

  return (
    <div className="container-wide py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-8">
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
          {/* Main Image */}
          <div
            className="relative aspect-[4/5] rounded-3xl overflow-hidden
                       bg-surface cursor-zoom-in select-none"
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
                            transform: 'scale(1.8)',
                            transition: 'transform 0.1s ease',
                          }
                        : {
                            transform: 'scale(1)',
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
                <button
                  onClick={() =>
                    setSelectedImage((p) =>
                      p === 0 ? product.images.length - 1 : p - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9
                             rounded-xl bg-background/90 flex items-center justify-center
                             text-foreground hover:bg-background transition-all shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setSelectedImage((p) =>
                      p === product.images.length - 1 ? 0 : p + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9
                             rounded-xl bg-background/90 flex items-center justify-center
                             text-foreground hover:bg-background transition-all shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isFeatured && (
                <Badge>Featured</Badge>
              )}
              {isOutOfStock && (
                <Badge variant="secondary">Sold Out</Badge>
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
                    'relative w-16 h-20 rounded-xl overflow-hidden shrink-0',
                    'border-2 transition-all duration-200',
                    i === selectedImage
                      ? 'border-foreground'
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

        {/* ── RIGHT: Info ── */}
        <div className="lg:sticky lg:top-28 lg:self-start space-y-6">
          {/* Brand + Actions */}
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={`/explore?brand=${product.brand}`}
                className="text-xs font-semibold uppercase tracking-widest
                           text-muted hover:text-foreground transition-colors"
              >
                {product.brand}
              </Link>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold
                             tracking-tight text-foreground mt-1 leading-snug">
                {product.title}
              </h1>
            </div>

            <div className="flex gap-2 shrink-0 ml-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  `w-10 h-10 rounded-xl flex items-center justify-center
                   border transition-all duration-200`,
                  isSaved
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted hover:text-foreground hover:border-foreground'
                )}
              >
                <Heart size={16} className={cn(isSaved && 'fill-current')} />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-xl flex items-center justify-center
                           border border-border text-muted hover:text-foreground
                           hover:border-foreground transition-all duration-200"
              >
                <Share2 size={16} />
              </button>
              {isSignedIn && (
                <div className="relative">
                  <button
                    onClick={() => setShowCollectionPicker(!showCollectionPicker)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                               border border-border text-muted hover:text-foreground
                               hover:border-foreground transition-all duration-200"
                  >
                    <Bookmark size={16} />
                  </button>

                  <AnimatePresence>
                    {showCollectionPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 z-20 w-56 bg-background
                                   border border-border rounded-2xl shadow-xl
                                   overflow-hidden"
                      >
                        <div className="p-3">
                          <p className="text-xs font-semibold text-muted px-2 pb-2">
                            Save to collection
                          </p>
                          {collections.length === 0 ? (
                            <Link
                              href="/collections/new"
                              className="block px-3 py-2.5 text-sm text-foreground
                                         hover:bg-accent rounded-xl transition-colors"
                            >
                              + Create collection
                            </Link>
                          ) : (
                            collections.map((col) => (
                              <button
                                key={col._id}
                                onClick={() => handleAddToCollection(col._id)}
                                className="w-full text-left px-3 py-2.5 text-sm
                                           text-foreground hover:bg-accent rounded-xl
                                           transition-colors truncate"
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
                    className={cn(
                      i < Math.round(product.rating)
                        ? 'text-foreground fill-current'
                        : 'text-border fill-current'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold">
              {formatPrice(product.price, 'KES')}
            </span>
            {product.comparePrice > product.price && (
              <>
                <span className="text-lg text-muted line-through">
                  {formatPrice(product.comparePrice, 'KES')}
                </span>
                <Badge variant="destructive" size="sm">
                  Save{' '}
                  {Math.round(
                    ((product.comparePrice - product.price) /
                      product.comparePrice) *
                      100
                  )}
                  %
                </Badge>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted leading-relaxed">
            {product.description}
          </p>

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Select Size
              </span>
              <button className="text-xs text-muted underline underline-offset-2
                                 hover:text-foreground transition-colors">
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants?.map((variant: any) => {
                const inStock = variant.inventory > 0
                const isSelected = selectedSize === variant.size
                return (
                  <button
                    key={variant.size}
                    onClick={() => inStock && setSelectedSize(variant.size)}
                    disabled={!inStock}
                    className={cn(
                      `relative h-11 min-w-[3rem] px-4 rounded-xl border text-sm
                       font-medium transition-all duration-200`,
                      isSelected
                        ? 'bg-foreground text-background border-foreground'
                        : inStock
                        ? 'border-border text-foreground hover:border-foreground'
                        : 'border-border text-muted opacity-40 cursor-not-allowed',
                      !inStock && 'line-through'
                    )}
                  >
                    {variant.size}
                    {inStock && variant.inventory <= 3 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500
                                       text-white text-2xs px-1 rounded-full">
                        {variant.inventory}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedVariant && (
              <p className="text-xs text-muted">
                {selectedVariant.inventory > 0
                  ? `${selectedVariant.inventory} in stock`
                  : 'Out of stock'}
              </p>
            )}
          </div>

          {/* Add to Cart */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="xl"
              className="flex-1 rounded-2xl"
              leftIcon={<ShoppingBag size={18} />}
              isLoading={isAddingToCart}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: '🔒', label: 'Secure Checkout', sub: 'M-Pesa protected' },
              { icon: '↩️', label: 'Free Returns', sub: 'Within 30 days' },
              { icon: '🚚', label: 'Fast Delivery', sub: 'Nairobi same day' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center p-3
                           rounded-xl bg-surface border border-border gap-1"
              >
                <span className="text-lg">{item.icon}</span>
                <p className="text-xs font-medium text-foreground leading-tight">
                  {item.label}
                </p>
                <p className="text-2xs text-muted">{item.sub}</p>
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
                  className="text-xs text-muted border border-border px-3 py-1
                             rounded-full hover:border-foreground hover:text-foreground
                             transition-all duration-200"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Seller */}
          {product.seller && (
            <div className="flex items-center gap-3 p-4 rounded-2xl
                            bg-surface border border-border">
              <Avatar
                src={product.seller.avatar}
                name={product.seller.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted">Sold by</p>
                <Link
                  href={`/profile/${product.seller.username}`}
                  className="text-sm font-medium text-foreground hover:opacity-70
                             transition-opacity"
                >
                  {product.seller.displayName}
                </Link>
              </div>
              {product.saves > 0 && (
                <div className="text-right">
                  <p className="text-sm font-semibold">{product.saves}</p>
                  <p className="text-2xs text-muted">saves</p>
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