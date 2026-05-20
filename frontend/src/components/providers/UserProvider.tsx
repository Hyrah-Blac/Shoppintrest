'use client'

import { useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'
import api from '@/lib/api'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  const { user: clerkUser, isLoaded } = useUser()
  const fetchUser = useUserStore((s) => s.fetchUser)
  const clearUser = useUserStore((s) => s.clearUser)
  const fetchCart = useCartStore((s) => s.fetchCart)

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && clerkUser) {
      // Sync Clerk user to MongoDB first
      const syncAndFetch = async () => {
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

        // Now fetch the MongoDB user
        await fetchUser()
        await fetchCart()
      }

      syncAndFetch()
    } else if (isLoaded && !isSignedIn) {
      clearUser()
    }
  }, [isSignedIn, isLoaded, clerkUser])

  return <>{children}</>
}