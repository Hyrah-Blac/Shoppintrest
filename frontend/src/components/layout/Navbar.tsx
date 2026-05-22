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
    const onScroll = () => setIsScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setIsMobileOpen(false) }, [pathname])

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled ? 'glass shadow-sm py-2.5' : 'bg-background/95 py-3'
        )}
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container-wide flex items-center gap-3">

          {/* ── Logo ── */}
          <Link href="/" className="group flex items-center gap-2 shrink-0 mr-2">
            {/* Pinterest-style P mark */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center
                         text-white text-sm font-bold shrink-0
                         transition-transform duration-200 group-hover:scale-105"
              style={{ background: 'hsl(var(--accent))' }}
            >
              S
            </div>
            <span className="hidden sm:block font-semibold text-lg tracking-tight
                             text-foreground group-hover:opacity-75 transition-opacity">
              Shoppintrest
            </span>
          </Link>

          {/* ── Search bar (Pinterest-style floating pill) ── */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5
                       rounded-[var(--radius-pill)] border border-border
                       bg-background-secondary hover:border-foreground/30
                       transition-all duration-200 text-muted text-sm
                       shadow-sm hover:shadow-md group"
            style={{ background: 'hsl(var(--background-secondary))' }}
          >
            <Search size={16} className="shrink-0 group-hover:text-foreground transition-colors" />
            <span className="truncate">Search for products, styles…</span>
          </button>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-0.5 ml-auto shrink-0">

            <ThemeToggle />

            {isSignedIn ? (
              <>
                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative p-2.5 rounded-full text-muted hover:text-foreground
                             hover:bg-background-secondary transition-all duration-200"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-background"
                      style={{ background: 'hsl(var(--accent))' }}
                    />
                  )}
                </Link>

                {/* Saved / Wishlist */}
                <Link
                  href="/saved"
                  aria-label="Saved"
                  className={cn(
                    'relative p-2.5 rounded-full text-muted hover:text-foreground',
                    'hover:bg-background-secondary transition-all duration-200',
                    pathname === '/saved' && 'text-foreground'
                  )}
                >
                  <Heart
                    size={18}
                    className={cn(pathname === '/saved' && 'fill-current')}
                    style={pathname === '/saved' ? { color: 'hsl(var(--accent))' } : {}}
                  />
                </Link>

                {/* Cart */}
                <button
                  onClick={toggleCart}
                  aria-label="Cart"
                  className="relative p-2.5 rounded-full text-muted hover:text-foreground
                             hover:bg-background-secondary transition-all duration-200"
                >
                  <ShoppingBag size={18} />
                  <AnimatePresence>
                    {itemCount > 0 && (
                      <motion.span
                        key={itemCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem]
                                   text-white text-[10px] font-bold rounded-full
                                   flex items-center justify-center px-0.5 border-2 border-background"
                        style={{ background: 'hsl(var(--accent))' }}
                      >
                        {itemCount > 9 ? '9+' : itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* User avatar */}
                <div className="ml-1">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: 'w-8 h-8 rounded-full' } }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/sign-in"
                  className="text-sm font-semibold text-muted hover:text-foreground
                             transition-colors px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-save text-sm"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Menu"
              className="md:hidden p-2.5 rounded-full text-muted hover:text-foreground
                         hover:bg-background-secondary transition-all duration-200 ml-1"
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

        {/* ── Desktop secondary nav (category pills) ── */}
        <div className="hidden md:block border-t border-border/50 mt-2.5">
          <div className="container-wide flex items-center gap-1 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  pathname?.startsWith(link.href)
                    ? 'bg-foreground text-background'
                    : 'text-muted hover:text-foreground hover:bg-background-secondary'
                )}
              >
                {link.label}
              </Link>
            ))}
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
              className="md:hidden overflow-hidden border-t border-border/50"
            >
              <div className="container-wide py-4 flex flex-col gap-1">
                {/* Mobile search */}
                <button
                  onClick={() => { setIsSearchOpen(true); setIsMobileOpen(false) }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl
                             text-sm font-medium text-muted
                             hover:bg-background-secondary transition-all duration-200 w-full"
                  style={{ background: 'hsl(var(--background-secondary))' }}
                >
                  <Search size={15} className="shrink-0" />
                  Search…
                </button>

                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl
                                 text-sm font-medium text-muted hover:text-foreground
                                 hover:bg-background-secondary transition-all duration-200"
                    >
                      <Compass size={15} className="shrink-0" />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {isSignedIn && (
                  <>
                    <Link href="/saved"
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl
                                 text-sm font-medium text-muted hover:text-foreground
                                 hover:bg-background-secondary transition-all duration-200"
                    >
                      <Heart size={15} className="shrink-0" />
                      Saved
                    </Link>
                    <Link href="/messages"
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl
                                 text-sm font-medium text-muted hover:text-foreground
                                 hover:bg-background-secondary transition-all duration-200"
                    >
                      Messages
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer — accounts for double nav row */}
      <div className="h-[88px]" />

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}