'use client'

import { useClerk, useSignIn, useUser, useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useCartStore } from '@/store/useCartStore'

// ── parse Clerk's non-enumerable error object ──────────────────────────────────
function parseClerkError(err: any): { code: string; message: string; longMessage: string } {
  const e = Array.isArray(err?.errors) ? err.errors[0] : err
  return {
    code:        String(e?.code        ?? ''),
    message:     String(e?.message     ?? ''),
    longMessage: String(e?.longMessage ?? e?.message ?? ''),
  }
}

function friendlyError(code: string, message: string, longMessage: string): string {
  if (code === 'form_password_incorrect' || code === 'form_identifier_not_found')
    return 'Incorrect email or password.'
  if (code === 'too_many_requests')
    return 'Too many attempts. Please wait and try again.'
  if (code.includes('captcha') || message.toLowerCase().includes('captcha'))
    return 'Security check failed. Please refresh and try again.'
  if (code === 'form_param_format_invalid' || message.toLowerCase().includes('email'))
    return 'Please enter a valid email address.'
  if (code === 'account_transfer_invalid' || message.toLowerCase().includes('google') || message.toLowerCase().includes('oauth'))
    return 'This email is linked to a Google account. Please use Continue with Google below.'
  return longMessage || message || 'Sign in failed. Please try again.'
}

const RESEND_WAIT = 30 // seconds

