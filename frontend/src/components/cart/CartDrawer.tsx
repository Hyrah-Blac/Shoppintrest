'use client'

/**
 * CartDrawer — v2
 *
 * Brought up to the same standard as the hero / explore page:
 *  - Empty state now uses the same Great Vibes script + breathing accent
 *    glow vessel as the explore page's "Nothing found" moment, so an empty
 *    cart doesn't suddenly drop into a different, flatter design language.
 *  - Backdrop deepened (thin bg-foreground/20 blur-sm read as an
 *    afterthought next to the rest of the app) to match the weight of the
 *    hero's Quick View scrim.
 *  - Quantity stepper and remove button now give real tactile feedback
 *    (tap scale, hover color/shadow) instead of a flat color swap.
 *  - "Free shipping" is now a pulsing-dot pill using the same accent
 *    language as the explore page's result-count line, instead of plain
 *    green text that doesn't tie back to the rest of the system.
 *  - Cleaned up the stray unindented markup around the empty-state CTA.
 *
 * Cart logic (store, update/remove handlers, pricing) is unchanged —
 * only the presentation layer was touched.
 */

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { Great_Vibes } from 'next/font/google'
import { useCartStore, getItemUnitPrice } from '@/store/useCartStore'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

// Same script family + loading strategy used on the explore page's opener
// and empty state — self-hosted via next/font so it can't silently fall
// back to generic cursive if a stylesheet import is missing or blocked.
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], display: 'swap' })

const ease = [0.16, 1, 0.3, 1] as const

