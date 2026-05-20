import Link from 'next/link'

const footerLinks = {
  Discover: [
    { href: '/explore', label: 'Explore' },
    { href: '/collections', label: 'Collections' },
    { href: '/explore?featured=true', label: 'Featured' },
    { href: '/explore?sort=popular', label: 'Trending' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/careers', label: 'Careers' },
    { href: '/press', label: 'Press' },
    { href: '/blog', label: 'Journal' },
  ],
  Support: [
    { href: '/help', label: 'Help Center' },
    { href: '/returns', label: 'Returns' },
    { href: '/shipping', label: 'Shipping' },
    { href: '/contact', label: 'Contact' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/cookies', label: 'Cookies' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-32">
      <div className="container-wide py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-display font-semibold text-lg tracking-tight text-foreground"
            >
              Shoppintrest
            </Link>
            <p className="mt-3 text-sm text-muted leading-relaxed max-w-xs">
              A luxury visual commerce platform for discovering and collecting
              exceptional fashion.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row
                        items-center justify-between gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} Shoppintrest. All rights reserved.</p>
          <p>Designed with intention. Built with care.</p>
        </div>
      </div>
    </footer>
  )
}