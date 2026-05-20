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

  // Set token getter synchronously on every render so it's
  // always available before any API call fires
  setTokenGetter(() => getToken({ template: 'backend' }))

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