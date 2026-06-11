'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { ProductCard } from '@/components/product/ProductCard'
import { SavedFolder } from '@/types/savedFolder'

export default function FolderDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const [folder,  setFolder]  = useState<SavedFolder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    apiClient.saved.getFolder(slug)
      .then(res => setFolder(res.data.data))
      .catch(() => setError('Folder not found'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <div style={{ height: 20, width: 120, borderRadius: 4, background: 'var(--color-background-secondary)', marginBottom: '1.75rem' }} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div style={{ aspectRatio: '3/4', borderRadius: 12, background: 'var(--color-background-secondary)' }} />
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 11, width: '40%', borderRadius: 4, background: 'var(--color-background-secondary)', marginBottom: 6 }} />
              <div style={{ height: 13, width: '80%', borderRadius: 4, background: 'var(--color-background-secondary)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (error || !folder) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem 4rem', textAlign: 'center' }}>
      <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        {error || 'Folder not found'}
      </p>
      <Link href="/saved/folders" style={{
        fontSize: 13, color: 'var(--color-text-primary)', textDecoration: 'underline',
      }}>
        Back to folders
      </Link>
    </div>
  )

  const products = folder.products as any[]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Link href="/saved/folders" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 13, color: 'var(--color-text-secondary)',
          textDecoration: 'none', marginBottom: '1rem',
        }}>
          <ArrowLeft size={14} />
          Folders
        </Link>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{folder.name}</h1>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, margin: '0 auto 1rem',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: 'var(--color-text-secondary)',
          }}>
            ♡
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
            This folder is empty
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 1.5rem' }}>
            Save products and move them here from your saved list.
          </p>
          <Link href="/saved" style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 500,
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            border: 'none', borderRadius: 8, textDecoration: 'none',
            display: 'inline-block',
          }}>
            Go to saved
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {products.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}