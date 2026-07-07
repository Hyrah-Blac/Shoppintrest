'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Clock } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1] as const

// ─── Icon components ──────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  )
}

// ─── Channel data — no JSX in the array ───────────────────────────────────────

const channels = [
  {
    id:       'whatsapp',
    label:    'WhatsApp',
    desc:     'Fastest response — chat with us directly',
    sub:      'Usually replies within minutes',
    href:     'https://wa.me/254731786491',
    cta:      'Open WhatsApp',
    external: true,
    iconBg:   'hsl(142 55% 40%)',
    cardBg:   'hsl(142 55% 40% / 0.08)',
    cardBorder: '1px solid hsl(142 55% 40% / 0.30)',
    btnBg:    'hsl(142 55% 40%)',
    iconColor: 'white',
    btnColor:  'white',
  },
  {
    id:       'instagram',
    label:    'Instagram',
    desc:     'DM us on Instagram for anything',
    sub:      'We reply to DMs daily',
    href:     'https://www.instagram.com/injiniapowered?igsh=d3hheTZycnhqejl2',
    cta:      'Open Instagram',
    external: true,
    iconBg:   'linear-gradient(135deg, hsl(36 90% 50%), hsl(350 80% 55%), hsl(280 60% 55%))',
    cardBg:   'hsl(280 60% 55% / 0.06)',
    cardBorder: '1px solid hsl(280 60% 55% / 0.20)',
    btnBg:    'hsl(280 60% 50%)',
    iconColor: 'white',
    btnColor:  'white',
  },
  {
    id:       'support',
    label:    'Live Support',
    desc:     'Chat with our support team for any question or inquiry',
    sub:      'Real responses, not bots',
    href:     '/support',
    cta:      'Start a Chat',
    external: false,
    iconBg:   'hsl(var(--foreground))',
    cardBg:   'hsl(var(--surface-elevated))',
    cardBorder: '1px solid hsl(var(--border))',
    btnBg:    'hsl(var(--foreground))',
    iconColor: 'hsl(var(--background))',
    btnColor:  'hsl(var(--background))',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div
        className="container-narrow"
        style={{ paddingBlock: 'clamp(3rem, 8vw, 7rem)' }}
      >

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease }}
          className="mb-12 sm:mb-16"
        >
          <p className="eyebrow mb-3">Get in touch</p>
          <h1
            className="font-display"
            style={{
              fontSize:      'clamp(2rem, 5vw, 3.5rem)',
              fontWeight:    300,
              letterSpacing: '-0.025em',
              lineHeight:    1.05,
              color:         'hsl(var(--foreground))',
              marginBottom:  '1rem',
            }}
          >
            We&apos;re here to{' '}
            <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>
              help
            </em>
          </h1>
          <p style={{
            fontSize:   '15px',
            fontWeight: 300,
            lineHeight: 1.75,
            color:      'hsl(var(--muted))',
            maxWidth:   '28rem',
          }}>
            Questions about an order, a product, or just want to say hi?
            Reach us on any of the channels below.
          </p>
        </motion.div>

        {/* ── Contact channels ── */}
        <div className="flex flex-col gap-4">
          {channels.map((ch, i) => (
            <motion.a
              key={ch.id}
              href={ch.href}
              target={ch.external ? '_blank' : undefined}
              rel={ch.external ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 16, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: i * 0.08, duration: 0.45, ease }}
              className="group flex flex-col sm:flex-row sm:items-center
                         justify-between gap-5 rounded-2xl p-6 sm:p-7
                         transition-shadow duration-200"
              style={{
                background:     ch.cardBg,
                border:         ch.cardBorder,
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              {/* Left: icon + text */}
              <div className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center shrink-0 rounded-xl"
                  style={{
                    width:      '48px',
                    height:     '48px',
                    background: ch.iconBg,
                    color:      ch.iconColor,
                  }}
                >
                  {ch.id === 'whatsapp'  && <WhatsAppIcon />}
                  {ch.id === 'instagram' && <InstagramIcon />}
                  {ch.id === 'support'   && <MessageCircle size={22} />}
                </div>
                <div>
                  <p style={{
                    fontSize:     '15px',
                    fontWeight:   600,
                    color:        'hsl(var(--foreground))',
                    marginBottom: '0.25rem',
                  }}>
                    {ch.label}
                  </p>
                  <p style={{
                    fontSize:   '13px',
                    fontWeight: 300,
                    color:      'hsl(var(--muted-foreground))',
                    lineHeight: 1.5,
                  }}>
                    {ch.desc}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock size={10} style={{ color: 'hsl(var(--muted))' }} />
                    <p style={{
                      fontSize:   '11px',
                      fontWeight: 400,
                      color:      'hsl(var(--muted))',
                    }}>
                      {ch.sub}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: CTA button */}
              <span
                className="inline-flex items-center justify-center shrink-0
                           rounded-xl text-sm font-medium w-full sm:w-auto"
                style={{
                  padding:    '0.625rem 1.375rem',
                  background: ch.btnBg,
                  color:      ch.btnColor,
                  minHeight:  '44px',
                  whiteSpace: 'nowrap',
                }}
              >
                {ch.cta}
              </span>
            </motion.a>
          ))}
        </div>

        {/* ── Hours ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 flex items-center gap-3"
        >
          <div className="h-px flex-1" style={{ background: 'hsl(var(--border) / 0.5)' }} />
          <p style={{
            fontSize:      '11px',
            fontWeight:    400,
            color:         'hsl(var(--muted))',
            letterSpacing: '0.04em',
            whiteSpace:    'nowrap',
          }}>
            Mon – Sat · 8 AM – 8 PM EAT
          </p>
          <div className="h-px flex-1" style={{ background: 'hsl(var(--border) / 0.5)' }} />
        </motion.div>

      </div>
    </div>
  )
}