'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart,
  Users, BarChart3, Settings, LogOut,
  Tag, Bell,
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Collections',
    href: '/admin/collections',
    icon: Tag,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <aside className="w-60 min-h-screen border-r border-border bg-background
                      flex flex-col shrink-0 sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center
                          justify-center">
            <span className="text-background text-xs font-bold">S</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">
              Shoppintrest
            </p>
            <p className="text-2xs text-muted mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
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
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                 font-medium transition-all duration-200`,
                isActive
                  ? 'bg-foreground text-background'
                  : 'text-muted hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     font-medium text-muted hover:text-foreground hover:bg-accent
                     transition-all duration-200"
        >
          <Bell size={16} />
          View Site
        </Link>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                     text-sm font-medium text-muted hover:text-destructive
                     hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}