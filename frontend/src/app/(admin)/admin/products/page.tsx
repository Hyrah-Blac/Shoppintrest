'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Edit2, Trash2, Eye, EyeOff, X, Upload,
  ChevronLeft, ChevronRight, Package, AlertCircle,
} from 'lucide-react'
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
const PAGE_LIMIT = 20

const emptyForm = {
  title: '', brand: '', description: '',
  price: '', comparePrice: '', category: '',
  sizes: [] as { size: string; inventory: number }[],
  stockQty: '' as string | number,
  images: [] as string[],
  isPublished: false,
}

// Categories where items come in clothing sizes. Everything else gets a
// single stock-quantity field instead of size selectors.
const SIZED_CATEGORIES = ['womenswear', 'menswear', 'shoes']

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export default function AdminProductsPage() {
  const [products, setProducts]         = useState<any[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [total, setTotal]               = useState(0)
  const [showModal, setShowModal]       = useState(false)
  const [editProduct, setEditProduct]   = useState<any>(null)
  const [form, setForm]                 = useState(emptyForm)
  const [isSaving, setIsSaving]         = useState(false)
  const [imageUrl, setImageUrl]         = useState('')
  const [isUploading, setIsUploading]   = useState(false)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [togglingId, setTogglingId]     = useState<string | null>(null)
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  const fetchProducts = async () => {
    products.length ? setIsRefreshing(true) : setIsLoading(true)
    try {
      const { data } = await apiClient.products.getAll({ page, limit: PAGE_LIMIT })
      const list = data.data || []
      // If we deleted the last item on a page beyond page 1, step back.
      if (list.length === 0 && page > 1) {
        setPage((p) => Math.max(1, p - 1))
        return
      }
      setProducts(list)
      setTotal(data.total || 0)
    } catch {
      toast.error('Could not load products')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => { fetchProducts() }, [page])

  const handleCloseModal = () => {
    if (isUploading) { toast.error('Please wait for the upload to finish'); return }
    if (isSaving)    { toast.error('Please wait for the save to finish');   return }
    setShowModal(false)
  }

  const openAdd = () => {
    setEditProduct(null); setForm(emptyForm); setImageUrl(''); setErrors({}); setShowModal(true)
  }

  const openEdit = (product: any) => {
    setEditProduct(product)
    const variants = product.variants?.map((v: any) => ({ size: v.size, inventory: v.inventory })) || []
    const isSized = SIZED_CATEGORIES.includes(product.category)
    setForm({
      title:        product.title || '',
      brand:        product.brand || '',
      description:  product.description || '',
      price:        product.price?.toString() || '',
      comparePrice: product.comparePrice?.toString() || '',
      category:     product.category || '',
      sizes:        isSized ? variants : [],
      // For non-sized products, fold any existing variant inventory into a single quantity
      stockQty:     isSized ? '' : (product.totalInventory ?? variants.reduce((s: number, v: any) => s + (v.inventory || 0), 0)) || '',
      images:       product.images?.map((i: any) => i.url || i) || [],
      isPublished:  product.isPublished || false,
    })
    setImageUrl(''); setErrors({}); setShowModal(true)
  }

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) return
    setForm((f) => ({ ...f, images: [...f.images, imageUrl.trim()] }))
    setImageUrl('')
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    setIsUploading(true)
    try {
      const { data } = await apiClient.upload.image(file, 'products')
      setForm((f) => ({ ...f, images: [...f.images, data.data.url] }))
      toast.success('Image uploaded')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
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
      sizes: f.sizes.map((s) => s.size === size ? { ...s, inventory: Math.max(0, inventory) } : s),
    }))

  const isSizedCategory = SIZED_CATEGORIES.includes(form.category)

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.title.trim())       next.title = 'Title is required'
    if (!form.brand.trim())       next.brand = 'Brand is required'
    if (!form.description.trim()) next.description = 'Description is required'
    if (!form.category)           next.category = 'Choose a category'
    if (!form.price || parseFloat(form.price) <= 0) next.price = 'Enter a valid price'
    if (form.comparePrice && parseFloat(form.comparePrice) <= parseFloat(form.price || '0')) {
      next.comparePrice = 'Must be higher than the price'
    }
    if (!isSizedCategory && (form.stockQty === '' || Number(form.stockQty) < 0)) {
      next.stockQty = 'Enter a stock quantity'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const computeTotalInventory = (sizes: { size: string; inventory: number }[]) =>
    sizes.reduce((sum, s) => sum + (s.inventory || 0), 0)

  // Builds the variants array sent to the API. Sized categories use the
  // size/inventory pairs from the picker; everything else gets a single
  // "One Size" variant carrying the stock quantity.
  const buildVariants = () => {
    if (isSizedCategory) {
      return form.sizes.map((s) => ({
        size: s.size,
        inventory: s.inventory,
        sku: `${slugify(form.brand)}-${slugify(form.title)}-${slugify(s.size)}`,
      }))
    }
    return [{
      size: 'One Size',
      inventory: Number(form.stockQty) || 0,
      sku: `${slugify(form.brand)}-${slugify(form.title)}-one-size`,
    }]
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        category: form.category,
        isPublished: form.isPublished,
        images: form.images.map((url) => ({
          url,
          publicId: url.includes('cloudinary.com')
            ? url.split('/').pop()?.split('.')[0]?.split('?')[0] || url
            : url,
          alt: form.title,
        })),
        variants: buildVariants(),
      }

      if (editProduct) {
        const { data } = await apiClient.products.update(editProduct._id, payload)
        const updated = data.data ?? {
          ...editProduct,
          ...payload,
          images: payload.images,
          variants: payload.variants,
          totalInventory: computeTotalInventory(payload.variants),
        }
        setProducts((prev) => prev.map((p) => (p._id === editProduct._id ? updated : p)))
        toast.success('Product updated')
      } else {
        const { data } = await apiClient.products.create(payload)
        const created = data.data ?? {
          ...payload,
          _id: crypto.randomUUID(),
          totalInventory: computeTotalInventory(payload.variants),
        }
        setProducts((prev) => [created, ...prev])
        setTotal((t) => t + 1)
        toast.success('Product created')
      }
      setShowModal(false)
    } catch (err: any) {
      const message = err?.response?.data?.message
      toast.error(
        typeof message === 'string' && message
          ? message
          : 'Could not save product. Check the details and try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await apiClient.products.delete(id)
      setProducts((prev) => prev.filter((p) => p._id !== id))
      setTotal((t) => Math.max(0, t - 1))
      toast.success('Product deleted')
    } catch {
      toast.error('Could not delete product')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePublish = async (product: any) => {
    setTogglingId(product._id)
    const nextPublished = !product.isPublished
    // optimistic update
    setProducts((prev) =>
      prev.map((p) => p._id === product._id ? { ...p, isPublished: nextPublished } : p)
    )
    try {
      await apiClient.products.update(product._id, { isPublished: nextPublished })
      toast.success(nextPublished ? 'Product published' : 'Product moved to drafts')
    } catch {
      // roll back on failure
      setProducts((prev) =>
        prev.map((p) => p._id === product._id ? { ...p, isPublished: product.isPublished } : p)
      )
      toast.error('Could not update product')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      p.title?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    )
  }, [products, search])

  const inputClass = cn(
    'w-full h-10 px-3 rounded-[10px] text-sm placeholder:text-[hsl(var(--muted))]',
    'focus:outline-none transition-all duration-[var(--duration-hover)]'
  )
  const inputStyle = {
    border:     '0.5px solid hsl(var(--border))',
    background: 'hsl(var(--background))',
    color:      'hsl(var(--foreground))',
  }
  const errorInputStyle = {
    border:     '1px solid hsl(var(--destructive))',
    background: 'hsl(var(--background))',
    color:      'hsl(var(--foreground))',
  }
  const focusRing = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.45)'
    e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.09)'
  }
  const blurRing = (e: React.FocusEvent<HTMLElement>, hasError?: boolean) => {
    e.currentTarget.style.borderColor = hasError ? 'hsl(var(--destructive))' : 'hsl(var(--border))'
    e.currentTarget.style.boxShadow   = 'none'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="text-[10px] font-medium uppercase tracking-[0.12em] mb-1"
            style={{ color: 'hsl(var(--accent))' }}
          >
            Catalogue
          </p>
          <h1
            className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            Products
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
            {total.toLocaleString()} total product{total === 1 ? '' : 's'}
            {isRefreshing && (
              <span className="ml-2 text-[11px] opacity-50">Refreshing…</span>
            )}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={14} />}
          onClick={openAdd}
          className="w-full sm:w-auto"
        >
          Add product
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'hsl(var(--muted))' }}
        />
        <input
          type="text"
          placeholder="Search by title, brand, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-9 rounded-[var(--radius-pill)] text-sm
                     placeholder:text-[hsl(var(--muted))] focus:outline-none
                     transition-all duration-[var(--duration-hover)]"
          style={{
            border:     '0.5px solid hsl(var(--border))',
            background: 'hsl(var(--background))',
            color:      'hsl(var(--foreground))',
          }}
          onFocus={focusRing}
          onBlur={blurRing}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
            style={{ color: 'hsl(var(--muted))' }}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(var(--background))',
          border:     '0.5px solid hsl(var(--border))',
          boxShadow:  'var(--shadow-xs)',
        }}
      >
        {/* Desktop / tablet table */}
        <div className="hidden md:block overflow-x-auto">
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
                    className={cn('px-5 py-4 font-medium whitespace-nowrap', i === 5 && 'text-right')}
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
                  <td colSpan={6} className="px-5 py-20">
                    <EmptyState search={search} onAdd={openAdd} />
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <ProductRow
                    key={product._id}
                    product={product}
                    onEdit={() => openEdit(product)}
                    onDelete={() => handleDelete(product._id)}
                    onTogglePublish={() => handleTogglePublish(product)}
                    isDeleting={deletingId === product._id}
                    isToggling={togglingId === product._id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="divide-y" style={{ borderColor: 'hsl(var(--border-subtle))' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3"
                     style={{ borderBottom: '0.5px solid hsl(var(--border-subtle))' }}>
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3 rounded-lg" />
                    <Skeleton className="h-3 w-1/3 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16">
              <EmptyState search={search} onAdd={openAdd} />
            </div>
          ) : (
            filtered.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={() => openEdit(product)}
                onDelete={() => handleDelete(product._id)}
                onTogglePublish={() => handleTogglePublish(product)}
                isDeleting={deletingId === product._id}
                isToggling={togglingId === product._id}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && total > PAGE_LIMIT && (
          <div
            className="flex items-center justify-between gap-3 px-5 py-3"
            style={{ borderTop: '0.5px solid hsl(var(--border))' }}
          >
            <p className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-[8px] transition-all duration-[var(--duration-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ border: '0.5px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-[8px] transition-all duration-[var(--duration-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ border: '0.5px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
            <div
              className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto sm:rounded-2xl"
              style={{
                background: 'hsl(var(--background))',
                border:     '0.5px solid hsl(var(--border))',
                boxShadow:  'var(--shadow-float)',
              }}
            >
              {/* Modal Header */}
              <div
                className="flex items-center justify-between p-4 sm:p-6 sticky top-0 z-10"
                style={{
                  background:   'hsl(var(--background))',
                  borderBottom: '0.5px solid hsl(var(--border))',
                }}
              >
                <h2
                  className="font-display text-lg font-semibold"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {editProduct ? 'Edit product' : 'Add product'}
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
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-5">

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
                    style={errors.title ? errorInputStyle : inputStyle}
                    onFocus={focusRing}
                    onBlur={(e) => blurRing(e, !!errors.title)}
                  />
                  {errors.title && <FieldError message={errors.title} />}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      style={errors.brand ? errorInputStyle : inputStyle}
                      onFocus={focusRing}
                      onBlur={(e) => blurRing(e, !!errors.brand)}
                    />
                    {errors.brand && <FieldError message={errors.brand} />}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Category <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => {
                        const category = e.target.value
                        const willBeSized = SIZED_CATEGORIES.includes(category)
                        setForm((f) => ({
                          ...f,
                          category,
                          sizes: willBeSized ? f.sizes : [],
                          stockQty: willBeSized ? '' : f.stockQty,
                        }))
                      }}
                      className={inputClass}
                      style={errors.category ? errorInputStyle : inputStyle}
                      onFocus={focusRing}
                      onBlur={(e) => blurRing(e, !!errors.category)}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.category && <FieldError message={errors.category} />}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Price (KES) <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="e.g. 5000"
                      className={inputClass}
                      style={errors.price ? errorInputStyle : inputStyle}
                      onFocus={focusRing}
                      onBlur={(e) => blurRing(e, !!errors.price)}
                    />
                    {errors.price && <FieldError message={errors.price} />}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Compare price (KES)
                    </label>
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={form.comparePrice}
                      onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                      placeholder="e.g. 7000 (optional)"
                      className={inputClass}
                      style={errors.comparePrice ? errorInputStyle : inputStyle}
                      onFocus={focusRing}
                      onBlur={(e) => blurRing(e, !!errors.comparePrice)}
                    />
                    {errors.comparePrice && <FieldError message={errors.comparePrice} />}
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
                    style={errors.description ? errorInputStyle : inputStyle}
                    onFocus={focusRing}
                    onBlur={(e) => blurRing(e, !!errors.description)}
                  />
                  {errors.description && <FieldError message={errors.description} />}
                </div>

                {/* Sizes (apparel/footwear) or stock quantity (everything else) */}
                {isSizedCategory ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Sizes & inventory
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
                            <span
                              className="text-[11px] font-medium w-12 shrink-0"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              {s.size}
                            </span>
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={s.inventory}
                              onChange={(e) => updateInventory(s.size, parseInt(e.target.value) || 0)}
                              className="flex-1 h-7 px-2 rounded-lg text-xs focus:outline-none min-w-0"
                              style={{
                                border:     '0.5px solid hsl(var(--border))',
                                background: 'hsl(var(--background))',
                                color:      'hsl(var(--foreground))',
                              }}
                            />
                            <span className="text-[10px] shrink-0" style={{ color: 'hsl(var(--muted))' }}>pcs</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted))' }}>
                      Stock quantity <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </label>
                    <div className="flex items-center gap-2 max-w-[160px]">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={form.stockQty}
                        onChange={(e) => {
                          const val = e.target.value
                          setForm((f) => ({ ...f, stockQty: val === '' ? '' : Math.max(0, parseInt(val) || 0) }))
                        }}
                        placeholder="e.g. 10"
                        className={inputClass}
                        style={errors.stockQty ? errorInputStyle : inputStyle}
                        onFocus={focusRing}
                        onBlur={(e) => blurRing(e, !!errors.stockQty)}
                      />
                      <span className="text-[11px] shrink-0" style={{ color: 'hsl(var(--muted))' }}>pcs</span>
                    </div>
                    {errors.stockQty && <FieldError message={errors.stockQty} />}
                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                      This item doesn't use sizes — set how many are in stock.
                    </p>
                  </div>
                )}

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
                          {idx === 0 && (
                            <span
                              className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium"
                              style={{ background: 'hsl(var(--background) / 0.85)', color: 'hsl(var(--foreground))' }}
                            >
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                                       flex items-center justify-center opacity-100 sm:opacity-0
                                       group-hover:opacity-100 transition-opacity"
                            style={{ background: 'hsl(var(--destructive))', color: 'white' }}
                            aria-label="Remove image"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <label
                      className={cn(
                        'flex items-center justify-center sm:justify-start gap-2 w-full sm:w-fit cursor-pointer px-3 py-2',
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
                  </div>

                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste image URL…"
                      className="flex-1 h-9 px-3 rounded-[10px] text-xs min-w-0
                                 placeholder:text-[hsl(var(--muted))] focus:outline-none"
                      style={inputStyle}
                      onFocus={focusRing}
                      onBlur={blurRing}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl() } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 h-9 rounded-[10px] text-xs font-medium shrink-0
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
                    className="relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0"
                    style={{ background: form.isPublished ? 'hsl(var(--foreground))' : 'hsl(var(--border))' }}
                    role="switch"
                    aria-checked={form.isPublished}
                  >
                    <span
                      className="absolute top-[3px] w-4 h-4 rounded-full transition-all duration-200"
                      style={{
                        background: 'hsl(var(--background))',
                        left: form.isPublished ? '22px' : '3px',
                      }}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                      {form.isPublished ? 'Published' : 'Draft'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted))' }}>
                      {form.isPublished
                        ? 'Visible to shoppers on the storefront'
                        : 'Hidden from shoppers until published'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 sticky bottom-0"
                style={{
                  background: 'hsl(var(--background))',
                  borderTop:  '0.5px solid hsl(var(--border))',
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
                  {editProduct ? 'Save changes' : 'Create product'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/* Sub-components                                                          */
/* ---------------------------------------------------------------------- */

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 text-[11px]" style={{ color: 'hsl(var(--destructive))' }}>
      <AlertCircle size={11} />
      {message}
    </p>
  )
}

function EmptyState({ search, onAdd }: { search: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'hsl(var(--surface))', color: 'hsl(var(--muted))' }}
      >
        <Package size={20} />
      </div>
      {search ? (
        <div className="space-y-1">
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            No products match "{search}"
          </p>
          <p className="text-[12px]" style={{ color: 'hsl(var(--muted))' }}>
            Try a different title, brand, or category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              No products yet
            </p>
            <p className="text-[12px]" style={{ color: 'hsl(var(--muted))' }}>
              Add your first product to start building the catalogue.
            </p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={13} />} onClick={onAdd}>
            Add product
          </Button>
        </div>
      )}
    </div>
  )
}

function StockLabel({ value }: { value: number }) {
  const color =
    value === 0
      ? 'hsl(var(--destructive))'
      : value <= 5
      ? 'hsl(36 88% 50%)'
      : 'hsl(var(--foreground))'
  const label = value === 0 ? 'Out of stock' : value <= 5 ? `Low · ${value}` : `${value}`
  return (
    <span className="text-[13px] font-medium" style={{ color }}>
      {label}
    </span>
  )
}

function RowActions({
  product, onEdit, onDelete, onTogglePublish, isDeleting, isToggling,
}: {
  product: any
  onEdit: () => void
  onDelete: () => void
  onTogglePublish: () => void
  isDeleting: boolean
  isToggling: boolean
}) {
  const actions = [
    {
      label: product.isPublished ? 'Unpublish' : 'Publish',
      onClick: onTogglePublish,
      icon: product.isPublished ? <EyeOff size={13} /> : <Eye size={13} />,
      danger: false,
      loading: isToggling,
    },
    {
      label: 'Edit',
      onClick: onEdit,
      icon: <Edit2 size={13} />,
      danger: false,
      loading: false,
    },
    {
      label: 'Delete',
      onClick: onDelete,
      icon: <Trash2 size={13} />,
      danger: true,
      loading: isDeleting,
    },
  ]

  return (
    <div className="flex items-center justify-end gap-1">
      {actions.map((btn) => (
        <button
          key={btn.label}
          type="button"
          onClick={btn.onClick}
          disabled={btn.loading}
          aria-label={btn.label}
          title={btn.label}
          className="p-2 rounded-[8px] transition-all duration-[var(--duration-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: 'hsl(var(--muted))' }}
          onMouseEnter={e => {
            if (btn.loading) return
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
  )
}

function ProductRow({
  product, onEdit, onDelete, onTogglePublish, isDeleting, isToggling,
}: {
  product: any
  onEdit: () => void
  onDelete: () => void
  onTogglePublish: () => void
  isDeleting: boolean
  isToggling: boolean
}) {
  return (
    <tr
      className="transition-colors duration-[var(--duration-hover)]"
      style={{
        borderBottom: '0.5px solid hsl(var(--border-subtle))',
        opacity: isDeleting ? 0.5 : 1,
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface))')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
            style={{ background: 'hsl(var(--surface))' }}
          >
            {product.images?.[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: 'hsl(var(--muted))' }}>
                <Package size={14} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p
              className="text-[13px] font-medium truncate max-w-[220px]"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {product.title}
            </p>
            <p className="text-[11px] truncate max-w-[220px]" style={{ color: 'hsl(var(--muted))' }}>
              {product.brand}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge variant="secondary" size="sm">{product.category}</Badge>
      </td>
      <td className="px-5 py-4 text-[13px] font-medium whitespace-nowrap" style={{ color: 'hsl(var(--foreground))' }}>
        <div className="flex items-center gap-2">
          {formatPrice(product.price, 'KES')}
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-[11px] line-through" style={{ color: 'hsl(var(--muted))' }}>
              {formatPrice(product.comparePrice, 'KES')}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <StockLabel value={product.totalInventory ?? 0} />
      </td>
      <td className="px-5 py-4">
        <Badge variant={product.isPublished ? 'success' : 'secondary'} size="sm">
          {product.isPublished ? 'Published' : 'Draft'}
        </Badge>
      </td>
      <td className="px-5 py-4">
        <RowActions
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePublish={onTogglePublish}
          isDeleting={isDeleting}
          isToggling={isToggling}
        />
      </td>
    </tr>
  )
}

function ProductCard({
  product, onEdit, onDelete, onTogglePublish, isDeleting, isToggling,
}: {
  product: any
  onEdit: () => void
  onDelete: () => void
  onTogglePublish: () => void
  isDeleting: boolean
  isToggling: boolean
}) {
  return (
    <div
      className="p-4 flex items-center gap-3 transition-opacity"
      style={{
        borderBottom: '0.5px solid hsl(var(--border-subtle))',
        opacity: isDeleting ? 0.5 : 1,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
        style={{ background: 'hsl(var(--surface))' }}
      >
        {product.images?.[0]?.url ? (
          <img src={product.images[0].url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: 'hsl(var(--muted))' }}>
            <Package size={16} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[13px] font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
          {product.title}
        </p>
        <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted))' }}>
          {product.brand} · {product.category}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            {formatPrice(product.price, 'KES')}
          </span>
          <StockLabel value={product.totalInventory ?? 0} />
          <Badge variant={product.isPublished ? 'success' : 'secondary'} size="sm">
            {product.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </div>

      <RowActions
        product={product}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        isDeleting={isDeleting}
        isToggling={isToggling}
      />
    </div>
  )
}