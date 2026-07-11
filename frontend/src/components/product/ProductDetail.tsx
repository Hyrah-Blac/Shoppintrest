'use client'

/**
 * ProductDetail — v3 · Shoppin
 *
 * v2 → v3:
 *  - Removed the "save to collection" feature entirely (collections picker,
 *    BookmarkPlus button, Collection interface, apiClient.collections calls,
 *    showCollectionPicker state)
 *  - CLOTHING_CATEGORIES now matches the actual Product category enum
 *    (womenswear, menswear) — size guide only renders for those
 *
 * v1 → v2:
 *  - Full TypeScript — no any types
 *  - err: any → err: unknown with proper cast
 *  - Accent removed from: save button, rating stars, sale price, discount badge
 *    shadow, thumbnail border, size selector, trust icons, collection hover,
 *    seller link hover, size guide modal (Ruler icon, table cells, info box)
 *  - Sale price: foreground bold (price conveys urgency; color is unnecessary)
 *  - Save button saved: foreground bg + background text (matches ProductCard)
 *  - Thumbnail selected: foreground border, no shadow-red
 *  - Size selector selected: foreground bg + background text
 *  - Trust badge icons: muted (decorative, not actionable)
 *  - Featured badge: glass pill (matches ProductCard v2)
 *  - Size guide: only shown for clothing categories (hassizing allowlist)
 *  - Seller link hover: foreground (was accent)
 *  - Size guide: accent stripped throughout, table size column → foreground bold
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ShoppingBag, ArrowUpRight, ChevronLeft, ChevronRight,
  Package, RotateCcw, Zap, X, Ruler,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { formatPrice, cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { ReviewSection } from '@/components/product/ReviewSection'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductImage {
  url: string
  alt?: string
}

interface ProductVariant {
  size:      string
  inventory: number
  price?:    number  // overrides the product's base price for this size only
}

interface Seller {
  _id:         string
  username:    string
  displayName: string
  avatar?:     string
}

interface Product {
  _id:          string
  title:        string
  price:        number
  comparePrice?: number
  brand?:       string
  category?:    string
  description?: string
  isFeatured?:  boolean
  totalInventory?: number
  rating?:      number
  reviewCount?: number
  saves?:       number
  tags?:        string[]
  images?:      ProductImage[]
  variants?:    ProductVariant[]
  seller?:      Seller
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Categories for which a size guide is relevant.
 * Matches the Product schema's category enum — apparel categories
 * (womenswear, menswear) use garment sizing, shoes use EU foot sizing.
 * Bags, jewelry, accessories, beauty, and home goods don't get a guide.
 */
const CLOTHING_CATEGORIES = new Set(['womenswear', 'menswear'])
const SHOE_CATEGORIES     = new Set(['shoes'])
const SIZED_CATEGORIES    = new Set([...CLOTHING_CATEGORIES, ...SHOE_CATEGORIES])

const hassizing = (category?: string) =>
  category ? SIZED_CATEGORIES.has(category.toLowerCase()) : false

const isShoeCategory = (category?: string) =>
  category ? SHOE_CATEGORIES.has(category.toLowerCase()) : false

// ─── ProductDetail ────────────────────────────────────────────────────────────

interface Props { id: string }

