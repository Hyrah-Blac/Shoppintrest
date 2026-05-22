'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Bookmark, Users } from 'lucide-react'

export function EditorialBanner() {
  return (
    <section
      className="py-8"
      style={{ background: 'hsl(var(--background-secondary))' }}
    >
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[var(--radius-2xl)]"
          style={{ background: 'hsl(var(--foreground))' }}
        >
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Red glow */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, hsl(var(--accent) / 0.18) 0%, transparent 70%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 px-8 py-14 sm:py-18 lg:py-24 text-center">

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-6"
              style={{ background: 'hsl(var(--accent) / 0.15)' }}
            >
              <Bookmark size={20} style={{ color: 'hsl(var(--accent))' }} />
            </motion.div>

            {/* Eyebrow */}
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em] mb-4"
              style={{ color: 'hsl(var(--accent))' }}
            >
              Collections
            </p>

            {/* Headline */}
            <h2
              className="font-bold tracking-tight leading-tight mb-4"
              style={{
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                color: 'rgba(255,255,255,0.96)',
              }}
            >
              Your Personal Style Board
            </h2>

            {/* Subtext */}
            <p
              className="text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Save pieces you love. Build boards. Share your aesthetic with a
              community that gets it.
            </p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-foreground"
                    style={{
                      background: `hsl(${[200, 160, 280, 340][i]} 60% 55%)`,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>12,000+</span> curators already collecting
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/collections"
                className="btn-save"
              >
                Browse Collections
                <ArrowRight size={14} className="ml-1 inline" />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-pill)]
                           text-sm font-semibold transition-all duration-200"
                style={{
                  border: '2px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
                  e.currentTarget.style.color = 'rgba(255,255,255,1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                }}
              >
                <Users size={14} />
                Join Free
              </Link>
            </div>
          </div>

          {/* Footer strip */}
          <div
            className="relative z-10 px-8 py-4 flex items-center justify-between
                       border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              Shoppintrest
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              Est. 2025
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}