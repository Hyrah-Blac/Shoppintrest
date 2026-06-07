'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shirt,
  User,
  Footprints,
  ShoppingBag,
  Gem,
  SunMedium,
  Sparkles,
  Armchair,
} from 'lucide-react'

const categories = [
  { label: 'Womenswear',  value: 'womenswear',  icon: Shirt       },
  { label: 'Menswear',    value: 'menswear',    icon: User        },
  { label: 'Shoes',       value: 'shoes',       icon: Footprints  },
  { label: 'Bags',        value: 'bags',        icon: ShoppingBag },
  { label: 'Jewelry',     value: 'jewelry',     icon: Gem         },
  { label: 'Accessories', value: 'accessories', icon: SunMedium   },
  { label: 'Beauty',      value: 'beauty',      icon: Sparkles    },
  { label: 'Home',        value: 'home',        icon: Armchair    },
]

export function CategoriesSection() {
  return (
    <section
      className="relative py-8"
      style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
    >
      {/* Top hairline — system-consistent */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.25) 50%, transparent 100%)',
        }}
      />

      <div className="container-wide">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat, i) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
                className="shrink-0"
              >
                <Link
                  href={`/explore?category=${cat.value}`}
                  className="group inline-flex items-center gap-2 rounded-full
                             px-4 py-2 transition-all duration-200"
                  style={{
                    border:     '0.5px solid hsl(var(--border))',
                    background: 'transparent',
                    color:      'hsl(var(--muted))',
                    fontSize:   '11px',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background    = 'hsl(var(--foreground))'
                    el.style.borderColor   = 'hsl(var(--foreground))'
                    el.style.color         = 'hsl(var(--background))'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background    = 'transparent'
                    el.style.borderColor   = 'hsl(var(--border))'
                    el.style.color         = 'hsl(var(--muted))'
                  }}
                >
                  <Icon
                    size={12}
                    strokeWidth={1.75}
                    className="shrink-0 transition-none"
                  />
                  {cat.label}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}