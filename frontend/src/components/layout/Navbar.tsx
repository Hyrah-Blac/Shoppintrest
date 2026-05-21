'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, UserButton } from '@clerk/nextjs'
import {
  Search, ShoppingBag, Heart, Bell, Menu, X, Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { SearchModal } from '@/components/search/SearchModal'

const navLinks = [
  { href: '/explore', label: 'Explore' },
  { href: '/collections', label: 'Collections' },
]

export function Navbar() {
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount)
  const toggleCart = useCartStore((s) => s.toggleCart)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'glass shadow-sm py-3'
            : 'bg-transparent py-5'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="container-wide flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="font-display font-semibold text-xl tracking-tight text-foreground hover:opacity-70 transition-opacity"
          >
            Shoppintrest
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  pathname === link.href
                    ? 'text-foreground'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-xl text-muted hover:text-foreground
                         hover:bg-accent transition-all duration-200"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <ThemeToggle />

            {isSignedIn ? (
              <>
                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative p-2.5 rounded-xl text-muted hover:text-foreground
                             hover:bg-accent transition-all duration-200"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-foreground rounded-full" />
                  )}
                </Link>

                {/* Saved */}
                <Link
                  href="/saved"
                  className={cn(
                    'p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-accent transition-all duration-200',
                    pathname === '/saved' && 'text-foreground'
                  )}
                  aria-label="Saved"
                >
                  <Heart size={18} className={cn(pathname === '/saved' && 'fill-current')} />
                </Link>

                {/* Cart */}
                <button
                  onClick={toggleCart}
                  className="relative p-2.5 rounded-xl text-muted hover:text-foreground
                             hover:bg-accent transition-all duration-200"
                  aria-label="Cart"
                >
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground
                                 text-background text-2xs font-semibold rounded-full
                                 flex items-center justify-center"
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </motion.span>
                  )}
                </button>

                {/* User */}
                <div className="ml-1">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-8 h-8',
                      },
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-muted hover:text-foreground
                             transition-colors duration-200 px-3 py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-medium bg-foreground text-background
                             px-4 py-2 rounded-xl hover:opacity-80 transition-opacity"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2.5 rounded-xl text-muted hover:text-foreground
                         hover:bg-accent transition-all duration-200 ml-1"
              aria-label="Menu"
            >
              {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border mt-3 overflow-hidden"
            >
              <div className="container-wide py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl
                               text-sm font-medium text-muted hover:text-foreground
                               hover:bg-accent transition-all duration-200"
                  >
                    <Compass size={16} />
                    {link.label}
                  </Link>
                ))}
                {isSignedIn && (
                  <>
                    <Link
                      href="/saved"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl
                                 text-sm font-medium text-muted hover:text-foreground
                                 hover:bg-accent transition-all duration-200"
                    >
                      <Heart size={16} />
                      Saved
                    </Link>
                    <Link
                      href="/messages"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl
                                 text-sm font-medium text-muted hover:text-foreground
                                 hover:bg-accent transition-all duration-200"
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

      {/* Spacer */}
      <div className="h-20" />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  )
}