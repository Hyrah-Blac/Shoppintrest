'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Globe, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export default function NewCollectionPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    isPrivate: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="container-narrow py-12 max-w-2xl">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-sm text-muted
                     hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to Collections
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-3xl border border-border p-8 space-y-6"
        >
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              New Collection
            </h1>
            <p className="text-sm text-muted mt-1">
              Curate a board of your favourite pieces
            </p>
          </div>

          <Input
            label="Collection Name"
            placeholder="e.g. Summer Essentials"
            value={form.title}
            error={errors.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            maxLength={100}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Description{' '}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full h-24 rounded-xl border border-input bg-background
                         px-4 py-3 text-sm text-foreground placeholder:text-muted
                         resize-none focus:outline-none focus:ring-2 focus:ring-ring
                         transition-colors"
              placeholder="Describe your collection..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              maxLength={500}
            />
            <p className="text-xs text-muted text-right">
              {form.description.length}/500
            </p>
          </div>

          {/* Privacy Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Privacy
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: false,
                  label: 'Public',
                  desc: 'Anyone can see this collection',
                  icon: Globe,
                },
                {
                  value: true,
                  label: 'Private',
                  desc: 'Only you can see this',
                  icon: Lock,
                },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() =>
                    setForm((f) => ({ ...f, isPrivate: opt.value }))
                  }
                  className={cn(
                    `flex items-start gap-3 p-4 rounded-xl border-2 text-left
                     transition-all duration-200`,
                    form.isPrivate === opt.value
                      ? 'border-foreground bg-surface'
                      : 'border-border hover:border-foreground/30'
                  )}
                >
                  <opt.icon size={16} className="text-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {opt.label}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 rounded-2xl"
              isLoading={isLoading}
              onClick={handleSubmit}
            >
              Create Collection
            </Button>
            <Link href="/collections">
              <Button variant="outline" size="lg" className="rounded-2xl">
                Cancel
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}