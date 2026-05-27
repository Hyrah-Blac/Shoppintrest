'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  ShoppingBag,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Star,
  BookmarkPlus,
  Package,
  RotateCcw,
  Zap,
  X,
  Ruler,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { formatPrice, cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { ReviewSection } from '@/components/product/ReviewSection'

interface Props { id: string }

export function ProductDetail({ id }: Props) {
  const { isSignedIn }    = useAuth()
  const addItem           = useCartStore((s) => s.addItem)
  const isSaved           = useUserStore((s) => s.isSaved(id))
  const toggleSaveProduct = useUserStore((s) => s.toggleSaveProduct)

  const [product,              setProduct]              = useState<any>(null)
  const [isLoading,            setIsLoading]            = useState(true)
  const [selectedSize,         setSelectedSize]         = useState<string>('')
  const [selectedImage,        setSelectedImage]        = useState(0)
  const [isAddingToCart,       setIsAddingToCart]       = useState(false)
  const [isSaving,             setIsSaving]             = useState(false)
  const [isZoomed,             setIsZoomed]             = useState(false)
  const [zoomPos,              setZoomPos]              = useState({ x: 50, y: 50 })
  const [collections,          setCollections]          = useState<any[]>([])
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [showSizeGuide,        setShowSizeGuide]        = useState(false)

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
  const discount        = product?.comparePrice > product?.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  if (isLoading) return null
  if (!product) return (
    <div className="container-wide py-32 text-center"
         style={{ color: 'hsl(var(--muted))' }}>
      Product not found
    </div>
  )

  return (
    <div className="container-wide py-8 lg:py-12">

      {/* ── Breadcrumb ── */}
      <nav
        className="flex items-center gap-1.5 mb-10"
        style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted))' }}
      >
        {[
          { href: '/',                                      label: 'Home'            },
          { href: '/explore',                               label: 'Explore'         },
          { href: `/explore?category=${product.category}`, label: product.category,
            capitalize: true                                                          },
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

        {/* ══════════════════════════════════════════════════
            LEFT — Images
        ══════════════════════════════════════════════════ */}
        <div className="space-y-3">

          {/* Main image */}
          <div
            className="relative aspect-[4/5] overflow-hidden
                       cursor-zoom-in select-none"
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

            {/* Sold Out — diagonal ribbon (matches ProductCard) */}
            {isOutOfStock && (
              <div
                className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
                style={{ borderRadius: 'var(--radius-2xl)' }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: 'rgba(0,0,0,0.22)' }}
                />
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    top:                 '14%',
                    right:               '-28%',
                    width:               '90%',
                    padding:             '0.45rem 0',
                    background:          'rgba(12,12,12,0.82)',
                    backdropFilter:      'blur(8px)',
                    WebkitBackdropFilter:'blur(8px)',
                    transform:           'rotate(35deg)',
                    borderTop:           '0.5px solid rgba(255,255,255,0.12)',
                    borderBottom:        '0.5px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <span
                    style={{
                      color:         'white',
                      fontSize:      '0.65rem',
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

            {/* Top-left badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.isFeatured && (
                <span className="badge badge-red">Featured</span>
              )}
              {discount && !isOutOfStock && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8, y: -4 }}
                  animate={{ opacity: 1, scale: 1,   y: 0  }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  className="inline-flex items-center font-bold"
                  style={{
                    fontSize:      '0.68rem',
                    padding:       '0.25rem 0.6rem',
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

            {/* Nav arrows */}
            {product.images?.length > 1 && (
              <>
                {[
                  {
                    side: 'left' as const,
                    icon: <ChevronLeft size={16} />,
                    onClick: () => setSelectedImage((p) =>
                      p === 0 ? product.images.length - 1 : p - 1),
                  },
                  {
                    side: 'right' as const,
                    icon: <ChevronRight size={16} />,
                    onClick: () => setSelectedImage((p) =>
                      p === product.images.length - 1 ? 0 : p + 1),
                  },
                ].map(({ side, icon, onClick }) => (
                  <button
                    key={side}
                    onClick={onClick}
                    className="absolute top-1/2 -translate-y-1/2 w-9 h-9 p-0
                               flex items-center justify-center rounded-full
                               transition-all duration-[var(--duration-hover)]"
                    style={{
                      [side]:             '1rem',
                      background:         'rgba(255,255,255,0.92)',
                      backdropFilter:     'blur(12px)',
                      WebkitBackdropFilter:'blur(12px)',
                      color:              'hsl(var(--foreground))',
                      boxShadow:          '0 2px 12px rgba(0,0,0,0.12)',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {product.images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'relative w-16 h-20 shrink-0 overflow-hidden',
                    'transition-all duration-[var(--duration-hover)]',
                  )}
                  style={{
                    borderRadius: 'var(--radius)',
                    border:       i === selectedImage
                      ? '2px solid hsl(var(--accent))'
                      : '2px solid transparent',
                    opacity:      i === selectedImage ? 1 : 0.55,
                    boxShadow:    i === selectedImage ? 'var(--shadow-red)' : 'none',
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

        {/* ══════════════════════════════════════════════════
            RIGHT — Info
        ══════════════════════════════════════════════════ */}
        <div className="lg:sticky lg:top-28 lg:self-start space-y-7">

          {/* Brand + action row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                href={`/explore?brand=${product.brand}`}
                className="eyebrow hover:opacity-70 transition-opacity
                           duration-[var(--duration-hover)]"
              >
                {product.brand}
              </Link>
              <h1
                className="font-display font-bold tracking-[-0.03em] leading-[1.1] mt-1.5"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                {product.title}
              </h1>
            </div>

            {/* Action icons */}
            <div className="flex gap-1.5 shrink-0">
              {/* Save / heart */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleSave}
                disabled={isSaving}
                aria-label="Save product"
                className="w-10 h-10 flex items-center justify-center rounded-full
                           transition-all duration-[var(--duration-hover)]"
                style={isSaved ? {
                  background:  'hsl(var(--accent))',
                  color:       'white',
                  boxShadow:   'var(--shadow-red)',
                } : {
                  background:  'hsl(var(--background-secondary))',
                  border:      '1px solid hsl(var(--border))',
                  color:       'hsl(var(--muted))',
                }}
              >
                <Heart
                  size={16}
                  className={cn(isSaved && 'fill-current')}
                />
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

              {/* Collection picker */}
              {isSignedIn && (
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setShowCollectionPicker(!showCollectionPicker)}
                    aria-label="Add to collection"
                    className="w-10 h-10 flex items-center justify-center rounded-full
                               transition-all duration-[var(--duration-hover)]"
                    style={{
                      background:  showCollectionPicker
                        ? 'hsl(var(--foreground))'
                        : 'hsl(var(--background-secondary))',
                      border:      '1px solid hsl(var(--border))',
                      color:       showCollectionPicker
                        ? 'hsl(var(--background))'
                        : 'hsl(var(--muted))',
                    }}
                  >
                    <BookmarkPlus size={16} />
                  </motion.button>

                  <AnimatePresence>
                    {showCollectionPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1    }}
                        exit={{   opacity: 0, y: 8, scale: 0.96  }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-12 z-30 w-56 overflow-hidden"
                        style={{
                          background:   'hsl(var(--surface-elevated))',
                          border:       '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius-lg)',
                          boxShadow:    'var(--shadow-float)',
                        }}
                      >
                        <div className="p-2">
                          <p
                            className="text-[10px] font-semibold uppercase tracking-widest
                                       px-3 py-2"
                            style={{ color: 'hsl(var(--muted))' }}
                          >
                            Save to collection
                          </p>
                          {collections.length === 0 ? (
                            <Link
                              href="/collections/new"
                              className="flex items-center gap-2 px-3 py-2.5 text-sm
                                         rounded-[var(--radius-sm)]
                                         hover:bg-[hsl(var(--accent-muted))]
                                         transition-colors duration-[var(--duration-fast)]"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              + Create collection
                            </Link>
                          ) : (
                            collections.map((col) => (
                              <button
                                key={col._id}
                                onClick={() => handleAddToCollection(col._id)}
                                className="w-full text-left px-3 py-2.5 text-sm truncate
                                           rounded-[var(--radius-sm)]
                                           hover:bg-[hsl(var(--accent-muted))]
                                           transition-colors duration-[var(--duration-fast)]"
                                style={{ color: 'hsl(var(--foreground))' }}
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

          {/* Rating — stars only */}
          {product.rating > 0 && (
            <div className="flex gap-0.5">
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
          )}

          {/* ── Price ── */}
          <div className="flex items-baseline gap-3">
            {discount ? (
              <>
                <span
                  className="font-display font-bold tracking-[-0.03em]"
                  style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                    color:    'hsl(var(--accent))',
                  }}
                >
                  {formatPrice(product.price, 'KES')}
                </span>
                <span
                  style={{
                    fontSize:            '1.05rem',
                    fontWeight:          400,
                    color:               'hsl(var(--muted))',
                    textDecoration:      'line-through',
                    textDecorationColor: 'hsl(var(--muted) / 0.5)',
                    letterSpacing:       '-0.01em',
                  }}
                >
                  {formatPrice(product.comparePrice, 'KES')}
                </span>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1    }}
                  transition={{ delay: 0.15, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
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
                  Save {discount}%
                </motion.span>
              </>
            ) : (
              <span
                className="font-display font-bold tracking-[-0.03em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
              >
                {formatPrice(product.price, 'KES')}
              </span>
            )}
          </div>

          {/* Description */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'hsl(var(--muted))', fontWeight: 300, lineHeight: 1.75 }}
          >
            {product.description}
          </p>

          {/* ── Size selector ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Select Size
              </span>
              <button
                onClick={() => setShowSizeGuide(true)}
                className="flex items-center gap-1 text-xs underline underline-offset-2
                           hover:text-[hsl(var(--foreground))]
                           transition-colors duration-[var(--duration-hover)]"
                style={{ color: 'hsl(var(--muted))' }}
              >
                <Ruler size={11} />
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
                      'relative h-11 min-w-[3rem] px-4',
                      'text-sm font-medium',
                      'transition-all duration-[var(--duration-hover)]',
                      !inStock && 'cursor-not-allowed',
                    )}
                    style={{
                      borderRadius: 'var(--radius-pill)',
                      border:       isSelected
                        ? '1.5px solid hsl(var(--accent))'
                        : inStock
                          ? '1.5px solid hsl(var(--border))'
                          : '1.5px solid hsl(var(--border-subtle))',
                      background: isSelected
                        ? 'hsl(var(--accent))'
                        : 'transparent',
                      color: isSelected
                        ? 'white'
                        : inStock
                          ? 'hsl(var(--foreground))'
                          : 'hsl(var(--muted))',
                      opacity:         !inStock ? 0.4 : 1,
                      textDecoration:  !inStock ? 'line-through' : 'none',
                      boxShadow:       isSelected ? 'var(--shadow-red)' : 'none',
                    }}
                  >
                    {variant.size}
                    {/* Low stock indicator */}
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
                    ? `Only ${selectedVariant.inventory} left — order soon`
                    : `${selectedVariant.inventory} in stock`
                  : 'Out of stock'}
              </p>
            )}
          </div>

          {/* ── Add to Cart ── */}
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
              {isAddingToCart
                ? 'Adding…'
                : isOutOfStock
                  ? 'Out of Stock'
                  : 'Add to Cart'}
            </motion.button>
          </div>

          {/* ── Trust badges ── */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                icon:  <Package size={16} />,
                label: 'Secure Checkout',
                sub:   'M-Pesa protected',
              },
              {
                icon:  <RotateCcw size={16} />,
                label: 'Free Returns',
                sub:   'Within 30 days',
              },
              {
                icon:  <Zap size={16} />,
                label: 'Fast Delivery',
                sub:   'Nairobi same day',
              },
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
                <span style={{ color: 'hsl(var(--accent))' }}>{item.icon}</span>
                <p
                  className="text-[11px] font-semibold leading-tight"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {item.label}
                </p>
                <p
                  className="text-[10px] leading-snug"
                  style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                >
                  {item.sub}
                </p>
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
                  className="pill text-xs px-3 py-1"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Seller card */}
          {product.seller && (
            <div
              className="flex items-center gap-3 p-4"
              style={{
                background:   'hsl(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border:       '1px solid hsl(var(--border))',
              }}
            >
              <Avatar
                src={product.seller.avatar}
                name={product.seller.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  Sold by
                </p>
                <Link
                  href={`/profile/${product.seller.username}`}
                  className="text-sm font-semibold flex items-center gap-1 mt-0.5
                             hover:text-[hsl(var(--accent))]
                             transition-colors duration-[var(--duration-hover)]"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {product.seller.displayName}
                  <ArrowUpRight size={12} style={{ opacity: 0.5 }} />
                </Link>
              </div>
              {product.saves > 0 && (
                <div
                  className="text-right pl-3"
                  style={{
                    borderLeft: '1px solid hsl(var(--border))',
                  }}
                >
                  <p
                    className="text-base font-bold tracking-tight"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {product.saves}
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-wide"
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

      {/* ── Size Guide Modal ── */}
      <AnimatePresence>
        {showSizeGuide && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowSizeGuide(false)}
            />

            {/* Modal panel */}
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
                  background:   'hsl(var(--surface-elevated))',
                  borderRadius: 'var(--radius-2xl)',
                  border:       '1px solid hsl(var(--border))',
                  boxShadow:    'var(--shadow-float)',
                  pointerEvents: 'auto',
                }}
              >
                {/* Header */}
                <div
                  className="sticky top-0 flex items-center justify-between px-6 py-5"
                  style={{
                    background:   'hsl(var(--surface-elevated))',
                    borderBottom: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center"
                        style={{ background: 'hsl(var(--accent-muted))' }}
                      >
                        <Ruler size={12} style={{ color: 'hsl(var(--accent))' }} />
                      </div>
                      <span className="eyebrow">Sizing</span>
                    </div>
                    <h3
                      className="font-display font-bold tracking-tight"
                      style={{ fontSize: '1.25rem' }}
                    >
                      Size Guide
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowSizeGuide(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-full
                               transition-colors duration-[var(--duration-hover)]
                               hover:bg-[hsl(var(--background-secondary))]"
                    style={{ color: 'hsl(var(--muted))' }}
                    aria-label="Close size guide"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">

                  {/* How to measure */}
                  <div
                    className="flex gap-3 p-4 rounded-[var(--radius-lg)]"
                    style={{
                      background:  'hsl(var(--accent-muted))',
                      border:      '1px solid hsl(var(--accent) / 0.15)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'hsl(var(--accent))', color: 'white' }}
                    >
                      <Ruler size={14} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        How to measure
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                      >
                        Measure your <strong style={{ fontWeight: 600 }}>chest</strong> around the fullest part,
                        your <strong style={{ fontWeight: 600 }}>waist</strong> at the narrowest point, and
                        your <strong style={{ fontWeight: 600 }}>hips</strong> at the widest point.
                        Keep the tape measure snug but not tight.
                      </p>
                    </div>
                  </div>

                  {/* Women's sizes */}
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-3"
                      style={{ color: 'hsl(var(--muted))' }}
                    >
                      Women&apos;s
                    </p>
                    <div className="overflow-x-auto scrollbar-hide rounded-[var(--radius-lg)]"
                         style={{ border: '1px solid hsl(var(--border))' }}>
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
                          {[
                            { size: 'XS',  chest: '79–82',  waist: '61–64',  hips: '87–90',  ref: 'US 0–2 / EU 32–34'  },
                            { size: 'S',   chest: '83–86',  waist: '65–68',  hips: '91–94',  ref: 'US 4–6 / EU 36–38'  },
                            { size: 'M',   chest: '87–91',  waist: '69–73',  hips: '95–99',  ref: 'US 8–10 / EU 40–42' },
                            { size: 'L',   chest: '92–97',  waist: '74–79',  hips: '100–105',ref: 'US 12–14 / EU 44–46'},
                            { size: 'XL',  chest: '98–104', waist: '80–86',  hips: '106–112',ref: 'US 16–18 / EU 48–50'},
                            { size: 'XXL', chest: '105–112',waist: '87–94',  hips: '113–120',ref: 'US 20–22 / EU 52–54'},
                          ].map((row, i) => (
                            <tr
                              key={row.size}
                              style={{
                                background: i % 2 === 0
                                  ? 'hsl(var(--surface-elevated))'
                                  : 'hsl(var(--background-secondary) / 0.5)',
                                borderTop: '1px solid hsl(var(--border-subtle))',
                              }}
                            >
                              <td className="px-4 py-3 font-bold" style={{ color: 'hsl(var(--accent))' }}>
                                {row.size}
                              </td>
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

                  {/* Men's sizes */}
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-3"
                      style={{ color: 'hsl(var(--muted))' }}
                    >
                      Men&apos;s
                    </p>
                    <div className="overflow-x-auto scrollbar-hide rounded-[var(--radius-lg)]"
                         style={{ border: '1px solid hsl(var(--border))' }}>
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
                          {[
                            { size: 'XS',  chest: '84–87',  waist: '71–74',  hips: '87–90',  ref: 'US XS / EU 44'  },
                            { size: 'S',   chest: '88–92',  waist: '75–79',  hips: '91–95',  ref: 'US S / EU 46–48' },
                            { size: 'M',   chest: '93–98',  waist: '80–85',  hips: '96–101', ref: 'US M / EU 48–50' },
                            { size: 'L',   chest: '99–105', waist: '86–92',  hips: '102–108',ref: 'US L / EU 50–52' },
                            { size: 'XL',  chest: '106–113',waist: '93–100', hips: '109–116',ref: 'US XL / EU 54–56'},
                            { size: 'XXL', chest: '114–122',waist: '101–109',hips: '117–125',ref: 'US XXL / EU 58'  },
                          ].map((row, i) => (
                            <tr
                              key={row.size}
                              style={{
                                background: i % 2 === 0
                                  ? 'hsl(var(--surface-elevated))'
                                  : 'hsl(var(--background-secondary) / 0.5)',
                                borderTop: '1px solid hsl(var(--border-subtle))',
                              }}
                            >
                              <td className="px-4 py-3 font-bold" style={{ color: 'hsl(var(--accent))' }}>
                                {row.size}
                              </td>
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

                  {/* Fit note */}
                  <p
                    className="text-xs text-center pb-2"
                    style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                  >
                    Between sizes? We recommend sizing up for a more comfortable fit.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Reviews ── */}
      <div className="mt-20">
        <ReviewSection productId={id} />
      </div>
    </div>
  )
}