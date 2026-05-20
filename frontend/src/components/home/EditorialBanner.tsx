'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function EditorialBanner() {
  return (
    <section className="py-8">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-4xl bg-foreground
                     text-background px-8 py-16 sm:py-20 lg:py-28
                     flex flex-col items-center text-center"
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative z-10 max-w-2xl">
            <p className="text-2xs font-semibold uppercase tracking-[0.2em]
                          text-background/60 mb-4">
              Collections
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl
                           font-semibold tracking-tight mb-6 leading-tight">
              Your Personal Style Board
            </h2>
            <p className="text-background/70 text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto">
              Save the pieces you love, build collections that reflect your
              aesthetic, and share your vision with the world.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 bg-background text-foreground
                           px-6 py-3 rounded-2xl text-sm font-medium
                           hover:opacity-90 transition-opacity"
              >
                Browse Collections
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 border border-background/30
                           text-background px-6 py-3 rounded-2xl text-sm font-medium
                           hover:border-background/60 transition-colors"
              >
                Start Collecting
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}