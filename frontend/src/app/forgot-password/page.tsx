'use client'

import { useSignIn } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

// ── stage type ────────────────────────────────────────────────────────────────
type Stage = 'request' | 'sent' | 'reset'

// ── error sentinel constants ──────────────────────────────────────────────────
const ERR = {
  GOOGLE_ONLY: 'GOOGLE_ONLY',
} as const
type ErrSentinel = typeof ERR[keyof typeof ERR] | ''

const RESEND_WAIT = 30 // seconds

// ── animation variant ─────────────────────────────────────────────────────────
const fadeSlide = {
  initial:  { opacity: 0, y: 14 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

// ── Clerk error parser ────────────────────────────────────────────────────────
function parseClerkError(err: any): { code: string; message: string; longMessage: string } {
  const e = Array.isArray(err?.errors) ? err.errors[0] : err
  return {
    code:        String(e?.code        ?? ''),
    message:     String(e?.message     ?? ''),
    longMessage: String(e?.longMessage ?? e?.message ?? ''),
  }
}

// ── friendly error mapper — detects Google/OAuth accounts ─────────────────────
function friendlyError(code: string, message: string, longMessage: string): string {
  const lower = `${code} ${message} ${longMessage}`.toLowerCase()

  if (
    lower.includes('google') ||
    lower.includes('oauth') ||
    lower.includes('external_account') ||
    code === 'strategy_for_user_invalid'
  ) {
    return ERR.GOOGLE_ONLY
  }

  return longMessage || message || 'Could not send reset email. Try again.'
}

// ── component ─────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [stage,          setStage]          = useState<Stage>('request')
  const [email,          setEmail]          = useState('')
  const [code,           setCode]           = useState('')
  const [password,       setPassword]       = useState('')
  const [confirm,        setConfirm]        = useState('')
  const [error,          setError]          = useState('')
  const [errorKey,       setErrorKey]       = useState<ErrSentinel>('')
  const [loading,        setLoading]        = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading,  setResendLoading]  = useState(false)
  const [resendSuccess,  setResendSuccess]  = useState(false)

  // cleanup countdown on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  // ── cooldown ticker ───────────────────────────────────────────────────────
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

  // ── Step 1: request reset code ────────────────────────────────────────────
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setErrorKey('')
    setLoading(true)

    try {
      await signIn!.create({
        strategy:   'reset_password_email_code',
        identifier: email,
      })
      setStage('sent')
      startCooldown()
    } catch (err: any) {
      const { code, message, longMessage } = parseClerkError(err)
      const friendly = friendlyError(code, message, longMessage)
      setErrorKey(friendly as ErrSentinel)
      setError(friendly)
    } finally {
      setLoading(false)
    }
  }

  // ── Resend code ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!isLoaded || resendLoading || resendCooldown > 0) return
    setResendLoading(true)
    setResendSuccess(false)
    setError('')
    setErrorKey('')

    try {
      await signIn!.create({
        strategy:   'reset_password_email_code',
        identifier: email,
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

  // ── Step 2: verify code + set new password ────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setErrorKey('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const result = await signIn!.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/')
      } else {
        setError('Verification incomplete. Please try again.')
        setCode('')
      }
    } catch (err: any) {
      const { code: errCode, message, longMessage } = parseClerkError(err)
      setError(friendlyError(errCode, message, longMessage))
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  // ── Google sign-in redirect ───────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (!isLoaded) return
    try {
      await signIn!.authenticateWithRedirect({
        strategy:            'oauth_google',
        redirectUrl:         '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (err: any) {
      const { message } = parseClerkError(err)
      setError(message || 'Google sign-in failed. Please try again.')
    }
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '0.6875rem 1rem',
    borderRadius: 'var(--radius)',
    border:       '1.5px solid hsl(var(--input))',
    background:   'hsl(var(--background))',
    color:        'hsl(var(--foreground))',
    fontSize:     'var(--text-body)',
    fontFamily:   "'DM Sans', sans-serif",
    fontWeight:   300,
    outline:      'none',
    transition:   'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing:    'border-box',
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
    display:      'block',
    fontSize:     'var(--text-sm)',
    fontWeight:   500,
    color:        'hsl(var(--foreground))',
    marginBottom: '0.375rem',
  }

  const errorBoxStyle: React.CSSProperties = {
    marginBottom: '1rem',
    padding:      '0.625rem 0.875rem',
    borderRadius: 'var(--radius-sm)',
    background:   'hsl(var(--destructive) / 0.08)',
    border:       '1px solid hsl(var(--destructive) / 0.20)',
    color:        'hsl(var(--destructive))',
    fontSize:     'var(--text-sm)',
    fontWeight:   400,
    lineHeight:   1.55,
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="w-full max-w-md">
        {/* ── Card ── */}
        <div
          style={{
            background:   'hsl(var(--surface))',
            border:       '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-2xl)',
            boxShadow:    'var(--shadow-float)',
            padding:      '2.5rem 2rem',
            overflow:     'hidden',
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div
              style={{
                position:     'relative',
                width:        40,
                height:       40,
                borderRadius: 'var(--radius-sm)',
                overflow:     'hidden',
              }}
            >
              <Image src="/logo.png" alt="Shoppintrest" fill className="object-contain" priority />
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Stage 1: enter email ─────────────────────────────────── */}
            {stage === 'request' && (
              <motion.div key="request" {...fadeSlide}>
                <h1
                  className="font-display font-bold text-center"
                  style={{
                    fontSize:      'clamp(1.3rem, 3vw, 1.6rem)',
                    color:         'hsl(var(--foreground))',
                    letterSpacing: '-0.03em',
                    lineHeight:    1.1,
                    marginBottom:  '0.5rem',
                  }}
                >
                  Reset your password
                </h1>
                <p
                  className="text-sm text-center"
                  style={{
                    color:        'hsl(var(--muted))',
                    fontWeight:   300,
                    marginBottom: '2rem',
                  }}
                >
                  Enter your email and we'll send a reset code.
                </p>

                <form onSubmit={handleRequest} noValidate>
                  <div style={{ marginBottom: '1.5rem' }}>
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

                  {/* Error — Google-only or generic */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        key="err"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={errorBoxStyle}
                      >
                        {errorKey === ERR.GOOGLE_ONLY ? (
                          <>
                            This account was created using Google. Please continue
                            with Google sign-in instead.
                          </>
                        ) : (
                          error
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* "Continue with Google" shown only for OAuth-only accounts */}
                  <AnimatePresence>
                    {errorKey === ERR.GOOGLE_ONLY && (
                      <motion.div
                        key="google-btn"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{
                            width:          '100%',
                            justifyContent: 'center',
                            marginBottom:   '1rem',
                            display:        'flex',
                            alignItems:     'center',
                            gap:            '0.5rem',
                          }}
                          onClick={handleGoogleSignIn}
                        >
                          {/* Google colour logo */}
                          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Continue with Google
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-save"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem' }}
                  >
                    {loading ? 'Sending…' : 'Send reset code'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Stage 2: check inbox notice ──────────────────────────── */}
            {stage === 'sent' && (
              <motion.div key="sent" {...fadeSlide}>
                <div className="flex flex-col items-center text-center mb-8">
                  {/* Envelope icon */}
                  <div
                    style={{
                      width:          48,
                      height:         48,
                      borderRadius:   'var(--radius)',
                      background:     'hsl(var(--background-secondary))',
                      border:         '1px solid hsl(var(--border))',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      marginBottom:   '1.25rem',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m2 7 10 7 10-7"/>
                    </svg>
                  </div>
                  <h1
                    className="font-display font-bold"
                    style={{
                      fontSize:      'clamp(1.3rem, 3vw, 1.6rem)',
                      color:         'hsl(var(--foreground))',
                      letterSpacing: '-0.03em',
                      lineHeight:    1.1,
                      marginBottom:  '0.5rem',
                    }}
                  >
                    Check your inbox
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                  >
                    We sent a 6-digit code to{' '}
                    <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                      {email}
                    </span>
                  </p>
                </div>

                {/* Resend row */}
                <div
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    marginBottom:   '1.5rem',
                    padding:        '0.625rem 0.875rem',
                    borderRadius:   'var(--radius-sm)',
                    background:     'hsl(var(--background-secondary))',
                    border:         '1px solid hsl(var(--border))',
                  }}
                >
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                    Didn't receive it? Check spam.
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    style={{
                      background:  'none',
                      border:      'none',
                      cursor:      resendCooldown > 0 ? 'default' : 'pointer',
                      fontSize:    '0.75rem',
                      fontWeight:  500,
                      padding:     0,
                      whiteSpace:  'nowrap',
                      flexShrink:  0,
                      color:       resendCooldown > 0 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--accent))',
                      transition:  'color 0.2s ease',
                      fontFamily:  "'DM Sans', sans-serif",
                    }}
                  >
                    {resendLoading
                      ? 'Sending…'
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend code'}
                  </button>
                </div>

                {/* Resend success toast */}
                <AnimatePresence>
                  {resendSuccess && (
                    <motion.p
                      key="resend-ok"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: '0.75rem', fontWeight: 500 }}
                    >
                      ✓ New code sent — check your inbox.
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Generic resend error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="resend-err"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ ...errorBoxStyle, marginBottom: '1rem' }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  className="btn-save"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem' }}
                  onClick={() => { setError(''); setErrorKey(''); setStage('reset') }}
                >
                  Enter code
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                  onClick={() => { setStage('request'); setError(''); setErrorKey(''); setResendCooldown(0); setResendSuccess(false) }}
                >
                  Use a different email
                </button>
              </motion.div>
            )}

            {/* ── Stage 3: code + new password ─────────────────────────── */}
            {stage === 'reset' && (
              <motion.div key="reset" {...fadeSlide}>
                <h1
                  className="font-display font-bold text-center"
                  style={{
                    fontSize:      'clamp(1.3rem, 3vw, 1.6rem)',
                    color:         'hsl(var(--foreground))',
                    letterSpacing: '-0.03em',
                    lineHeight:    1.1,
                    marginBottom:  '0.5rem',
                  }}
                >
                  Set new password
                </h1>
                <p
                  className="text-sm text-center"
                  style={{
                    color:        'hsl(var(--muted))',
                    fontWeight:   300,
                    marginBottom: '2rem',
                  }}
                >
                  Enter the code from your email and choose a new password.
                </p>

                <form onSubmit={handleReset} noValidate>
                  {/* Code + resend inline */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
                      <label htmlFor="code" style={{ ...labelStyle, marginBottom: 0 }}>Reset code</label>
                      <button
                        type="button"
                        onClick={() => { setError(''); setErrorKey(''); setStage('sent') }}
                        style={{
                          background: 'none',
                          border:     'none',
                          cursor:     'pointer',
                          fontSize:   '0.75rem',
                          fontWeight: 500,
                          padding:    0,
                          color:      'hsl(var(--accent))',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Resend code
                      </button>
                    </div>
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

                  {/* New password */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="password" style={labelStyle}>New password</label>
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

                  {/* Confirm */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="confirm" style={labelStyle}>Confirm password</label>
                    <input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        key="err"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={errorBoxStyle}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-save"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem' }}
                  >
                    {loading ? 'Updating…' : 'Update password'}
                  </button>
                </form>

                <button
                  type="button"
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                  onClick={() => { setStage('sent'); setError(''); setErrorKey('') }}
                >
                  Back
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-5"
          style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 300 }}
        >
          Remembered it?{' '}
          <a href="/sign-in" style={{ color: 'hsl(var(--accent))', fontWeight: 500 }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}