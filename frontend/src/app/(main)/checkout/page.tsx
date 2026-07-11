'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone, CheckCircle2, Loader2,
  ShoppingBag, ArrowLeft, AlertCircle,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { useCartStore, getItemUnitPrice } from '@/store/useCartStore'
import { apiClient } from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Step = 'details' | 'payment' | 'polling' | 'success' | 'failed'

const SHIPPING_FREE_THRESHOLD = 0
const SHIPPING_COST = 0

export default function CheckoutPage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { items, total, clearCart } = useCartStore()

  const [step, setStep] = useState<Step>('details')
  const [orderId, setOrderId] = useState<string>('')
  const [mpesaReceipt, setMpesaReceipt] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [pollMessage, setPollMessage] = useState('Waiting for payment...')

  const [address, setAddress] = useState({
    fullName: '', line1: '', line2: '',
    city: '', state: '', postalCode: '', country: 'Kenya',
  })
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Uses the selected size's own price when the product has one (e.g.
  // framed art: A5 vs A1), falling back to the base product price otherwise.
  // Must match the same logic the backend uses to compute the amount it
  // actually charges via M-Pesa, or the displayed total and the real charge
  // can disagree.
  const subtotal = items.reduce(
    (s, i: any) => s + getItemUnitPrice(i) * i.quantity, 0
  )
  const shippingCost = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_COST
  const orderTotal = subtotal + shippingCost

  useEffect(() => {
    if (!isSignedIn) router.push('/sign-in')
  }, [isSignedIn, router])

  useEffect(() => {
    if (items.length === 0 && step === 'details') {
      router.push('/cart')
    }
  }, [items, step, router])

  // Poll payment status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    if (step === 'polling' && orderId) {
      const messages = [
        'Waiting for M-Pesa prompt...',
        'Enter your M-Pesa PIN on your phone...',
        'Processing payment...',
        'Almost there...',
        'Confirming with Safaricom...',
      ]

      interval = setInterval(async () => {
        setPollCount((c) => {
          const next = c + 1
          setPollMessage(messages[Math.min(next, messages.length - 1)])
          return next
        })

        try {
          const { data } = await apiClient.orders.checkStatus(orderId)
          const { isPaid, status, mpesaReceiptNumber } = data.data

          if (isPaid || status === 'processing') {
            clearInterval(interval)
            setMpesaReceipt(mpesaReceiptNumber || '')
            setStep('success')
            clearCart()
          } else if (status === 'cancelled') {
            clearInterval(interval)
            setStep('failed')
          }
        } catch {
          // silent — keep polling
        }

        // Timeout after 2.5 minutes (30 polls × 5s)
        if (pollCount >= 30) {
          clearInterval(interval)
          setStep('failed')
        }
      }, 5000)
    }

    return () => clearInterval(interval)
  }, [step, orderId, pollCount])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!address.fullName.trim()) e.fullName = 'Required'
    if (!address.line1.trim()) e.line1 = 'Required'
    if (!address.city.trim()) e.city = 'Required'
    if (!address.state.trim()) e.state = 'Required'
    if (!address.postalCode.trim()) e.postalCode = 'Required'
    const cleaned = phone.replace(/\D/g, '')
    if (!phone.trim()) e.phone = 'Required'
    else if (cleaned.length < 9 || cleaned.length > 12) {
      e.phone = 'Use format: 0712345678'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const { data } = await apiClient.orders.initiateMpesa({
        shippingAddress: address,
        phone,
      })
      setOrderId(data.data.orderId)
      setStep('polling')
      toast.success(data.data.message || 'Check your phone for the M-Pesa prompt')
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Failed to initiate payment'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'success') return <SuccessScreen receipt={mpesaReceipt} orderId={orderId} />
  if (step === 'failed') return (
    <FailedScreen onRetry={() => { setStep('details'); setPollCount(0) }} />
  )

  return (
    <div className="min-h-screen bg-surface">
      <div className="container-narrow py-8 lg:py-12">
        {/* Back */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-muted
                     hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to cart
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left — Form */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Checkout
              </h1>
              <p className="text-sm text-muted mt-1">
                Complete your order via M-Pesa
              </p>
            </div>

            {/* Shipping Address */}
            <div className="bg-background rounded-2xl border border-border p-6 space-y-4">
              <h2 className="font-medium text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-foreground text-background
                                 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Shipping Address
              </h2>

              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={address.fullName}
                error={errors.fullName}
                onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
              />

              <Input
                label="Address Line 1"
                placeholder="123 Kenyatta Avenue"
                value={address.line1}
                error={errors.line1}
                onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
              />

              <Input
                label="Address Line 2 (optional)"
                placeholder="Apartment, suite, etc."
                value={address.line2}
                onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Nairobi"
                  value={address.city}
                  error={errors.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                />
                <Input
                  label="County / State"
                  placeholder="Nairobi County"
                  value={address.state}
                  error={errors.state}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Postal Code"
                  placeholder="00100"
                  value={address.postalCode}
                  error={errors.postalCode}
                  onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
                />
                <Input
                  label="Country"
                  value={address.country}
                  onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                />
              </div>
            </div>

            {/* M-Pesa Payment */}
            <div className="bg-background rounded-2xl border border-border p-6 space-y-4">
              <h2 className="font-medium text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-foreground text-background
                                 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                M-Pesa Payment
              </h2>

              <div className="flex items-center gap-3 p-4 bg-green-50
                              dark:bg-green-900/20 rounded-xl border
                              border-green-200 dark:border-green-800">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center
                                justify-center shrink-0">
                  <Smartphone size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Pay with M-Pesa
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    You&apos;ll receive an STK push on your phone
                  </p>
                </div>
              </div>

              <Input
                label="M-Pesa Phone Number"
                placeholder="0712 345 678"
                value={phone}
                error={errors.phone}
                hint="The number registered with M-Pesa"
                leftElement={
                  <span className="text-xs font-medium text-foreground">🇰🇪</span>
                }
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="numeric"
              />

              <div className="text-xs text-muted space-y-1.5 p-3 bg-surface rounded-xl">
                <p className="font-medium text-foreground">How it works:</p>
                <p>1. Click &ldquo;Pay with M-Pesa&rdquo; below</p>
                <p>2. You&apos;ll receive a prompt on your phone</p>
                <p>3. Enter your M-Pesa PIN to confirm</p>
                <p>4. Your order is confirmed instantly</p>
              </div>
            </div>

            {/* Submit */}
            <Button
              variant="primary"
              size="xl"
              className="w-full rounded-2xl"
              isLoading={isSubmitting}
              leftIcon={<Smartphone size={18} />}
              onClick={handleSubmit}
            >
              Pay {formatPrice(orderTotal, 'KES')} with M-Pesa
            </Button>

            <p className="text-xs text-center text-muted">
              By placing this order you agree to our{' '}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Right — Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-background rounded-2xl border border-border p-6
                            lg:sticky lg:top-28 space-y-5">
              <h2 className="font-medium text-foreground">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-hide">
                {items.map((item: any) => (
                  <div
                    key={`${item.product?._id}-${item.size}`}
                    className="flex gap-3"
                  >
                    <div className="w-14 h-16 rounded-xl overflow-hidden
                                    bg-surface shrink-0 relative">
                      {item.product?.images?.[0]?.url && (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      )}
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5
                                       bg-foreground text-background text-2xs
                                       rounded-full flex items-center justify-center
                                       font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.product?.title}
                      </p>
                      <p className="text-xs text-muted">
                        Size {item.size} · {item.product?.brand}
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        {formatPrice(getItemUnitPrice(item) * item.quantity, 'KES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border" />

              {/* Totals */}
              <div className="space-y-2.5">
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
                <div className="border-t border-border pt-2.5 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">{formatPrice(orderTotal, 'KES')}</span>
                </div>
              </div>

              {shippingCost === 0 && (
                <div className="text-xs text-green-600 dark:text-green-400
                                text-center bg-green-50 dark:bg-green-900/20
                                rounded-xl p-2.5">
                  🎉 You qualify for free shipping!
                </div>
              )}

              {shippingCost > 0 && (
                <p className="text-xs text-muted text-center">
                  Add {formatPrice(SHIPPING_FREE_THRESHOLD - subtotal, 'KES')} more for free shipping
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Polling Overlay */}
      <AnimatePresence>
        {step === 'polling' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm
                       flex items-center justify-center p-6"
          >
            <div className="text-center max-w-sm">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl bg-green-500 flex items-center
                           justify-center mx-auto mb-6 shadow-lg shadow-green-500/20"
              >
                <Smartphone size={36} className="text-white" />
              </motion.div>

              <h2 className="font-display text-2xl font-semibold mb-2">
                Check Your Phone
              </h2>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                {pollMessage}
              </p>

              <div className="flex justify-center gap-1 mb-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>

              <p className="text-xs text-muted">Do not close this page</p>

              <button
                onClick={() => setStep('failed')}
                className="mt-6 text-xs text-muted underline underline-offset-2
                           hover:text-foreground transition-colors"
              >
                Cancel payment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SuccessScreen({ receipt, orderId }: { receipt: string; orderId: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-green-500 flex items-center
                     justify-center mx-auto mb-6 shadow-xl shadow-green-500/20"
        >
          <CheckCircle2 size={40} className="text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
            Order Confirmed!
          </h1>
          <p className="text-muted text-sm leading-relaxed mb-6">
            Your payment was received. We&apos;re preparing your order.
          </p>

          {receipt && (
            <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
              <p className="text-xs text-muted mb-1">M-Pesa Receipt</p>
              <p className="font-mono font-bold text-lg tracking-wider">{receipt}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href={`/orders/${orderId}`}>
              <Button variant="primary" size="lg" className="w-full rounded-2xl">
                View Order
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="ghost" size="lg" className="w-full rounded-2xl">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function FailedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md w-full"
      >
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center
                        justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-destructive" />
        </div>

        <h1 className="font-display text-3xl font-semibold mb-2">
          Payment Not Completed
        </h1>
        <p className="text-muted text-sm leading-relaxed mb-8">
          The payment was cancelled or timed out. Your cart is still saved.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full rounded-2xl"
            onClick={onRetry}
          >
            Try Again
          </Button>
          <Link href="/cart">
            <Button variant="ghost" size="lg" className="w-full rounded-2xl">
              Return to Cart
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}