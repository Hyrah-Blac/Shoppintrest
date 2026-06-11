'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useSavedStore } from '@/store/useSavedStore'
import { ProductCard } from '@/components/product/ProductCard'
import { toast } from 'sonner'

function MoveToFolderModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { folders, moveProduct } = useSavedStore()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleMove(slug: string) {
    setLoading(slug)
    try {
      await moveProduct(productId, '', slug)
      toast.success('Added to folder')
      onClose()
    } catch {
      toast.error('Could not add to folder')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
    >
      <div style={{
        background: 'var(--color-background-primary)',
        borderRadius: '16px 16px 0 0',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        width: '100%', maxWidth: 480,
        padding: '0 0 2rem',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem 1rem',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
            Add to folder
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}>
            <i className="ti ti-x" style={{ fontSize: 16 }} />
          </button>
        </div>

        {folders.length === 0 ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>No folders yet.</p>
            <Link href="/saved/folders" onClick={onClose} style={{ fontSize: 13, color: 'var(--color-text-primary)', textDecoration: 'underline' }}>
              Create one
            </Link>
          </div>
        ) : (
          <div>
            {folders.map(f => (
              <button
                key={f._id}
                onClick={() => handleMove(f.slug)}
                disabled={!!loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '14px 1.5rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: '0.5px solid var(--color-border-tertiary)',
                  opacity: loading && loading !== f.slug ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  background: f.coverImage ? `url(${f.coverImage}) center/cover` : 'var(--color-background-secondary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!f.coverImage && <i className="ti ti-bookmark" style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>{f.name}</p>
                  <p style={{ fontSize: 12, margin: '2px 0 0', color: 'var(--color-text-secondary)' }}>{f.products.length} items</p>
                </div>
                {loading === f.slug && <i className="ti ti-loader-2" style={{ fontSize: 16, color: 'var(--color-text-secondary)' }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SavedProductCard({ product }: { product: any }) {
  const { unsaveProduct } = useSavedStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showMove, setShowMove] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  async function handleUnsave() {
    setMenuOpen(false)
    try {
      await unsaveProduct(product._id)
      toast.success('Removed')
    } catch {
      toast.error('Could not remove')
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <ProductCard product={product} />

      <div ref={menuRef} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Options"
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
          className="saved-card-menu-btn"
        >
          <i className="ti ti-dots" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }} />
        </button>

        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
            <div style={{
              position: 'absolute', top: 36, right: 0, zIndex: 20,
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12, overflow: 'hidden',
              minWidth: 170,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}>
              <button
                onClick={() => { setMenuOpen(false); setShowMove(true) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <i className="ti ti-folder-plus" style={{ fontSize: 15, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
                Add to folder
              </button>
              <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)' }} />
              <button
                onClick={handleUnsave}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--color-text-danger)', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <i className="ti ti-trash" style={{ fontSize: 15 }} aria-hidden="true" />
                Remove
              </button>
            </div>
          </>
        )}
      </div>

      {showMove && <MoveToFolderModal productId={product._id} onClose={() => setShowMove(false)} />}

      <style>{`.saved-card-menu-btn { opacity: 0 !important; } .group:hover .saved-card-menu-btn, .saved-card-menu-btn:focus { opacity: 1 !important; }`}</style>
    </div>
  )
}

export default function SavedPage() {
  const { savedProducts, folders, isLoaded, loadSaved } = useSavedStore()

  useEffect(() => {
    if (!isLoaded) loadSaved()
  }, [isLoaded, loadSaved])

  return (
    <>
      <style>{`
        .saved-wrap:hover .saved-card-menu-btn { opacity: 1 !important; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        {/* ── Editorial header ── */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
                Your collection
              </p>
              <h1 style={{ fontSize: 32, fontWeight: 400, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-serif, serif)' }}>
                Saved
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isLoaded && (
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {savedProducts.length} {savedProducts.length === 1 ? 'piece' : 'pieces'}
                </span>
              )}
              <Link
                href="/saved/folders"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', fontSize: 12, fontWeight: 500,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--color-text-primary)',
                  border: '0.5px solid var(--color-border-primary)',
                  borderRadius: 2, textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <i className="ti ti-folders" style={{ fontSize: 14 }} aria-hidden="true" />
                Folders
                {folders.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>({folders.length})</span>
                )}
              </Link>
            </div>
          </div>

          <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', marginTop: '1.5rem' }} />
        </div>

        {/* ── Content ── */}
        {!isLoaded ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem 1.5rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div style={{ aspectRatio: '3/4', borderRadius: 2, background: 'var(--color-background-secondary)', marginBottom: 12 }} />
                <div style={{ height: 10, width: '35%', borderRadius: 2, background: 'var(--color-background-secondary)', marginBottom: 8 }} />
                <div style={{ height: 13, width: '75%', borderRadius: 2, background: 'var(--color-background-secondary)', marginBottom: 8 }} />
                <div style={{ height: 13, width: '25%', borderRadius: 2, background: 'var(--color-background-secondary)' }} />
              </div>
            ))}
          </div>
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
              fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
              borderRadius: 2, textDecoration: 'none',
            }}>
              Explore
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem 1.5rem' }}>
            {savedProducts.map(product => (
              <div key={product._id} className="saved-wrap" style={{ position: 'relative' }}>
                <SavedProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}