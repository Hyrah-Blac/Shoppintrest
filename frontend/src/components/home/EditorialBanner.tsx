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
          className="relative overflow-hidden rounded-[var(--radius-2xl)]"
          style={{ background: 'hsl(var(--foreground))' }}
        >

          {/* ── Background layers ── */}

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />

          {/* Top-right radial glow */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96
                       rounded-full pointer-events-none opacity-[0.08]"
            style={{
              background: `radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)`,
            }}
          />

          {/* Bottom-left radial glow */}
          <div
            className="absolute -bottom-16 -left-16 w-72 h-72
                       rounded-full pointer-events-none opacity-[0.05]"
            style={{
              background: `radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)`,
            }}
          />

          {/* Pinterest-red top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px opacity-60"
            style={{
              background:
                'linear-gradient(90deg, transparent, hsl(var(--accent)), transparent)',
            }}
          />

          {/* ── Content ── */}
          <div className="relative z-10 px-8 py-16 sm:py-20 lg:py-28
                          flex flex-col items-center text-center">

            {/* Icon badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-12 h-12 rounded-[var(--radius)] flex items-center justify-center mb-7
                         shadow-[var(--shadow-red)]"
              style={{ background: 'hsl(var(--accent) / 0.18)' }}
            >
              <Bookmark size={19} style={{ color: 'hsl(var(--accent))' }} />
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
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="font-display font-bold tracking-[-0.03em] leading-[1.05] mb-1"
                style={{
                  fontSize: 'clamp(2.2rem, 5vw, var(--text-hero))',
                  color: 'rgba(255,255,255,0.95)',
                }}
              >
                Your Personal
              </motion.h2>

              {/* Headline line 2 — accent red */}
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.22 }}
                className="font-display font-bold tracking-[-0.03em] leading-[1.05] mb-6"
                style={{
                  fontSize: 'clamp(2.2rem, 5vw, var(--text-hero))',
                  color: 'hsl(var(--accent))',
                }}
              >
                Style Board
              </motion.h2>

              {/* Accent divider */}
              <motion.div
                className="mx-auto mb-8 h-px w-16"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.8), transparent)',
                }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto"
                style={{
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300,
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
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-wrap gap-3 justify-center"
              >
                {/* Primary — Pinterest red */}
                <Link
                  href="/collections"
                  className="btn-save group gap-2.5 px-6 py-3 text-sm"
                >
                  Browse Collections
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-[var(--duration-hover)]
                               group-hover:translate-x-0.5"
                  />
                </Link>

                {/* Ghost — white outline */}
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 px-6 py-3
                             rounded-[var(--radius-pill)] text-sm font-medium
                             transition-all duration-[var(--duration-hover)]"
                  style={{
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.70)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)'
                    e.currentTarget.style.color = 'rgba(255,255,255,1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.70)'
                  }}
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
          <div
            className="relative z-10 px-8 pb-6 pt-4 flex items-center justify-between
                       border-t"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <span
              className="text-[10px] tracking-[0.22em] uppercase"
              style={{
                color: 'rgba(255,255,255,0.22)',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              Shoppintrest — Collections
            </span>
            <span
              className="text-[10px] tracking-[0.22em] uppercase"
              style={{
                color: 'rgba(255,255,255,0.22)',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              Est. 2025
            </span>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