export function ProductDetail({ id }: Props) {
  const { isSignedIn }    = useAuth()
  const addItem           = useCartStore((s) => s.addItem)
  const isSaved           = useUserStore((s) => s.isSaved(id))
  const toggleSaveProduct = useUserStore((s) => s.toggleSaveProduct)

  const [product,        setProduct]        = useState<Product | null>(null)
  const [isLoading,      setIsLoading]      = useState(true)
  const [selectedSize,   setSelectedSize]   = useState<string>('')
  const [selectedImage,  setSelectedImage]  = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSaving,       setIsSaving]       = useState(false)
  const [isZoomed,       setIsZoomed]       = useState(false)
  const [zoomPos,        setZoomPos]        = useState({ x: 50, y: 50 })
  const [showSizeGuide,  setShowSizeGuide]  = useState(false)

  useEffect(() => {
    setIsLoading(true)
    apiClient.products.getOne(id)
      .then(({ data }) => {
        const p: Product = data.data
        setProduct(p)
        if (p?.variants && p.variants.length > 0) {
          const inStock = p.variants.find((v) => v.inventory > 0)
          setSelectedSize(inStock?.size || p.variants[0].size)
        }
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleAddToCart = async () => {
    if (!isSignedIn)   { toast.error('Sign in to add to cart'); return }
    if (!selectedSize) { toast.error('Please select a size');   return }
    setIsAddingToCart(true)
    try {
      await addItem(id, selectedSize, 1)
      toast.success('Added to cart')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Could not add to cart')
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

  const selectedVariant = product?.variants?.find((v) => v.size === selectedSize)
  const isOutOfStock    = !selectedVariant || selectedVariant.inventory === 0

  // Some categories (e.g. framed art: A5 vs A1) price each size differently.
  // When any variant carries its own price, the selected size's price wins;
  // otherwise everything shares the product's base price as before.
  const hasPerSizePricing = product?.variants?.some((v) => v.price != null) ?? false
  const effectivePrice    = selectedVariant?.price ?? product?.price ?? 0

  // "Compare at" pricing only makes sense against a single base price — a
  // per-size override doesn't carry its own compare price in this schema.
  const discount = !hasPerSizePricing && product?.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  const showSizeGuideBtn = hassizing(product?.category)

  if (isLoading) return null
  if (!product) return (
    <div
      className="container-wide py-32 text-center"
      style={{ color: 'hsl(var(--muted))' }}
    >
      Product not found
    </div>
  )

  return (
    <div className="container-wide py-8 lg:py-12">

      {/* ── Breadcrumb ── */}
      <nav
        className="flex items-center gap-1.5 mb-10"
        style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted))' }}
        aria-label="Breadcrumb"
      >
        {[
          { href: '/',                                      label: 'Home'           },
          { href: '/explore',                               label: 'Explore'        },
          { href: `/explore?category=${product.category}`, label: product.category,
            capitalize: true                                                         },
        ].map((crumb, i, arr) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <Link
              href={crumb.href}
              className={cn(
                'hover:text-[hsl(var(--foreground))] transition-colors',
                'duration-[var(--duration-hover)]',
                crumb.capitalize && 'capitalize'
              )}
            >
              {crumb.label}
            </Link>
            {i < arr.length - 1 && (
              <span style={{ color: 'hsl(var(--border))' }}>/</span>
            )}
          </span>
        ))}
        <span style={{ color: 'hsl(var(--border))' }}>/</span>
        <span
          className="truncate max-w-[200px]"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {product.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-20">

        {/* ── Left: Images ── */}
        <div className="space-y-3">

          {/* Main image */}
          <div
            className="relative aspect-[4/5] overflow-hidden cursor-zoom-in select-none"
            style={{
              background:   'hsl(var(--surface))',
              borderRadius: 'var(--radius-2xl)',
              boxShadow:    'var(--shadow-card)',
            }}
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
                        ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(1.8)', transition: 'transform 0.1s ease' }
                        : { transform: 'scale(1)', transition: 'transform 0.3s ease' }
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Sold out ribbon */}
            {isOutOfStock && (
              <div
                className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
                style={{ borderRadius: 'var(--radius-2xl)' }}
              >
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.22)' }} />
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    top: '14%', right: '-28%', width: '90%', padding: '0.45rem 0',
                    background: 'rgba(12,12,12,0.82)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    transform: 'rotate(35deg)',
                    borderTop: '0.5px solid rgba(255,255,255,0.12)',
                    borderBottom: '0.5px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Sold Out
                  </span>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.isFeatured && (
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 9px', borderRadius: '100px',
                    fontSize: '9px', fontWeight: 500,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    color: 'rgba(255,255,255,0.9)',
                    border: '0.5px solid rgba(255,255,255,0.2)',
                  }}
                >
                  Featured
                </span>
              )}
              {discount && !isOutOfStock && (
                <span className="badge badge-red">−{discount}%</span>
              )}
            </div>

            {/* Nav arrows */}
            {(product.images?.length ?? 0) > 1 && (
              <>
                {[
                  { side: 'left'  as const, icon: <ChevronLeft  size={16} />, onClick: () => setSelectedImage((p) => p === 0 ? (product.images!.length - 1) : p - 1) },
                  { side: 'right' as const, icon: <ChevronRight size={16} />, onClick: () => setSelectedImage((p) => p === product.images!.length - 1 ? 0 : p + 1) },
                ].map(({ side, icon, onClick }) => (
                  <button
                    key={side}
                    onClick={onClick}
                    className="absolute top-1/2 -translate-y-1/2 w-9 h-9
                               flex items-center justify-center rounded-full
                               transition-all duration-[var(--duration-hover)]"
                    aria-label={side === 'left' ? 'Previous image' : 'Next image'}
                    style={{
                      [side]: '1rem',
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Thumbnails */}
          {(product.images?.length ?? 0) > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {product.images!.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className="relative w-16 h-20 shrink-0 overflow-hidden transition-all duration-[var(--duration-hover)]"
                  style={{
                    borderRadius: 'var(--radius)',
                    border:       `2px solid ${i === selectedImage ? 'hsl(var(--foreground))' : 'transparent'}`,
                    opacity:      i === selectedImage ? 1 : 0.5,
                  }}
                >
                  <Image src={img.url} alt={img.alt || `Image ${i + 1}`} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Info ── */}
        <div className="lg:sticky lg:top-28 lg:self-start space-y-7">

          {/* Brand + actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {product.brand && (
                <Link
                  href={`/explore?brand=${product.brand}`}
                  className="eyebrow hover:opacity-70 transition-opacity duration-[var(--duration-hover)]"
                >
                  {product.brand}
                </Link>
              )}
              <h1
                className="font-display font-bold tracking-[-0.03em] leading-[1.1] mt-1.5"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                {product.title}
              </h1>
            </div>

            <div className="flex gap-1.5 shrink-0">
              {/* Save */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleSave}
                disabled={isSaving}
                aria-label={isSaved ? 'Remove from saved' : 'Save product'}
                className="w-10 h-10 flex items-center justify-center rounded-full
                           transition-all duration-[var(--duration-hover)]"
                style={isSaved ? {
                  background: 'hsl(var(--foreground))',
                  color:      'hsl(var(--background))',
                  border:     '1px solid hsl(var(--foreground))',
                } : {
                  background: 'hsl(var(--background-secondary))',
                  border:     '1px solid hsl(var(--border))',
                  color:      'hsl(var(--muted))',
                }}
              >
                <Heart size={16} className={cn(isSaved && 'fill-current')} />
              </motion.button>

              {/* Share */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleShare}
                aria-label="Share"
                className="w-10 h-10 flex items-center justify-center rounded-full
                           transition-all duration-[var(--duration-hover)]"
                style={{
                  background: 'hsl(var(--background-secondary))',
                  border:     '1px solid hsl(var(--border))',
                  color:      'hsl(var(--muted))',
                }}
              >
                <ArrowUpRight size={16} />
              </motion.button>
            </div>
          </div>

          {/* Rating — dots, consistent with ProductCard */}
          {(product.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width:        i < Math.round(product.rating!) ? '5px' : '4px',
                    height:       i < Math.round(product.rating!) ? '5px' : '4px',
                    borderRadius: '50%',
                    background:   i < Math.round(product.rating!)
                      ? 'hsl(var(--foreground))'
                      : 'hsl(var(--border))',
                    flexShrink: 0,
                  }}
                />
              ))}
              {(product.reviewCount ?? 0) > 0 && (
                <span className="ml-1.5 text-[11px]" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              {discount ? (
                <>
                  <span
                    className="font-display font-bold tracking-[-0.03em]"
                    style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', color: 'hsl(var(--foreground))' }}
                  >
                    {formatPrice(product.price, 'KES')}
                  </span>
                  <span
                    style={{
                      fontSize: '1.05rem', fontWeight: 400,
                      color: 'hsl(var(--muted))',
                      textDecoration: 'line-through',
                      textDecorationColor: 'hsl(var(--muted) / 0.5)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {formatPrice(product.comparePrice, 'KES')}
                  </span>
                  <span className="badge badge-red">−{discount}%</span>
                </>
              ) : (
                <span
                  className="font-display font-bold tracking-[-0.03em]"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
                >
                  {formatPrice(effectivePrice, 'KES')}
                </span>
              )}
            </div>
            {hasPerSizePricing && (
              <p className="text-xs" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                Price shown is for {selectedSize || 'the selected size'}
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300, lineHeight: 1.75 }}
            >
              {product.description}
            </p>
          )}

          {/* Size selector — only for clothing */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  Size
                </span>
                {/* Size guide only for clothing categories */}
                {showSizeGuideBtn && (
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center gap-1 text-xs underline underline-offset-2
                               hover:text-[hsl(var(--foreground))]
                               transition-colors duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    <Ruler size={11} />
                    Size guide
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const inStock    = variant.inventory > 0
                  const isSelected = selectedSize === variant.size
                  return (
                    <button
                      key={variant.size}
                      onClick={() => inStock && setSelectedSize(variant.size)}
                      disabled={!inStock}
                      className={cn(
                        'relative min-w-[3rem] px-4 text-sm font-medium',
                        hasPerSizePricing ? 'h-auto min-h-11 py-2' : 'h-11',
                        'transition-all duration-[var(--duration-hover)]',
                        !inStock && 'cursor-not-allowed',
                      )}
                      style={{
                        borderRadius: 'var(--radius-pill)',
                        border:       isSelected
                          ? '1.5px solid hsl(var(--foreground))'
                          : inStock
                            ? '1.5px solid hsl(var(--border))'
                            : '1.5px solid hsl(var(--border-subtle))',
                        background: isSelected ? 'hsl(var(--foreground))' : 'transparent',
                        color:      isSelected
                          ? 'hsl(var(--background))'
                          : inStock
                            ? 'hsl(var(--foreground))'
                            : 'hsl(var(--muted))',
                        opacity:        !inStock ? 0.4 : 1,
                        textDecoration: !inStock ? 'line-through' : 'none',
                      }}
                    >
                      {hasPerSizePricing ? (
                        <span className="flex flex-col items-center leading-tight">
                          <span>{variant.size}</span>
                          <span
                            className="text-[10px] font-normal mt-0.5"
                            style={{ opacity: 0.75, textDecoration: 'none' }}
                          >
                            {formatPrice(variant.price ?? product.price, 'KES')}
                          </span>
                        </span>
                      ) : (
                        variant.size
                      )}
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
                  style={{
                    color: selectedVariant.inventory > 0
                      ? selectedVariant.inventory <= 5
                        ? 'hsl(var(--warning))'
                        : 'hsl(var(--success))'
                      : 'hsl(var(--destructive))',
                  }}
                >
                  {selectedVariant.inventory > 0
                    ? selectedVariant.inventory <= 5
                      ? `Only ${selectedVariant.inventory} left`
                      : `${selectedVariant.inventory} in stock`
                    : 'Out of stock'}
                </p>
              )}
            </div>
          )}

          {/* Add to cart */}
          <div className="flex gap-3 pt-1">
            <motion.button
              whileTap={{ scale: isOutOfStock ? 1 : 0.97 }}
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              className={cn(
                'btn-save flex-1 gap-2.5 py-4 text-sm justify-center',
                (isOutOfStock || isAddingToCart) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ShoppingBag size={17} />
              {isAddingToCart ? 'Adding…' : isOutOfStock ? 'Out of stock' : 'Add to cart'}
            </motion.button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: <Package  size={16} />, label: 'Secure checkout', sub: 'M-Pesa protected'  },
              { icon: <RotateCcw size={16} />, label: 'Free returns',   sub: 'Within 30 days'    },
              { icon: <Zap      size={16} />, label: 'Fast delivery',   sub: 'Nairobi same day'  },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center p-3 gap-2"
                style={{
                  background:   'hsl(var(--surface))',
                  borderRadius: 'var(--radius)',
                  border:       '1px solid hsl(var(--border))',
                }}
              >
                {/* Icon: muted — decorative, not actionable */}
                <span style={{ color: 'hsl(var(--muted))' }}>{item.icon}</span>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                  {item.label}
                </p>
                <p className="text-[10px] leading-snug" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                  {item.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {(product.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags!.map((tag) => (
                <Link key={tag} href={`/explore?q=${tag}`} className="pill text-xs px-3 py-1">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Seller */}
          {product.seller && (
            <div
              className="flex items-center gap-3 p-4"
              style={{
                background:   'hsl(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border:       '1px solid hsl(var(--border))',
              }}
            >
              <Avatar src={product.seller.avatar} name={product.seller.displayName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'hsl(var(--muted))' }}>
                  Sold by
                </p>
                <Link
                  href={`/profile/${product.seller.username}`}
                  className="text-sm font-semibold flex items-center gap-1 mt-0.5
                             hover:text-[hsl(var(--foreground))] opacity-80 hover:opacity-100
                             transition-opacity duration-[var(--duration-hover)]"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {product.seller.displayName}
                  <ArrowUpRight size={12} style={{ opacity: 0.5 }} />
                </Link>
              </div>
              {(product.saves ?? 0) > 0 && (
                <div className="text-right pl-3" style={{ borderLeft: '1px solid hsl(var(--border))' }}>
                  <p className="text-base font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                    {product.saves}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: 'hsl(var(--muted))' }}>
                    saves
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Size Guide Modal — only rendered for clothing ── */}
      {showSizeGuideBtn && (
        <AnimatePresence>
          {showSizeGuide && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                onClick={() => setShowSizeGuide(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                exit={{   opacity: 0, scale: 0.95, y: 16  }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ pointerEvents: 'none' }}
              >
                <div
                  className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide"
                  style={{
                    background:    'hsl(var(--surface-elevated))',
                    borderRadius:  'var(--radius-2xl)',
                    border:        '1px solid hsl(var(--border))',
                    boxShadow:     'var(--shadow-float)',
                    pointerEvents: 'auto',
                  }}
                >
                  {/* Modal header */}
                  <div
                    className="sticky top-0 flex items-center justify-between px-6 py-5"
                    style={{
                      background:   'hsl(var(--surface-elevated))',
                      borderBottom: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
                    }}
                  >
                    <div>
                      <p className="eyebrow mb-1">Sizing</p>
                      <h3 className="font-display font-bold tracking-tight" style={{ fontSize: '1.25rem' }}>
                        Size guide
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowSizeGuide(false)}
                      className="w-9 h-9 flex items-center justify-center rounded-full
                                 transition-colors duration-[var(--duration-hover)]
                                 hover:bg-[hsl(var(--background-secondary))]"
                      style={{ color: 'hsl(var(--muted))' }}
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Modal body */}
                  <div className="p-6 space-y-8">

                    {isShoeCategory(product?.category) ? (
                      <>
                        {/* How to measure — feet */}
                        <div
                          className="flex gap-3 p-4 rounded-[var(--radius-lg)]"
                          style={{
                            background: 'hsl(var(--background-secondary))',
                            border:     '1px solid hsl(var(--border))',
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}
                          >
                            <Ruler size={14} style={{ color: 'hsl(var(--muted))' }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                              How to measure
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                              Stand on a sheet of paper and trace your foot, then measure the length
                              from heel to longest toe. Match that to <strong style={{ fontWeight: 600 }}>foot length (cm)</strong>{' '}
                              below to find your EU size.
                            </p>
                          </div>
                        </div>

                        {/* EU shoe size table */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--muted))' }}>
                            EU sizing
                          </p>
                          <div
                            className="overflow-x-auto scrollbar-hide rounded-[var(--radius-lg)]"
                            style={{ border: '1px solid hsl(var(--border))' }}
                          >
                            <table className="w-full text-xs">
                              <thead>
                                <tr style={{ background: 'hsl(var(--background-secondary))' }}>
                                  {['EU', 'Foot length (cm)', 'UK', 'US Men', 'US Women'].map((h) => (
                                    <th
                                      key={h}
                                      className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                                      style={{ color: 'hsl(var(--foreground))' }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { eu: '36', cm: '22.5', uk: '3.5',  usM: '4',    usW: '6'    },
                                  { eu: '37', cm: '23.0', uk: '4',    usM: '5',    usW: '6.5'  },
                                  { eu: '38', cm: '24.0', uk: '5',    usM: '6',    usW: '7.5'  },
                                  { eu: '39', cm: '24.5', uk: '6',    usM: '6.5',  usW: '8'    },
                                  { eu: '40', cm: '25.5', uk: '6.5',  usM: '7.5',  usW: '9'    },
                                  { eu: '41', cm: '26.0', uk: '7',    usM: '8',    usW: '9.5'  },
                                  { eu: '42', cm: '27.0', uk: '8',    usM: '9',    usW: '10.5' },
                                  { eu: '43', cm: '27.5', uk: '9',    usM: '9.5',  usW: '11'   },
                                  { eu: '44', cm: '28.5', uk: '9.5',  usM: '10.5', usW: '12'   },
                                  { eu: '45', cm: '29.0', uk: '10.5', usM: '11',   usW: '12.5' },
                                ].map((row, i) => (
                                  <tr
                                    key={row.eu}
                                    style={{
                                      background: i % 2 === 0
                                        ? 'hsl(var(--surface-elevated))'
                                        : 'hsl(var(--background-secondary) / 0.5)',
                                      borderTop: '1px solid hsl(var(--border-subtle))',
                                    }}
                                  >
                                    <td className="px-4 py-3 font-bold" style={{ color: 'hsl(var(--foreground))' }}>{row.eu}</td>
                                    <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{row.cm}</td>
                                    <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{row.uk}</td>
                                    <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{row.usM}</td>
                                    <td className="px-4 py-3" style={{ color: 'hsl(var(--muted))' }}>{row.usW}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* How to measure — mono */}
                        <div
                          className="flex gap-3 p-4 rounded-[var(--radius-lg)]"
                          style={{
                            background: 'hsl(var(--background-secondary))',
                            border:     '1px solid hsl(var(--border))',
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}
                          >
                            <Ruler size={14} style={{ color: 'hsl(var(--muted))' }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                              How to measure
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                              Measure your <strong style={{ fontWeight: 600 }}>chest</strong> around the fullest part,
                              your <strong style={{ fontWeight: 600 }}>waist</strong> at the narrowest point, and
                              your <strong style={{ fontWeight: 600 }}>hips</strong> at the widest point.
                              Keep the tape measure snug but not tight.
                            </p>
                          </div>
                        </div>

                        {/* Size tables */}
                        {[
                          {
                            label: "Women's",
                            rows: [
                              { size: 'XS',  chest: '79–82',  waist: '61–64',  hips: '87–90',   ref: 'US 0–2 / EU 32–34'   },
                              { size: 'S',   chest: '83–86',  waist: '65–68',  hips: '91–94',   ref: 'US 4–6 / EU 36–38'   },
                              { size: 'M',   chest: '87–91',  waist: '69–73',  hips: '95–99',   ref: 'US 8–10 / EU 40–42'  },
                              { size: 'L',   chest: '92–97',  waist: '74–79',  hips: '100–105', ref: 'US 12–14 / EU 44–46' },
                              { size: 'XL',  chest: '98–104', waist: '80–86',  hips: '106–112', ref: 'US 16–18 / EU 48–50' },
                              { size: 'XXL', chest: '105–112',waist: '87–94',  hips: '113–120', ref: 'US 20–22 / EU 52–54' },
                            ],
                          },
                          {
                            label: "Men's",
                            rows: [
                              { size: 'XS',  chest: '84–87',  waist: '71–74',  hips: '87–90',  ref: 'US XS / EU 44'   },
                              { size: 'S',   chest: '88–92',  waist: '75–79',  hips: '91–95',  ref: 'US S / EU 46–48' },
                              { size: 'M',   chest: '93–98',  waist: '80–85',  hips: '96–101', ref: 'US M / EU 48–50' },
                              { size: 'L',   chest: '99–105', waist: '86–92',  hips: '102–108',ref: 'US L / EU 50–52' },
                              { size: 'XL',  chest: '106–113',waist: '93–100', hips: '109–116',ref: 'US XL / EU 54–56'},
                              { size: 'XXL', chest: '114–122',waist: '101–109',hips: '117–125',ref: 'US XXL / EU 58'  },
                            ],
                          },
                        ].map(({ label, rows }) => (
                          <div key={label}>
                            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--muted))' }}>
                              {label}
                            </p>
                            <div
                              className="overflow-x-auto scrollbar-hide rounded-[var(--radius-lg)]"
                              style={{ border: '1px solid hsl(var(--border))' }}
                            >
                              <table className="w-full text-xs">
                                <thead>
                                  <tr style={{ background: 'hsl(var(--background-secondary))' }}>
                                    {['Size', 'Chest (cm)', 'Waist (cm)', 'Hips (cm)', 'US / EU'].map((h) => (
                                      <th
                                        key={h}
                                        className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                                        style={{ color: 'hsl(var(--foreground))' }}
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row, i) => (
                                    <tr
                                      key={row.size}
                                      style={{
                                        background: i % 2 === 0
                                          ? 'hsl(var(--surface-elevated))'
                                          : 'hsl(var(--background-secondary) / 0.5)',
                                        borderTop: '1px solid hsl(var(--border-subtle))',
                                      }}
                                    >
                                      {/* Size column: foreground bold (was accent) */}
                                      <td className="px-4 py-3 font-bold" style={{ color: 'hsl(var(--foreground))' }}>{row.size}</td>
                                      <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{row.chest}</td>
                                      <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{row.waist}</td>
                                      <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{row.hips}</td>
                                      <td className="px-4 py-3" style={{ color: 'hsl(var(--muted))' }}>{row.ref}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    <p className="text-xs text-center pb-2" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                      Between sizes? We recommend sizing up for a more comfortable fit.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Reviews */}
      <div className="mt-20">
        <ReviewSection productId={id} />
      </div>
    </div>
  )
}