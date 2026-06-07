'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { useAuth } from '@clerk/nextjs'

function Spinner() {
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

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const user      = useUserStore((s) => s.user)
  const isLoading = useUserStore((s) => s.isLoading)

  // FIX — track whether a redirect is already in flight so we never
  // return null without a redirect running, eliminating the flash window.
  const redirecting = useRef(false)

  useEffect(() => {
    if (!isLoaded || isLoading) return

    if (!isSignedIn) {
      redirecting.current = true
      router.push('/sign-in')
      return
    }

    if (user && user.role !== 'admin') {
      redirecting.current = true
      router.push('/')
      return
    }
  }, [isLoaded, isSignedIn, user, isLoading, router])

  // Still waiting on Clerk or the user store
  if (!isLoaded || isLoading) return <Spinner />

  // Not signed in — redirect is in flight, show spinner not null
  if (!isSignedIn) return <Spinner />

  // Signed in but user not yet fetched — keep spinner, don't flash or null
  if (!user) return <Spinner />

  // User fetched but not admin — redirect is in flight, show spinner not null
  if (user.role !== 'admin') return <Spinner />

  return <>{children}</>
}