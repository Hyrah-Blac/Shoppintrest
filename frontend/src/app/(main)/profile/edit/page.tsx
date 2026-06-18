'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Camera, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useUserStore } from '@/store/useUserStore'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ProfileEditPage() {
  const router     = useRouter()
  const user       = useUserStore((s) => s.user)
  const updateUser = useUserStore((s) => s.updateUser)

  const [form, setForm] = useState({
    displayName: '',
    bio:         '',
    avatar:      '',
  })
  const [isLoading,        setIsLoading]        = useState(false)
  const [isUploadingAvatar,setIsUploadingAvatar] = useState(false)
  const [initialForm,      setInitialForm]      = useState(form)
  const fileRef = useRef<HTMLInputElement>(null)

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm)

  useEffect(() => {
    if (user) {
      const loaded = {
        displayName: user.displayName || '',
        bio:         user.bio         || '',
        avatar:      user.avatar      || '',
      }
      setForm(loaded)
      setInitialForm(loaded)
    }
  }, [user])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setIsUploadingAvatar(true)
    try {
      const { data } = await apiClient.upload.image(file, 'shoppintrest/avatars')
      setForm(f => ({ ...f, avatar: data.data.url }))
      toast.success('Photo uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!form.displayName.trim()) { toast.error('Display name is required'); return }
    setIsLoading(true)
    try {
      await updateUser(form)
      setInitialForm(form)
      toast.success('Profile updated')
      router.push(`/profile/${user?.username}`)
    } catch {
      toast.error('Could not save profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-xl px-4 py-10">
        <Link
          href={`/profile/${user?.username}`}
          className="inline-flex items-center gap-2 text-sm text-muted
                     hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to profile
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-background rounded-3xl border border-border p-8 space-y-7"
        >
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Edit profile
            </h1>
            <p className="text-sm text-muted mt-1">
              Update your public profile information
            </p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border-2 border-border">
                {form.avatar ? (
                  <Image src={form.avatar} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-2xl font-semibold select-none">
                    {form.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isUploadingAvatar}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                           bg-foreground text-background flex items-center
                           justify-center shadow-sm
                           hover:opacity-80 disabled:opacity-50 transition-opacity"
              >
                {isUploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile photo</p>
              <p className="text-xs text-muted mt-0.5">JPG, PNG or WebP · max 5 MB</p>
            </div>
          </div>

          {/* Fields */}
          <div className="border-t border-border" />
          <div className="space-y-5">
            <Input
              label="Display name"
              placeholder="Your name"
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              maxLength={60}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Bio</label>
              <textarea
                className="w-full h-24 rounded-xl border border-input bg-background
                           px-4 py-3 text-sm text-foreground placeholder:text-muted
                           resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tell the world about yourself..."
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                maxLength={300}
              />
              <p className="text-xs text-muted text-right tabular-nums">{form.bio.length}/300</p>
            </div>
          </div>

          {/* Read-only account info */}
          <div className="px-4 py-3 bg-surface rounded-xl border border-border space-y-2.5">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">Account</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Username</span>
              <span className="font-medium">@{user?.username}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Email</span>
              <span className="font-medium truncate max-w-[60%] text-right">{user?.email}</span>
            </div>
            <p className="text-xs text-muted pt-0.5">Username and email are managed in account settings.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 rounded-2xl"
              isLoading={isLoading}
              disabled={!isDirty || isLoading}
              onClick={handleSave}
            >
              Save changes
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl"
              disabled={isLoading}
              onClick={() => router.push(`/profile/${user?.username}`)}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}