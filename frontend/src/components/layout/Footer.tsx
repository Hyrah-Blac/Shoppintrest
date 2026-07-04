'use client'

/**
 * Footer — v6 · Shoppin
 *
 * v5 → v6:
 *  - Removed Pinterest
 *  - Added WhatsApp Business link (wa.me/254731786491) — shown prominently
 *    as a labelled CTA button above the icon row, not just a plain icon
 *  - Updated Instagram to real account link
 *  - All Image fill instances now have sizes prop (fixes Next.js warning)
 *  - General mobile rhythm polish
 */

import Link from 'next/link'
import Image from 'next/image'
import { Smartphone } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const footerLinks = {
  Shop: [
    { href: '/explore',                   label: 'Women'    },
    { href: '/explore?category=menswear', label: 'Men'      },
    { href: '/explore?sort=popular',      label: 'Trending' },
    { href: '/explore?featured=true',     label: 'New in'   },
  ],
  Company: [
    { href: '/about', label: 'About'   },
    { href: '/press', label: 'Press'   },
    { href: '/blog',  label: 'Journal' },
  ],
  Support: [
    { href: '/help',     label: 'Help'     },
    { href: '/returns',  label: 'Returns'  },
    { href: '/shipping', label: 'Shipping' },
    { href: '/contact',  label: 'Contact'  },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms',   label: 'Terms'   },
    { href: '/cookies', label: 'Cookies' },
  ],
}

// WhatsApp first — most important channel for a Kenya-based store
const socials = [
  {
    label: 'Instagram',
    href:  'https://www.instagram.com/injiniapowered?igsh=d3hheTZycnhqejl2',
    accent: false,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
  },
  {
    label: 'X',
    href:  'https://x.com',
    accent: false,
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

// ─── WhatsApp SVG ─────────────────────────────────────────────────────────────

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer
      className="relative"
      style={{
        marginTop:  'clamp(3rem, 8vw, 8rem)',
        background: 'hsl(var(--background))',
        borderTop:  '1px solid hsl(var(--border) / 0.5)',
      }}
    >
      <div
        className="container-wide"
        style={{
          paddingTop:    'clamp(2rem, 5vw, 5rem)',
          paddingBottom: 'clamp(1.5rem, 3vw, 3rem)',
        }}
      >

        {/* ── Main grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-7 sm:gap-y-10 sm:gap-x-8 lg:gap-16">

          {/* ── Brand column ── */}
          <div className="col-span-2 sm:col-span-4 md:col-span-2 flex flex-col gap-4 sm:gap-5">

            {/* Logo */}
            <Link href="/" className="inline-flex items-center self-start">
              <div className="relative w-20 h-7 sm:w-24 sm:h-8">
                <Image
                  src="/logo.png"
                  alt="Shoppin"
                  fill
                  sizes="96px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            {/* Tagline */}
            <p style={{
              fontSize:   '13px',
              fontWeight: 300,
              lineHeight: 1.7,
              color:      'hsl(var(--muted))',
              maxWidth:   '22rem',
            }}>
              The place to find things worth buying.
            </p>

            {/* Shipping pill */}
            <div
              className="inline-flex items-center gap-1.5 self-start"
              style={{
                borderRadius: '100px',
                border:       '0.5px solid hsl(var(--border))',
                padding:      '5px 10px',
              }}
            >
              <span
                aria-hidden
                style={{
                  width:        '6px',
                  height:       '6px',
                  borderRadius: '50%',
                  background:   'hsl(var(--success))',
                  flexShrink:   0,
                }}
              />
              <span style={{
                fontSize:      '10px',
                fontWeight:    400,
                color:         'hsl(var(--muted))',
                letterSpacing: '0.04em',
              }}>
                Shipping within Kenya
              </span>
            </div>

            {/* ── WhatsApp CTA — prominent, labelled ── */}
            <a
              href="https://wa.me/254731786491"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 self-start group transition-all duration-200"
              style={{
                padding:      '0.5rem 1rem',
                borderRadius: '100px',
                background:   'hsl(142 55% 40% / 0.10)',
                border:       '0.5px solid hsl(142 55% 40% / 0.35)',
                color:        'hsl(142 55% 36%)',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background   = 'hsl(142 55% 40% / 0.18)'
                el.style.borderColor  = 'hsl(142 55% 40% / 0.6)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background   = 'hsl(142 55% 40% / 0.10)'
                el.style.borderColor  = 'hsl(142 55% 40% / 0.35)'
              }}
            >
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width:        '22px',
                  height:       '22px',
                  borderRadius: '50%',
                  background:   'hsl(142 55% 40%)',
                  color:        'white',
                }}
              >
                <WhatsAppIcon size={12} />
              </span>
              <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>
                Chat with us on WhatsApp
              </span>
            </a>

            {/* ── Social icons row ── */}
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width:          '34px',
                    height:         '34px',
                    borderRadius:   'var(--radius-sm, 6px)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    background:     'transparent',
                    border:         '0.5px solid hsl(var(--border))',
                    color:          'hsl(var(--muted))',
                    transition:     'color 0.2s, border-color 0.2s',
                    flexShrink:     0,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color       = 'hsl(var(--foreground))'
                    el.style.borderColor = 'hsl(var(--foreground))'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color       = 'hsl(var(--muted))'
                    el.style.borderColor = 'hsl(var(--border))'
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Nav columns ── */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p style={{
                fontSize:      '10px',
                fontWeight:    500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color:         'hsl(var(--muted))',
                marginBottom:  '1rem',
              }}>
                {title}
              </p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize:       '13px',
                        fontWeight:     300,
                        color:          'hsl(var(--muted))',
                        textDecoration: 'none',
                        transition:     'color 0.2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted))'
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4 text-center sm:text-left"
          style={{
            marginTop:  'clamp(2rem, 5vw, 4.5rem)',
            paddingTop: '1.25rem',
            borderTop:  '1px solid hsl(var(--border) / 0.4)',
          }}
        >
          {/* Left: copyright + M-Pesa badge */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4">
            <p style={{
              fontSize:      '10px',
              fontWeight:    400,
              color:         'hsl(var(--muted))',
              letterSpacing: '0.04em',
            }}>
              © {new Date().getFullYear()} Shoppin. All rights reserved.
            </p>

            <div
              className="inline-flex items-center gap-2 whitespace-nowrap"
              style={{
                borderRadius: '100px',
                border:       '0.5px solid hsl(142 45% 40% / 0.35)',
                background:   'hsl(142 45% 40% / 0.08)',
                padding:      '5px 12px 5px 6px',
              }}
            >
              <span
                className="flex items-center justify-center"
                style={{
                  width:        '18px',
                  height:       '18px',
                  borderRadius: '50%',
                  background:   'hsl(142 45% 40%)',
                  color:        'white',
                  flexShrink:   0,
                }}
              >
                <Smartphone size={10} strokeWidth={2.5} aria-hidden />
              </span>
              <span
                className="mpesa-badge-label"
                style={{
                  fontSize:      '10px',
                  fontWeight:    600,
                  letterSpacing: '0.04em',
                }}
              >
                Pay with M-Pesa
              </span>
            </div>
          </div>

          <p style={{
            fontSize:      '10px',
            fontWeight:    400,
            color:         'hsl(var(--muted))',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Est. 2026
          </p>
        </div>

      </div>

      <style jsx>{`
        .mpesa-badge-label {
          color: hsl(142 45% 30%);
        }
        :global(.dark) .mpesa-badge-label {
          color: hsl(142 55% 62%);
        }
      `}</style>
    </footer>
  )
}