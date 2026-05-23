'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, UserButton } from '@clerk/nextjs'
import { Search, ShoppingBag, Heart, Bell, Menu, X, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { SearchModal } from '@/components/search/SearchModal'

const navLinks = [
  { href: '/explore',     label: 'Explore' },
  { href: '/collections', label: 'Collections' },
]

export function Navbar() {
  const pathname       = usePathname()
  const { isSignedIn } = useAuth()
  const [isScrolled,   setIsScrolled]   = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const itemCount   = useCartStore((s) => s.itemCount)
  const toggleCart  = useCartStore((s) => s.toggleCart)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setIsMobileOpen(false) }, [pathname])

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'transition-[padding,background,border-color,box-shadow]',
          'duration-[var(--duration-standard)]',
          isScrolled ? 'glass py-3' : 'bg-transparent py-5'
        )}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container-wide flex items-center justify-between gap-4">

          {/* ── Logo — image only, no wordmark ── */}
        {/* ── Logo — Pinterest-style floating icon ── */}
<Link href="/" className="shrink-0 flex items-center">
  <div className="relative w-30 h-30">
    <Image
      src="/logo.png"
      alt="Shoppin"
      fill
      className="object-contain"
      priority
    />
  </div>
</Link>
          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium',
                  'transition-all duration-[var(--duration-hover)]',
                  pathname === link.href
                    ? 'text-[hsl(var(--foreground))] bg-[hsl(var(--surface))]'
                    : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface)/0.7)]'
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: 'hsl(var(--accent))' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-0.5">

            {/* Search */}
            <NavIconBtn onClick={() => setIsSearchOpen(true)} label="Search">
              <Search size={17} />
            </NavIconBtn>

            <ThemeToggle />

            {isSignedIn ? (
              <>
                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="btn-icon relative"
                  aria-label="Notifications"
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="badge badge-red badge-notification">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Saved */}
                <Link
                  href="/saved"
                  aria-label="Saved"
                  className={cn(
                    'btn-icon',
                    pathname === '/saved' && 'text-[hsl(var(--accent))]'
                  )}
                >
                  <Heart
                    size={17}
                    className={cn(pathname === '/saved' && 'fill-current')}
                  />
                </Link>

                {/* Cart */}
                <button
                  onClick={toggleCart}
                  aria-label="Cart"
                  className="btn-icon relative"
                >
                  <ShoppingBag size={17} />
                  <AnimatePresence>
                    {itemCount > 0 && (
                      <motion.span
                        key={itemCount}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{   scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                        className="badge badge-red badge-notification"
                      >
                        {itemCount > 9 ? '9+' : itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* User avatar */}
                <div className="ml-2 pl-2 border-l border-[hsl(var(--border))]">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-8 h-8 rounded-[var(--radius-sm)]',
                      },
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-[hsl(var(--border))]">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-[hsl(var(--muted))]
                             hover:text-[hsl(var(--foreground))]
                             transition-colors duration-[var(--duration-hover)]
                             px-3 py-2"
                >
                  Sign in
                </Link>
                <Link href="/sign-up" className="btn-save text-sm">
                  Join free
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Menu"
              className="btn-icon md:hidden ml-1"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isMobileOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate:  90,  opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{   opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div
                className="mt-3 mx-4 h-px"
                style={{ background: 'hsl(var(--border))' }}
              />
              <div className="container-wide py-4 flex flex-col gap-0.5">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-[var(--radius-sm)]',
                        'text-sm font-medium transition-all duration-[var(--duration-hover)]',
                        pathname === link.href
                          ? 'text-[hsl(var(--foreground))] bg-[hsl(var(--surface))]'
                          : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]'
                      )}
                    >
                      <Compass size={15} className="shrink-0" />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {isSignedIn && (
                  <motion.div
                    className="flex flex-col gap-0.5"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navLinks.length * 0.06 }}
                  >
                    <Link
                      href="/saved"
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-[var(--radius-sm)]',
                        'text-sm font-medium transition-all duration-[var(--duration-hover)]',
                        pathname === '/saved'
                          ? 'text-[hsl(var(--accent))] bg-[hsl(var(--accent-muted))]'
                          : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]'
                      )}
                    >
                      <Heart
                        size={15}
                        className={cn('shrink-0', pathname === '/saved' && 'fill-current')}
                      />
                      Saved
                    </Link>
                    <Link
                      href="/messages"
                      className="flex items-center gap-3 px-3 py-3 rounded-[var(--radius-sm)]
                                 text-sm font-medium text-[hsl(var(--muted))]
                                 hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]
                                 transition-all duration-[var(--duration-hover)]"
                    >
                      Messages
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer */}
      <div className="h-[72px]" />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

/* ── Icon button helper ── */
function NavIconBtn({
  onClick,
  label,
  children,
}: {
  onClick?: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="btn-icon"
    >
      {children}
    </button>
  )
}