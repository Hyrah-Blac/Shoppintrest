'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const categories = [
  { label: 'Womenswear', value: 'womenswear', emoji: '👗' },
  { label: 'Menswear', value: 'menswear', emoji: '🧥' },
  { label: 'Shoes', value: 'shoes', emoji: '👠' },
  { label: 'Bags', value: 'bags', emoji: '👜' },
  { label: 'Jewelry', value: 'jewelry', emoji: '💍' },
  { label: 'Accessories', value: 'accessories', emoji: '🕶️' },
  { label: 'Beauty', value: 'beauty', emoji: '✨' },
  { label: 'Home', value: 'home', emoji: '🏡' },
]

export function CategoriesSection() {
  return (
    <section className="py-10 border-b border-border">
      <div className="container-wide">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.value}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/explore?category=${cat.value}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl
                           bg-surface border border-border hover:bg-accent
                           hover:border-foreground/20 transition-all duration-200
                           text-sm font-medium text-foreground whitespace-nowrap
                           shrink-0 group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">
                  {cat.emoji}
                </span>
                {cat.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}