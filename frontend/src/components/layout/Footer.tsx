'use client'

/**
 * Footer — Shoppin
 *
 * Content is capped at max-w-5xl and centered so a lean nav (3 groups)
 * never has to stretch across a full-width page and look empty.
 *
 * Responsive layout:
 *  mobile  (< md) — brand block full width, then Shop / Company / Support
 *                   as 3 columns below
 *  desktop (md+)  — brand pinned left, nav spread to the right edge of
 *                   the bounded container (justify-between)
 *
 * Note: the WhatsApp CTA now lives in <WhatsAppFloat /> (fixed, icon-only,
 * mounted in app/layout.tsx) instead of inline here.
 */

import Link from 'next/link'
import Image from 'next/image'

// ─── Data ─────────────────────────────────────────────────────────────────

const footerLinks = {
  Shop: [
    { href: '/explore', label: 'Women' },
    { href: '/explore?category=menswear', label: 'Men' },
    { href: '/explore?sort=popular', label: 'Trending' },
    { href: '/explore?featured=true', label: 'New in' },
  ],
  Company: [
    { href: '/about', label: 'About' },
  ],
  Support: [
    { href: '/contact', label: 'Contact' },
  ],
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="mt-12 sm:mt-16 md:mt-24 lg:mt-32 border-t border-[hsl(var(--border)/0.5)] bg-[hsl(var(--background))]">
      <div className="container-wide pt-8 pb-6 sm:pt-10 sm:pb-8 md:pt-16 md:pb-10 lg:pt-20 lg:pb-12">
        <div className="mx-auto max-w-5xl">

        {/* ── Top section ───────────────────────────────────────────── */}
        {/* brand pinned left, nav spread to fill the rest of this bounded
            width — justify-between across a capped container instead of
            the full page width, so the space reads as balanced rather
            than empty */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

          {/* Brand block */}
          <div className="flex flex-col gap-5 md:w-64 md:shrink-0">
            <Link href="/" className="self-start">
              <div className="relative w-24 h-8">
                <Image src="/logo.png" alt="Shoppin" fill sizes="96px" className="object-contain object-left" />
              </div>
            </Link>

            <p className="max-w-xs text-[13px] font-light leading-[1.75] text-[hsl(var(--muted))]">
              The place to find things worth buying.
            </p>

            {/* Social */}
            <a
              href="https://www.instagram.com/injiniapowered?igsh=d3hheTZycnhqejl2"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border-[0.5px]
                         border-[hsl(var(--border))] text-[hsl(var(--muted))] transition-colors duration-200
                         hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--foreground)/0.4)]
                         focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
            >
              <InstagramIcon />
            </a>
          </div>

          {/* Nav columns */}
          <nav aria-label="Footer" className="grid grid-cols-3 gap-x-6 gap-y-10 sm:gap-x-10 md:min-w-[22rem] md:gap-x-14 lg:min-w-[26rem] lg:gap-x-20">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted))]">
                  {title}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-block text-[13px] font-light leading-normal text-[hsl(var(--muted))]
                                   no-underline transition-all duration-200 hover:translate-x-0.5
                                   hover:text-[hsl(var(--foreground))] focus-visible:outline-none
                                   focus-visible:text-[hsl(var(--foreground))]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="divider mt-8 sm:mt-10 md:mt-16" aria-hidden />

        {/* ── Bottom bar ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 pt-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-[10px] tracking-wide text-[hsl(var(--muted))]">
            © {new Date().getFullYear()} Shoppin. All rights reserved.
          </p>

          <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Est. 2026
          </p>
        </div>
        </div>
      </div>
    </footer>
  )
}