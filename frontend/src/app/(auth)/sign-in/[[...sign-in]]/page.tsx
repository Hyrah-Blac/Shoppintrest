'use client'

import { SignIn, useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function SignInPage() {
  const { isSignedIn, user: clerkUser } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isSignedIn || !clerkUser) return

    const syncAndRedirect = async () => {
      // Step 1 — sync Clerk user to MongoDB
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
        // User likely already exists — continue
      }

      // Step 2 — retry fetching user until role is available
      let attempts = 0
      const maxAttempts = 5

      while (attempts < maxAttempts) {
        try {
          const res = await api.get('/api/users/me')
          const user = res.data?.data

          if (user?.role === 'admin') {
            router.push('/admin')
            return
          }

          if (user?.role) {
            router.push('/')
            return
          }
        } catch {
          // Not ready yet — wait and retry
        }

        attempts++
        await new Promise((resolve) => setTimeout(resolve, 800))
      }

      // Fallback after all retries
      router.push('/')
    }

    syncAndRedirect()
  }, [isSignedIn, clerkUser, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted mt-2">
            Sign in to your Shoppintrest account
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  )
}