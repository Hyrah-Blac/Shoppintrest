'use client'

import { SignIn, useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function SignInPage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const res = await api.get('/api/users/me')

        const user = res.data?.data

        if (user?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Role check failed:', error)
      }
    }

    if (isSignedIn) {
      checkUserRole()
    }
  }, [isSignedIn, router])

  return (
    <div
      className="min-h-screen flex items-center justify-center
                 bg-background px-4"
    >
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