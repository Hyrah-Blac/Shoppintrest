'use client'

/**
 * CategoriesSection — v3 · Shoppin
 *
 * v2 → v3:
 *  - Accent color removed from decorative hairline (was accent/0.25 gradient).
 *    Hairline is now solid border — consistent with all other section hairlines.
 *  - Pill hover remains foreground fill (interactive state — accent exempt rule
 *    applies to decorative use only, not interaction feedback).
 */

import Link from 'next/link'
import { motion } from 'framer-motion'

const categories = [
  { label: 'Women',       value: 'womenswear'  },
  { label: 'Men',         value: 'menswear'    },
  { label: 'Shoes',       value: 'shoes'       },
  { label: 'Bags',        value: 'bags'        },
  { label: 'Jewelry',     value: 'jewelry'     },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Beauty',      value: 'beauty'      },
] as const

export function CategoriesSection() {
  return (
    <section
      className="relative py-6 md:py-8"
      aria-label="Shop by category"
      style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
    >
      {/* Top hairline — solid border, no accent */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'hsl(var(--border))' }}
      />

      <div className="container-wide">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
          aria-label="Category list"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          role="list"
        >
          {categories.map((cat, i) => (
            <motion.div
              key={cat.value}
              role="listitem"
              className="shrink-0"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay:    Math.min(i, 4) * 0.05,
                ease:     [0.22, 1, 0.36, 1],
                duration: 0.4,
              }}
            >
              <Link
                href={`/explore?category=${cat.value}`}
                className="group inline-flex items-center rounded-full px-4 py-2
                           transition-all duration-200
                           hover:bg-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]
                           hover:text-[hsl(var(--background))]"
                style={{
                  border:         '0.5px solid hsl(var(--border))',
                  background:     'transparent',
                  color:          'hsl(var(--muted))',
                  fontSize:       '11px',
                  fontWeight:     500,
                  letterSpacing:  '0.06em',
                  textTransform:  'uppercase',
                  textDecoration: 'none',
                }}
              >
                {cat.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}