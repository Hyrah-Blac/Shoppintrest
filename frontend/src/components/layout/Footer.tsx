'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

const footerLinks = {
  Discover: [
    { href: '/explore',                label: 'Explore'    },
    { href: '/collections',            label: 'Collections'},
    { href: '/explore?featured=true',  label: 'Featured'   },
    { href: '/explore?sort=popular',   label: 'Trending'   },
  ],
  Company: [
    { href: '/about',    label: 'About'   },
    { href: '/careers',  label: 'Careers' },
    { href: '/press',    label: 'Press'   },
    { href: '/blog',     label: 'Journal' },
  ],
  Support: [
    { href: '/help',      label: 'Help Center' },
    { href: '/returns',   label: 'Returns'     },
    { href: '/shipping',  label: 'Shipping'    },
    { href: '/contact',   label: 'Contact'     },
  ],
  Legal: [
    { href: '/privacy',  label: 'Privacy' },
    { href: '/terms',    label: 'Terms'   },
    { href: '/cookies',  label: 'Cookies' },
  ],
}

const socials = [
  {
    label: 'Pinterest',
    href:  'https://pinterest.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href:  'https://instagram.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
  },
  {
    label: 'X / Twitter',
    href:  'https://x.com',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer
      className="mt-32 border-t"
      style={{
        background:  'hsl(var(--surface))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      <div className="container-wide pt-16 pb-10">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 lg:gap-14">

          {/* Brand column */}
          <div className="col-span-2 flex flex-col gap-6">

            {/* Logo */}
            <Link href="/" className="inline-flex items-center">
              <div className="relative w-24 h-8">
                <Image
                  src="/logo.png"
                  alt="Shoppintrest"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </Link>

            {/* Tagline */}
            <p
              className="text-sm leading-relaxed max-w-[210px]"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300, lineHeight: 1.8 }}
            >
              A luxury visual commerce platform for discovering and collecting
              exceptional fashion.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="w-9 h-9 flex items-center justify-center
                             transition-colors duration-[var(--duration-hover)]"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    background:   'hsl(var(--background-secondary))',
                    border:       '1px solid hsl(var(--border))',
                    color:        'hsl(var(--muted))',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--accent))'
                    e.currentTarget.style.color       = 'hsl(var(--accent))'
                    e.currentTarget.style.background  = 'hsl(var(--accent-muted))'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--border))'
                    e.currentTarget.style.color       = 'hsl(var(--muted))'
                    e.currentTarget.style.background  = 'hsl(var(--background-secondary))'
                  }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>

            {/* Location pill */}
            <div
              className="inline-flex items-center gap-2 self-start px-3 py-1.5"
              style={{
                borderRadius: 'var(--radius-pill)',
                background:   'hsl(var(--background-secondary))',
                border:       '1px solid hsl(var(--border))',
              }}
            >
              <MapPin size={11} style={{ color: 'hsl(var(--accent))' }} />
              <span
                className="text-[11px] font-medium"
                style={{ color: 'hsl(var(--muted))' }}
              >
                Nairobi, Kenya
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="eyebrow mb-5">{title}</h4>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm inline-block relative group"
                      style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                    >
                      <span
                        className="transition-colors duration-[var(--duration-hover)]
                                   group-hover:text-[hsl(var(--foreground))]"
                      >
                        {link.label}
                      </span>
                      {/* Subtle underline on hover */}
                      <span
                        className="absolute -bottom-px left-0 h-px w-0 group-hover:w-full
                                   transition-all duration-[var(--duration-standard)]"
                        style={{ background: 'hsl(var(--accent))' }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div
          className="mt-14 mb-8 h-px w-full"
          style={{ background: 'hsl(var(--border))' }}
        />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            © {new Date().getFullYear()} Shoppintrest. All rights reserved.
          </p>

          {/* Centre mark */}
          <span
            className="text-sm hidden sm:block"
            style={{ color: 'hsl(var(--border))' }}
          >
            ✦
          </span>

          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Designed with intention. Built with care.
          </p>
        </div>

      </div>
    </footer>
  )
}