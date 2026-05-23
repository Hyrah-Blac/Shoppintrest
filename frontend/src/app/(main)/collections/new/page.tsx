'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Globe, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export default function NewCollectionPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title:       '',
    description: '',
    isPrivate:   false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors,    setErrors]    = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim())      e.title = 'Title is required'
    if (form.title.length > 100) e.title = 'Max 100 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const { data } = await apiClient.collections.create(form)
      toast.success('Collection created!')
      router.push(`/collections/${data.data._id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not create collection')
    } finally { setIsLoading(false) }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(var(--surface))' }}
    >
      <div className="container-narrow py-12 max-w-2xl">

        {/* Back link */}
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-sm mb-8
                     transition-colors duration-[var(--duration-hover)]"
          style={{ color: 'hsl(var(--muted))' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'hsl(var(--foreground))')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'hsl(var(--muted))')}
        >
          <ArrowLeft size={14} />
          Back to Collections
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="p-8 space-y-6 border shadow-[var(--shadow-card)]"
          style={{
            background:   'hsl(var(--background))',
            borderColor:  'hsl(var(--border))',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          {/* Header */}
          <div>
            <h1
              className="font-display font-bold tracking-[-0.03em] leading-[1.1]"
              style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
            >
              New Collection
            </h1>

            {/* Accent underline */}
            <motion.div
              className="mt-3 mb-1 h-[2px] w-10 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            />

            <p
              className="text-sm mt-2"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
            >
              Curate a board of your favourite pieces
            </p>
          </div>

          {/* Title */}
          <Input
            label="Collection Name"
            placeholder="e.g. Summer Essentials"
            value={form.title}
            error={errors.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={100}
          />

          {/* Description */}
          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Description{' '}
              <span style={{ color: 'hsl(var(--muted))', fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <textarea
              className="w-full h-24 px-4 py-3 text-sm outline-none resize-none
                         transition-[border-color,box-shadow]
                         duration-[var(--duration-hover)]"
              style={{
                background:   'hsl(var(--background))',
                border:       '1.5px solid hsl(var(--input))',
                borderRadius: 'var(--radius)',
                color:        'hsl(var(--foreground))',
                fontFamily:   "'DM Sans', sans-serif",
                fontWeight:   300,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.6)'
                e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.12)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--input))'
                e.currentTarget.style.boxShadow   = 'none'
              }}
              placeholder="Describe your collection…"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500}
            />
            <p
              className="text-xs text-right"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {form.description.length}/500
            </p>
          </div>

          {/* Privacy toggle */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Privacy
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: false,
                  label: 'Public',
                  desc:  'Anyone can see this collection',
                  icon:  Globe,
                },
                {
                  value: true,
                  label: 'Private',
                  desc:  'Only you can see this',
                  icon:  Lock,
                },
              ].map((opt) => {
                const isSelected = form.isPrivate === opt.value
                return (
                  <button
                    key={opt.label}
                    onClick={() =>
                      setForm((f) => ({ ...f, isPrivate: opt.value }))}
                    className="flex items-start gap-3 p-4 text-left
                               transition-all duration-[var(--duration-hover)]"
                    style={{
                      borderRadius: 'var(--radius)',
                      border:       `2px solid ${isSelected
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--border))'}`,
                      background: isSelected
                        ? 'hsl(var(--accent-muted))'
                        : 'transparent',
                      boxShadow: isSelected
                        ? 'var(--shadow-red)'
                        : 'none',
                    }}
                  >
                    <opt.icon
                      size={16}
                      className="mt-0.5 shrink-0"
                      style={{
                        color: isSelected
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--muted))',
                      }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        {opt.label}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                      >
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={cn(
                'btn-save flex-1 gap-2 py-3.5 text-sm justify-center',
                isLoading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isLoading ? 'Creating…' : 'Create Collection'}
            </button>
            <Link href="/collections" className="btn-ghost py-3.5 px-6 text-sm">
              Cancel
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}