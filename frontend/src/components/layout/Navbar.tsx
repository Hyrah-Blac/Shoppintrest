'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, UserButton } from '@clerk/nextjs'
import {
  Search, ShoppingBag, Heart, Bell,
  Menu, X, Compass, BookMarked,
  MessageCircle, ChevronRight, LogOut, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { SearchModal } from '@/components/search/SearchModal'

const navLinks = [
  { href: '/explore',     label: 'Explore',     icon: Compass      },
  { href: '/collections', label: 'Collections', icon: BookMarked   },
  { href: '/saved',       label: 'Saved',       icon: Heart        },
]

export function Navbar() {
  const pathname        = usePathname()
  const { isSignedIn, signOut } = useAuth()
  const [isScrolled,    setIsScrolled]   = useState(false)
  const [isMobileOpen,  setIsMobileOpen] = useState(false)
  const [isSearchOpen,  setIsSearchOpen] = useState(false)
  const itemCount   = useCartStore((s) => s.itemCount)
  const toggleCart  = useCartStore((s) => s.toggleCart)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setIsMobileOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileOpen])

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
              <Image src="/logo.png" alt="Shoppin" fill className="object-contain" priority />
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
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Desktop only: Search + Theme */}
            <div className="hidden md:flex items-center gap-1.5">
              <NavIconBtn onClick={() => setIsSearchOpen(true)} label="Search">
                <Search size={17} />
              </NavIconBtn>
              <ThemeToggle />
            </div>

            {isSignedIn ? (
              <>
                {/* Notifications — desktop only */}
                <Link href="/notifications" className="btn-icon relative hidden md:inline-flex" aria-label="Notifications">
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="badge badge-red badge-notification">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Saved — desktop only */}
                <Link
                  href="/saved"
                  aria-label="Saved"
                  className={cn('btn-icon hidden md:inline-flex', pathname === '/saved' && 'text-[hsl(var(--accent))]')}
                >
                  <Heart size={17} className={cn(pathname === '/saved' && 'fill-current')} />
                </Link>

                {/* ── Messages — ALWAYS visible ── */}
                <Link
                  href="/messages"
                  aria-label="Messages"
                  className={cn('btn-icon relative', pathname === '/messages' && 'text-[hsl(var(--accent))]')}
                >
                  <MessageCircle size={17} className={cn(pathname === '/messages' && 'fill-current')} />
                </Link>

                {/* Cart — ALWAYS visible */}
                <button onClick={toggleCart} aria-label="Cart" className="btn-icon relative">
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

                {/* Avatar — desktop only */}
                <div className="ml-1 pl-2 md:border-l border-[hsl(var(--border))] hidden md:block">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: 'w-7 h-7 rounded-[var(--radius-sm)]' } }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Cart for signed-out users too */}
                <button onClick={toggleCart} aria-label="Cart" className="btn-icon relative">
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

                <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-[hsl(var(--border))]">
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]
                               transition-colors duration-[var(--duration-hover)] px-3 py-2"
                  >
                    Sign in
                  </Link>
                  <Link href="/sign-up" className="btn-save text-sm">Join free</Link>
                </div>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Menu"
              className="btn-icon md:hidden ml-0.5"
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
            MOBILE DROPDOWN
            ══════════════════════════════════════════ */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{   opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 top-[52px] bg-black/40 md:hidden -z-10"
                onClick={() => setIsMobileOpen(false)}
              />

              {/* Drawer panel */}
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: -8, scale: 0.98  }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="md:hidden mx-3 mt-2 mb-1 rounded-[var(--radius-lg)] overflow-hidden"
                style={{
                  background: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-float)',
                }}
              >
                {/* ── Nav Links ── */}
                <div className="p-2">
                  {navLinks.map((link, i) => {
                    const Icon   = link.icon
                    const active = pathname === link.href
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0   }}
                        transition={{ delay: i * 0.04, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link
                          href={link.href}
                          className={cn(
                            'group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)]',
                            'transition-all duration-[var(--duration-hover)]',
                            active
                              ? 'bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))]'
                              : 'text-[hsl(var(--muted))] hover:bg-[hsl(var(--background-secondary))] hover:text-[hsl(var(--foreground))]'
                          )}
                        >
                          <span
                            className={cn(
                              'w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 transition-colors duration-[var(--duration-hover)]',
                              active
                                ? 'bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]'
                                : 'bg-[hsl(var(--background-secondary))] text-[hsl(var(--muted))] group-hover:text-[hsl(var(--foreground))]'
                            )}
                          >
                            <Icon size={14} className={cn(link.href === '/saved' && active && 'fill-current')} />
                          </span>
                          <span className="flex-1 text-sm font-medium">{link.label}</span>
                          <ChevronRight
                            size={13}
                            className={cn(
                              'transition-all duration-[var(--duration-hover)]',
                              active ? 'opacity-60' : 'opacity-0 group-hover:opacity-30'
                            )}
                          />
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>

                {/* ── Divider ── */}
                <div className="h-px mx-3" style={{ background: 'hsl(var(--border))' }} />

                {/* ── Search + Theme ── */}
                <motion.div
                  className="p-2 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: navLinks.length * 0.04 + 0.05 }}
                >
                  <button
                    onClick={() => { setIsSearchOpen(true); setIsMobileOpen(false) }}
                    className={cn(
                      'flex items-center gap-2 flex-1 px-3 py-2.5 rounded-[var(--radius-sm)]',
                      'text-sm font-medium text-[hsl(var(--muted))]',
                      'bg-[hsl(var(--background-secondary))]',
                      'hover:bg-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]',
                      'transition-all duration-[var(--duration-hover)]'
                    )}
                  >
                    <Search size={14} />
                    Search anything…
                  </button>
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)]',
                      'bg-[hsl(var(--background-secondary))]'
                    )}
                  >
                    <ThemeToggle />
                  </div>
                </motion.div>

                {/* ── Divider ── */}
                <div className="h-px mx-3" style={{ background: 'hsl(var(--border))' }} />

                {/* ── Account footer ── */}
                <motion.div
                  className="p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: navLinks.length * 0.04 + 0.1 }}
                >
                  {isSignedIn ? (
                    <div className="flex items-center gap-3">
                      <UserButton
                        afterSignOutUrl="/"
                        appearance={{ elements: { avatarBox: 'w-8 h-8 rounded-[var(--radius-sm)]' } }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">Your account</p>
                        <p className="text-xs text-[hsl(var(--muted))] truncate">Profile & settings</p>
                      </div>
                      <button
                        onClick={() => signOut()}
                        aria-label="Sign out"
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-pill)]',
                          'text-xs font-medium text-[hsl(var(--muted))]',
                          'border border-[hsl(var(--border))]',
                          'hover:border-[hsl(var(--accent)/0.4)] hover:text-[hsl(var(--accent))]',
                          'transition-all duration-[var(--duration-hover)]'
                        )}
                      >
                        <LogOut size={12} />
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center bg-[hsl(var(--background-secondary))] text-[hsl(var(--muted))] shrink-0">
                        <User size={15} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">Join Shoppin</p>
                        <p className="text-xs text-[hsl(var(--muted))]">Save & discover what you love</p>
                      </div>
                      <Link href="/sign-up" className="btn-save text-xs px-3 py-1.5 shrink-0">
                        Join free
                      </Link>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer */}
      <div className="h-[52px]" />

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