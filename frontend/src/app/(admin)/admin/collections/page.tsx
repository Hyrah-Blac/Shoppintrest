'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
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

  useEffect(() => {
    apiClient.collections.getAll()
      .then(({ data }) => setCollections(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (c: any) => {
    setEditItem(c)
    setForm({ name: c.name || '', description: c.description || '', isPublic: c.isPublic ?? true })
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
    border: '0.5px solid hsl(var(--border))',
    background: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] mb-1"
             style={{ color: 'hsl(var(--accent))' }}>
            Curation
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: 'hsl(var(--foreground))' }}>
            Collections
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
            Manage curated product collections
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus size={14} />} onClick={openAdd}>
          New Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))
        ) : collections.length === 0 ? (
          <div className="col-span-3 py-24 text-center text-sm"
               style={{ color: 'hsl(var(--muted))' }}>
            No collections yet. Create your first one.
          </div>
        ) : (
          collections.map((c) => (
            <div
              key={c._id}
              className="rounded-2xl p-5 space-y-3 transition-all duration-[var(--duration-hover)]"
              style={{
                background: 'hsl(var(--background))',
                border:     '0.5px solid hsl(var(--border))',
                boxShadow:  'var(--shadow-xs)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold truncate"
                     style={{ color: 'hsl(var(--foreground))' }}>
                    {c.name}
                  </p>
                  <p className="text-[11px] mt-0.5 line-clamp-2"
                     style={{ color: 'hsl(var(--muted))' }}>
                    {c.description || 'No description'}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg transition-all duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--muted))' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--foreground))'; e.currentTarget.style.background = 'hsl(var(--surface))' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--muted))'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-1.5 rounded-lg transition-all duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--muted))' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--destructive))'; e.currentTarget.style.background = 'hsl(var(--destructive) / 0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--muted))'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2"
                   style={{ borderTop: '0.5px solid hsl(var(--border-subtle))' }}>
                <span className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                  {c.products?.length || 0} products
                </span>
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
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-2xl"
              style={{
                background: 'hsl(var(--background))',
                border:     '0.5px solid hsl(var(--border))',
                boxShadow:  'var(--shadow-float)',
              }}
            >
              <div
                className="flex items-center justify-between p-6"
                style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
              >
                <h2 className="font-display text-lg font-semibold"
                    style={{ color: 'hsl(var(--foreground))' }}>
                  {editItem ? 'Edit Collection' : 'New Collection'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-[10px] transition-all duration-[var(--duration-hover)]"
                  style={{ color: 'hsl(var(--muted))' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--surface))'; e.currentTarget.style.color = 'hsl(var(--foreground))' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted))' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                    Name <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Summer Essentials"
                    className="w-full h-10 px-3 rounded-[10px] text-sm
                               placeholder:text-[hsl(var(--muted))] focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description…"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-[10px] text-sm resize-none
                               placeholder:text-[hsl(var(--muted))] focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                    className="relative w-10 h-[22px] rounded-full transition-colors duration-200"
                    style={{ background: form.isPublic ? 'hsl(var(--foreground))' : 'hsl(var(--border))' }}
                  >
                    <span
                      className="absolute top-[3px] w-4 h-4 rounded-full transition-all duration-200"
                      style={{ background: 'hsl(var(--background))', left: form.isPublic ? '22px' : '3px' }}
                    />
                  </button>
                  <span className="text-sm" style={{ color: 'hsl(var(--muted))' }}>
                    {form.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-3 p-6"
                style={{ borderTop: '0.5px solid hsl(var(--border))' }}
              >
                <Button variant="outline" size="md" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button variant="primary" size="md" isLoading={isSaving} onClick={handleSave}>
                  {editItem ? 'Save Changes' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}