'use client'

/**
 * Footer — Shoppin
 *
 * Typography now matches HeroSection's system instead of the browser's
 * default sans stack (which is what made the old footer look faintly
 * "pixelated" at 10–13px — no hinting/optical-sizing to lean on):
 *
 *  - DISPLAY    → Playfair Display, sitewide via --font-display, used for
 *                 the one editorial line.
 *  - UTILITY    → DM Sans, sitewide, used for every tracked label/link —
 *                 same as the hero's season label, brand tag, etc.
 *  - Parisienne → self-hosted here via next/font (component-scoped, same
 *                 pattern the hero uses for "Scroll to shop" / "See it"),
 *                 used once for the small script accent over "Need help?".
 *
 * Shop is gone (already covered by Categories on the homepage). Instagram
 * moved into Company as a plain link instead of a separate round icon
 * button. No image logo — the footer opens on the one editorial line
 * instead of a lockup.
 */

import Link from 'next/link'
import { Parisienne } from 'next/font/google'
import { ArrowUpRight } from 'lucide-react'

const parisienne = Parisienne({ weight: '400', subsets: ['latin'], display: 'swap' })

// lucide-react dropped brand/logo icons (Instagram, Facebook, etc.) in
// later versions, so this stays a plain inline SVG like the old footer had.
function InstagramIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

// ─── Shared type tokens (mirrors HeroSection) ──────────────────────────────

const DISPLAY: React.CSSProperties = {
  fontFamily: '"Playfair Display", var(--font-display, Georgia), serif',
}
const UTILITY: React.CSSProperties = {
  fontFamily: '"DM Sans", system-ui, sans-serif',
}
const ACCENT = 'hsl(var(--accent, 0 78% 54%))'
const MUTED = 'hsl(var(--muted))'
const FG = 'hsl(var(--foreground))'

// ─── Data ─────────────────────────────────────────────────────────────────

const companyLinks = [
  { href: '/about', label: 'About' },
]

// ─── Small link — shared hover treatment (muted → foreground) ─────────────

function FooterLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <Link
      href={href}
      {...props}
      style={{
        ...UTILITY,
        fontSize: '13.5px',
        fontWeight: 300,
        color: MUTED,
        textDecoration: 'none',
        transition: 'color 0.25s ease',
      }}
      className="inline-flex items-center gap-2"
      onMouseEnter={(e) => (e.currentTarget.style.color = FG)}
      onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
    >
      {children}
    </Link>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="mt-12 sm:mt-16 md:mt-24 lg:mt-32 border-t border-[hsl(var(--border)/0.5)] bg-[hsl(var(--background))]">
      <div className="container-wide pt-10 pb-6 sm:pt-14 sm:pb-8 md:pt-20 md:pb-10 lg:pt-24 lg:pb-12">
        <div className="mx-auto max-w-5xl">

        {/* ── Top section ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">

          {/* Editorial line — replaces the old logo lockup */}
          <div className="max-w-sm md:w-64 md:shrink-0">
            <p
              style={{
                ...DISPLAY,
                fontSize: '22px',
                fontStyle: 'italic',
                fontWeight: 500,
                lineHeight: 1.35,
                letterSpacing: '-0.01em',
                color: FG,
              }}
            >
              The place to find things worth buying.
            </p>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:gap-x-16 md:min-w-[22rem] md:gap-x-20 lg:min-w-[26rem]">

            {/* Company */}
            <div>
              <p
                style={{
                  ...UTILITY,
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  marginBottom: '18px',
                }}
              >
                Company
              </p>
              <ul className="flex flex-col gap-3">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
                <li>
                  <a
                    href="https://www.instagram.com/injiniapowered?igsh=d3hheTZycnhqejl2"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...UTILITY,
                      fontSize: '13.5px',
                      fontWeight: 300,
                      color: MUTED,
                      textDecoration: 'none',
                      transition: 'color 0.25s ease',
                    }}
                    className="inline-flex items-center gap-2"
                    onMouseEnter={(e) => (e.currentTarget.style.color = FG)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                  >
                    <InstagramIcon size={13} />
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <p
                style={{
                  ...UTILITY,
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  marginBottom: '10px',
                }}
              >
                Support
              </p>

              <p
                className={parisienne.className}
                style={{
                  fontSize: '26px',
                  lineHeight: 1.2,
                  color: FG,
                  marginBottom: '10px',
                }}
              >
                Need help?
              </p>

              <Link
                href="/support"
                className="group inline-flex items-center gap-2"
                style={{
                  ...UTILITY,
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: FG,
                  textDecoration: 'none',
                }}
              >
                <span>Contact us</span>
                <ArrowUpRight
                  size={13}
                  style={{ color: ACCENT, transition: 'transform 0.25s ease' }}
                  className="group-hover:translate-x-[2px] group-hover:-translate-y-[2px]"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="divider mt-10 sm:mt-12 md:mt-16" aria-hidden />

        {/* ── Bottom bar ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 pt-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <p style={{ ...UTILITY, fontSize: '10px', letterSpacing: '0.02em', color: MUTED }}>
            © {new Date().getFullYear()} Shoppin. All rights reserved.
          </p>

          <p
            style={{
              ...UTILITY,
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: MUTED,
            }}
          >
            Est. 2026
          </p>
        </div>
        </div>
      </div>
    </footer>
  )
}