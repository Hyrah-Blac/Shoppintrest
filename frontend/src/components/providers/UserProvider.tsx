'use client'

import { useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'
import api, { setTokenGetter } from '@/lib/api'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth()
  const { user: clerkUser } = useUser()
  const fetchUser  = useUserStore((s) => s.fetchUser)
  const clearUser  = useUserStore((s) => s.clearUser)
  const fetchCart  = useCartStore((s) => s.fetchCart)
  const resetCart  = useCartStore((s) => s.reset)

  // Always keep the token getter fresh before any API call fires
  setTokenGetter(() => getToken({ template: 'backend' }))

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
            await api.post('/api/users/sync', {
              type: 'user.created',
              data: {
                id:              clerkUser.id,
                email_addresses: clerkUser.emailAddresses.map((e) => ({
                  email_address: e.emailAddress,
                })),
                username:   clerkUser.username,
                image_url:  clerkUser.imageUrl,
                first_name: clerkUser.firstName,
                last_name:  clerkUser.lastName,
              },
            })
          } catch {
            // Already exists — that's fine
          }

          // Upsert Novu subscriber so realtime delivery works for this user
          try {
            await api.post('/api/notifications/sync-subscriber')
          } catch {
            // Non-fatal — notifications will still work on next login
          }

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
  }, [isSignedIn, isLoaded, clerkUser])

  return <>{children}</>
}