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
    website:     '',
    avatar:      '',
  })
  const [isLoading,        setIsLoading]        = useState(false)
  const [isUploadingAvatar,setIsUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        bio:         user.bio         || '',
        website:     user.website     || '',
        avatar:      user.avatar      || '',
      })
    }
  }, [user])

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
      <div className="container-narrow py-10 max-w-2xl">
        <Link
          href={`/profile/${user?.username}`}
          className="inline-flex items-center gap-2 text-sm text-muted
                     hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to profile
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-3xl border border-border p-8 space-y-6"
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
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border-2 border-border">
                {form.avatar ? (
                  <Image src={form.avatar} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xl font-semibold">
                    {form.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                           bg-foreground text-background flex items-center
                           justify-center hover:opacity-80 transition-opacity"
              >
                {isUploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile photo</p>
              <p className="text-xs text-muted mt-0.5">JPG, PNG or WebP. Max 5MB.</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity mt-1"
              >
                Change photo
              </button>
            </div>
          </div>

          {/* Fields */}
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
            <p className="text-xs text-muted text-right">{form.bio.length}/300</p>
          </div>

          <Input
            label="Website"
            placeholder="https://yoursite.com"
            value={form.website}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            type="url"
          />

          {/* Read-only account info */}
          <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Account info</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Username</span>
              <span className="font-medium">@{user?.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <p className="text-xs text-muted">Username and email are managed via your account settings</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 rounded-2xl"
              isLoading={isLoading}
              onClick={handleSave}
            >
              Save changes
            </Button>
            <Link href={`/profile/${user?.username}`}>
              <Button variant="outline" size="lg" className="rounded-2xl">Cancel</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}