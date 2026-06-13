import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminGuard }   from '@/components/admin/AdminGuard'
import { StreamProvider } from '@/components/providers/StreamProvider'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <StreamProvider>
        <div
          className="min-h-screen flex"
          style={{ background: 'hsl(var(--surface))' }}
        >
          <AdminSidebar />
          <main className="flex-1 min-w-0 overflow-auto">
            {children}
          </main>
        </div>
      </StreamProvider>
    </AdminGuard>
  )
}