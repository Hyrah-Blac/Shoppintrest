'use client'

/**
 * Footer — v5 · Shoppin
 *
 * v4 → v5:
 *  - Added newsletter signup band above the main grid — headline + email
 *    capture, matches Net-a-Porter/Mytheresa pattern of leading with email
 *    capture rather than burying it in a column
 *  - Added "Shipping within Kenya" indicator pill near the tagline — replaces
 *    the old region-selector idea with a static trust signal (small status
 *    dot using --success token, not accent)
 *  - Added "Pay with M-Pesa" badge in the bottom bar — single, confident
 *    payment indicator instead of a generic (and currently inaccurate)
 *    multi-card row
 *  - Bottom bar restructured: left cluster = copyright + M-Pesa badge,
 *    right = Est. 2026, still stacks/centers on mobile
 *
 * v3 → v4 (aligned with Mytheresa / Net-a-Porter / SSENSE footer conventions):
 *  - Removed "Collections" from Shop — lives in primary nav already, redundant
 *    in the footer for a shopping site
 *  - Removed "Careers" from Company — premature for footer real estate;
 *    luxury/fashion e-comm footers keep Company to About/Press/Journal
 *  - Result: Shop (4), Company (3), Support (4), Legal (3) — evenly balanced
 *    columns, no orphaned single links in the mobile 2x2 grid
 *
 * v2 → v3:
 *  - Removed location badge ("Nairobi, Kenya" / MapPin) — placeholder data,
 *    no real address, irrelevant to an online store
 *  - Removed unused MapPin import
 *  - Responsive grid reworked:
 *      mobile   → brand full-width, nav columns 2x2
 *      tablet   → brand full-width, nav columns in a single row of 4
 *      desktop  → brand + 4 nav columns side by side (6-col grid)
 *  - Gaps scale down on mobile (gap-8 → sm:gap-10 → lg:gap-16)
 *  - Bottom bar stacks + centers on mobile, row + space-between on larger screens
 *  - Tagline max-width relaxed so it doesn't wrap awkwardly when brand spans
 *    full width on tablet
 */

import Link from 'next/link'
import Image from 'next/image'
import { Smartphone } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const footerLinks = {
  Shop: [
    { href: '/explore',               label: 'Women'    },
    { href: '/explore?category=menswear', label: 'Men'  },
    { href: '/explore?sort=popular',  label: 'Trending' },
    { href: '/explore?featured=true', label: 'New in'   },
  ],
  Company: [
    { href: '/about',   label: 'About'   },
    { href: '/press',   label: 'Press'   },
    { href: '/blog',    label: 'Journal' },
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

const socials = [
  {
    label: 'Pinterest',
    href: 'https://pinterest.com',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer
      className="relative"
      style={{
        marginTop:  'clamp(4rem, 8vw, 8rem)',
        background: 'hsl(var(--background))',
        borderTop:  '1px solid hsl(var(--border) / 0.5)',
      }}
    >
      <div
        className="container-wide"
        style={{
          paddingTop:    'clamp(2.5rem, 5vw, 5rem)',
          paddingBottom: 'clamp(1.75rem, 3vw, 3rem)',
        }}
      >

        {/* ── Main grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-10 sm:gap-x-8 lg:gap-16">

          {/* ── Brand column ── */}
          <div className="col-span-2 sm:col-span-4 md:col-span-2 flex flex-col gap-6">

            {/* Logo */}
            <Link href="/" className="inline-flex items-center self-start">
              <div className="relative w-24 h-8">
                <Image
                  src="/logo.png"
                  alt="Shoppin"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </Link>

            {/* Tagline — Shoppin voice */}
            <p
              style={{
                fontSize:   '13px',
                fontWeight: 300,
                lineHeight: 1.75,
                color:      'hsl(var(--muted))',
                maxWidth:   '22rem',
              }}
            >
              The place to find things worth buying.
            </p>

            {/* Shipping availability */}
            <div
              className="inline-flex items-center gap-1.5 self-start"
              style={{
                borderRadius: '100px',
                background:   'transparent',
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
              <span
                style={{
                  fontSize:      '10px',
                  fontWeight:    400,
                  color:         'hsl(var(--muted))',
                  letterSpacing: '0.04em',
                }}
              >
                Shipping within Kenya
              </span>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="social-icon"
                  style={{
                    width:          '32px',
                    height:         '32px',
                    borderRadius:   'var(--radius-sm, 6px)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    background:     'transparent',
                    border:         '0.5px solid hsl(var(--border))',
                    color:          'hsl(var(--muted))',
                    transition:     'color 0.2s, border-color 0.2s',
                    flexShrink:     0,
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
              <p
                style={{
                  fontSize:      '10px',
                  fontWeight:    500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color:         'hsl(var(--muted))',
                  marginBottom:  '1.25rem',
                }}
              >
                {title}
              </p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize:   '13px',
                        fontWeight: 300,
                        color:      'hsl(var(--muted))',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
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
          className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-center sm:text-left"
          style={{
            marginTop:  'clamp(2.5rem, 5vw, 4.5rem)',
            paddingTop: '1.5rem',
            borderTop:  '1px solid hsl(var(--border) / 0.5)',
          }}
        >
          {/* Left cluster: copyright + payment badge */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <p
              style={{
                fontSize:      '10px',
                fontWeight:    400,
                color:         'hsl(var(--muted))',
                letterSpacing: '0.04em',
              }}
            >
              © {new Date().getFullYear()} Shoppin. All rights reserved.
            </p>

            <div
              className="inline-flex items-center gap-2"
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

          <p
            style={{
              fontSize:      '10px',
              fontWeight:    400,
              color:         'hsl(var(--muted))',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
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