'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div
        className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{
          borderColor:    'hsl(var(--border))',
          borderTopColor: 'hsl(var(--accent))',
        }}
      />
      <p
        className="text-sm"
        style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
      >
        Completing sign in…
      </p>

      {/* Clerk silently finalises the OAuth session, then redirects */}
      <AuthenticateWithRedirectCallback />
    </div>
  )
}