
'use client'
import Link from 'next/link'

const footerLinks = {
  Discover: [
    { href: '/explore',                label: 'Explore'   },
    { href: '/collections',            label: 'Collections' },
    { href: '/explore?featured=true',  label: 'Featured'  },
    { href: '/explore?sort=popular',   label: 'Trending'  },
  ],
  Company: [
    { href: '/about',   label: 'About'   },
    { href: '/careers', label: 'Careers' },
    { href: '/press',   label: 'Press'   },
    { href: '/blog',    label: 'Journal' },
  ],
  Support: [
    { href: '/help',     label: 'Help Center' },
    { href: '/returns',  label: 'Returns'     },
    { href: '/shipping', label: 'Shipping'    },
    { href: '/contact',  label: 'Contact'     },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms',   label: 'Terms'   },
    { href: '/cookies', label: 'Cookies' },
  ],
}

export function Footer() {
  return (
    <footer
      className="mt-32 border-t"
      style={{
        background:   'hsl(var(--surface))',
        borderColor:  'hsl(var(--border))',
      }}
    >
      <div className="container-wide py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">

          {/* ── Brand ── */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group flex items-center gap-2.5 w-fit">
              <div
                className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center
                           text-xs font-bold text-white shadow-[var(--shadow-red)]
                           transition-all duration-[var(--duration-hover)]
                           group-hover:shadow-[var(--shadow-red-hover)] group-hover:scale-105"
                style={{
                  background:  'hsl(var(--accent))',
                  fontFamily:  "'Playfair Display', serif",
                }}
              >
                S
              </div>
              <span
                className="font-display text-lg font-semibold tracking-[-0.02em]
                           text-[hsl(var(--foreground))]
                           transition-opacity duration-[var(--duration-hover)]
                           group-hover:opacity-75"
              >
                Shoppintrest
              </span>
            </Link>

            <p
              className="mt-4 text-sm leading-relaxed max-w-xs"
              style={{
                color:      'hsl(var(--muted))',
                fontWeight: 300,
              }}
            >
              A luxury visual commerce platform for discovering and collecting
              exceptional fashion.
            </p>

            {/* Pinterest-red accent bar */}
            <div
              className="mt-5 h-px w-10 rounded-full"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--accent)), transparent)',
              }}
            />
          </div>

          {/* ── Link columns ── */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="eyebrow mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-[var(--duration-hover)]"
                      style={{ color: 'hsl(var(--muted))' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = 'hsl(var(--foreground))')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'hsl(var(--muted))')
                      }
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
          className="mt-16 pt-8 border-t flex flex-col sm:flex-row
                     items-center justify-between gap-4"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            © {new Date().getFullYear()} Shoppintrest. All rights reserved.
          </p>
          <p
            className="text-xs"
            style={{
              color:      'hsl(var(--muted-foreground))',
              fontWeight: 300,
            }}
          >
            Designed with intention. Built with care.
          </p>
        </div>
      </div>
    </footer>
  )
}