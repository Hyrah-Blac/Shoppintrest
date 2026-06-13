'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, useAnimation } from 'framer-motion'
import { useSavedStore } from '@/store/useSavedStore'
import { ProductCard } from '@/components/product/ProductCard'

const clipReveal = {
  hidden:  { y: '105%' },
  visible: { y: '0%'   },
}

function PageTitle() {
  return (
    <div style={{ overflow: 'hidden', display: 'inline-block', lineHeight: 1 }}>
      <motion.h1
        variants={clipReveal}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontSize:      32,
          fontWeight:    400,
          margin:        0,
          letterSpacing: '-0.02em',
          fontFamily:    'var(--font-serif, serif)',
          display:       'block',
        }}
      >
        Saved
      </motion.h1>
    </div>
  )
}

function ExploreLink() {
  const circleControls = useAnimation()
  const labelRef       = useRef<HTMLSpanElement>(null)
  const svgRef         = useRef<SVGSVGElement>(null)
  const circleRef      = useRef<SVGEllipseElement>(null)

  const updateCircle = useCallback(() => {
    const el     = labelRef.current
    const svg    = svgRef.current
    const circle = circleRef.current
    if (!el || !svg || !circle) return

    const { width, height } = el.getBoundingClientRect()
    const px = 14
    const py = 8
    const w  = width  + px * 2
    const h  = height + py * 2
    const a  = w / 2 - 1
    const b  = h / 2 - 1
    const circumference = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))

    svg.setAttribute('width',  String(w))
    svg.setAttribute('height', String(h))
    svg.style.left = `-${px}px`
    svg.style.top  = `-${py}px`

    circle.setAttribute('cx', String(w / 2))
    circle.setAttribute('cy', String(h / 2))
    circle.setAttribute('rx', String(a))
    circle.setAttribute('ry', String(b))
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
    <Link
      href="/explore"
      className="group relative inline-flex items-center py-1"
      style={{ textDecoration: 'none' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
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
            stroke:          'hsl(var(--foreground))',
            strokeWidth:     '0.75px',
            strokeLinecap:   'round',
            strokeDasharray:  '0',
            strokeDashoffset: '0',
          }}
        />
      </svg>

      <span className="overflow-hidden relative z-[1]" style={{ display: 'block', lineHeight: 1 }}>
        <motion.span
          ref={labelRef}
          className="block"
          variants={clipReveal}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize:      11,
            fontWeight:    500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         'hsl(var(--muted))',
            display:       'block',
            transition:    'color 0.25s',
          }}
        >
          <span className="group-hover:text-[hsl(var(--foreground))] transition-colors duration-[250ms]">
            Explore
          </span>
        </motion.span>
      </span>
    </Link>
  )
}

export default function SavedPage() {
  const { savedProducts, isLoaded, loadSaved } = useSavedStore()

  useEffect(() => {
    if (!isLoaded) loadSaved()
  }, [isLoaded, loadSaved])

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ overflow: 'hidden', display: 'block', lineHeight: 1, marginBottom: 8 }}>
              <motion.p
                variants={clipReveal}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize:      10,
                  fontWeight:    500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color:         'hsl(var(--muted))',
                  margin:        0,
                  display:       'block',
                }}
              >
                Your collection
              </motion.p>
            </span>
            <PageTitle />
          </div>

          {isLoaded && (
            <span style={{ overflow: 'hidden', display: 'block', lineHeight: 1, paddingBottom: 4 }}>
              <motion.span
                variants={clipReveal}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display:       'block',
                  fontSize:      11,
                  fontWeight:    500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color:         'hsl(var(--muted))',
                }}
              >
                {savedProducts.length} {savedProducts.length === 1 ? 'piece' : 'pieces'}
              </motion.span>
            </span>
          )}
        </div>

        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '0.5px', background: 'hsl(var(--border) / 0.6)', marginTop: '1.5rem' }}
        />
      </div>

      {/* ── Skeleton ── */}
      {!isLoaded ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem 1.5rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div style={{ aspectRatio: '3/4', background: 'hsl(var(--border) / 0.4)', marginBottom: 12 }} />
              <div style={{ height: 10, width: '35%', background: 'hsl(var(--border) / 0.4)', marginBottom: 8 }} />
              <div style={{ height: 13, width: '75%', background: 'hsl(var(--border) / 0.4)', marginBottom: 8 }} />
              <div style={{ height: 13, width: '25%', background: 'hsl(var(--border) / 0.4)' }} />
            </div>
          ))}
        </div>

      /* ── Empty ── */
      ) : savedProducts.length === 0 ? (
        <div style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <div style={{ overflow: 'hidden', display: 'inline-block', marginBottom: 12 }}>
            <motion.p
              variants={clipReveal}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize:      28,
                fontWeight:    400,
                fontFamily:    'var(--font-serif, serif)',
                color:         'hsl(var(--foreground))',
                margin:        0,
                letterSpacing: '-0.01em',
              }}
            >
              Nothing saved yet
            </motion.p>
          </div>
          <div style={{ overflow: 'hidden', display: 'block', marginBottom: '2rem' }}>
            <motion.p
              variants={clipReveal}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize:  13,
                color:     'hsl(var(--muted))',
                margin:    0,
                lineHeight: 1.6,
              }}
            >
              Tap the heart on any piece to save it here.
            </motion.p>
          </div>
          <ExploreLink />
        </div>

      /* ── Grid ── */
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem 1.5rem' }}>
          {savedProducts.map((product, i) => (
            <motion.div
              key={product._id}
              variants={clipReveal}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.55,
                delay:    Math.min(i, 7) * 0.04,
                ease:     [0.22, 1, 0.36, 1],
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}