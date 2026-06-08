'use client'

/**
 * CategoriesSection — v6 · Shoppin
 *
 * v5 → v6:
 *  ANIMATION — SVG circle border-draw on hover.
 *  Each item gets a hidden <svg> positioned absolute over the text.
 *  On hover the circle stroke-dashoffset animates 1 → 0 (draw),
 *  on leave it animates back 0 → 1 (erase). This is the pattern used
 *  by Dior, Jacquemus, and select Awwwards-winning fashion sites.
 *  The circle is sized dynamically via a ref measuring each label's width/height.
 *
 *  FONT RECOMMENDATION (apply in globals.css):
 *  Display/headlines → "Playfair Display" (free, Google Fonts) — the closest
 *  free equivalent to the Canela/Editorial New tier used by Mytheresa, Net-a-Porter.
 *  Nav/body → "DM Sans" (free, Google Fonts) — used by Mytheresa for UI text.
 *  Optional upgrade path → Canela (Commercial Type) + Graphik (Commercial Type).
 *
 *  Everything else from v5 kept:
 *  - Plain text, no pills
 *  - nav > ul > li semantics
 *  - clip-reveal entrance (y: 105% → 0%)
 *  - gap-6 md:gap-8
 *  - tabIndex on nav
 */

'use client'

import Link from 'next/link'
import { motion, useAnimation } from 'framer-motion'
import { useRef, useCallback } from 'react'

const categories = [
  { label: 'Women',       value: 'womenswear'  },
  { label: 'Men',         value: 'menswear'    },
  { label: 'Shoes',       value: 'shoes'       },
  { label: 'Bags',        value: 'bags'        },
  { label: 'Jewelry',     value: 'jewelry'     },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Beauty',      value: 'beauty'      },
] as const

// Clip-reveal — word slides up from behind overflow:hidden curtain
const clipReveal = {
  hidden:  { y: '105%' },
  visible: { y: '0%'   },
}

// ─── CategoryItem ─────────────────────────────────────────────────────────────

function CategoryItem({
  label,
  value,
  index,
}: {
  label: string
  value: string
  index: number
}) {
  const circleControls = useAnimation()
  const labelRef       = useRef<HTMLSpanElement>(null)
  const svgRef         = useRef<SVGSVGElement>(null)
  const circleRef      = useRef<SVGCircleElement>(null)

  // Size and draw the circle based on the label's measured bounding box
  const updateCircle = useCallback(() => {
    const el = labelRef.current
    const svg = svgRef.current
    const circle = circleRef.current
    if (!el || !svg || !circle) return

    const { width, height } = el.getBoundingClientRect()
    const px = 10  // horizontal padding beyond text
    const py = 6   // vertical padding beyond text
    const w  = width  + px * 2
    const h  = height + py * 2
    const rx = h / 2  // fully rounded ends — pill shape
    const cx = w / 2
    const cy = h / 2

    svg.setAttribute('width',  String(w))
    svg.setAttribute('height', String(h))
    svg.style.left = `-${px}px`
    svg.style.top  = `-${py}px`

    circle.setAttribute('cx', String(cx))
    circle.setAttribute('cy', String(cy))
    circle.setAttribute('rx', String(w / 2 - 1))
    circle.setAttribute('ry', String(h / 2 - 1))

    // Circumference of the ellipse (Ramanujan approximation)
    const a = w / 2 - 1
    const b = h / 2 - 1
    const circumference = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))
    circle.style.strokeDasharray  = String(circumference)
    circle.style.strokeDashoffset = String(circumference)
  }, [])

  const handleMouseEnter = useCallback(() => {
    updateCircle()
    circleControls.start({
      strokeDashoffset: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    })
  }, [circleControls, updateCircle])

  const handleMouseLeave = useCallback(() => {
    const circle = circleRef.current
    if (!circle) return
    const circumference = parseFloat(circle.style.strokeDasharray)
    circleControls.start({
      strokeDashoffset: circumference,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    })
  }, [circleControls])

  return (
    <li className="shrink-0">
      <Link
        href={`/explore?category=${value}`}
        className="group relative inline-flex items-center py-1"
        style={{ textDecoration: 'none' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {/* SVG circle border — drawn on hover */}
        <svg
          ref={svgRef}
          aria-hidden
          className="pointer-events-none absolute overflow-visible"
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
        >
          <motion.ellipse
            ref={circleRef}
            animate={circleControls}
            fill="none"
            style={{
              stroke:           'hsl(var(--foreground))',
              strokeWidth:      '0.75px',
              strokeLinecap:    'round',
              // start drawing from the top-center, going clockwise
              strokeDasharray:  '0',
              strokeDashoffset: '0',
            }}
          />
        </svg>

        {/* Clip container — overflow hidden = curtain */}
        <span className="overflow-hidden relative z-[1]" style={{ display: 'block', lineHeight: 1 }}>
          <motion.span
            ref={labelRef}
            className="block"
            variants={clipReveal}
            initial="hidden"
            animate="visible"
            transition={{
              delay:    Math.min(index, 5) * 0.04,
              duration: 0.55,
              ease:     [0.22, 1, 0.36, 1],
            }}
            style={{
              fontSize:      '11px',
              fontWeight:    500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color:         'hsl(var(--muted))',
              display:       'block',
              transition:    'color 0.25s',
            }}
          >
            <span className="group-hover:text-[hsl(var(--foreground))] transition-colors duration-[250ms]">
              {label}
            </span>
          </motion.span>
        </span>
      </Link>
    </li>
  )
}

// ─── CategoriesSection ────────────────────────────────────────────────────────

export function CategoriesSection() {
  return (
    <section
      className="py-4 md:py-5"
      aria-label="Shop by category"
      style={{
        borderTop:    '0.5px solid hsl(var(--border) / 0.6)',
        borderBottom: '0.5px solid hsl(var(--border) / 0.6)',
      }}
    >
      <div className="container-wide">
        <nav
          aria-label="Category navigation"
          className="overflow-x-auto scrollbar-hide"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          <ul
            className="flex items-center gap-6 md:gap-8 pb-px list-none m-0 p-0"
            style={{ width: 'max-content' }}
          >
            {categories.map((cat, i) => (
              <CategoryItem
                key={cat.value}
                label={cat.label}
                value={cat.value}
                index={i}
              />
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}