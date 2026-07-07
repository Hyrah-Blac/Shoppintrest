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

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
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

            {/* WhatsApp CTA + social — one row, vertically centered together */}
            <div className="flex w-full items-center gap-3">
              <a
                href="https://wa.me/254731786491"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-1 items-center gap-3.5 rounded-2xl
                           bg-gradient-to-br from-[hsl(142_60%_40%)] to-[hsl(142_62%_32%)]
                           px-4 py-3 text-white no-underline shadow-md shadow-[hsl(142_60%_20%/0.16)]
                           transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                           hover:shadow-[hsl(142_60%_20%/0.24)] motion-reduce:transition-none
                           motion-reduce:hover:translate-y-0 focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[hsl(142_55%_50%)]
                           focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]
                           sm:flex-initial"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <WhatsAppIcon size={18} />
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-[ping_2.4s_ease-in-out_infinite] rounded-full bg-[hsl(120_60%_62%)] opacity-60 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(120_60%_62%)] ring-2 ring-[hsl(142_62%_32%)]" />
                  </span>
                </span>
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-[13.5px] font-semibold leading-tight tracking-wide">
                    Chat with us on WhatsApp
                  </span>
                  <span className="text-[11px] font-normal leading-tight text-white/70">
                    Usually replies within minutes
                  </span>
                </span>
              </a>

              {/* Social */}
              <a
                href="https://www.instagram.com/injiniapowered?igsh=d3hheTZycnhqejl2"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-[0.5px]
                           border-[hsl(var(--border))] text-[hsl(var(--muted))] transition-colors duration-200
                           hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--foreground)/0.4)]
                           focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
              >
                <InstagramIcon />
              </a>
            </div>
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