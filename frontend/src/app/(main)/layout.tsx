// PATH: src/app/(main)/layout.tsx

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { NovuProvider } from '@/components/providers/NovuProvider'
import { StreamProvider } from '@/components/providers/StreamProvider'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NovuProvider>
      <StreamProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </div>
      </StreamProvider>
    </NovuProvider>
  )
}