export function CartDrawer() {
  const {
    isOpen, closeCart, items, total,
    updateItem, removeItem, isLoading,
  } = useCartStore()

  const handleUpdate = async (
    productId: string,
    size: string,
    quantity: number
  ) => {
    try {
      await updateItem(productId, size, quantity)
    } catch {
      toast.error('Could not update cart')
    }
  }

  const handleRemove = async (productId: string, size: string) => {
    try {
      await removeItem(productId, size)
      toast.success('Removed from cart')
    } catch {
      toast.error('Could not remove item')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — deepened to match the weight of the hero's Quick
              View scrim rather than reading as a thin afterthought */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-foreground/45 backdrop-blur-md"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-md
                       bg-background border-l border-border flex flex-col
                       shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5
                            border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex
                                items-center justify-center shrink-0">
                  <ShoppingBag size={16} className="text-accent" />
                </div>
                <h2 className="font-display font-semibold text-lg tracking-tight">
                  Your Cart
                </h2>
                {items.length > 0 && (
                  <span className="text-xs text-muted">
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl hover:bg-accent/10 text-muted
                           hover:text-foreground transition-all duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center
                                text-center py-16">
                  {/* Void vessel — soft breathing accent glow behind a glass
                      tile, same language as the explore page's empty state */}
                  <div className="relative mb-6 w-16 h-16">
                    <motion.div
                      aria-hidden
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, hsl(var(--accent) / 0.22) 0%, transparent 72%)',
                      }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.45, 0.9, 0.45] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative w-16 h-16 rounded-2xl bg-surface
                                    border border-border flex items-center
                                    justify-center shadow-sm">
                      <motion.div
                        animate={{ rotate: [0, -8, 0, 8, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ShoppingBag size={22} className="text-muted" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Headline — same Great Vibes script + curtain-lift
                      reveal as the explore page's opener and empty state */}
                  <div className="overflow-hidden">
                    <motion.p
                      className={greatVibes.className}
                      initial={{ y: '105%' }}
                      animate={{ y: '0%' }}
                      transition={{ duration: 0.55, ease }}
                      style={{
                        fontSize:      'clamp(1.875rem, 5vw, 2.375rem)',
                        fontWeight:    400,
                        letterSpacing: '0.01em',
                        lineHeight:    1.2,
                        margin:        0,
                        paddingBottom: '0.12em', // clears descenders from the mask
                      }}
                    >
                      Empty, for now
                    </motion.p>
                  </div>

                  <p className="text-sm text-muted mt-1 mb-6">
                    Discover something beautiful
                  </p>

                  <Link href="/explore" onClick={closeCart}>
                    <Button
                      variant="secondary"
                      size="md"
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item: any) => (
                      <motion.div
                        key={`${item.product?._id}-${item.size}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-4 py-4 border-b border-border
                                   last:border-0"
                      >
                        {/* Image */}
                        <Link
                          href={`/product/${item.product?._id}`}
                          onClick={closeCart}
                          className="shrink-0"
                        >
                          <div className="w-20 h-24 rounded-xl overflow-hidden
                                          bg-surface">
                            {item.product?.images?.[0]?.url && (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.product.title}
                                width={80}
                                height={96}
                                className="w-full h-full object-cover
                                           hover:scale-105 transition-transform
                                           duration-300"
                              />
                            )}
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2">
                            <Link
                              href={`/product/${item.product?._id}`}
                              onClick={closeCart}
                              className="text-sm font-medium text-foreground
                                         line-clamp-2 hover:opacity-70
                                         transition-opacity leading-snug"
                            >
                              {item.product?.title}
                            </Link>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() =>
                                handleRemove(item.product?._id, item.size)
                              }
                              className="text-muted hover:text-destructive
                                         transition-colors shrink-0 p-1 rounded-lg
                                         hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>

                          <p className="text-xs text-muted mt-1">
                            {item.product?.brand}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-surface border border-border
                                             px-2 py-0.5 rounded-lg text-foreground">
                              Size {item.size}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity */}
                            <div className="flex items-center gap-2 bg-surface
                                            rounded-xl border border-border p-0.5">
                              <motion.button
                                whileTap={{ scale: 0.88 }}
                                disabled={item.quantity <= 1}
                                onClick={() =>
                                  handleUpdate(
                                    item.product?._id,
                                    item.size,
                                    item.quantity - 1
                                  )
                                }
                                className="w-7 h-7 rounded-lg flex items-center
                                           justify-center text-muted hover:text-foreground
                                           hover:bg-accent/10 transition-all duration-200
                                           disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <Minus size={12} />
                              </motion.button>
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={item.quantity}
                                  initial={{ opacity: 0, y: -3 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 3 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-sm font-medium text-foreground
                                             min-w-[1.25rem] text-center
                                             tabular-nums"
                                >
                                  {item.quantity}
                                </motion.span>
                              </AnimatePresence>
                              <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() =>
                                  handleUpdate(
                                    item.product?._id,
                                    item.size,
                                    item.quantity + 1
                                  )
                                }
                                className="w-7 h-7 rounded-lg flex items-center
                                           justify-center text-muted hover:text-foreground
                                           hover:bg-accent/10 transition-all duration-200"
                              >
                                <Plus size={12} />
                              </motion.button>
                            </div>

                            {/* Price — uses the selected size's own price when
                                the product has one (e.g. framed art), falling
                                back to the base product price otherwise. */}
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                              {formatPrice(
                                getItemUnitPrice(item) * item.quantity,
                                'KES'
                              )}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-border space-y-4">
                {/* Subtotal */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-medium tabular-nums">{formatPrice(total, 'KES')}</span>
                  </div>

                  {/* Free shipping — pulsing-dot pill, same accent language
                      as the explore page's result-count line, instead of
                      plain green text disconnected from the rest of the
                      system */}
                  <div className="flex items-center gap-2">
                    <motion.span
                      aria-hidden
                      className="w-[5px] h-[5px] rounded-full bg-accent shrink-0"
                      style={{ boxShadow: '0 0 6px hsl(var(--accent) / 0.65)' }}
                      animate={{ opacity: [0.45, 1, 0.45] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="text-xs text-muted">
                      Free shipping on all orders
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                  <Link href="/checkout" onClick={closeCart}>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      rightIcon={<ArrowRight size={16} />}
                      isLoading={isLoading}
                    >
                      Checkout
                    </Button>
                  </Link>
                </motion.div>

                <Link href="/cart" onClick={closeCart}>
                  <Button variant="ghost" size="md" className="w-full">
                    View full cart
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}