'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { useAuth } from '@clerk/nextjs'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const user = useUserStore((s) => s.user)
  const isLoading = useUserStore((s) => s.isLoading)

  useEffect(() => {
    if (!isLoaded || isLoading) return
    if (!isSignedIn) { router.push('/sign-in'); return }
    if (user && user.role !== 'admin') { router.push('/'); return }
  }, [isLoaded, isSignedIn, user, isLoading, router])

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-muted animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return <>{children}</>
}