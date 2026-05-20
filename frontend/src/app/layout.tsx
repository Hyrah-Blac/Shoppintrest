import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { UserProvider } from '@/components/providers/UserProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Shoppintrest — Luxury Visual Commerce',
    template: '%s | Shoppintrest',
  },
  description:
    'Discover and shop luxury fashion through a curated visual experience. Explore editorial collections, follow creators, and build your aesthetic.',
  keywords: [
    'luxury fashion',
    'visual commerce',
    'editorial style',
    'fashion discovery',
    'curated collections',
  ],
  authors: [{ name: 'Shoppintrest' }],
  creator: 'Shoppintrest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Shoppintrest',
    title: 'Shoppintrest — Luxury Visual Commerce',
    description:
      'Discover and shop luxury fashion through a curated visual experience.',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Shoppintrest',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shoppintrest — Luxury Visual Commerce',
    description: 'Discover and shop luxury fashion.',
    creator: '@shoppintrest',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f10' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider>
            <UserProvider>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </UserProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}