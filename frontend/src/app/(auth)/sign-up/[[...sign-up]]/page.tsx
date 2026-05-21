'use client'

import { SignUp, useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function SignUpPage() {
  const { isSignedIn, user: clerkUser } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isSignedIn || !clerkUser) return

    const syncAndRedirect = async () => {
      // Sync new user to MongoDB
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
        // Already exists — fine
      }

      router.push('/')
    }

    syncAndRedirect()
  }, [isSignedIn, clerkUser, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Join Shoppintrest
          </h1>
          <p className="text-sm text-muted mt-2">
            Discover and collect luxury fashion
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}