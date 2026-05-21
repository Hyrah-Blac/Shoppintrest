'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled ? 'glass py-3' : 'bg-transparent py-5'
        )}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container-wide flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="group flex items-center gap-2.5 shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-xs font-bold bg-foreground text-background
                         transition-opacity duration-200 group-hover:opacity-75"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              S
            </div>
            <span
              className="font-display text-lg font-semibold tracking-[-0.01em]
                         text-foreground group-hover:opacity-75 transition-opacity duration-200"
            >
              Shoppintrest
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'text-foreground bg-surface'
                    : 'text-muted hover:text-foreground hover:bg-surface/70'
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-px rounded-full"
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
                  className="relative p-2.5 rounded-xl text-muted hover:text-foreground
                             hover:bg-surface transition-all duration-200"
                  aria-label="Notifications"
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                      style={{ background: 'hsl(var(--accent))' }}
                    />
                  )}
                </Link>

                {/* Saved */}
                <Link
                  href="/saved"
                  aria-label="Saved"
                  className={cn(
                    'p-2.5 rounded-xl text-muted hover:text-foreground',
                    'hover:bg-surface transition-all duration-200',
                    pathname === '/saved' && 'text-foreground'
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
                  className="relative p-2.5 rounded-xl text-muted hover:text-foreground
                             hover:bg-surface transition-all duration-200"
                >
                  <ShoppingBag size={17} />
                  <AnimatePresence>
                    {itemCount > 0 && (
                      <motion.span
                        key={itemCount}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{   scale: 0, opacity: 0 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem]
                                   text-background text-[10px] font-semibold rounded-full
                                   flex items-center justify-center px-0.5"
                        style={{ background: 'hsl(var(--accent))' }}
                      >
                        {itemCount > 9 ? '9+' : itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* User avatar */}
                <div className="ml-1.5 pl-1.5 border-l border-border">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: 'w-8 h-8 rounded-xl' } }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-muted hover:text-foreground
                             transition-colors duration-200 px-3 py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-medium px-4 py-2 rounded-xl
                             bg-foreground text-background
                             hover:opacity-80 transition-opacity duration-200"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Menu"
              className="md:hidden p-2.5 rounded-xl text-muted hover:text-foreground
                         hover:bg-surface transition-all duration-200 ml-1"
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="divider-gold mt-3 mx-4" />
              <div className="container-wide py-4 flex flex-col gap-0.5">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl
                                 text-sm font-medium text-muted hover:text-foreground
                                 hover:bg-surface transition-all duration-200"
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
                      className="flex items-center gap-3 px-3 py-3 rounded-xl
                                 text-sm font-medium text-muted hover:text-foreground
                                 hover:bg-surface transition-all duration-200"
                    >
                      <Heart size={15} className="shrink-0" />
                      Saved
                    </Link>
                    <Link
                      href="/messages"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl
                                 text-sm font-medium text-muted hover:text-foreground
                                 hover:bg-surface transition-all duration-200"
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
      className="p-2.5 rounded-xl text-muted hover:text-foreground
                 hover:bg-surface transition-all duration-200"
    >
      {children}
    </button>
  )
}