export default function SignInPage() {
  const { signIn, setActive } = useSignIn()
  const clerk = useClerk()
  const { isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  const fetchCart = useCartStore((s) => s.fetchCart)

  const lastSyncedUserId = useRef<string | null>(null)
  const cooldownRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  const [stage,          setStage]          = useState<'form' | 'verify'>('form')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [code,           setCode]           = useState('')
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [googleLoading,  setGoogleLoading]  = useState(false)
  const [syncing,        setSyncing]        = useState(false)
  const [syncError,      setSyncError]      = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading,  setResendLoading]  = useState(false)
  const [resendSuccess,  setResendSuccess]  = useState(false)

  // clean up countdown on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  // ── sync after successful auth ───────────────────────────────────────────────
  useEffect(() => {
    if (!clerk.loaded || !isSignedIn || !clerkUser) return
    if (lastSyncedUserId.current === clerkUser.id) return
    lastSyncedUserId.current = clerkUser.id

    const syncAndRedirect = async () => {
      try {
        setSyncing(true)
        setSyncError('')

        let token: string | null = null
        for (let i = 0; i < 5; i++) {
          token = await getToken()
          if (token) break
          await new Promise((r) => setTimeout(r, 500))
        }

        if (!token) {
          setError('Unable to establish session. Please try again.')
          setSyncing(false)
          return
        }

        const authHeader = { Authorization: `Bearer ${token}` }

        try {
          await api.post('/api/users/clerk/sync', {}, { headers: authHeader })
        } catch (syncErr: any) {
          console.error('[sync] Failed to sync user with backend:', syncErr)
          setSyncError('We could not finish signing you in. Please refresh or contact support.')
          setSyncing(false)
          return
        }

        await fetchCart()

        let attempts = 0
        while (attempts < 5) {
          try {
            const res = await api.get('/api/users/me', { headers: authHeader })
            const user = res.data?.data
            if (user?.role === 'admin') { router.replace('/admin'); return }
            if (user?.role)             { router.replace('/');      return }
          } catch {}
          attempts++
          await new Promise((r) => setTimeout(r, 800))
        }

        router.replace('/')
      } finally {
        setSyncing(false)
      }
    }

    syncAndRedirect()
  }, [clerk.loaded, isSignedIn, clerkUser, router, getToken, fetchCart])

  // ── cooldown ticker ──────────────────────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(RESEND_WAIT)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── sign in (form stage) ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    setError('')
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        return
      }

      const needsEmail =
        result.status === 'needs_second_factor' ||
        result.status === 'needs_first_factor'  ||
        result.supportedFirstFactors?.some((f: any) => f.strategy === 'email_code') ||
        result.supportedSecondFactors?.some((f: any) => f.strategy === 'email_code')

      if (needsEmail) {
        try {
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: (result.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code') as any)?.emailAddressId ?? '' })
        } catch {
          // prepareFirstFactor may not be needed for second-factor flows — ignore
        }
        setStage('verify')
        startCooldown()
      } else {
        setError('Additional verification required. Please check your email.')
      }
    } catch (err: any) {
      const { code, message, longMessage } = parseClerkError(err)
      setError(friendlyError(code, message, longMessage))
    } finally {
      setLoading(false)
    }
  }

  // ── verify (OTP stage) ───────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    setError('')
    setLoading(true)
    try {
      let result: any
      try {
        result = await signIn.attemptFirstFactor({ strategy: 'email_code', code })
      } catch {
        result = await (signIn as any).attemptSecondFactor({ strategy: 'email_code', code })
      }

      const status    = result?.status            ?? signIn.status
      const sessionId = result?.createdSessionId  ?? signIn.createdSessionId

      if (status === 'complete') {
        await setActive({ session: sessionId })
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      const { code, message, longMessage } = parseClerkError(err)
      setError(friendlyError(code, message, longMessage))
    } finally {
      setLoading(false)
    }
  }

  // ── resend code ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!signIn || resendLoading || resendCooldown > 0) return
    setResendLoading(true)
    setResendSuccess(false)
    setError('')
    try {
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: ((signIn as any).supportedFirstFactors?.find((f: any) => f.strategy === 'email_code') as any)?.emailAddressId ?? '',
      })
      setResendSuccess(true)
      startCooldown()
      setTimeout(() => setResendSuccess(false), 4000)
    } catch (err: any) {
      const { code, message, longMessage } = parseClerkError(err)
      setError(friendlyError(code, message, longMessage))
    } finally {
      setResendLoading(false)
    }
  }

  // ── google ────────────────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (!clerk.loaded || googleLoading) return
    setGoogleLoading(true)

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      window.location.origin

    try {
      await clerk.client!.signIn.authenticateWithRedirect({
        strategy:            'oauth_google',
        redirectUrl:         `${appUrl}/sso-callback`,
        redirectUrlComplete: `${appUrl}/`,
      })
    } catch (err: any) {
      const { message, longMessage } = parseClerkError(err)
      setError(longMessage || message || 'Google sign in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  // ── styles ────────────────────────────────────────────────────────────────────
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
    e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.12)'
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'hsl(var(--input))'
    e.currentTarget.style.boxShadow   = 'none'
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500,
    color: 'hsl(var(--foreground))', marginBottom: '0.375rem',
  }
  const errorBoxStyle: React.CSSProperties = {
    marginBottom: '1rem',
    padding: '0.625rem 0.875rem',
    borderRadius: 'var(--radius-sm)',
    background: 'hsl(var(--destructive) / 0.08)',
    border: '1px solid hsl(var(--destructive) / 0.20)',
    color: 'hsl(var(--destructive))',
    fontSize: 'var(--text-sm)',
    fontWeight: 400,
    lineHeight: 1.55,
  }

  if (!clerk.loaded) return null

  if (syncing && !syncError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--accent))' }} />
      <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>Signing you in…</p>
    </div>
  )

  if (syncError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: 'hsl(var(--background))' }}>
      <div style={{ ...errorBoxStyle, maxWidth: 420, textAlign: 'center' }}>{syncError}</div>
      <button className="btn-ghost" onClick={() => { setSyncError(''); lastSyncedUserId.current = null }}>
        Try again
      </button>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'hsl(var(--background))' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-float)', padding: '2.5rem 2rem' }}>

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-5" style={{ position: 'relative', width: 40, height: 40, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <Image src="/logo.png" alt="Shoppin" fill sizes="40px" className="object-contain" priority />
            </div>
            <h1 className="font-display font-bold" style={{ fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', color: 'hsl(var(--foreground))', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.375rem' }}>
              {stage === 'form' ? 'Welcome back' : 'Check your email'}
            </h1>
            <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
              {stage === 'form' ? 'Sign in to your Shoppin account' : `We sent a verification code to ${email}`}
            </p>
          </div>

          {/* ── Form stage ─────────────────────────────────────────────────── */}
          {stage === 'form' && (
            <>
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="email" style={labelStyle}>Email</label>
                  <input
                    id="email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
                    <label htmlFor="password" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                      Password
                    </label>
                    <a href="/forgot-password" rel="noopener noreferrer" style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: 'hsl(var(--accent))' }}>
                      Forgot password?
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password" required
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: '2.75rem' }}
                      onFocus={handleFocus} onBlur={handleBlur}
                    />
                    <button
                      type="button" tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 0, fontSize: '0.85rem', lineHeight: 1 }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={errorBoxStyle}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading || googleLoading} className="btn-save"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
                <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
              </div>

              <button type="button" className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', opacity: googleLoading ? 0.7 : 1 }}
                disabled={googleLoading || loading}
                onClick={handleGoogleSignIn}
              >
                {googleLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--foreground))', marginRight: 8 }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 8 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>
            </>
          )}

          {/* ── Verify stage ───────────────────────────────────────────────── */}
          {stage === 'verify' && (
            <form onSubmit={handleVerify} noValidate>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="code" style={labelStyle}>Verification code</label>
                <input
                  id="code" type="text" inputMode="numeric" autoComplete="one-time-code"
                  required maxLength={6}
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{ ...inputStyle, letterSpacing: '0.2em', fontWeight: 500, textAlign: 'center', fontSize: '1.25rem' }}
                  onFocus={handleFocus} onBlur={handleBlur}
                />

                {/* resend row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    Didn't receive it? Check your spam folder.
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    style={{
                      background: 'none', border: 'none',
                      cursor: resendCooldown > 0 ? 'default' : 'pointer',
                      fontSize: '0.75rem', fontWeight: 500, padding: 0,
                      whiteSpace: 'nowrap', flexShrink: 0,
                      color: resendCooldown > 0 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--accent))',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {resendLoading ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                {/* success toast */}
                <AnimatePresence>
                  {resendSuccess && (
                    <motion.p
                      key="resend-ok"
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.375rem', fontWeight: 500 }}
                    >
                      ✓ New code sent — check your inbox.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={errorBoxStyle}>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading || code.length < 6} className="btn-save"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem', opacity: (loading || code.length < 6) ? 0.7 : 1 }}>
                {loading ? 'Verifying…' : 'Verify email'}
              </button>

              <button type="button" className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                onClick={() => { setStage('form'); setError(''); setCode(''); setResendCooldown(0); setResendSuccess(false) }}>
                Back
              </button>
            </form>
          )}

        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 300 }}>
          Don&apos;t have an account?{' '}
          <a href="/sign-up" rel="noopener noreferrer" style={{ color: 'hsl(var(--accent))', fontWeight: 500 }}>Join free</a>
        </p>

      </motion.div>
    </div>
  )
}