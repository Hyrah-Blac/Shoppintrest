'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shirt,
  PersonStanding,
  Footprints,
  ShoppingBag,
  Gem,
  Glasses,
  Sparkles,
  Sofa,
} from 'lucide-react'

const categories = [
  { label: 'Womenswear', value: 'womenswear', icon: Shirt },
  { label: 'Menswear',   value: 'menswear',   icon: PersonStanding },
  { label: 'Shoes',      value: 'shoes',      icon: Footprints },
  { label: 'Bags',       value: 'bags',       icon: ShoppingBag },
  { label: 'Jewelry',    value: 'jewelry',    icon: Gem },
  { label: 'Accessories',value: 'accessories',icon: Glasses },
  { label: 'Beauty',     value: 'beauty',     icon: Sparkles },
  { label: 'Home',       value: 'home',       icon: Sofa },
]

export function CategoriesSection() {
  return (
    <section className="py-10 border-b border-border">
      <div className="container-wide">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat, i) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={`/explore?category=${cat.value}`}
                  className="group flex items-center gap-2.5 px-5 py-2.5 rounded-2xl
                             bg-surface border border-border/60
                             hover:border-border hover:bg-surface
                             transition-all duration-200
                             text-sm font-medium text-muted hover:text-foreground
                             whitespace-nowrap shrink-0"
                  style={{
                    boxShadow: '0 1px 2px hsl(var(--foreground) / 0.04)',
                  }}
                >
                  {/* Icon container with accent background on hover */}
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center
                               bg-surface-2 group-hover:bg-accent-muted
                               transition-all duration-200 shrink-0"
                    style={{ background: 'hsl(var(--surface-2))' }}
                  >
                    <Icon
                      size={13}
                      className="transition-all duration-200"
                      style={{
                        color: 'hsl(var(--muted))',
                      }}
                    />
                  </span>
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