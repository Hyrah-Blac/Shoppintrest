'use client'

import { useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'
import api, { setTokenGetter } from '@/lib/api'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth()
  const { user: clerkUser } = useUser()
  const fetchUser = useUserStore((s) => s.fetchUser)
  const clearUser = useUserStore((s) => s.clearUser)
  const fetchCart = useCartStore((s) => s.fetchCart)
  const resetCart = useCartStore((s) => s.reset)

  // FIX 1 — move setTokenGetter into an effect so it doesn't run on every render
  useEffect(() => {
    setTokenGetter(() => getToken({ template: 'backend' }))
  }, [getToken])

  // One-time: nuke any stale localStorage cart from the old persist middleware
  useEffect(() => {
    localStorage.removeItem('shoppintrest-cart')
  }, [])
useEffect(() => {
  if (!isLoaded) return

  if (isSignedIn && clerkUser) {
    const syncAndFetch = async () => {
      try {
        const token = await getToken({ template: 'backend' })
        if (!token) return

        try {
          await api.post('/api/users/clerk/sync', {})
        } catch {}

        try {
          await api.post('/api/notifications/sync-subscriber')
        } catch {}

        await fetchUser()
        await fetchCart()
      } catch (err) {
        console.error('UserProvider sync failed:', err)
      }
    }

    syncAndFetch()
  } else if (isLoaded && !isSignedIn) {
    clearUser()
    resetCart()
  }
}, [isSignedIn, isLoaded, clerkUser?.id])
  return <>{children}</>
}