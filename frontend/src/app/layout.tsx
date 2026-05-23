import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { UserProvider } from '@/components/providers/UserProvider'
import ClerkTokenProvider from '@/components/ClerkTokenProvider'

/* ── Blueprint fonts: DM Sans (body/UI) + Playfair Display (editorial) ── */
const dmSans = DM_Sans({
  subsets:  ['latin'],
  axes:     ['opsz'],
  variable: '--font-dm-sans',
  display:  'swap',
})

const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  display:  'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'Shoppintrest — Luxury Visual Commerce',
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
  authors:  [{ name: 'Shoppintrest' }],
  creator:  'Shoppintrest',
  openGraph: {
    type:        'website',
    locale:      'en_US',
    url:         process.env.NEXT_PUBLIC_APP_URL,
    siteName:    'Shoppintrest',
    title:       'Shoppintrest — Luxury Visual Commerce',
    description: 'Discover and shop luxury fashion through a curated visual experience.',
    images: [
      {
        url:    `${process.env.NEXT_PUBLIC_APP_URL}/og-image.jpg`,
        width:  1200,
        height: 630,
        alt:    'Shoppintrest',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Shoppintrest — Luxury Visual Commerce',
    description: 'Discover and shop luxury fashion.',
    creator:     '@shoppintrest',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:                true,
      follow:               true,
      'max-video-preview':  -1,
      'max-image-preview':  'large',
      'max-snippet':        -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' }, /* --background light */
    { media: '(prefers-color-scheme: dark)',  color: '#0F1115' }, /* --background dark  */
  ],
  width:        'device-width',
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
      <html
        lang="en"
        suppressHydrationWarning
        className={`${dmSans.variable} ${playfair.variable}`}
      >
        <body className="font-sans antialiased">
          <ThemeProvider>
            <ClerkTokenProvider />
            <UserProvider>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background:   'hsl(var(--surface))',
                    color:        'hsl(var(--foreground))',
                    border:       '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize:     'var(--text-body)',
                    fontFamily:   'var(--font-dm-sans), sans-serif',
                    boxShadow:    'var(--shadow-float)',
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