'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSavedStore } from '@/store/useSavedStore'
import { ProductCard } from '@/components/product/ProductCard'
import { toast } from 'sonner'
import { useState } from 'react'

const ease = [0.16, 1, 0.3, 1] as const

function SavedCard({ product }: { product: any }) {
  const { unsaveProduct } = useSavedStore()
  const [hovered,  setHovered]  = useState(false)
  const [removing, setRemoving] = useState(false)

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setRemoving(true)
    try {
      await unsaveProduct(product._id)
      toast.success('Removed')
    } catch {
      toast.error('Could not remove')
      setRemoving(false)
    }
  }

  return (
    <motion.div
      animate={{ opacity: removing ? 0 : 1, y: removing ? 8 : 0 }}
      transition={{ duration: 0.3, ease }}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ProductCard product={product} />

      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.15, ease }}
            onClick={handleRemove}
            disabled={removing}
            aria-label={`Remove ${product.title}`}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 30,
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(255,255,255,0.96)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 13, color: 'rgba(0,0,0,0.8)' }} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
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
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
              Your collection
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 400, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-serif, serif)' }}>
              Saved
            </h1>
          </div>
          {isLoaded && (
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', paddingBottom: 4 }}>
              {savedProducts.length} {savedProducts.length === 1 ? 'piece' : 'pieces'}
            </span>
          )}
        </div>
        <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', marginTop: '1.5rem' }} />
      </div>

      {/* ── Skeleton ── */}
      {!isLoaded ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem 1.5rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div style={{ aspectRatio: '3/4', background: 'var(--color-background-secondary)', marginBottom: 12 }} />
              <div style={{ height: 10, width: '35%', background: 'var(--color-background-secondary)', marginBottom: 8 }} />
              <div style={{ height: 13, width: '75%', background: 'var(--color-background-secondary)', marginBottom: 8 }} />
              <div style={{ height: 13, width: '25%', background: 'var(--color-background-secondary)' }} />
            </div>
          ))}
        </div>

      /* ── Empty ── */
      ) : savedProducts.length === 0 ? (
        <div style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 400, fontFamily: 'var(--font-serif, serif)', color: 'var(--color-text-primary)', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            Nothing saved yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 2rem', lineHeight: 1.6 }}>
            Tap the heart on any piece to save it here.
          </p>
          <Link href="/explore" style={{
            display: 'inline-block', padding: '10px 24px',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            textDecoration: 'none',
          }}>
            Explore
          </Link>
        </div>

      /* ── Grid ── */
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem 1.5rem' }}>
          {savedProducts.map(product => (
            <SavedCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}