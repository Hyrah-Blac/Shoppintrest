'use client'

/**
 * Navbar — v3 · Shoppin
 *
 * v2 → v3:
 *  - Removed: Collections nav item, Messages nav item
 *  - Removed: useMessageStore (store being deleted)
 *  - Removed: BookMarked, MessageCircle imports
 *  - Added:   Support to desktop dropdown + mobile links
 *  - Added:   Headphones icon
 *  - Mobile fill-current guard updated (removed /messages reference)
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import {
  Search, ShoppingBag, Heart, Bell,
  Menu, X, Compass, ChevronRight, LogOut,
  User, LayoutDashboard, ArrowRight, Package,
  Headphones,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { SearchModal } from '@/components/search/SearchModal'

// ─── Data ─────────────────────────────────────────────────────────────────────

const navLinks = [
  { href: '/explore', label: 'Explore', icon: Compass },
]

const mobileOnlyLinks = [
  { href: '/saved',   label: 'Saved',     icon: Heart      },
  { href: '/orders',  label: 'My Orders', icon: Package    },
  { href: '/support', label: 'Support',   icon: Headphones },
]

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const pathname                = usePathname()
  const { isSignedIn, signOut } = useAuth()
  const user                    = useUserStore((s) => s.user)
  const isAdmin                 = user?.role === 'admin'

  const [isScrolled,   setIsScrolled]   = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserOpen,   setIsUserOpen]   = useState(false)

  const itemCount   = useCartStore((s) => s.itemCount)
  const toggleCart  = useCartStore((s) => s.toggleCart)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setIsUserOpen(false) }, [pathname])

  const allMobileLinks = isSignedIn ? [...navLinks, ...mobileOnlyLinks] : navLinks

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const Avatar = ({ size = 28 }: { size?: number }) => (
    <div
      className="rounded-full flex items-center justify-center
                 text-[hsl(var(--background))] font-semibold shrink-0 overflow-hidden"
      style={{
        width:      size,
        height:     size,
        fontSize:   size < 36 ? '11px' : '13px',
        background: 'hsl(var(--foreground))',
      }}
    >
      {user?.avatar
        ? <Image src={user.avatar} alt={user.displayName || 'Avatar'} width={size} height={size} className="object-cover w-full h-full" />
        : initials}
    </div>
  )

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
              <Image src="/logo.png" alt="Shoppin" fill sizes="64px" className="object-contain" priority />
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
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
                    style={{ background: 'hsl(var(--foreground))' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Search + Theme — desktop only */}
            <div className="hidden md:flex items-center gap-1.5">
              <NavIconBtn onClick={() => setIsSearchOpen(true)} label="Search">
                <Search size={17} />
              </NavIconBtn>
              <ThemeToggle />
            </div>

            {isSignedIn ? (
              <>
                {/* Notifications */}
                <Link href="/notifications" className="btn-icon relative" aria-label="Notifications">
                  <Bell size={17} />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        key={unreadCount}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{   scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                        className="badge badge-red badge-notification"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                {/* Saved — desktop only */}
                <Link
                  href="/saved"
                  aria-label="Saved"
                  className={cn(
                    'btn-icon hidden md:inline-flex',
                    pathname === '/saved' && 'text-[hsl(var(--foreground))]'
                  )}
                >
                  <Heart size={17} className={cn(pathname === '/saved' && 'fill-current')} />
                </Link>

                {/* Cart */}
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

                {/* Avatar — mobile: profile link */}
                <Link
                  href={`/profile/${user?.username}`}
                  aria-label="Your profile"
                  className="md:hidden flex items-center p-1 rounded-full ml-0.5
                             hover:ring-2 hover:ring-[hsl(var(--border))]
                             transition-all duration-[var(--duration-hover)]"
                >
                  <Avatar size={28} />
                </Link>

                {/* Avatar — desktop: dropdown */}
                <div
                  ref={dropdownRef}
                  className="relative ml-1 pl-2 border-l border-[hsl(var(--border))] hidden md:block"
                >
                  <button
                    onClick={() => setIsUserOpen(!isUserOpen)}
                    aria-label="Account menu"
                    aria-expanded={isUserOpen}
                    className={cn(
                      'flex items-center p-1 rounded-full',
                      'transition-all duration-[var(--duration-hover)]',
                      'hover:ring-2 hover:ring-[hsl(var(--border))]',
                      isUserOpen && 'ring-2 ring-[hsl(var(--border))]'
                    )}
                  >
                    <Avatar size={28} />
                  </button>

                  <AnimatePresence>
                    {isUserOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1    }}
                        exit={{   opacity: 0, y: 6, scale: 0.97  }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full mt-2 z-50 overflow-hidden"
                        style={{
                          width:        '276px',
                          borderRadius: '16px',
                          background:   'hsl(var(--surface))',
                          border:       '0.5px solid hsl(var(--border))',
                          boxShadow:    'var(--shadow-float)',
                        }}
                      >
                        {/* Header */}
                        <div
                          className="px-3.5 py-3 flex items-center gap-3"
                          style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
                        >
                          <Avatar size={42} />
                          <div className="min-w-0">
                            <p
                              className="text-[14px] font-medium truncate leading-snug"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              {user?.displayName || 'Your account'}
                            </p>
                            <p
                              className="text-[12px] truncate mt-0.5"
                              style={{ color: 'hsl(var(--muted))' }}
                            >
                              @{user?.username}
                            </p>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-1.5">
                          <p
                            className="px-2 pt-1.5 pb-1 text-[10px] font-medium uppercase tracking-[0.07em]"
                            style={{ color: 'hsl(var(--muted))' }}
                          >
                            Account
                          </p>

                          <DropdownItem
                            href={`/profile/${user?.username}`}
                            icon={<User size={14} style={{ color: 'hsl(var(--muted))' }} />}
                            label="Your profile"
                            sub={`shoppin.com/@${user?.username}`}
                          />

                          <DropdownItem
                            href="/orders"
                            icon={<Package size={14} style={{ color: 'hsl(var(--muted))' }} />}
                            label="My orders"
                            sub="See your history"
                          />

                          <DropdownItem
                            href="/support"
                            icon={<Headphones size={14} style={{ color: 'hsl(var(--muted))' }} />}
                            label="Support"
                            sub="Get help with your orders"
                          />

                          {isAdmin && (
                            <>
                              <p
                                className="px-2 pt-2.5 pb-1 text-[10px] font-medium uppercase tracking-[0.07em]"
                                style={{ color: 'hsl(var(--muted))' }}
                              >
                                Admin
                              </p>
                              <DropdownItem
                                href="/admin"
                                icon={<LayoutDashboard size={14} style={{ color: 'hsl(var(--muted))' }} />}
                                label="Dashboard"
                                sub="Manage products & users"
                              />
                            </>
                          )}
                        </div>

                        {/* Sign out */}
                        <div className="p-1.5" style={{ borderTop: '0.5px solid hsl(var(--border))' }}>
                          <button
                            onClick={() => { setIsUserOpen(false); signOut() }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-[9px]
                                       rounded-[10px] text-[13.5px] transition-all duration-[var(--duration-hover)]"
                            style={{ color: 'hsl(var(--muted))' }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'hsl(var(--background-secondary))'
                              e.currentTarget.style.color      = 'hsl(var(--foreground))'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color      = 'hsl(var(--muted))'
                            }}
                          >
                            <span
                              className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
                              style={{ background: 'hsl(var(--background-secondary))' }}
                            >
                              <LogOut size={13} style={{ color: 'hsl(var(--muted))' }} />
                            </span>
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                {/* Cart — guests */}
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

                {/* Desktop auth */}
                <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-[hsl(var(--border))]">
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium px-3 py-2
                               text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]
                               transition-colors duration-[var(--duration-hover)]"
                  >
                    Sign in
                  </Link>
                  <Link href="/sign-up" className="btn-save text-sm">Join free</Link>
                </div>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileOpen}
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

        {/* ── Mobile Drawer ── */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{   opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 top-[52px] bg-black/40 md:hidden -z-10"
                onClick={() => setIsMobileOpen(false)}
                aria-hidden
              />

              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: -8, scale: 0.98  }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="md:hidden mx-3 mt-2 mb-1 rounded-[var(--radius-lg)] overflow-hidden"
                style={{
                  background: 'hsl(var(--surface))',
                  border:     '1px solid hsl(var(--border))',
                  boxShadow:  'var(--shadow-float)',
                }}
              >
                <div className="p-2">
                  {allMobileLinks.map((link, i) => {
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
                              ? 'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--foreground))]'
                              : 'text-[hsl(var(--muted))] hover:bg-[hsl(var(--background-secondary))] hover:text-[hsl(var(--foreground))]'
                          )}
                        >
                          <span className={cn(
                            'w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0',
                            'transition-colors duration-[var(--duration-hover)]',
                            active
                              ? 'bg-[hsl(var(--background-secondary))] text-[hsl(var(--foreground))]'
                              : 'bg-[hsl(var(--background-secondary))] text-[hsl(var(--muted))] group-hover:text-[hsl(var(--foreground))]'
                          )}>
                            <Icon size={14} className={cn(link.href === '/saved' && active && 'fill-current')} />
                          </span>
                          <span className="flex-1 text-sm font-medium">{link.label}</span>
                          <ChevronRight
                            size={13}
                            className={cn(
                              'transition-all duration-[var(--duration-hover)]',
                              active ? 'opacity-30' : 'opacity-0 group-hover:opacity-30'
                            )}
                          />
                        </Link>
                      </motion.div>
                    )
                  })}

                  {isAdmin && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0   }}
                      transition={{ delay: allMobileLinks.length * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href="/admin"
                        className={cn(
                          'group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)]',
                          'transition-all duration-[var(--duration-hover)]',
                          pathname.startsWith('/admin')
                            ? 'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--foreground))]'
                            : 'text-[hsl(var(--muted))] hover:bg-[hsl(var(--background-secondary))] hover:text-[hsl(var(--foreground))]'
                        )}
                      >
                        <span className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0
                                         bg-[hsl(var(--background-secondary))] text-[hsl(var(--muted))]
                                         group-hover:text-[hsl(var(--foreground))] transition-colors duration-[var(--duration-hover)]">
                          <LayoutDashboard size={14} />
                        </span>
                        <span className="flex-1 text-sm font-medium">Dashboard</span>
                      </Link>
                    </motion.div>
                  )}
                </div>

                <div className="h-px mx-3" style={{ background: 'hsl(var(--border))' }} />

                <motion.div
                  className="p-2 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: allMobileLinks.length * 0.04 + 0.05 }}
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
                  <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-[hsl(var(--background-secondary))]">
                    <ThemeToggle />
                  </div>
                </motion.div>

                {!isSignedIn && (
                  <>
                    <div className="h-px mx-3" style={{ background: 'hsl(var(--border))' }} />
                    <motion.div
                      className="p-3 flex flex-col gap-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: allMobileLinks.length * 0.04 + 0.08 }}
                    >
                      <Link
                        href="/sign-in"
                        className="w-full flex items-center justify-center gap-2
                                   py-3 rounded-[var(--radius-pill)] text-sm font-medium
                                   border border-[hsl(var(--border))]
                                   text-[hsl(var(--foreground))]
                                   hover:border-[hsl(var(--foreground))]
                                   hover:bg-[hsl(var(--foreground)/0.04)]
                                   transition-all duration-[var(--duration-hover)]"
                      >
                        Sign in
                      </Link>
                      <Link href="/sign-up" className="btn-save w-full justify-center gap-2 py-3 text-sm">
                        Join free
                        <ArrowRight size={14} />
                      </Link>
                    </motion.div>
                  </>
                )}

                {isSignedIn && (
                  <>
                    <div className="h-px mx-3" style={{ background: 'hsl(var(--border))' }} />
                    <motion.div
                      className="p-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: allMobileLinks.length * 0.04 + 0.1 }}
                    >
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-3 py-2.5
                                   rounded-[var(--radius-sm)] text-sm
                                   transition-all duration-[var(--duration-hover)]"
                        style={{ color: 'hsl(var(--muted))' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'hsl(var(--background-secondary))'
                          e.currentTarget.style.color      = 'hsl(var(--foreground))'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color      = 'hsl(var(--muted))'
                        }}
                      >
                        <span
                          className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                          style={{ background: 'hsl(var(--background-secondary))' }}
                        >
                          <LogOut size={13} style={{ color: 'hsl(var(--muted))' }} />
                        </span>
                        <span className="font-medium">Sign out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="h-[52px]" aria-hidden />

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

// ─── DropdownItem ─────────────────────────────────────────────────────────────

function DropdownItem({
  href, icon, label, sub,
}: {
  href: string
  icon: React.ReactNode
  label: string
  sub?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px]
                 transition-all duration-[var(--duration-hover)]"
      style={{ color: 'hsl(var(--foreground))' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--background-secondary))')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span
        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
        style={{ background: 'hsl(var(--background-secondary))' }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-[450] leading-none" style={{ color: 'hsl(var(--foreground))' }}>
          {label}
        </span>
        {sub && (
          <span className="block text-[11.5px] mt-0.5 truncate" style={{ color: 'hsl(var(--muted))' }}>
            {sub}
          </span>
        )}
      </span>
      <ChevronRight size={13} style={{ color: 'hsl(var(--muted))', opacity: 0.45 }} />
    </Link>
  )
}

// ─── NavIconBtn ───────────────────────────────────────────────────────────────

function NavIconBtn({ onClick, label, children }: {
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