'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Search, X, UserCheck, UserX, Users as UsersIcon,
  ShieldCheck, AlertCircle,
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

type Role = 'user' | 'moderator' | 'admin'

interface AdminUser {
  _id: string
  displayName: string
  email: string
  avatar?: string
  role: Role
  isActive: boolean
  createdAt: string
}

const roleFilters: { label: string; value: 'all' | Role }[] = [
  { label: 'All',       value: 'all'       },
  { label: 'User',      value: 'user'      },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Admin',     value: 'admin'     },
]

const statusFilters: { label: string; value: 'all' | 'active' | 'inactive' }[] = [
  { label: 'All',      value: 'all'      },
  { label: 'Active',   value: 'active'   },
  { label: 'Inactive', value: 'inactive' },
]

const inputClass = cn(
  'w-full h-10 px-3 rounded-[10px] text-sm placeholder:text-[hsl(var(--muted))]',
  'focus:outline-none transition-all duration-[var(--duration-hover)]'
)
const inputStyle = {
  border:     '0.5px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
  color:      'hsl(var(--foreground))',
}
const focusRing = (e: React.FocusEvent<HTMLElement>) => {
  e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.45)'
  e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.09)'
}
const blurRing = (e: React.FocusEvent<HTMLElement>) => {
  e.currentTarget.style.borderColor = 'hsl(var(--border))'
  e.currentTarget.style.boxShadow   = 'none'
}

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter]     = useState<'all' | Role>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [togglingId, setTogglingId]     = useState<string | null>(null)

  useEffect(() => {
    apiClient.admin.getUsers()
      .then(({ data }) => setUsers(data.data || []))
      .catch(() => toast.error('Could not load users'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleToggle = async (user: AdminUser) => {
    setTogglingId(user._id)
    const nextActive = !user.isActive
    // optimistic update
    setUsers((prev) =>
      prev.map((u) => u._id === user._id ? { ...u, isActive: nextActive } : u)
    )
    try {
      await apiClient.admin.toggleUserActive(user._id)
      toast.success(nextActive ? 'User activated' : 'User deactivated')
    } catch {
      // roll back on failure
      setUsers((prev) =>
        prev.map((u) => u._id === user._id ? { ...u, isActive: user.isActive } : u)
      )
      toast.error('Could not update user')
    } finally {
      setTogglingId(null)
    }
  }

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await apiClient.admin.updateUserRole(userId, role)
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role } : u))
      )
      toast.success('Role updated')
    } catch { toast.error('Could not update role') }
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    users.length,
    active:   users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins:   users.filter(u => u.role === 'admin').length,
  }), [users])

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter === 'active'   && !u.isActive) return false
      if (statusFilter === 'inactive' &&  u.isActive) return false
      if (q) {
        const haystack = `${u.displayName ?? ''} ${u.email ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [users, search, roleFilter, statusFilter])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div>
        <p
          className="text-[10px] font-medium uppercase tracking-[0.12em] mb-1"
          style={{ color: 'hsl(var(--accent))' }}
        >
          Directory
        </p>
        <h1
          className="font-display text-2xl font-semibold tracking-tight"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Users
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
          {stats.total.toLocaleString()} total user{stats.total === 1 ? '' : 's'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={UsersIcon}   label="Total users" value={stats.total}    isLoading={isLoading} />
        <StatCard icon={UserCheck}   label="Active"      value={stats.active}   isLoading={isLoading} tone="success" />
        <StatCard icon={UserX}       label="Inactive"    value={stats.inactive} isLoading={isLoading} tone="muted" />
        <StatCard icon={ShieldCheck} label="Admins"      value={stats.admins}   isLoading={isLoading} />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'hsl(var(--muted))' }}
          />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-[var(--radius-pill)] text-sm
                       placeholder:text-[hsl(var(--muted))] focus:outline-none
                       transition-all duration-[var(--duration-hover)]"
            style={inputStyle}
            onFocus={focusRing}
            onBlur={blurRing}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
              style={{ color: 'hsl(var(--muted))' }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <FilterGroup
            options={roleFilters}
            value={roleFilter}
            onChange={setRoleFilter}
          />
          <span className="w-px h-5 shrink-0" style={{ background: 'hsl(var(--border))' }} />
          <FilterGroup
            options={statusFilters}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(var(--background))',
          border:     '0.5px solid hsl(var(--border))',
          boxShadow:  'var(--shadow-xs)',
        }}
      >
        {/* Desktop / tablet table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-[11px]"
                style={{
                  borderBottom: '0.5px solid hsl(var(--border))',
                  color: 'hsl(var(--muted))',
                }}
              >
                {['User', 'Role', 'Joined', 'Status', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={cn('px-5 py-4 font-medium whitespace-nowrap', i === 4 && 'text-right')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-20">
                    <EmptyState search={search} />
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    onToggle={() => handleToggle(user)}
                    onRoleChange={(role) => handleRoleChange(user._id, role)}
                    isToggling={togglingId === user._id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="divide-y" style={{ borderColor: 'hsl(var(--border-subtle))' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3"
                     style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}>
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3 rounded-lg" />
                    <Skeleton className="h-3 w-1/3 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16">
              <EmptyState search={search} />
            </div>
          ) : (
            filtered.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                onToggle={() => handleToggle(user)}
                onRoleChange={(role) => handleRoleChange(user._id, role)}
                isToggling={togglingId === user._id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/* Sub-components                                                          */
/* ---------------------------------------------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  tone = 'default',
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label: string
  value: number
  isLoading: boolean
  tone?: 'default' | 'success' | 'muted'
}) {
  const color =
    tone === 'success' ? 'hsl(var(--success))' :
    tone === 'muted'   ? 'hsl(var(--muted))'    :
    'hsl(var(--foreground))'

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'hsl(var(--background))',
        border:     '0.5px solid hsl(var(--border))',
        boxShadow:  'var(--shadow-xs)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
          {label}
        </p>
        <Icon size={14} style={{ color: 'hsl(var(--muted))' } as React.CSSProperties} />
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-12 rounded-lg" />
      ) : (
        <p className="text-2xl font-semibold tracking-tight" style={{ color }}>
          {value}
        </p>
      )}
    </div>
  )
}

function FilterGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium whitespace-nowrap
                       transition-all duration-[var(--duration-hover)]"
            style={
              active
                ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))', border: 'none' }
                : { background: 'transparent', color: 'hsl(var(--muted))', border: '0.5px solid hsl(var(--border))' }
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function RoleSelect({
  value,
  onChange,
  fullWidth,
}: {
  value: Role
  onChange: (role: Role) => void
  fullWidth?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Role)}
      className={cn(inputClass, 'h-9 text-[12px]', fullWidth && 'w-full')}
      style={inputStyle}
      onFocus={focusRing}
      onBlur={blurRing}
    >
      <option value="user">User</option>
      <option value="moderator">Moderator</option>
      <option value="admin">Admin</option>
    </select>
  )
}

function ToggleActiveAction({
  user,
  onToggle,
  isToggling,
}: {
  user: AdminUser
  onToggle: () => void
  isToggling: boolean
}) {
  const isActive = user.isActive
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isToggling}
      aria-label={isActive ? 'Deactivate user' : 'Activate user'}
      title={isActive ? 'Deactivate' : 'Activate'}
      className="p-2 rounded-[8px] transition-all duration-[var(--duration-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ color: 'hsl(var(--muted))' }}
      onMouseEnter={e => {
        if (isToggling) return
        e.currentTarget.style.color = isActive
          ? 'hsl(var(--destructive))'
          : 'hsl(var(--success))'
        e.currentTarget.style.background = isActive
          ? 'hsl(var(--destructive) / 0.08)'
          : 'hsl(var(--success) / 0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'hsl(var(--muted))'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
    </button>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'hsl(var(--surface))', color: 'hsl(var(--muted))' }}
      >
        <UsersIcon size={20} />
      </div>
      {search ? (
        <div className="space-y-1">
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            No users match "{search}"
          </p>
          <p className="text-[12px]" style={{ color: 'hsl(var(--muted))' }}>
            Try a different name or email.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            No users found
          </p>
          <p className="text-[12px]" style={{ color: 'hsl(var(--muted))' }}>
            Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  )
}

function UserRow({
  user,
  onToggle,
  onRoleChange,
  isToggling,
}: {
  user: AdminUser
  onToggle: () => void
  onRoleChange: (role: Role) => void
  isToggling: boolean
}) {
  return (
    <tr
      className="transition-colors duration-[var(--duration-hover)]"
      style={{
        borderBottom: '0.5px solid hsl(var(--border-subtle))',
        opacity: isToggling ? 0.6 : 1,
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface))')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} name={user.displayName} size="sm" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate max-w-[220px]" style={{ color: 'hsl(var(--foreground))' }}>
              {user.displayName}
            </p>
            <p className="text-[11px] truncate max-w-[220px]" style={{ color: 'hsl(var(--muted))' }}>
              {user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <RoleSelect value={user.role} onChange={onRoleChange} />
      </td>
      <td className="px-5 py-4 text-[12px] whitespace-nowrap" style={{ color: 'hsl(var(--muted))' }}>
        {formatDate(user.createdAt)}
      </td>
      <td className="px-5 py-4">
        <Badge variant={user.isActive ? 'success' : 'secondary'} size="sm">
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end">
          <ToggleActiveAction user={user} onToggle={onToggle} isToggling={isToggling} />
        </div>
      </td>
    </tr>
  )
}

function UserCard({
  user,
  onToggle,
  onRoleChange,
  isToggling,
}: {
  user: AdminUser
  onToggle: () => void
  onRoleChange: (role: Role) => void
  isToggling: boolean
}) {
  return (
    <div
      className="p-4 flex flex-col gap-3 transition-opacity"
      style={{
        borderBottom: '0.5px solid hsl(var(--border-subtle))',
        opacity: isToggling ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar} name={user.displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
            {user.displayName}
          </p>
          <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted))' }}>
            {user.email}
          </p>
        </div>
        <ToggleActiveAction user={user} onToggle={onToggle} isToggling={isToggling} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={user.isActive ? 'success' : 'secondary'} size="sm">
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <span className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
            Joined {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      <RoleSelect value={user.role} onChange={onRoleChange} fullWidth />
    </div>
  )
}