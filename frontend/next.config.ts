import type { NextConfig } from 'next'

const CLERK_DOMAIN = 'https://secure-shad-51.clerk.accounts.dev'
const API_URL      = 'https://shoppintrest.onrender.com'
const isDev        = process.env.NODE_ENV === 'development'

const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",

      // React needs eval() in dev (Turbopack). Never in prod.
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://accounts.google.com"
        : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://accounts.google.com",

      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://img.clerk.com",

      // API calls: your backend + Clerk + Stream Chat + Novu
      [
        "connect-src 'self'",
        API_URL,
        CLERK_DOMAIN,
        'https://api.clerk.dev',
        'wss://chat.stream-io-api.com',
        'https://chat.stream-io-api.com',
        'https://api.novu.co',
        'wss://socket.novu.co',
        // Turbopack HMR in dev
        ...(isDev ? ['ws://localhost:3000', 'http://localhost:3000'] : []),
      ].join(' '),

      `frame-src https://challenges.cloudflare.com https://accounts.google.com ${CLERK_DOMAIN}`,
      `script-src-elem 'self' 'unsafe-inline' ${CLERK_DOMAIN} https://challenges.cloudflare.com https://accounts.google.com`,
      "worker-src 'self' blob:",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  compress: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig