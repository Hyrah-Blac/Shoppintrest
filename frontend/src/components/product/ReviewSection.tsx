'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Check, ThumbsUp } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatRelativeTime, cn } from '@/lib/utils'

interface Props { productId: string }

export function ReviewSection({ productId }: Props) {
  const { isSignedIn } = useAuth()
  const [reviews,     setReviews]     = useState<any[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [isSubmitting,setIsSubmitting]= useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState({ rating: 5, title: '', body: '' })

  const fetchReviews = () => {
    apiClient.reviews.getForProduct(productId)
      .then(({ data }) => setReviews(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchReviews() }, [productId])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setIsSubmitting(true)
    try {
      await apiClient.reviews.create(productId, form)
      toast.success('Review submitted!')
      setShowForm(false)
      setForm({ rating: 5, title: '', body: '' })
      fetchReviews()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not submit review')
    } finally { setIsSubmitting(false) }
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }))

  return (
    <div className="border-t border-border pt-16">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Reviews</h2>
          {reviews.length > 0 && (
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted))' }}>
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          )}
        </div>
        {isSignedIn && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-ghost text-sm"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Rating summary */}
      {reviews.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12 p-6 border"
          style={{
            background: 'hsl(var(--background-secondary))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-6xl font-bold tracking-tight text-foreground">
              {avgRating.toFixed(1)}
            </span>
            <div className="flex gap-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  style={{
                    color: i < Math.round(avgRating)
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--border))',
                    fill: 'currentColor',
                  }}
                />
              ))}
            </div>
            <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>
              Based on {reviews.length} reviews
            </p>
          </div>
          <div className="space-y-2.5">
            {ratingBreakdown.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs w-3 text-right" style={{ color: 'hsl(var(--muted))' }}>
                  {star}
                </span>
                <Star size={10} style={{ color: 'hsl(var(--muted))', fill: 'currentColor' }} className="shrink-0" />
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'hsl(var(--border))' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: 'hsl(var(--accent))' }}
                  />
                </div>
                <span className="text-xs w-4 text-right" style={{ color: 'hsl(var(--muted))' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="mb-10 p-6 border space-y-4"
              style={{
                background: 'hsl(var(--background-secondary))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <h3 className="font-semibold text-foreground">Your Review</h3>

              {/* Star picker */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setForm((f) => ({ ...f, rating: star }))}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      style={{
                        color: star <= form.rating
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--border))',
                        fill: 'currentColor',
                      }}
                    />
                  </button>
                ))}
              </div>

              <Input
                label="Title"
                placeholder="Summarize your experience"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={150}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Review</label>
                <textarea
                  className="w-full h-28 px-4 py-3 text-sm resize-none
                             transition-colors focus:outline-none"
                  style={{
                    background: 'hsl(var(--background))',
                    border: '1.5px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--foreground))',
                  }}
                  placeholder="Tell others about your experience..."
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  maxLength={2000}
                  onFocus={(e) => { e.target.style.borderColor = 'hsl(var(--accent) / 0.5)' }}
                  onBlur={(e)  => { e.target.style.borderColor = 'hsl(var(--border))' }}
                />
                <p className="text-xs text-right" style={{ color: 'hsl(var(--muted))' }}>
                  {form.body.length}/2000
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-save"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded-full" />
                <div className="skeleton h-3 w-full rounded-full" />
                <div className="skeleton h-3 w-3/4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">✦</p>
          <p className="font-semibold text-foreground mb-1">No reviews yet</p>
          <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>
            Be the first to share your experience
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {reviews.map((review) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="pb-8 border-b border-border last:border-0"
            >
              <div className="flex items-start gap-4">
                <Avatar src={review.user?.avatar} name={review.user?.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      {review.user?.displayName}
                    </p>
                    {review.isVerifiedPurchase && (
                      <span
                        className="flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: '#16a34a' }}
                      >
                        <Check size={10} />
                        Verified
                      </span>
                    )}
                    <span className="text-[10px] ml-auto" style={{ color: 'hsl(var(--muted))' }}>
                      {formatRelativeTime(review.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-px mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        style={{
                          color: i < review.rating
                            ? 'hsl(var(--accent))'
                            : 'hsl(var(--border))',
                          fill: 'currentColor',
                        }}
                      />
                    ))}
                  </div>

                  <p className="text-sm font-semibold text-foreground mb-1">{review.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted))' }}>
                    {review.body}
                  </p>

                  <button
                    onClick={() => apiClient.reviews.markHelpful(review._id)}
                    className="mt-3 flex items-center gap-1.5 text-xs
                               transition-colors hover:text-foreground"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    <ThumbsUp size={11} />
                    Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}