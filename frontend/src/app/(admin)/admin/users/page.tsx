'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { UserCheck, UserX } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.admin.getUsers()
      .then(({ data }) => setUsers(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleToggle = async (user: any) => {
    try {
      await apiClient.admin.toggleUserActive(user._id)
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        )
      )
      toast.success(user.isActive ? 'User deactivated' : 'User activated')
    } catch { toast.error('Could not update user') }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await apiClient.admin.updateUserRole(userId, role)
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role } : u))
      )
      toast.success('Role updated')
    } catch { toast.error('Could not update role') }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Users
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Manage user accounts and roles
        </p>
      </div>

      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-4 font-medium">User</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Joined</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-surface transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar}
                        name={user.displayName}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value)
                      }
                      className="text-xs border border-border rounded-lg px-2 py-1
                                 bg-background text-foreground focus:outline-none
                                 focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      <option value="user">user</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={user.isActive ? 'success' : 'destructive'}
                      size="sm"
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleToggle(user)}
                      className={cn(
                        `p-2 rounded-lg transition-colors`,
                        user.isActive
                          ? 'text-muted hover:text-destructive hover:bg-destructive/10'
                          : 'text-muted hover:text-emerald-600 hover:bg-emerald-50'
                      )}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive
                        ? <UserX size={15} />
                        : <UserCheck size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}