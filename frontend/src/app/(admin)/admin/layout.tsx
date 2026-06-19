import { AdminSidebar }   from '@/components/admin/AdminSidebar'
import { AdminGuard }     from '@/components/admin/AdminGuard'
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
          style={{ background: 'hsl(var(--background))' }}
        >
          <AdminSidebar />
          {/*
            pt-14 clears the 56px fixed mobile top bar rendered by AdminSidebar.
            md:pt-0 removes it on desktop where the sidebar is persistent instead.
          */}
          <main className="flex-1 min-w-0 overflow-auto pt-14 md:pt-0">
            {children}
          </main>
        </div>
      </StreamProvider>
    </AdminGuard>
  )
}