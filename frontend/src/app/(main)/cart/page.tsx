'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

const SHIPPING_FREE_THRESHOLD =0
const SHIPPING_COST =0

export default function CartPage() {
  const { items, updateItem, removeItem, isLoading } = useCartStore()

  const subtotal = items.reduce(
    (s, i: any) => s + (i.product?.price || 0) * i.quantity, 0
  )
  const shippingCost = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal + shippingCost

  const handleUpdate = async (productId: string, size: string, quantity: number) => {
    try { await updateItem(productId, size, quantity) }
    catch { toast.error('Could not update cart') }
  }

  const handleRemove = async (productId: string, size: string) => {
    try {
      await removeItem(productId, size)
      toast.success('Item removed')
    } catch { toast.error('Could not remove item') }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center
                      text-center px-4 py-32">
        <div className="w-20 h-20 rounded-3xl bg-surface border border-border
                        flex items-center justify-center mb-6">
          <ShoppingBag size={32} className="text-muted" />
        </div>
        <h1 className="font-display text-2xl font-semibold mb-2">
          Your cart is empty
        </h1>
        <p className="text-muted text-sm mb-8">
          Discover something beautiful to add
        </p>
        <Link href="/explore">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
            Explore Products
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="container-wide py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight mb-8">
          Cart ({items.length})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item: any) => (
                <motion.div
                  key={`${item.product?._id}-${item.size}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-background rounded-2xl border border-border p-5"
                >
                  <div className="flex gap-5">
                    <Link href={`/product/${item.product?._id}`} className="shrink-0">
                      <div className="w-24 h-28 rounded-xl overflow-hidden bg-surface">
                        {item.product?.images?.[0]?.url && (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.title}
                            width={96}
                            height={112}
                            className="w-full h-full object-cover hover:scale-105
                                       transition-transform duration-300"
                          />
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-2xs text-muted uppercase tracking-wider font-medium">
                            {item.product?.brand}
                          </p>
                          <Link href={`/product/${item.product?._id}`}>
                            <p className="text-sm font-medium text-foreground mt-0.5
                                          hover:opacity-70 transition-opacity line-clamp-2 leading-snug">
                              {item.product?.title}
                            </p>
                          </Link>
                          <p className="text-xs text-muted mt-1">Size: {item.size}</p>
                        </div>
                        <button
                          onClick={() => handleRemove(item.product?._id, item.size)}
                          className="text-muted hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-0.5">
                          <button
                            onClick={() => handleUpdate(item.product?._id, item.size, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                                       text-muted hover:text-foreground hover:bg-accent transition-all"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdate(item.product?._id, item.size, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                                       text-muted hover:text-foreground hover:bg-accent transition-all"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <p className="font-semibold text-foreground">
                          {formatPrice((item.product?.price || 0) * item.quantity, 'KES')}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-background rounded-2xl border border-border p-6 sticky top-28 space-y-5">
              <h2 className="font-medium text-foreground">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(subtotal, 'KES')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span>
                    {shippingCost === 0 ? 'Free' : formatPrice(shippingCost, 'KES')}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total, 'KES')}</span>
                </div>
              </div>

              {shippingCost > 0 && (
                <p className="text-xs text-muted text-center">
                  Add {formatPrice(SHIPPING_FREE_THRESHOLD - subtotal, 'KES')} more for free shipping
                </p>
              )}

              <Link href="/checkout">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full rounded-2xl"
                  rightIcon={<ArrowRight size={16} />}
                  isLoading={isLoading}
                >
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/explore">
                <Button variant="ghost" size="md" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}