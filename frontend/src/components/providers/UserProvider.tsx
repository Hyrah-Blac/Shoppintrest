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

  // Register token getter once so axios always has a fresh token
  useEffect(() => {
    setTokenGetter(() => getToken({ template: 'backend' }))
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && clerkUser) {
      const syncAndFetch = async () => {
        try {
          // Wait for a valid token before making any API calls
          const token = await getToken({ template: 'backend' })
          if (!token) return

          // Sync Clerk user to MongoDB
          try {
            await api.post('/api/users/sync', {
              type: 'user.created',
              data: {
                id: clerkUser.id,
                email_addresses: clerkUser.emailAddresses.map((e) => ({
                  email_address: e.emailAddress,
                })),
                username: clerkUser.username,
                image_url: clerkUser.imageUrl,
                first_name: clerkUser.firstName,
                last_name: clerkUser.lastName,
              },
            })
          } catch {
            // Already exists — that's fine
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
    }
  }, [isSignedIn, isLoaded, clerkUser])

  return <>{children}</>
}