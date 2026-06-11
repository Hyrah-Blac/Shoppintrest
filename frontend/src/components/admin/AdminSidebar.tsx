'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart,
  Users, BarChart3, Settings, LogOut,
  Headset, Bell, ChevronRight,
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

export function AdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <aside
      className="w-[220px] min-h-screen flex flex-col shrink-0 sticky top-0"
      style={{
        background:   'hsl(var(--background))',
        borderRight:  '0.5px solid hsl(var(--border))',
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
      >
        <Link href="/admin" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--foreground))' }}
          >
            <span
              className="text-[11px] font-bold"
              style={{ color: 'hsl(var(--background))' }}
            >S</span>
          </div>
          <div>
            <p
              className="text-[13px] font-semibold leading-none"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Shoppintrest
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: 'hsl(var(--muted))' }}
            >
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5">
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

      {/* Footer */}
      <div
        className="px-2.5 py-3 space-y-0.5"
        style={{ borderTop: '0.5px solid hsl(var(--border))' }}
      >
        <Link
          href="/"
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
          onClick={() => signOut()}
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
    </aside>
  )
}