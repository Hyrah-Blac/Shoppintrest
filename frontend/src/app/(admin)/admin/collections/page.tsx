'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Edit2, X,
  BookmarkPlus, Globe, Lock, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

const emptyForm = { name: '', description: '', isPublic: true }

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editItem, setEditItem]       = useState<any>(null)
  const [form, setForm]               = useState(emptyForm)
  const [isSaving, setIsSaving]       = useState(false)
  const [search, setSearch]           = useState('')

  useEffect(() => {
    apiClient.collections.getAll()
      .then(({ data }) => setCollections(data.data || []))
      .catch(() => toast.error('Could not load collections'))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = collections.filter((c) =>
    (c.name || c.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditItem(null); setForm(emptyForm); setShowModal(true)
  }
  const openEdit = (c: any) => {
    setEditItem(c)
    setForm({
      name:        c.name || c.title || '',
      description: c.description || '',
      isPublic:    c.isPublic ?? true,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setIsSaving(true)
    try {
      if (editItem) {
        const { data } = await apiClient.collections.update(editItem._id, form)
        setCollections((prev) => prev.map((c) => c._id === editItem._id ? data.data : c))
        toast.success('Collection updated')
      } else {
        const { data } = await apiClient.collections.create(form)
        setCollections((prev) => [data.data, ...prev])
        toast.success('Collection created')
      }
      setShowModal(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not save collection')
    } finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return
    try {
      await apiClient.collections.delete(id)
      setCollections((prev) => prev.filter((c) => c._id !== id))
      toast.success('Collection deleted')
    } catch { toast.error('Could not delete collection') }
  }

  const inputStyle = {
    border:     '0.5px solid hsl(var(--border))',
    background: 'hsl(var(--background))',
    color:      'hsl(var(--foreground))',
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--surface))' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="relative border-b overflow-hidden"
        style={{
          background:  'hsl(var(--background))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.5), transparent)',
          }}
        />

        <div className="px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              <p
                className="text-[10px] font-medium uppercase tracking-[0.12em]"
                style={{ color: 'hsl(var(--accent))' }}
              >
                Curation
              </p>
              <h1
                className="font-display text-2xl font-semibold tracking-tight"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Collections
              </h1>
              <motion.div
                className="h-[2px] w-10 rounded-full"
                style={{ background: 'hsl(var(--accent))' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              />
              <p
                className="text-sm"
                style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
              >
                {collections.length} curated{' '}
                {collections.length === 1 ? 'board' : 'boards'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3"
            >
              {/* Search */}
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'hsl(var(--muted))' }}
                />
                <input
                  type="text"
                  placeholder="Search collections…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[200px] h-10 pl-8 pr-4 text-sm outline-none
                             transition-all duration-[var(--duration-hover)]"
                  style={{
                    ...inputStyle,
                    borderRadius: 'var(--radius-pill)',
                    fontFamily:   "'DM Sans', sans-serif",
                    fontWeight:   300,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.5)'
                    e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.09)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'hsl(var(--border))'
                    e.currentTarget.style.boxShadow   = 'none'
                  }}
                />
              </div>

              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={14} />}
                onClick={openAdd}
              >
                New Collection
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div
              className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center
                         justify-center mx-auto mb-5 border"
              style={{
                background:  'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                boxShadow:   'var(--shadow-xs)',
              }}
            >
              <BookmarkPlus size={24} style={{ color: 'hsl(var(--muted))' }} />
            </div>
            <p className="font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              {search ? 'No collections match your search' : 'No collections yet'}
            </p>
            <p
              className="text-sm mb-6 max-w-xs mx-auto"
              style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
            >
              {search
                ? 'Try a different keyword'
                : 'Create your first curated board'}
            </p>
            {!search && (
              <button onClick={openAdd} className="btn-save gap-2">
                <Plus size={14} />
                Create Collection
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{
                    delay:    i * 0.04,
                    duration: 0.4,
                    ease:     [0.22, 1, 0.36, 1],
                  }}
                >
                  <div
                    className="group rounded-2xl overflow-hidden border
                               transition-all duration-[var(--duration-standard)]"
                    style={{
                      background:  'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      boxShadow:   'var(--shadow-xs)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--accent) / 0.35)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow  = 'var(--shadow-red)'
                      ;(e.currentTarget as HTMLElement).style.transform  = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'
                      ;(e.currentTarget as HTMLElement).style.boxShadow  = 'var(--shadow-xs)'
                      ;(e.currentTarget as HTMLElement).style.transform  = 'translateY(0)'
                    }}
                  >
                    {/* Cover mosaic */}
                    <div
                      className="relative h-36 overflow-hidden"
                      style={{ background: 'hsl(var(--surface))' }}
                    >
                      {c.products?.length > 0 ? (
                        <div className="grid grid-cols-3 gap-0.5 h-full">
                          {c.products.slice(0, 3).map((p: any, pi: number) => (
                            <div
                              key={p._id || pi}
                              className={`relative overflow-hidden ${
                                pi === 0 ? 'col-span-2' : ''
                              }`}
                            >
                              {(p.images?.[0]?.url || p.images?.[0]) && (
                                <img
                                  src={p.images[0]?.url || p.images[0]}
                                  alt={p.title || ''}
                                  className="w-full h-full object-cover
                                             transition-transform duration-500
                                             group-hover:scale-105"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookmarkPlus size={28} style={{ color: 'hsl(var(--muted))' }} />
                        </div>
                      )}

                      {/* Privacy badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className="badge badge-muted gap-1 text-[10px]"
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          {c.isPublic
                            ? <><Globe size={9} /> Public</>
                            : <><Lock size={9} /> Private</>}
                        </span>
                      </div>

                      {/* Action buttons — revealed on hover */}
                      <div
                        className="absolute top-3 right-3 flex gap-1
                                   opacity-0 group-hover:opacity-100
                                   transition-all duration-[var(--duration-hover)]
                                   translate-y-1 group-hover:translate-y-0"
                      >
                        <button
                          onClick={() => openEdit(c)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center
                                     transition-all duration-[var(--duration-hover)]"
                          style={{
                            background: 'hsl(var(--background) / 0.92)',
                            color:      'hsl(var(--foreground))',
                            backdropFilter: 'blur(8px)',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground))'
                            ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--background))'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'hsl(var(--background) / 0.92)'
                            ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center
                                     transition-all duration-[var(--duration-hover)]"
                          style={{
                            background: 'hsl(var(--background) / 0.92)',
                            color:      'hsl(var(--destructive))',
                            backdropFilter: 'blur(8px)',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'hsl(var(--destructive))'
                            ;(e.currentTarget as HTMLElement).style.color = 'white'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'hsl(var(--background) / 0.92)'
                            ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--destructive))'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h2
                          className="font-display font-semibold tracking-[-0.02em]
                                     leading-snug line-clamp-1 transition-colors
                                     duration-[var(--duration-hover)]
                                     group-hover:text-[hsl(var(--accent))]"
                          style={{
                            fontSize: '0.9375rem',
                            color:    'hsl(var(--foreground))',
                          }}
                        >
                          {c.name || c.title}
                        </h2>
                        {c.description && (
                          <p
                            className="text-xs mt-1 line-clamp-2 leading-relaxed"
                            style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                          >
                            {c.description}
                          </p>
                        )}
                      </div>

                      <div
                        className="flex items-center justify-between pt-2"
                        style={{ borderTop: '0.5px solid hsl(var(--border-subtle))' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                            {c.products?.length || 0}{' '}
                            {(c.products?.length || 0) === 1 ? 'item' : 'items'}
                          </span>
                          {c.saves > 0 && (
                            <>
                              <span style={{ color: 'hsl(var(--muted) / 0.4)', fontSize: 10 }}>·</span>
                              <span className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                                {c.saves} saves
                              </span>
                            </>
                          )}
                        </div>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={
                            c.isPublic
                              ? { background: 'hsl(152 48% 38% / 0.1)', color: 'hsl(152 48% 38%)' }
                              : { background: 'hsl(var(--surface))', color: 'hsl(var(--muted))' }
                          }
                        >
                          {c.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{   opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-md rounded-2xl"
                style={{
                  background: 'hsl(var(--background))',
                  border:     '0.5px solid hsl(var(--border))',
                  boxShadow:  'var(--shadow-float)',
                }}
              >
                {/* Modal header */}
                <div
                  className="flex items-center justify-between px-6 py-5"
                  style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
                >
                  <div>
                    <h2
                      className="font-display text-lg font-semibold"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {editItem ? 'Edit Collection' : 'New Collection'}
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
                      {editItem ? 'Update board details' : 'Create a curated product board'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-[10px] transition-all duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--muted))' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface))'
                      ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                      ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted))'
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Modal body */}
                <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <label
                      className="block text-[11px] font-medium"
                      style={{ color: 'hsl(var(--muted))' }}
                    >
                      Name <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Summer Essentials"
                      className="w-full h-10 px-3 rounded-[10px] text-sm
                                 placeholder:text-[hsl(var(--muted))] focus:outline-none
                                 transition-all duration-[var(--duration-hover)]"
                      style={inputStyle}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.5)'
                        e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.09)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'hsl(var(--border))'
                        e.currentTarget.style.boxShadow   = 'none'
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="block text-[11px] font-medium"
                      style={{ color: 'hsl(var(--muted))' }}
                    >
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional — describe what this board is about…"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm resize-none
                                 placeholder:text-[hsl(var(--muted))] focus:outline-none
                                 transition-all duration-[var(--duration-hover)]"
                      style={inputStyle}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.5)'
                        e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.09)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'hsl(var(--border))'
                        e.currentTarget.style.boxShadow   = 'none'
                      }}
                    />
                  </div>

                  {/* Visibility toggle */}
                  <div
                    className="flex items-center justify-between p-3.5 rounded-xl"
                    style={{
                      background: 'hsl(var(--surface))',
                      border:     '0.5px solid hsl(var(--border))',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: form.isPublic
                            ? 'hsl(152 48% 38% / 0.12)'
                            : 'hsl(var(--background))',
                          border: '0.5px solid hsl(var(--border))',
                        }}
                      >
                        {form.isPublic
                          ? <Globe size={14} style={{ color: 'hsl(152 48% 38%)' }} />
                          : <Lock  size={14} style={{ color: 'hsl(var(--muted))' }} />
                        }
                      </div>
                      <div>
                        <p className="text-[12px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {form.isPublic ? 'Public' : 'Private'}
                        </p>
                        <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>
                          {form.isPublic
                            ? 'Visible to all users'
                            : 'Only visible to admins'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                      className="relative w-10 h-[22px] rounded-full transition-colors duration-200"
                      style={{
                        background: form.isPublic
                          ? 'hsl(var(--foreground))'
                          : 'hsl(var(--border))',
                      }}
                    >
                      <span
                        className="absolute top-[3px] w-4 h-4 rounded-full transition-all duration-200"
                        style={{
                          background: 'hsl(var(--background))',
                          left: form.isPublic ? '22px' : '3px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Modal footer */}
                <div
                  className="flex items-center justify-end gap-3 px-6 py-4"
                  style={{ borderTop: '0.5px solid hsl(var(--border))' }}
                >
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    onClick={handleSave}
                  >
                    {editItem ? 'Save Changes' : 'Create Collection'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}