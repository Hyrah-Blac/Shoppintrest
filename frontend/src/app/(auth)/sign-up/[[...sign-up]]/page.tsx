'use client'

import { useSignUp, useUser, useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import api from '@/lib/api'

export default function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const { isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'form' | 'verify'>('form')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!isSignedIn || !clerkUser) return
    const syncAndRedirect = async () => {
      setSyncing(true)
      const token = await getToken()
      if (!token) { router.replace('/sign-up'); return }
      const authHeader = { Authorization: `Bearer ${token}` }
      try {
        await api.post('/api/users/sync', {
          type: 'user.created',
          data: {
            id: clerkUser.id,
            email_addresses: clerkUser.emailAddresses.map((e) => ({ email_address: e.emailAddress })),
            username: clerkUser.username,
            image_url: clerkUser.imageUrl,
            first_name: clerkUser.firstName,
            last_name: clerkUser.lastName,
          },
        }, { headers: authHeader })
      } catch {}
      let attempts = 0
      while (attempts < 5) {
        try {
          const res = await api.get('/api/users/me', { headers: authHeader })
          const user = res.data?.data
          if (user?.role === 'admin') { router.replace('/admin'); return }
          if (user?.role) { router.replace('/'); return }
        } catch {}
        attempts++
        await new Promise((r) => setTimeout(r, 800))
      }
      setSyncing(false)
      router.replace('/')
    }
    syncAndRedirect()
  }, [isSignedIn, clerkUser, router, getToken])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStage('verify')
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError.errors?.[0]?.message ?? 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError.errors?.[0]?.message ?? 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6875rem 1rem',
    borderRadius: 'var(--radius)',
    border: '1.5px solid hsl(var(--input))',
    background: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    fontSize: 'var(--text-body)',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.6)'
    e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--accent) / 0.12)'
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'hsl(var(--input))'
    e.currentTarget.style.boxShadow = 'none'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'hsl(var(--foreground))',
    marginBottom: '0.375rem',
  }

  if (syncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--accent))' }} />
        <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>Setting up your account…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'hsl(var(--background))' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-float)', padding: '2.5rem 2rem' }}>

          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-5" style={{ position: 'relative', width: 40, height: 40, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <Image src="/logo.png" alt="Shoppin" fill className="object-contain" priority />
            </div>
            <h1 className="font-display font-bold" style={{ fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', color: 'hsl(var(--foreground))', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.375rem' }}>
              {stage === 'form' ? 'Create your account' : 'Verify your email'}
            </h1>
            <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
              {stage === 'form' ? 'Join Shoppin and start discovering' : `We sent a code to ${email}`}
            </p>
          </div>

          {/* Stage: registration form */}
          {stage === 'form' && (
            <form onSubmit={handleRegister} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="firstName" style={labelStyle}>First name</label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" style={labelStyle}>Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: '1rem', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.20)', color: 'hsl(var(--destructive))', fontSize: 'var(--text-sm)', fontWeight: 400 }}
                >
                  {error}
                </motion.div>
              )}

              <button type="submit" disabled={loading} className="btn-save" style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem' }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
                <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
              </div>

              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={async () => {
                  if (!isLoaded) return
                  await signUp.authenticateWithRedirect({
                    strategy: 'oauth_google',
                    redirectUrl: '/sso-callback',
                    redirectUrlComplete: '/',
                  })
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 8 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </form>
          )}

          {/* Stage: email verification */}
          {stage === 'verify' && (
            <form onSubmit={handleVerify} noValidate>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="code" style={labelStyle}>Verification code</label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{ ...inputStyle, letterSpacing: '0.2em', fontWeight: 500, textAlign: 'center', fontSize: '1.25rem' }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: '1rem', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.20)', color: 'hsl(var(--destructive))', fontSize: 'var(--text-sm)', fontWeight: 400 }}
                >
                  {error}
                </motion.div>
              )}

              <button type="submit" disabled={loading} className="btn-save" style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem' }}>
                {loading ? 'Verifying…' : 'Verify email'}
              </button>

              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                onClick={() => { setStage('form'); setError('') }}
              >
                Back
              </button>
            </form>
          )}

        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 300 }}>
          Already have an account?{' '}
          <a href="/sign-in" style={{ color: 'hsl(var(--accent))', fontWeight: 500 }}>Sign in</a>
        </p>

      </motion.div>
    </div>
  )
}