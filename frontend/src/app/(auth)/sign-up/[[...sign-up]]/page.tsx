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
      try {
        await api.post('/api/users/sync', {
          type: 'user.created',
          data: {
            id: clerkUser.id,
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
     
      }

      router.push('/')
    }

    syncAndRedirect()
  }, [isSignedIn, clerkUser, router])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Ambient red glow — top */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40vw] h-64
                   rounded-full pointer-events-none opacity-[0.06]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">

        {/* ── Editorial header ── */}
        <div className="text-center mb-8">
          {/* Logo mark */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div
              className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center
                         text-sm font-bold text-white shadow-[var(--shadow-red)]"
              style={{
                background: 'hsl(var(--accent))',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              S
            </div>
            <span
              className="font-display text-xl font-semibold tracking-[-0.02em]"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Shoppintrest
            </span>
          </div>

          <h1
            className="font-display font-bold tracking-[-0.03em] leading-[1.1] mb-2"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            Join Shoppintrest
          </h1>

          {/* Accent underline */}
          <div
            className="mx-auto mt-3 mb-4 h-px w-10 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(var(--accent)), transparent)',
            }}
          />

          <p
            className="text-sm"
            style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
          >
            Discover and collect luxury fashion
          </p>
        </div>

        {/* Clerk SignUp — styled via global .cl-* overrides in blueprint CSS */}
        <SignUp />
      </div>
    </div>
  )
}