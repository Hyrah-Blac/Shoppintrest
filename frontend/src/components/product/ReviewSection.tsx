'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    rating: 5, title: '', body: '',
  })

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
    } finally {
      setIsSubmitting(false)
    }
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
        : 0,
  }))

  return (
    <div className="border-t border-border pt-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Reviews
          </h2>
          {reviews.length > 0 && (
            <p className="text-sm text-muted mt-1">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          )}
        </div>
        {isSignedIn && (
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </Button>
        )}
      </div>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12
                        p-6 bg-surface rounded-2xl border border-border">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="font-display text-6xl font-semibold">
              {avgRating.toFixed(1)}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={cn(
                    i < Math.round(avgRating)
                      ? 'text-foreground fill-current'
                      : 'text-border fill-current'
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted">
              Based on {reviews.length} reviews
            </p>
          </div>
          <div className="space-y-2">
            {ratingBreakdown.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-muted w-4">{star}</span>
                <Star size={10} className="text-muted fill-current shrink-0" />
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full bg-foreground rounded-full"
                  />
                </div>
                <span className="text-xs text-muted w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      <AnimateReviewForm show={showForm}>
        <div className="mb-10 p-6 bg-surface rounded-2xl border border-border space-y-4">
          <h3 className="font-medium text-foreground">Your Review</h3>

          {/* Star Picker */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setForm((f) => ({ ...f, rating: star }))}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={22}
                  className={cn(
                    star <= form.rating
                      ? 'text-foreground fill-current'
                      : 'text-border fill-current'
                  )}
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
            <label className="block text-sm font-medium text-foreground">
              Review
            </label>
            <textarea
              className="w-full h-28 rounded-xl border border-input bg-background
                         px-4 py-3 text-sm text-foreground placeholder:text-muted
                         resize-none focus:outline-none focus:ring-2 focus:ring-ring
                         transition-colors"
              placeholder="Tell others about your experience..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              maxLength={2000}
            />
            <p className="text-xs text-muted text-right">
              {form.body.length}/2000
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Submit Review
          </Button>
        </div>
      </AnimateReviewForm>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-4">✦</p>
          <p className="font-medium text-foreground mb-1">No reviews yet</p>
          <p className="text-sm">Be the first to share your experience</p>
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
                <Avatar
                  src={review.user?.avatar}
                  name={review.user?.displayName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">
                      {review.user?.displayName}
                    </p>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-2xs text-emerald-600
                                       dark:text-emerald-400">
                        <Check size={10} />
                        Verified Purchase
                      </span>
                    )}
                    <span className="text-2xs text-muted ml-auto">
                      {formatRelativeTime(review.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-0.5 mt-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={cn(
                          i < review.rating
                            ? 'text-foreground fill-current'
                            : 'text-border fill-current'
                        )}
                      />
                    ))}
                  </div>

                  <p className="text-sm font-medium text-foreground mb-1">
                    {review.title}
                  </p>
                  <p className="text-sm text-muted leading-relaxed">
                    {review.body}
                  </p>

                  <button
                    onClick={() => apiClient.reviews.markHelpful(review._id)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-muted
                               hover:text-foreground transition-colors"
                  >
                    <ThumbsUp size={12} />
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

function AnimateReviewForm({
  show, children,
}: {
  show: boolean
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}