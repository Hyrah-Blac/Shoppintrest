'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingCart,
  Users, BarChart3, Settings, LogOut,
  Headset, Bell, ChevronRight, Menu, X,
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard',   href: '/admin',             icon: LayoutDashboard },
  { label: 'Products',    href: '/admin/products',    icon: Package         },
  { label: 'Orders',      href: '/admin/orders',      icon: ShoppingCart    },
  { label: 'Users',       href: '/admin/users',       icon: Users           },
  { label: 'Support',     href: '/admin/support',     icon: Headset         },
  { label: 'Analytics',   href: '/admin/analytics',   icon: BarChart3       },
  { label: 'Settings',    href: '/admin/settings',    icon: Settings        },
]

const ease = [0.16, 1, 0.3, 1] as const

// ─── Mobile top bar height ──────────────────────────────────────────────────
// This bar is `fixed`, so a spacer of the same height is rendered below it to
// push page content down on mobile/tablet. No changes needed in parent layouts.
const MOBILE_BAR_HEIGHT = 56

export function AdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock background scroll while the drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = previous }
    }
  }, [mobileOpen])

  return (
    <>
      {/* ── MOBILE TOP BAR ── */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4"
        style={{
          height:       `${MOBILE_BAR_HEIGHT}px`,
          background:   'hsl(var(--background))',
          borderBottom: '0.5px solid hsl(var(--border))',
        }}
      >
        <Link href="/admin" className="relative w-20 h-6 shrink-0">
          <Image
            src="/logo.png"
            alt="Shoppin"
            fill
            className="object-contain object-left"
          />
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex items-center justify-center rounded-[10px] shrink-0"
          style={{
            width:      '36px',
            height:     '36px',
            color:      'hsl(var(--foreground))',
            background: 'hsl(var(--surface))',
            border:     '0.5px solid hsl(var(--border))',
          }}
        >
          <Menu size={16} />
        </button>
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden md:flex w-[220px] min-h-screen flex-col shrink-0 sticky top-0"
        style={{
          background:  'hsl(var(--background))',
          borderRight: '0.5px solid hsl(var(--border))',
        }}
      >
        <SidebarLogo />
        <SidebarNav pathname={pathname} />
        <SidebarFooter signOut={signOut} />
      </aside>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />

            {/* Panel */}
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="md:hidden fixed inset-y-0 left-0 z-50 flex flex-col"
              style={{
                width:       'min(260px, 80vw)',
                background:  'hsl(var(--background))',
                borderRight: '0.5px solid hsl(var(--border))',
                boxShadow:   'var(--shadow-lg)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.32, ease }}
            >
              <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '0.5px solid hsl(var(--border))' }}>
                <Link href="/admin" className="flex flex-col gap-1.5" onClick={() => setMobileOpen(false)}>
                  <div className="relative w-24 h-7">
                    <Image
                      src="/logo.png"
                      alt="Shoppin"
                      fill
                      className="object-contain object-left"
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>
                    Admin Panel
                  </p>
                </Link>

                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex items-center justify-center rounded-[10px] shrink-0"
                  style={{
                    width:      '32px',
                    height:     '32px',
                    color:      'hsl(var(--muted))',
                    background: 'transparent',
                    border:     '0.5px solid hsl(var(--border))',
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <SidebarFooter signOut={signOut} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer so page content clears the fixed mobile bar */}
      <div className="md:hidden" style={{ height: `${MOBILE_BAR_HEIGHT}px` }} aria-hidden />
    </>
  )
}

// ─── Logo block (desktop sidebar header) ───────────────────────────────────

function SidebarLogo() {
  return (
    <div
      className="px-5 py-5"
      style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
    >
      <Link href="/admin" className="flex flex-col gap-1.5">
        <div className="relative w-24 h-7">
          <Image
            src="/logo.png"
            alt="Shoppin"
            fill
            className="object-contain object-left"
          />
        </div>
        <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>
          Admin Panel
        </p>
      </Link>
    </div>
  )
}

// ─── Nav links — shared by desktop sidebar and mobile drawer ───────────────

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
      <p
        className="px-3 pt-1 pb-2 text-[10px] font-medium uppercase tracking-[0.07em]"
        style={{ color: 'hsl(var(--muted))' }}
      >
        Menu
      </p>
      {navItems.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px]',
              'font-medium transition-all',
              'duration-[var(--duration-hover)]'
            )}
            style={
              isActive
                ? {
                    background: 'hsl(var(--foreground))',
                    color:      'hsl(var(--background))',
                  }
                : {
                    color: 'hsl(var(--muted))',
                  }
            }
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'hsl(var(--surface))'
                e.currentTarget.style.color = 'hsl(var(--foreground))'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'hsl(var(--muted))'
              }
            }}
          >
            <item.icon size={14} />
            <span className="flex-1">{item.label}</span>
            {isActive && (
              <ChevronRight
                size={11}
                style={{ opacity: 0.4, color: 'hsl(var(--background))' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// ─── Footer links — shared by desktop sidebar and mobile drawer ────────────

function SidebarFooter({
  signOut,
  onNavigate,
}: {
  signOut: () => void
  onNavigate?: () => void
}) {
  return (
    <div
      className="px-2.5 py-3 space-y-0.5"
      style={{ borderTop: '0.5px solid hsl(var(--border))' }}
    >
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]
                   text-[13px] font-medium transition-all duration-[var(--duration-hover)]"
        style={{ color: 'hsl(var(--muted))' }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'hsl(var(--surface))'
          e.currentTarget.style.color = 'hsl(var(--foreground))'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'hsl(var(--muted))'
        }}
      >
        <Bell size={14} />
        View Site
      </Link>
      <button
        onClick={() => { onNavigate?.(); signOut() }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]
                   text-[13px] font-medium transition-all duration-[var(--duration-hover)]"
        style={{ color: 'hsl(var(--muted))' }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'hsl(var(--destructive) / 0.08)'
          e.currentTarget.style.color = 'hsl(var(--destructive))'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'hsl(var(--muted))'
        }}
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </div>
  )
}