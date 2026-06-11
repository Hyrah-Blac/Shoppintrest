'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Folder } from 'lucide-react'
import { useSavedStore } from '@/store/useSavedStore'
import { ProductCard } from '@/components/product/ProductCard'

export default function SavedPage() {
  const { savedProducts, folders, isLoaded, loadSaved } = useSavedStore()

  useEffect(() => {
    if (!isLoaded) loadSaved()
  }, [isLoaded, loadSaved])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>Saved</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            {isLoaded
              ? `${savedProducts.length} ${savedProducts.length === 1 ? 'item' : 'items'}`
              : '…'}
          </p>
        </div>

        <Link
          href="/saved/folders"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', fontSize: 13, fontWeight: 500,
            background: 'var(--color-background-secondary)',
            color: 'var(--color-text-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 8, textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-tertiary)')}
        >
          <Folder size={14} />
          Folders
          {folders.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 500,
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 20, padding: '1px 6px',
              color: 'var(--color-text-secondary)',
            }}>
              {folders.length}
            </span>
          )}
        </Link>
      </div>

      {/* ── Content ── */}
      {!isLoaded ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div style={{
                aspectRatio: '3/4', borderRadius: 12,
                background: 'var(--color-background-secondary)',
              }} />
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 11, width: '40%', borderRadius: 4, background: 'var(--color-background-secondary)', marginBottom: 6 }} />
                <div style={{ height: 13, width: '80%', borderRadius: 4, background: 'var(--color-background-secondary)', marginBottom: 6 }} />
                <div style={{ height: 13, width: '30%', borderRadius: 4, background: 'var(--color-background-secondary)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : savedProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 1rem',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: 'var(--color-text-secondary)',
          }}>
            ♡
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
            Nothing saved yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 1.5rem' }}>
            Tap the heart on any product to save it here.
          </p>
          <Link href="/explore" style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 500,
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            border: 'none', borderRadius: 8, textDecoration: 'none',
            display: 'inline-block',
          }}>
            Explore products
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {savedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}