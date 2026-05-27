'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Bookmark } from 'lucide-react'

export function EditorialBanner() {
  return (
    <section className="py-10">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[var(--radius-2xl)]
                     editorial-banner"
        >

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.055] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
              backgroundSize:  '28px 28px',
            }}
          />

          {/* Top-right accent glow */}
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px]
                       rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, hsl(var(--accent)) 0%, transparent 65%)`,
              opacity:    0.12,
            }}
          />

          {/* Bottom-left accent glow */}
          <div
            className="absolute -bottom-24 -left-24 w-80 h-80
                       rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, hsl(var(--accent)) 0%, transparent 65%)`,
              opacity:    0.07,
            }}
          />

          {/* Centre vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.2) 100%)',
            }}
          />

          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.8) 50%, transparent 100%)',
            }}
          />

          {/* ── Content ── */}
          <div className="relative z-10 px-8 py-16 sm:py-20 lg:py-28
                          flex flex-col items-center text-center">

            {/* Icon badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: -8 }}
              whileInView={{ opacity: 1, scale: 1,   y:  0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center
                         justify-center mb-8"
              style={{
                background: 'hsl(var(--accent) / 0.14)',
                border:     '1px solid hsl(var(--accent) / 0.30)',
                boxShadow:  '0 0 40px hsl(var(--accent) / 0.18)',
              }}
            >
              <Bookmark size={20} style={{ color: 'hsl(var(--accent))' }} />
            </motion.div>

            <div className="max-w-2xl">

              {/* Eyebrow */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="eyebrow mb-5"
              >
                Collections
              </motion.p>

              {/* Headline line 1 */}
              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.18 }}
                className="editorial-headline font-display font-bold
                           tracking-[-0.03em] leading-[1.05] mb-1"
                style={{ fontSize: 'clamp(2.2rem, 5vw, var(--text-hero))' }}
              >
                Your Personal
              </motion.h2>

              {/* Headline line 2 — always accent red */}
              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.26 }}
                className="font-display font-bold tracking-[-0.03em]
                           leading-[1.05] mb-7"
                style={{
                  fontSize:  'clamp(2.2rem, 5vw, var(--text-hero))',
                  color:     'hsl(var(--accent))',
                  textShadow:'0 2px 32px hsl(var(--accent) / 0.35)',
                }}
              >
                Style Board
              </motion.h2>

              {/* Accent divider */}
              <motion.div
                className="mx-auto mb-9 h-px w-16"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.9), transparent)',
                }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.32 }}
              />

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.28 }}
                className="editorial-subtext text-base sm:text-lg leading-relaxed
                           mb-10 max-w-md mx-auto"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300,
                  lineHeight: 1.8,
                }}
              >
                Save the pieces you love, build collections that reflect your
                aesthetic, and share your vision with the world.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.34 }}
                className="flex flex-wrap gap-3 justify-center"
              >
                {/* Primary */}
                <Link
                  href="/collections"
                  className="btn-save group gap-2.5 px-7 py-3.5 text-sm"
                >
                  Browse Collections
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-[var(--duration-hover)]
                               group-hover:translate-x-0.5"
                  />
                </Link>

                {/* Ghost — inverts with the panel */}
                <Link
                  href="/sign-up"
                  className="editorial-ghost group inline-flex items-center gap-2
                             px-7 py-3.5 rounded-[var(--radius-pill)] text-sm font-medium
                             transition-all duration-[var(--duration-hover)]"
                >
                  Start Collecting
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-[var(--duration-hover)]
                               group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* ── Bottom editorial label ── */}
          <div className="editorial-footer relative z-10 px-8 pb-6 pt-4
                          flex items-center justify-between border-t">
            <span
              style={{
                fontSize:      '0.6rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontFamily:    "'DM Sans', sans-serif",
                fontWeight:    500,
              }}
            >
              Shoppintrest — Collections
            </span>
            <span
              style={{
                fontSize:      '0.6rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontFamily:    "'DM Sans', sans-serif",
                fontWeight:    500,
              }}
            >
              Est. 2026
            </span>
          </div>

        </motion.div>
      </div>
    </section>
  )
}