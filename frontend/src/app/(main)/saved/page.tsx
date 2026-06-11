'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Folder, MoreVertical, FolderInput, Trash2 } from 'lucide-react'
import { useSavedStore } from '@/store/useSavedStore'
import { ProductCard } from '@/components/product/ProductCard'
import { toast } from 'sonner'

// ─── Move to folder modal ─────────────────────────────────────────────────────

function MoveToFolderModal({
  productId,
  onClose,
}: {
  productId: string
  onClose: () => void
}) {
  const { folders, moveProduct } = useSavedStore()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleMove(slug: string) {
    setLoading(slug)
    try {
      await moveProduct(productId, '', slug)
      toast.success('Added to folder')
      onClose()
    } catch {
      toast.error('Could not move product')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        background: 'var(--color-background-primary)',
        borderRadius: 16,
        border: '0.5px solid var(--color-border-tertiary)',
        width: '100%', maxWidth: 360,
        overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Add to folder</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: 18, padding: 4, lineHeight: 1,
          }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* folder list */}
        {folders.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>
              No folders yet.
            </p>
            <Link
              href="/saved/folders"
              onClick={onClose}
              style={{
                fontSize: 13, fontWeight: 500,
                color: 'var(--color-text-primary)',
                textDecoration: 'underline',
              }}
            >
              Create one
            </Link>
          </div>
        ) : (
          <div style={{ padding: '6px' }}>
            {folders.map(f => (
              <button
                key={f._id}
                onClick={() => handleMove(f.slug)}
                disabled={loading === f.slug}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 12px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderRadius: 10, textAlign: 'left',
                  transition: 'background 0.1s',
                  opacity: loading === f.slug ? 0.6 : 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* cover thumb */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: f.coverImage
                    ? `url(${f.coverImage}) center/cover`
                    : 'var(--color-background-secondary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: 'var(--color-text-secondary)',
                }}>
                  {!f.coverImage && <i className="ti ti-bookmark" />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </p>
                  <p style={{ fontSize: 11, margin: 0, color: 'var(--color-text-secondary)' }}>
                    {f.products.length} {f.products.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {loading === f.slug && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Adding…</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Product card with three-dot menu ────────────────────────────────────────

function SavedProductCard({ product }: { product: any }) {
  const { unsaveProduct } = useSavedStore()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [showMove,   setShowMove]   = useState(false)
  const [removing,   setRemoving]   = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  async function handleUnsave() {
    setMenuOpen(false)
    setRemoving(true)
    try {
      await unsaveProduct(product._id)
      toast.success('Removed from saved')
    } catch {
      toast.error('Could not remove')
      setRemoving(false)
    }
  }

  return (
    <div style={{ position: 'relative', opacity: removing ? 0.4 : 1, transition: 'opacity 0.2s' }}>
      <ProductCard product={product} />

      {/* three-dot button — sits below the image, top-right of the info area */}
      <div ref={menuRef} style={{ position: 'absolute', bottom: 72, right: 4, zIndex: 10 }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
          aria-label="Product options"
        >
          <MoreVertical size={13} style={{ color: 'var(--color-text-secondary)' }} />
        </button>

        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            />
            <div style={{
              position: 'absolute', bottom: 34, right: 0, zIndex: 20,
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: 160,
            }}>
              <button
                onClick={() => { setMenuOpen(false); setShowMove(true) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '9px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <FolderInput size={13} style={{ color: 'var(--color-text-secondary)' }} />
                Add to folder
              </button>

              <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '2px 0' }} />

              <button
                onClick={handleUnsave}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '9px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--color-text-danger)', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </>
        )}
      </div>

      {showMove && (
        <MoveToFolderModal
          productId={product._id}
          onClose={() => setShowMove(false)}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
              <div style={{ aspectRatio: '3/4', borderRadius: 12, background: 'var(--color-background-secondary)' }} />
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
            <SavedProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}