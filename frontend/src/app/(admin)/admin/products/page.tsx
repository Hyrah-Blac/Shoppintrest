'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

const CATEGORIES = [
  'womenswear', 'menswear', 'shoes', 'bags',
  'jewelry', 'accessories', 'beauty', 'home',
]
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']

const emptyForm = {
  title: '', brand: '', description: '',
  price: '', comparePrice: '', category: '',
  sizes: [] as { size: string; inventory: number }[],
  images: [] as string[],
  isPublished: false,
}

export default function AdminProductsPage() {
  const [products, setProducts]       = useState<any[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [total, setTotal]             = useState(0)
  const [showModal, setShowModal]     = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [form, setForm]               = useState(emptyForm)
  const [isSaving, setIsSaving]       = useState(false)
  const [imageUrl, setImageUrl]       = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const fetchProducts = async () => {
    products.length ? setIsRefreshing(true) : setIsLoading(true)
    try {
      const { data } = await apiClient.products.getAll({ page, limit: 20 })
      setProducts(data.data || [])
      setTotal(data.total || 0)
    } catch { /* silent */ }
    finally { setIsLoading(false); setIsRefreshing(false) }
  }

  useEffect(() => { fetchProducts() }, [page])

  const handleCloseModal = () => {
    if (isUploading) { toast.error('Please wait for the upload to finish'); return }
    if (isSaving)    { toast.error('Please wait for the save to finish');   return }
    setShowModal(false)
  }

  const openAdd = () => {
    setEditProduct(null); setForm(emptyForm); setImageUrl(''); setShowModal(true)
  }

  const openEdit = (product: any) => {
    setEditProduct(product)
    setForm({
      title:        product.title || '',
      brand:        product.brand || '',
      description:  product.description || '',
      price:        product.price?.toString() || '',
      comparePrice: product.comparePrice?.toString() || '',
      category:     product.category || '',
      sizes:        product.variants?.map((v: any) => ({ size: v.size, inventory: v.inventory })) || [],
      images:       product.images?.map((i: any) => i.url || i) || [],
      isPublished:  product.isPublished || false,
    })
    setImageUrl(''); setShowModal(true)
  }

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) return
    setForm((f) => ({ ...f, images: [...f.images, imageUrl.trim()] }))
    setImageUrl('')
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const { data } = await apiClient.upload.image(file, 'products')
      setForm((f) => ({ ...f, images: [...f.images, data.data.url] }))
      toast.success('Image uploaded')
    } catch { toast.error('Image upload failed') }
    finally { setIsUploading(false) }
  }

  const handleRemoveImage = (idx: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))

  const toggleSize = (size: string) =>
    setForm((f) => {
      const exists = f.sizes.find((s) => s.size === size)
      return {
        ...f,
        sizes: exists
          ? f.sizes.filter((s) => s.size !== size)
          : [...f.sizes, { size, inventory: 10 }],
      }
    })

  const updateInventory = (size: string, inventory: number) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s) => s.size === size ? { ...s, inventory } : s),
    }))

  const handleSave = async () => {
    if (!form.title || !form.price || !form.category || !form.brand || !form.description) {
      toast.error('Title, brand, description, price and category are required')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        title: form.title, brand: form.brand, description: form.description,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        category: form.category, isPublished: form.isPublished,
        images: form.images.map((url) => ({
          url,
          publicId: url.includes('cloudinary.com')
            ? url.split('/').pop()?.split('.')[0] || url : url,
          alt: form.title,
        })),
        variants: form.sizes.map((s) => ({
          size: s.size, inventory: s.inventory,
          sku: `${form.brand}-${form.title}-${s.size}`.toLowerCase()
               .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        })),
      }
      if (editProduct) {
        const { data } = await apiClient.products.update(editProduct._id, payload)
        setProducts((prev) => prev.map((p) => (p._id === editProduct._id ? data.data : p)))
        toast.success('Product updated')
      } else {
        const { data } = await apiClient.products.create(payload)
        setProducts((prev) => [data.data, ...prev])
        setTotal((t) => t + 1)
        toast.success('Product created')
      }
      setShowModal(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not save product')
    } finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await apiClient.products.delete(id)
      setProducts((prev) => prev.filter((p) => p._id !== id))
      toast.success('Product deleted')
    } catch { toast.error('Could not delete product') }
  }

  const handleTogglePublish = async (product: any) => {
    try {
      await apiClient.products.update(product._id, { isPublished: !product.isPublished })
      setProducts((prev) =>
        prev.map((p) => p._id === product._id ? { ...p, isPublished: !p.isPublished } : p)
      )
      toast.success(product.isPublished ? 'Product unpublished' : 'Product published')
    } catch { toast.error('Could not update product') }
  }

  const filtered = products.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  )

  const inputClass = `
    w-full h-10 px-3 rounded-[10px] text-sm placeholder:text-[hsl(var(--muted))]
    focus:outline-none transition-all duration-[var(--duration-hover)]
  `
  const inputStyle = {
    border:     '0.5px solid hsl(var(--border))',
    background: 'hsl(var(--background))',
    color:      'hsl(var(--foreground))',
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-[10px] font-medium uppercase tracking-[0.12em] mb-1"
            style={{ color: 'hsl(var(--accent))' }}
          >
            Catalogue
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: 'hsl(var(--foreground))' }}>
            Products
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
            {total.toLocaleString()} total products
            {isRefreshing && (
              <span className="ml-2 text-[11px] opacity-50">Refreshing…</span>
            )}
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus size={14} />} onClick={openAdd}>
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'hsl(var(--muted))' }} />
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-[var(--radius-pill)] text-sm
                     placeholder:text-[hsl(var(--muted))] focus:outline-none
                     transition-all duration-[var(--duration-hover)]"
          style={{
            border:     '0.5px solid hsl(var(--border))',
            background: 'hsl(var(--background))',
            color:      'hsl(var(--foreground))',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.45)'
            e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.09)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'hsl(var(--border))'
            e.currentTarget.style.boxShadow   = 'none'
          }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(var(--background))',
          border:     '0.5px solid hsl(var(--border))',
          boxShadow:  'var(--shadow-xs)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-[11px]"
                style={{
                  borderBottom: '0.5px solid hsl(var(--border))',
                  color: 'hsl(var(--muted))',
                }}
              >
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={cn('px-5 py-4 font-medium', i === 5 && 'text-right')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center text-sm"
                      style={{ color: 'hsl(var(--muted))' }}>
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product._id}
                    className="transition-colors duration-[var(--duration-hover)]"
                    style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface))')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                          style={{ background: 'hsl(var(--surface))' }}
                        >
                          {product.images?.[0]?.url && (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate max-w-[200px]"
                             style={{ color: 'hsl(var(--foreground))' }}>
                            {product.title}
                          </p>
                          <p className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                            {product.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="secondary" size="sm">{product.category}</Badge>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium"
                        style={{ color: 'hsl(var(--foreground))' }}>
                      {formatPrice(product.price, 'KES')}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="text-[13px] font-medium"
                        style={{
                          color: product.totalInventory === 0
                            ? 'hsl(var(--destructive))'
                            : product.totalInventory <= 5
                            ? 'hsl(36 88% 50%)'
                            : 'hsl(var(--foreground))',
                        }}
                      >
                        {product.totalInventory}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={product.isPublished ? 'success' : 'secondary'}
                        size="sm"
                      >
                        {product.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {[
                          {
                            onClick: () => handleTogglePublish(product),
                            icon: product.isPublished ? <EyeOff size={13} /> : <Eye size={13} />,
                            danger: false,
                          },
                          {
                            onClick: () => openEdit(product),
                            icon: <Edit2 size={13} />,
                            danger: false,
                          },
                          {
                            onClick: () => handleDelete(product._id),
                            icon: <Trash2 size={13} />,
                            danger: true,
                          },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={btn.onClick}
                            className="p-2 rounded-[8px] transition-all duration-[var(--duration-hover)]"
                            style={{ color: 'hsl(var(--muted))' }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = btn.danger
                                ? 'hsl(var(--destructive))'
                                : 'hsl(var(--foreground))'
                              e.currentTarget.style.background = btn.danger
                                ? 'hsl(var(--destructive) / 0.08)'
                                : 'hsl(var(--surface))'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = 'hsl(var(--muted))'
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{
                background: 'hsl(var(--background))',
                border:     '0.5px solid hsl(var(--border))',
                boxShadow:  'var(--shadow-float)',
              }}
            >
              {/* Modal Header */}
              <div
                className="flex items-center justify-between p-6 sticky top-0 z-10"
                style={{
                  background:   'hsl(var(--background))',
                  borderBottom: '0.5px solid hsl(var(--border))',
                }}
              >
                <h2 className="font-display text-lg font-semibold"
                    style={{ color: 'hsl(var(--foreground))' }}>
                  {editProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 rounded-[10px] transition-all duration-[var(--duration-hover)]"
                  style={{ color: 'hsl(var(--muted))' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'hsl(var(--surface))'
                    e.currentTarget.style.color = 'hsl(var(--foreground))'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'hsl(var(--muted))'
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                    Title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Silk Evening Gown"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Brand <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                      placeholder="e.g. Gucci"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Category <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className={inputClass}
                      style={inputStyle}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Price (KES) <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="e.g. 5000"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Compare Price (KES)
                    </label>
                    <input
                      type="number"
                      value={form.comparePrice}
                      onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                      placeholder="e.g. 7000 (optional)"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                    Description <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Product description…"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-[10px] text-sm resize-none
                               placeholder:text-[hsl(var(--muted))] focus:outline-none
                               transition-all duration-[var(--duration-hover)]"
                    style={inputStyle}
                  />
                </div>

                {/* Sizes */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                    Sizes & Inventory
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => {
                      const selected = form.sizes.find((s) => s.size === size)
                      return (
                        <button
                          type="button"
                          key={size}
                          onClick={() => toggleSize(size)}
                          className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium
                                     transition-all duration-[var(--duration-hover)]"
                          style={
                            selected
                              ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))', border: 'none' }
                              : { background: 'transparent', color: 'hsl(var(--muted))', border: '0.5px solid hsl(var(--border))' }
                          }
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>

                  {form.sizes.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {form.sizes.map((s) => (
                        <div
                          key={s.size}
                          className="flex items-center gap-2 p-2 rounded-xl"
                          style={{
                            border:     '0.5px solid hsl(var(--border))',
                            background: 'hsl(var(--surface))',
                          }}
                        >
                          <span className="text-[11px] font-medium w-12"
                                style={{ color: 'hsl(var(--foreground))' }}>
                            {s.size}
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={s.inventory}
                            onChange={(e) => updateInventory(s.size, parseInt(e.target.value) || 0)}
                            className="flex-1 h-7 px-2 rounded-lg text-xs focus:outline-none"
                            style={{
                              border:     '0.5px solid hsl(var(--border))',
                              background: 'hsl(var(--background))',
                              color:      'hsl(var(--foreground))',
                            }}
                          />
                          <span className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>pcs</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Images */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                    Images
                  </label>

                  {form.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.images.map((url, idx) => (
                        <div key={idx} className="relative group w-16 h-16">
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover rounded-xl"
                            style={{ border: '0.5px solid hsl(var(--border))' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                                       flex items-center justify-center opacity-0
                                       group-hover:opacity-100 transition-opacity"
                            style={{ background: 'hsl(var(--destructive))', color: 'white' }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label
                    className={cn(
                      'flex items-center gap-2 w-fit cursor-pointer px-3 py-2',
                      'rounded-xl text-[11px] transition-colors duration-[var(--duration-hover)]',
                      isUploading && 'opacity-60 cursor-not-allowed pointer-events-none'
                    )}
                    style={{
                      border: '0.5px dashed hsl(var(--border))',
                      color:  'hsl(var(--muted))',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'hsl(var(--foreground) / 0.3)'
                      e.currentTarget.style.color = 'hsl(var(--foreground))'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))'
                      e.currentTarget.style.color = 'hsl(var(--muted))'
                    }}
                  >
                    <Upload size={12} />
                    {isUploading ? 'Uploading…' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadImage}
                      disabled={isUploading}
                    />
                  </label>

                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste image URL…"
                      className="flex-1 h-9 px-3 rounded-[10px] text-xs
                                 placeholder:text-[hsl(var(--muted))] focus:outline-none"
                      style={inputStyle}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl() } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 h-9 rounded-[10px] text-xs font-medium
                                 transition-all duration-[var(--duration-hover)]"
                      style={{
                        background: 'hsl(var(--surface))',
                        border:     '0.5px solid hsl(var(--border))',
                        color:      'hsl(var(--foreground))',
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Publish toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                    className="relative w-10 h-[22px] rounded-full transition-colors duration-200"
                    style={{ background: form.isPublished ? 'hsl(var(--foreground))' : 'hsl(var(--border))' }}
                  >
                    <span
                      className="absolute top-[3px] w-4 h-4 rounded-full transition-all duration-200"
                      style={{
                        background: 'hsl(var(--background))',
                        left: form.isPublished ? '22px' : '3px',
                      }}
                    />
                  </button>
                  <span className="text-sm" style={{ color: 'hsl(var(--muted))' }}>
                    {form.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="flex items-center justify-end gap-3 p-6 sticky bottom-0"
                style={{
                  background:  'hsl(var(--background))',
                  borderTop:   '0.5px solid hsl(var(--border))',
                }}
              >
                <Button type="button" variant="outline" size="md" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  onClick={handleSave}
                >
                  {editProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}