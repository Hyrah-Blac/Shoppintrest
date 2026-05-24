'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, UserButton } from '@clerk/nextjs'
import {
  Search, ShoppingBag, Heart, Bell, Menu, X,
  Compass, BookMarked, MessageCircle, ChevronRight,
  LogOut, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { SearchModal } from '@/components/search/SearchModal'

const navLinks = [
  { href: '/explore',     label: 'Explore',     icon: Compass      },
  { href: '/collections', label: 'Collections', icon: BookMarked   },
]

const signedInLinks = [
  { href: '/saved',    label: 'Saved',    icon: Heart          },
  { href: '/messages', label: 'Messages', icon: MessageCircle  },
]

export function Navbar() {
  const pathname       = usePathname()
  const { isSignedIn, signOut } = useAuth()
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

  /* lock body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileOpen])

  const allMobileLinks = [
    ...navLinks,
    ...(isSignedIn ? signedInLinks : []),
  ]

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'transition-[padding,background,border-color,box-shadow]',
          'duration-[var(--duration-standard)]',
          isScrolled ? 'glass py-2' : 'bg-transparent py-3'
        )}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container-wide flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="shrink-0 flex items-center">
            <div className="relative w-16 h-7">
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
          <div className="flex items-center gap-2 shrink-0">

            <div className="hidden md:flex items-center gap-2">
              <NavIconBtn onClick={() => setIsSearchOpen(true)} label="Search">
                <Search size={17} />
              </NavIconBtn>
              <ThemeToggle />
            </div>

            {isSignedIn ? (
              <>
                <Link href="/notifications" className="btn-icon relative hidden md:inline-flex" aria-label="Notifications">
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="badge badge-red badge-notification">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/saved"
                  aria-label="Saved"
                  className={cn(
                    'btn-icon hidden md:inline-flex',
                    pathname === '/saved' && 'text-[hsl(var(--accent))]'
                  )}
                >
                  <Heart size={17} className={cn(pathname === '/saved' && 'fill-current')} />
                </Link>

                <button onClick={toggleCart} aria-label="Cart" className="btn-icon relative hidden md:inline-flex">
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

                <div className="ml-2 pl-2 md:border-l border-[hsl(var(--border))] hidden md:block">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: 'w-7 h-7 rounded-[var(--radius-sm)]' } }}
                  />
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2 ml-3 pl-3 md:border-l border-[hsl(var(--border))]">
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

            {/* Mobile — cart badge visible always */}
            <button onClick={toggleCart} aria-label="Cart" className="btn-icon relative md:hidden">
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

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Menu"
              className="btn-icon md:hidden"
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

        {/* ══════════════════════════════════════════
            MOBILE DRAWER
            ══════════════════════════════════════════ */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{   opacity: 0, height: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden glass-modal"
            >
              <div className="px-4 pt-3 pb-6 flex flex-col gap-1">

                {/* ── Zone 1: Nav Links ── */}
                <p className="eyebrow px-3 pt-2 pb-3">Navigate</p>

                {allMobileLinks.map((link, i) => {
                  const Icon    = link.icon
                  const active  = pathname === link.href
                  const isSaved = link.href === '/saved'

                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.055, ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-3 rounded-[var(--radius-sm)]',
                          'transition-all duration-[var(--duration-hover)] relative overflow-hidden',
                          active
                            ? 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]'
                            : 'text-[hsl(var(--muted))] hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--foreground))]'
                        )}
                      >
                        {/* Active left-bar accent */}
                        {active && (
                          <motion.div
                            layoutId="mobile-active-bar"
                            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                            style={{ background: 'hsl(var(--accent))' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}

                        {/* Icon badge */}
                        <span
                          className={cn(
                            'w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0',
                            'transition-colors duration-[var(--duration-hover)]',
                            active
                              ? 'bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))]'
                              : 'bg-[hsl(var(--background-secondary))] text-[hsl(var(--muted))] group-hover:bg-[hsl(var(--accent-muted))] group-hover:text-[hsl(var(--accent))]'
                          )}
                        >
                          <Icon
                            size={15}
                            className={cn(isSaved && active && 'fill-current')}
                          />
                        </span>

                        <span className="flex-1 text-sm font-medium">{link.label}</span>

                        <ChevronRight
                          size={14}
                          className={cn(
                            'transition-all duration-[var(--duration-hover)]',
                            active
                              ? 'text-[hsl(var(--accent))] opacity-100'
                              : 'opacity-0 group-hover:opacity-40 -translate-x-1 group-hover:translate-x-0'
                          )}
                        />
                      </Link>
                    </motion.div>
                  )
                })}

                {/* ── Divider ── */}
                <div
                  className="my-2 h-px mx-3"
                  style={{ background: 'hsl(var(--border))' }}
                />

                {/* ── Zone 2: Quick Actions ── */}
                <p className="eyebrow px-3 pb-3">Tools</p>

                <motion.div
                  className="flex items-center gap-2 px-3"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: allMobileLinks.length * 0.055, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Search pill */}
                  <button
                    onClick={() => { setIsSearchOpen(true); setIsMobileOpen(false) }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-pill)]
                               text-sm font-medium flex-1
                               bg-[hsl(var(--background-secondary))] text-[hsl(var(--muted))]
                               hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--foreground))]
                               border border-[hsl(var(--border))]
                               transition-all duration-[var(--duration-hover)]"
                  >
                    <Search size={14} />
                    Search
                  </button>

                  {/* Theme pill */}
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-pill)]
                               text-sm font-medium
                               bg-[hsl(var(--background-secondary))]
                               border border-[hsl(var(--border))]"
                  >
                    <ThemeToggle />
                    <span className="text-[hsl(var(--muted))] text-sm">Theme</span>
                  </div>
                </motion.div>

                {/* ── Divider ── */}
                <div
                  className="my-2 h-px mx-3"
                  style={{ background: 'hsl(var(--border))' }}
                />

                {/* ── Zone 3: Account Footer ── */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (allMobileLinks.length + 1) * 0.055, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {isSignedIn ? (
                    <div className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserButton
                          afterSignOutUrl="/"
                          appearance={{ elements: { avatarBox: 'w-8 h-8 rounded-[var(--radius-sm)]' } }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[hsl(var(--foreground))]">Your account</span>
                          <span className="text-xs text-[hsl(var(--muted))]">Manage profile & settings</span>
                        </div>
                      </div>
                      <button
                        onClick={() => signOut()}
                        aria-label="Sign out"
                        className="btn-icon text-[hsl(var(--muted))] hover:text-[hsl(var(--accent))]"
                      >
                        <LogOut size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 py-2 flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0
                                   bg-[hsl(var(--background-secondary))] text-[hsl(var(--muted))]"
                      >
                        <User size={15} />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">Join Shoppin</p>
                        <p className="text-xs text-[hsl(var(--muted))]">Discover & save what you love</p>
                      </div>
                      <Link href="/sign-up" className="btn-save text-xs px-3 py-1.5">
                        Join free
                      </Link>
                    </div>
                  )}
                </motion.div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer */}
      <div className="h-[52px]" />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

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
    <button onClick={onClick} aria-label={label} className="btn-icon">
      {children}
    </button>
  )
}