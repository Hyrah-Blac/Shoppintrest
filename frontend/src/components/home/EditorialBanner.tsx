'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, MoveRight, Layers } from 'lucide-react'

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
          style={{ background: 'hsl(var(--surface))' }}
        >

          {/* Top hairline — system-consistent */}
          <div
            className="absolute top-0 inset-x-0 h-px pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.6) 50%, transparent 100%)',
            }}
          />

          {/* Dot grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
              backgroundSize:  '28px 28px',
            }}
          />

          {/* Accent glow — top right */}
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px]
                       rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, hsl(var(--accent)) 0%, transparent 65%)`,
              opacity: 0.09,
            }}
          />

          {/* Accent glow — bottom left */}
          <div
            className="absolute -bottom-24 -left-24 w-80 h-80
                       rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, hsl(var(--accent)) 0%, transparent 65%)`,
              opacity: 0.05,
            }}
          />

          {/* ── Content ── */}
          <div className="relative z-10 px-8 py-16 sm:py-20 lg:py-28
                          flex flex-col items-center text-center">

            {/* Icon badge — Layers instead of Bookmark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -8 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              className="inline-flex items-center justify-center mb-8 rounded-full"
              style={{
                width:      '48px',
                height:     '48px',
                background: 'hsl(var(--accent) / 0.1)',
                border:     '0.5px solid hsl(var(--accent) / 0.25)',
              }}
            >
              <Layers size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--accent))' }} />
            </motion.div>

            <div className="max-w-2xl">

              {/* Eyebrow pill */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex justify-center mb-6"
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{
                    background: 'hsl(var(--accent-muted))',
                    border:     '0.5px solid hsl(var(--accent) / 0.2)',
                  }}
                >
                  <span
                    className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                    style={{ color: 'hsl(var(--accent))' }}
                  >
                    Collections
                  </span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.18 }}
                className="font-display font-bold tracking-[-0.03em] leading-[1.05] mb-1"
                style={{ fontSize: 'clamp(2.2rem, 5vw, var(--text-hero))' }}
              >
                Your Personal
              </motion.h2>

              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.26 }}
                className="font-display font-bold tracking-[-0.03em] leading-[1.05] mb-8"
                style={{
                  fontSize:   'clamp(2.2rem, 5vw, var(--text-hero))',
                  color:      'hsl(var(--accent))',
                }}
              >
                Style Board
              </motion.h2>

              {/* Hairline divider */}
              <motion.div
                className="mx-auto mb-8 h-px w-10"
                style={{ background: 'hsl(var(--accent) / 0.6)' }}
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
                transition={{ duration: 0.45, delay: 0.28 }}
                className="text-[15px] leading-[1.8] mb-10 max-w-md mx-auto font-light"
                style={{ color: 'hsl(var(--muted))' }}
              >
                Save the pieces you love, build collections that reflect your
                aesthetic, and share your vision with the world.
              </motion.p>

              {/* CTAs — unified circle-arrow system */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.34 }}
                className="flex flex-wrap gap-4 justify-center items-center"
              >
                {/* Primary — fills foreground on hover */}
                <Link
                  href="/collections"
                  className="group inline-flex items-center gap-3
                             text-[12px] font-medium tracking-[0.12em] uppercase
                             transition-all duration-300"
                  style={{ color: 'hsl(var(--foreground))' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    const circle = el.querySelector('span') as HTMLElement
                    if (circle) {
                      circle.style.background  = 'hsl(var(--foreground))'
                      circle.style.color       = 'hsl(var(--background))'
                      circle.style.borderColor = 'hsl(var(--foreground))'
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    const circle = el.querySelector('span') as HTMLElement
                    if (circle) {
                      circle.style.background  = 'transparent'
                      circle.style.color       = 'hsl(var(--foreground))'
                      circle.style.borderColor = 'hsl(var(--border))'
                    }
                  }}
                >
                  Browse Collections
                  <span
                    className="inline-flex items-center justify-center rounded-full transition-all duration-300"
                    style={{
                      width:  '36px',
                      height: '36px',
                      border: '0.5px solid hsl(var(--border))',
                      color:  'hsl(var(--foreground))',
                    }}
                  >
                    <ArrowUpRight size={13} strokeWidth={1.75} />
                  </span>
                </Link>

                {/* Divider dot */}
                <span
                  className="hidden sm:block w-1 h-1 rounded-full"
                  style={{ background: 'hsl(var(--border))' }}
                />

                {/* Ghost — text only with MoveRight */}
                <Link
                  href="/collections/new"
                  className="group inline-flex items-center gap-2
                             text-[12px] font-medium tracking-[0.12em] uppercase
                             transition-colors duration-200"
                  style={{ color: 'hsl(var(--muted))' }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted))'
                  }}
                >
                  Start Collecting
                  <MoveRight
                    size={13}
                    strokeWidth={1.5}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* ── Bottom editorial footer ── */}
          <div
            className="relative z-10 px-8 pb-6 pt-4 flex items-center justify-between"
            style={{ borderTop: '0.5px solid hsl(var(--border) / 0.5)' }}
          >
            <span
              className="text-[10px] font-medium tracking-[0.22em] uppercase"
              style={{ color: 'hsl(var(--muted))' }}
            >
              Shoppintrest — Collections
            </span>
            <span
              className="text-[10px] font-medium tracking-[0.22em] uppercase"
              style={{ color: 'hsl(var(--muted))' }}
            >
              Est. 2026
            </span>
          </div>

        </motion.div>
      </div>
    </section>
  )
}