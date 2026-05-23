'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Check, ThumbsUp } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { formatRelativeTime, cn } from '@/lib/utils'

interface Props { productId: string }

export function ReviewSection({ productId }: Props) {
  const { isSignedIn } = useAuth()
  const [reviews,     setReviews]     = useState<any[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [isSubmitting,setIsSubmitting]= useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [form, setForm] = useState({ rating: 5, title: '', body: '' })

  const fetchReviews = () => {
    apiClient.reviews.getForProduct(productId)
      .then(({ data }) => setReviews(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchReviews() }, [productId])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Please fill in all fields'); return
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

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:   reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }))

  return (
    <div
      className="border-t pt-16"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, var(--text-section))' }}
          >
            Customer{' '}
            <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
              Reviews
            </em>
          </h2>
          {reviews.length > 0 && (
            <p
              className="text-sm mt-1"
              style={{ color: 'hsl(var(--muted))' }}
            >
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          )}

          {/* Accent underline */}
          <motion.div
            className="mt-3 h-[2px] w-10 rounded-full"
            style={{ background: 'hsl(var(--accent))' }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
          />
        </motion.div>

        {isSignedIn && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-ghost' : 'btn-save'}
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* ── Rating Summary ── */}
      {reviews.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12
                     p-6 rounded-[var(--radius-xl)] border shadow-[var(--shadow-card)]"
          style={{
            background:  'hsl(var(--surface))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          {/* Average score */}
          <div className="flex flex-col items-center justify-center gap-2">
            <span
              className="font-display font-bold tracking-[-0.03em]"
              style={{ fontSize: 'clamp(3rem, 6vw, 4rem)' }}
            >
              {avgRating.toFixed(1)}
            </span>
            <div className="flex gap-0.5">
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
            <p
              className="text-sm"
              style={{ color: 'hsl(var(--muted))' }}
            >
              Based on {reviews.length} reviews
            </p>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-2.5">
            {ratingBreakdown.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span
                  className="text-xs w-4 text-right"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {star}
                </span>
                <Star
                  size={10}
                  style={{ color: 'hsl(var(--muted))', fill: 'currentColor' }}
                  className="shrink-0"
                />
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'hsl(var(--border))' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: 'hsl(var(--accent))' }}
                  />
                </div>
                <span
                  className="text-xs w-4 text-right"
                  style={{ color: 'hsl(var(--muted))' }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Review Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{   opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden mb-10"
          >
            <div
              className="p-6 rounded-[var(--radius-xl)] border shadow-[var(--shadow-card)]
                         space-y-4"
              style={{
                background:  'hsl(var(--surface))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <h3
                className="font-medium"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Your Review
              </h3>

              {/* Star picker */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setForm((f) => ({ ...f, rating: star }))}
                    className="p-1 transition-transform duration-[var(--duration-fast)]
                               hover:scale-110"
                  >
                    <Star
                      size={22}
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
                <label
                  className="block text-sm font-medium"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  Review
                </label>
                <textarea
                  className="w-full h-28 rounded-[var(--radius)] px-4 py-3 text-sm
                             resize-none outline-none transition-all
                             duration-[var(--duration-hover)]"
                  style={{
                    background:  'hsl(var(--background))',
                    border:      '1.5px solid hsl(var(--input))',
                    color:       'hsl(var(--foreground))',
                    fontFamily:  "'DM Sans', sans-serif",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.6)'
                    e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--input))'
                    e.currentTarget.style.boxShadow   = 'none'
                  }}
                  placeholder="Tell others about your experience..."
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  maxLength={2000}
                />
                <p
                  className="text-xs text-right"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {form.body.length}/2000
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  'btn-save gap-2',
                  isSubmitting && 'opacity-60 cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reviews List ── */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded-[var(--radius-sm)]" />
                <div className="skeleton h-3 w-full rounded-[var(--radius-sm)]" />
                <div className="skeleton h-3 w-3/4 rounded-[var(--radius-sm)]" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">✦</p>
          <p
            className="font-medium mb-1"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            No reviews yet
          </p>
          <p
            className="text-sm"
            style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
          >
            Be the first to share your experience
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {reviews.map((review, i) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="pb-8 border-b last:border-0"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <div className="flex items-start gap-4">
                <Avatar
                  src={review.user?.avatar}
                  name={review.user?.displayName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {review.user?.displayName}
                    </p>
                    {review.isVerifiedPurchase && (
                      <span
                        className="flex items-center gap-1 text-[10px] font-medium"
                        style={{ color: 'hsl(142 60% 40%)' }}
                      >
                        <Check size={10} />
                        Verified Purchase
                      </span>
                    )}
                    <span
                      className="text-[10px] ml-auto"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      {formatRelativeTime(review.createdAt)}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 mt-1 mb-2">
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

                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {review.title}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                  >
                    {review.body}
                  </p>

                  <button
                    onClick={() => apiClient.reviews.markHelpful(review._id)}
                    className="mt-3 flex items-center gap-1.5 text-xs
                               transition-colors duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--muted))' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'hsl(var(--muted))')}
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