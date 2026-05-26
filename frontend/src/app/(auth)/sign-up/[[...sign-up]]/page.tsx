'use client'

import { useClerk, useSignUp, useUser, useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'

// ── password rules ─────────────────────────────────────────────────────────────
const PW_RULES = [
  { id: 'length', label: 'At least 8 characters',   test: (p: string) => p.length >= 8 },
  { id: 'upper',  label: 'One uppercase letter',     test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',  label: 'One lowercase letter',     test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number',               test: (p: string) => /\d/.test(p) },
]

// ── error sentinel constants ───────────────────────────────────────────────────
const ERR = {
  EMAIL_EXISTS:  'EMAIL_EXISTS',
  GOOGLE_EXISTS: 'GOOGLE_EXISTS',
} as const
type ErrKey = typeof ERR[keyof typeof ERR] | ''

const RESEND_WAIT = 30 // seconds

// ── dev-only logger (fix 1) ────────────────────────────────────────────────────
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') console.log(...args)
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const passed = PW_RULES.filter(r => r.test(password)).length
  const barColor = ['#ef4444', '#f97316', '#eab308', '#22c55e'][passed - 1] ?? 'hsl(var(--border))'
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: '0.375rem' }}>
        {PW_RULES.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < passed ? barColor : 'hsl(var(--border))', transition: 'background 0.25s ease' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {PW_RULES.map(r => {
          const ok = r.test(password)
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: ok ? '#22c55e' : 'hsl(var(--muted-foreground))' }}>
              <span style={{ fontSize: '0.65rem' }}>{ok ? '✓' : '○'}</span>
              {r.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
  devLog('[Clerk error]', { code, message, longMessage }) // fix 1 — dev only
  if (code.includes('captcha') || message.toLowerCase().includes('captcha'))
    return 'Security check failed. Please refresh and try again.'
  if (code === 'form_identifier_exists' || code === 'identifier_already_signed_in')
    return ERR.EMAIL_EXISTS
  if (code === 'external_account_exists' || message.toLowerCase().includes('google') || message.toLowerCase().includes('oauth'))
    return ERR.GOOGLE_EXISTS
  if (code === 'form_password_length_too_short')       return 'Password must be at least 8 characters.'
  if (code === 'form_password_pwned')                  return 'This password appeared in a data breach. Please choose another.'
  if (code === 'form_password_not_strong_enough')      return 'Password is too weak. Add uppercase letters, numbers, or symbols.'
  if (code === 'form_password_size_in_bytes_exceeded') return 'Password is too long.'
  if (code === 'form_param_format_invalid' || message.toLowerCase().includes('email')) return 'Please enter a valid email address.'
  if (code === 'form_param_nil')                       return longMessage || 'A required field is missing.'
  if (code === 'too_many_requests')                    return 'Too many attempts. Please wait and try again.'
  // fix 5 — session expiry during OTP stage
  if (code === 'expired_activity' || code === 'session_exists' || longMessage.toLowerCase().includes('expired'))
    return '__EXPIRED__'
  return longMessage || message || 'Sign up failed. Please try again.'
}

// ── component ──────────────────────────────────────────────────────────────────
export default function SignUpPage() {
  const { signUp } = useSignUp()
  const clerk = useClerk()
  const setActive = clerk.setActive
  const { isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()

  const lastSyncedUserId = useRef<string | null>(null)
  const cooldownRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [code,            setCode]            = useState('')
  const [stage,           setStage]           = useState<'form' | 'verify'>('form')
  const [errorKey,        setErrorKey]        = useState<ErrKey>('')
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [googleLoading,   setGoogleLoading]   = useState(false)
  const [syncing,         setSyncing]         = useState(false)
  const [syncError,       setSyncError]       = useState('')
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [resendCooldown,  setResendCooldown]  = useState(0)
  const [resendLoading,   setResendLoading]   = useState(false)
  const [resendSuccess,   setResendSuccess]   = useState(false)

  const passwordValid = PW_RULES.every(r => r.test(password))

  // cleanup countdown on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  // fix 2 — redirect already-signed-in users immediately
  useEffect(() => {
    if (clerk.loaded && isSignedIn && !syncing) router.replace('/')
  }, [clerk.loaded, isSignedIn, syncing, router])

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
          await new Promise(r => setTimeout(r, 500))
        }
        if (!token) {
          setError('Unable to establish session. Please try again.')
          setSyncing(false)
          return
        }

        const h = { Authorization: `Bearer ${token}` }

        try {
          await api.post('/api/users/clerk/sync', {}, { headers: h })
        } catch (syncErr: any) {
          console.error('[sync] Failed to sync user with backend:', syncErr)
          setSyncError('We could not finish setting up your account. Please refresh or contact support.')
          setSyncing(false)
          return
        }

        for (let i = 0; i < 5; i++) {
          try {
            const res = await api.get('/api/users/me', { headers: h })
            const user = res.data?.data
            if (user?.role === 'admin') { router.replace('/admin'); return }
            if (user?.role)             { router.replace('/');      return }
          } catch {}
          await new Promise(r => setTimeout(r, 800))
        }
        router.replace('/')
      } finally {
        setSyncing(false)
      }
    }

    syncAndRedirect()
  }, [clerk.loaded, isSignedIn, clerkUser, router, getToken])

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

  // ── register ─────────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp || !clerk.loaded) return
    if (!passwordValid) { setError('Please make sure your password meets all the requirements below.'); return }

    setError('')
    setErrorKey('')
    setLoading(true)
    try {
      const raw = await signUp.create({ firstName, lastName, emailAddress: email, password }) as any

      if (raw?.error) {
        const { code, message, longMessage } = parseClerkError(raw.error)
        const friendly = friendlyError(code, message, longMessage)
        setErrorKey(friendly as ErrKey)
        setError(friendly)
        setPassword('') // fix 3 — clear password on failure
        return
      }

      if (signUp.status === 'complete') {
        await setActive({ session: signUp.createdSessionId })
      } else {
        await signUp.sendEmailCode()
        setStage('verify')
        startCooldown()
      }
    } catch (err: any) {
      const { code, message, longMessage } = parseClerkError(err)
      const friendly = friendlyError(code, message, longMessage)
      setErrorKey(friendly as ErrKey)
      setError(friendly)
      setPassword('') // fix 3 — clear password on failure
    } finally {
      setLoading(false)
    }
  }

  // ── verify ────────────────────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return
    setError('')
    setLoading(true)
    try {
      const raw = await signUp.verifyEmailCode({ code }) as any
      const r = (raw?.result ?? raw) as any
      const status    = r?.status            ?? signUp.status
      const sessionId = r?.createdSessionId  ?? signUp.createdSessionId
      if (status === 'complete') {
        await setActive({ session: sessionId })
      } else {
        setError('Verification incomplete. Please try again.')
        setCode('') // fix 4 — clear bad code
      }
    } catch (err: any) {
      const { code: errCode, message, longMessage } = parseClerkError(err)
      const friendly = friendlyError(errCode, message, longMessage)
      // fix 5 — expired session: bounce back to form
      if (friendly === '__EXPIRED__') {
        setStage('form')
        setCode('')
        setErrorKey('')
        setResendCooldown(0)
        setError('Your session expired. Please start again.')
        return
      }
      setError(friendly)
      setCode('') // fix 4 — clear bad code
    } finally {
      setLoading(false)
    }
  }

  // ── resend code ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!signUp || resendLoading || resendCooldown > 0) return
    setResendLoading(true)
    setResendSuccess(false)
    setError('')
    try {
      await signUp.sendEmailCode()
      setResendSuccess(true)
      startCooldown()
      setTimeout(() => setResendSuccess(false), 4000)
    } catch (err: any) {
      const { code, message, longMessage } = parseClerkError(err)
      const friendly = friendlyError(code, message, longMessage)
      if (friendly === '__EXPIRED__') {
        setStage('form')
        setCode('')
        setResendCooldown(0)
        setError('Your session expired. Please start again.')
        return
      }
      setError(friendly)
    } finally {
      setResendLoading(false)
    }
  }

  // ── google — FIXED: use clerk.client.signUp instead of useSignUp() resource ──
  const handleGoogleSignUp = async () => {
    if (!clerk.loaded || googleLoading) return
    setGoogleLoading(true)

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      window.location.origin

    try {
      await clerk.client!.signUp.authenticateWithRedirect({
        strategy:            'oauth_google',
        redirectUrl:         `${appUrl}/sso-callback`,
        redirectUrlComplete: `${appUrl}/`,
      })
    } catch (err: any) {
      const { message } = parseClerkError(err)
      setError(message || 'Google sign up failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  // ── styles ────────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6875rem 1rem',
    borderRadius: 'var(--radius)', border: '1.5px solid hsl(var(--input))',
    background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
    fontSize: 'var(--text-body)', fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300, outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease', boxSizing: 'border-box',
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.6)'
    e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.12)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'hsl(var(--input))'
    e.currentTarget.style.boxShadow   = 'none'
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500,
    color: 'hsl(var(--foreground))', marginBottom: '0.375rem',
  }
  const errorBoxStyle: React.CSSProperties = {
    marginBottom: '1rem', padding: '0.625rem 0.875rem',
    borderRadius: 'var(--radius-sm)',
    background: 'hsl(var(--destructive) / 0.08)',
    border: '1px solid hsl(var(--destructive) / 0.20)',
    color: 'hsl(var(--destructive))', fontSize: 'var(--text-sm)',
    fontWeight: 400, lineHeight: 1.55,
  }

  if (!clerk.loaded) return null

  if (syncing && !syncError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--accent))' }} />
      <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>Setting up your account…</p>
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
      {/* Clerk Turnstile mounts here — must be in DOM before signUp.create() */}
      <div id="clerk-captcha" style={{ position: 'absolute', bottom: 0, right: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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
              {stage === 'form' ? 'Create your account' : 'Verify your email'}
            </h1>
            <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
              {stage === 'form' ? 'Join Shoppin and start discovering' : `We sent a code to ${email}`}
            </p>
          </div>

          {/* ── Form stage ─────────────────────────────────────────────────── */}
          {stage === 'form' && (
            <form onSubmit={handleRegister} noValidate>

              {/* Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="firstName" style={labelStyle}>First name</label>
                  <input id="firstName" type="text" autoComplete="given-name" required
                    value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label htmlFor="lastName" style={labelStyle}>Last name</label>
                  <input id="lastName" type="text" autoComplete="family-name" required
                    value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Doe" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input id="email" type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Password + strength */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    style={{ ...inputStyle, paddingRight: '2.75rem' }}
                    onFocus={e => { onFocus(e); setPasswordFocused(true) }}
                    onBlur={e  => { onBlur(e);  setPasswordFocused(false) }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 0, fontSize: '0.85rem', lineHeight: 1 }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <AnimatePresence>
                  {(passwordFocused || password.length > 0) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                      <PasswordStrength password={password} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={errorBoxStyle}>
                    {errorKey === ERR.EMAIL_EXISTS ? (
                      <>
                        An account with this email already exists.{' '}
                        <a href="/sign-in" rel="noopener noreferrer" style={{ color: 'hsl(var(--accent))', fontWeight: 500 }}>Sign in instead</a>
                        {' '}— or use <strong>Continue with Google</strong> if you originally signed up that way.
                      </>
                    ) : errorKey === ERR.GOOGLE_EXISTS ? (
                      <>
                        This email is linked to a Google account.{' '}
                        Please use <strong>Continue with Google</strong> below to sign in.
                      </>
                    ) : error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading || googleLoading} className="btn-save"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
                <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
              </div>

              <button type="button" className="btn-ghost" disabled={googleLoading || loading}
                style={{ width: '100%', justifyContent: 'center', opacity: googleLoading ? 0.7 : 1 }}
                onClick={handleGoogleSignUp}>
                {googleLoading
                  ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--foreground))', marginRight: 8 }} />
                  : <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 8 }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                }
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>
            </form>
          )}

          {/* ── Verify stage ───────────────────────────────────────────────── */}
          {stage === 'verify' && (
            <form onSubmit={handleVerify} noValidate>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="code" style={labelStyle}>Verification code</label>
                <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code"
                  required maxLength={6}
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{ ...inputStyle, letterSpacing: '0.2em', fontWeight: 500, textAlign: 'center', fontSize: '1.25rem' }}
                  onFocus={onFocus} onBlur={onBlur} />

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
                      background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer',
                      fontSize: '0.75rem', fontWeight: 500, padding: 0, whiteSpace: 'nowrap', flexShrink: 0,
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
                    <motion.p key="resend-ok"
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.375rem', fontWeight: 500 }}>
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
                onClick={() => { setStage('form'); setError(''); setErrorKey(''); setCode(''); setResendCooldown(0); setResendSuccess(false) }}>
                Back
              </button>
            </form>
          )}

        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 300 }}>
          Already have an account?{' '}
          <a href="/sign-in" rel="noopener noreferrer" style={{ color: 'hsl(var(--accent))', fontWeight: 500 }}>Sign in</a>
        </p>
      </motion.div>
    </div>
  )
}