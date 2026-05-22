'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shirt, PersonStanding, Footprints, ShoppingBag,
  Gem, Glasses, Sparkles, Sofa,
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
    <section
      className="py-4 border-b border-border/60"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="container-wide">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {categories.map((cat, i) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={`/explore?category=${cat.value}`}
                  className="group flex items-center gap-2 px-4 py-2 rounded-[var(--radius-pill)]
                             border border-border/70 bg-background
                             hover:bg-foreground hover:border-foreground
                             hover:text-background
                             transition-all duration-200 text-sm font-semibold
                             text-foreground whitespace-nowrap shrink-0
                             shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <Icon
                    size={14}
                    className="shrink-0 transition-colors duration-200
                               text-muted group-hover:text-background"
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