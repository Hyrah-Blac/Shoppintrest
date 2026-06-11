'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSavedStore } from '@/store/useSavedStore'
import { SavedFolder } from '@/types/savedFolder'

// ─── new folder modal ─────────────────────────────────────────────────────────

function NewFolderModal({ onClose }: { onClose: () => void }) {
  const { createFolder } = useSavedStore()
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await createFolder(name.trim())
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not create folder.')
      setLoading(false)
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
        width: '100%', maxWidth: 400,
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>New folder</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: 20, padding: 4, lineHeight: 1,
          }}>
            <i className="ti ti-x" aria-label="Close" />
          </button>
        </div>

        <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          Folder name
        </label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. Summer picks"
          maxLength={50}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '1rem' }}
        />

        {error && (
          <p style={{ fontSize: 12, color: 'var(--color-text-danger)', marginBottom: '0.75rem' }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          style={{
            width: '100%', padding: '10px',
            background: name.trim() && !loading ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
            color: name.trim() && !loading ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: 8, cursor: name.trim() && !loading ? 'pointer' : 'not-allowed',
            fontSize: 14, fontWeight: 500,
            transition: 'all 0.15s',
          }}
        >
          {loading ? 'Creating…' : 'Create folder'}
        </button>
      </div>
    </div>
  )
}

// ─── rename modal ─────────────────────────────────────────────────────────────

function RenameFolderModal({ folder, onClose }: { folder: SavedFolder; onClose: () => void }) {
  const { renameFolder } = useSavedStore()
  const [name, setName]       = useState(folder.name)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit() {
    if (!name.trim() || name.trim() === folder.name) { onClose(); return }
    setLoading(true)
    setError('')
    try {
      await renameFolder(folder.slug, name.trim())
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not rename folder.')
      setLoading(false)
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
        width: '100%', maxWidth: 400,
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>Rename folder</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: 20, padding: 4, lineHeight: 1,
          }}>
            <i className="ti ti-x" aria-label="Close" />
          </button>
        </div>

        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={50}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '1rem' }}
        />

        {error && (
          <p style={{ fontSize: 12, color: 'var(--color-text-danger)', marginBottom: '0.75rem' }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          style={{
            width: '100%', padding: '10px',
            background: name.trim() && !loading ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
            color: name.trim() && !loading ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: 8, cursor: name.trim() && !loading ? 'pointer' : 'not-allowed',
            fontSize: 14, fontWeight: 500,
          }}
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── folder card ──────────────────────────────────────────────────────────────

function FolderCard({ folder, onRename, onDelete }: {
  folder: SavedFolder
  onRename: (f: SavedFolder) => void
  onDelete: (f: SavedFolder) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <Link href={`/saved/folders/${folder.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'border-color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-tertiary)')}
        >
          {/* cover */}
          <div style={{
            height: 100,
            background: folder.coverImage
              ? `url(${folder.coverImage}) center/cover`
              : 'var(--color-background-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {!folder.coverImage && (
              <i className="ti ti-bookmark" style={{ fontSize: 28, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
            )}
          </div>

          {/* info */}
          <div style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {folder.name}
                {folder.isDefault && (
                  <span style={{ marginLeft: 5, fontSize: 10, color: 'var(--color-text-secondary)' }}>default</span>
                )}
              </span>
              {!folder.isDefault && (
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-secondary)', padding: '2px 4px', lineHeight: 1, flexShrink: 0,
                  }}
                >
                  <i className="ti ti-dots" aria-label="Options" />
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '3px 0 0' }}>
              {folder.products.length} {folder.products.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </Link>

      {/* context menu */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: 110, right: 8, zIndex: 20,
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            minWidth: 140,
          }}>
            <button
              onClick={() => { setMenuOpen(false); onRename(folder) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 14px', background: 'none',
                border: 'none', cursor: 'pointer', fontSize: 13,
                color: 'var(--color-text-primary)', textAlign: 'left',
              }}
            >
              <i className="ti ti-pencil" aria-hidden="true" /> Rename
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(folder) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 14px', background: 'none',
                border: 'none', cursor: 'pointer', fontSize: 13,
                color: 'var(--color-text-danger)', textAlign: 'left',
              }}
            >
              <i className="ti ti-trash" aria-hidden="true" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function FoldersPage() {
  const { folders, isLoaded, loadSaved, deleteFolder } = useSavedStore()
  const [showNew, setShowNew]         = useState(false)
  const [renaming, setRenaming]       = useState<SavedFolder | null>(null)
  const [deleting, setDeleting]       = useState<SavedFolder | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded) loadSaved()
  }, [isLoaded, loadSaved])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    await deleteFolder(deleting.slug)
    setDeleting(null)
    setDeleteLoading(false)
  }

  return (
    <>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>Folders</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
              Organise your saved items
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 13, fontWeight: 500,
              background: 'var(--color-text-primary)',
              color: 'var(--color-background-primary)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
            New folder
          </button>
        </div>

        {/* back to saved */}
        <Link href="/saved" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 13, color: 'var(--color-text-secondary)',
          textDecoration: 'none', marginBottom: '1.5rem',
        }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden="true" />
          All saved
        </Link>

        {/* grid */}
        {!isLoaded ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12,
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                borderRadius: 12, overflow: 'hidden',
                border: '0.5px solid var(--color-border-tertiary)',
              }}>
                <div style={{ height: 100, background: 'var(--color-background-secondary)' }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'var(--color-background-secondary)', marginBottom: 6 }} />
                  <div style={{ height: 10, width: '30%', borderRadius: 4, background: 'var(--color-background-secondary)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12, margin: '0 auto 1rem',
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: 'var(--color-text-secondary)',
            }}>
              <i className="ti ti-folder" aria-hidden="true" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
              No folders yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 1.25rem' }}>
              Create folders to organise your saved products.
            </p>
            <button onClick={() => setShowNew(true)} style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 500,
              background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
            }}>
              New folder
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12,
          }}>
            {folders.map(f => (
              <FolderCard
                key={f._id}
                folder={f}
                onRename={setRenaming}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </div>

      {/* modals */}
      {showNew   && <NewFolderModal onClose={() => setShowNew(false)} />}
      {renaming  && <RenameFolderModal folder={renaming} onClose={() => setRenaming(null)} />}

      {/* delete confirm */}
      {deleting && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDeleting(null) }}
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
            width: '100%', maxWidth: 380,
            padding: '1.5rem',
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 500, margin: '0 0 8px' }}>Delete folder?</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 1.25rem' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>{deleting.name}</strong> will be deleted.
              Your saved products won't be affected.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleting(null)}
                style={{
                  flex: 1, padding: '9px',
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '0.5px solid var(--color-border-secondary)',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  flex: 1, padding: '9px',
                  background: 'var(--color-text-danger)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8, cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 500, opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}