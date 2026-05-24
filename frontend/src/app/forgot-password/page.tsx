'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type Stage = 'request' | 'sent' | 'reset'

const fadeSlide = {
  initial:  { opacity: 0, y: 14 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export default function ForgotPasswordPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [stage, setStage]       = useState<Stage>('request')
  const [email, setEmail]       = useState('')
  const [code, setCode]         = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // ── Step 1: request reset code ────────────────────────────────────────────
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setLoading(true)

    try {
      await signIn.create({
        strategy:   'reset_password_email_code',
        identifier: email,
      })
      setStage('sent')
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError.errors?.[0]?.message ?? 'Could not send reset email. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify code + set new password ────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')

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
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/')
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError.errors?.[0]?.message ?? 'Reset failed. Check your code and try again.')
    } finally {
      setLoading(false)
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
                    color:         'hsl(var(--muted))',
                    fontWeight:    300,
                    marginBottom:  '2rem',
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

                  {error && <ErrorBox message={error} />}

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
                  {/* Envelope icon — plain, no glow */}
                  <div
                    style={{
                      width:        48,
                      height:       48,
                      borderRadius: 'var(--radius)',
                      background:   'hsl(var(--background-secondary))',
                      border:       '1px solid hsl(var(--border))',
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center',
                      marginBottom: '1.25rem',
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

                <button
                  type="button"
                  className="btn-save"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem' }}
                  onClick={() => setStage('reset')}
                >
                  Enter code
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                  onClick={() => { setStage('request'); setError('') }}
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
                  {/* Code */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="code" style={labelStyle}>Reset code</label>
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
                      style={{ ...inputStyle, letterSpacing: '0.2em', fontWeight: 500 }}
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

                  {error && <ErrorBox message={error} />}

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
                  onClick={() => { setStage('sent'); setError('') }}
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

// ── Shared error component ────────────────────────────────────────────────────
function ErrorBox({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: '1rem',
        padding:      '0.625rem 0.875rem',
        borderRadius: 'var(--radius-sm)',
        background:   'hsl(var(--destructive) / 0.08)',
        border:       '1px solid hsl(var(--destructive) / 0.20)',
        color:        'hsl(var(--destructive))',
        fontSize:     'var(--text-sm)',
        fontWeight:   400,
      }}
    >
      {message}
    </motion.div>
  )
}