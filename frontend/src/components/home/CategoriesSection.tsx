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
  { label: 'Womenswear',  value: 'womenswear',  icon: Shirt },
  { label: 'Menswear',    value: 'menswear',    icon: PersonStanding },
  { label: 'Shoes',       value: 'shoes',       icon: Footprints },
  { label: 'Bags',        value: 'bags',        icon: ShoppingBag },
  { label: 'Jewelry',     value: 'jewelry',     icon: Gem },
  { label: 'Accessories', value: 'accessories', icon: Glasses },
  { label: 'Beauty',      value: 'beauty',      icon: Sparkles },
  { label: 'Home',        value: 'home',        icon: Sofa },
]

export function CategoriesSection() {
  return (
    <section className="py-10 border-b border-[hsl(var(--border))]">
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
                className="shrink-0"
              >
                <Link
                  href={`/explore?category=${cat.value}`}
                  className="pill group flex items-center gap-2.5"
                >
                  {/* Icon bubble */}
                  <span
                    className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center
                               shrink-0 transition-all duration-[var(--duration-hover)]"
                    style={{
                      background: 'hsl(var(--background-secondary))',
                    }}
                    /* on pill hover the parent .pill:hover changes bg/color,
                       so we tint the icon bubble to accent-muted via inline style swap
                       handled by the group-hover utility below */
                  >
                    <Icon
                      size={13}
                      className="transition-colors duration-[var(--duration-hover)]
                                 text-[hsl(var(--muted))] group-hover:text-[hsl(var(--accent-foreground))]"
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