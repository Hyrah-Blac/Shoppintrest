'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  title: '',
  brand: '',
  description: '',
  price: '',
  comparePrice: '',
  category: '',
  sizes: [] as { size: string; inventory: number }[],
  images: [] as string[],
  isPublished: false,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const fetchProducts = async () => {
    products.length ? setIsRefreshing(true) : setIsLoading(true)
    try {
      const { data } = await apiClient.products.getAll({ page, limit: 20 })
      setProducts(data.data || [])
      setTotal(data.total || 0)
    } catch { /* silent */ }
    finally {
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
    setEditProduct(null)
    setForm(emptyForm)
    setImageUrl('')
    setShowModal(true)
  }

  const openEdit = (product: any) => {
    setEditProduct(product)
    setForm({
      title: product.title || '',
      brand: product.brand || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      comparePrice: product.comparePrice?.toString() || '',
      category: product.category || '',
      sizes: product.variants?.map((v: any) => ({
        size: v.size,
        inventory: v.inventory,
      })) || [],
      images: product.images?.map((i: any) => i.url || i) || [],
      isPublished: product.isPublished || false,
    })
    setImageUrl('')
    setShowModal(true)
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
    } catch {
      toast.error('Image upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  const toggleSize = (size: string) => {
    setForm((f) => {
      const exists = f.sizes.find((s) => s.size === size)
      return {
        ...f,
        sizes: exists
          ? f.sizes.filter((s) => s.size !== size)
          : [...f.sizes, { size, inventory: 10 }],
      }
    })
  }

  const updateInventory = (size: string, inventory: number) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s) => s.size === size ? { ...s, inventory } : s),
    }))
  }

  const handleSave = async () => {
    if (!form.title || !form.price || !form.category || !form.brand || !form.description) {
      toast.error('Title, brand, description, price and category are required')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: form.title,
        brand: form.brand,
        description: form.description,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        category: form.category,
        isPublished: form.isPublished,
        images: form.images.map((url) => ({
          url,
          publicId: url.includes('cloudinary.com')
            ? url.split('/').pop()?.split('.')[0] || url
            : url,
          alt: form.title,
        })),
        variants: form.sizes.map((s) => ({
          size: s.size,
          inventory: s.inventory,
          sku: `${form.brand}-${form.title}-${s.size}`
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
        })),
      }

      if (editProduct) {
        const { data } = await apiClient.products.update(editProduct._id, payload)
        setProducts((prev) =>
          prev.map((p) => (p._id === editProduct._id ? data.data : p))
        )
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
    } finally {
      setIsSaving(false)
    }
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
        prev.map((p) =>
          p._id === product._id ? { ...p, isPublished: !p.isPublished } : p
        )
      )
      toast.success(product.isPublished ? 'Product unpublished' : 'Product published')
    } catch { toast.error('Could not update product') }
  }

  const filtered = products.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted mt-0.5">
            {total.toLocaleString()} total products
            {isRefreshing && (
              <span className="ml-2 text-xs opacity-50">Refreshing...</span>
            )}
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus size={15} />} onClick={openAdd}>
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background
                     text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Price</th>
                <th className="px-5 py-4 font-medium">Stock</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted text-sm">
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-surface transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface overflow-hidden shrink-0">
                          {product.images?.[0]?.url && (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px]">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="secondary" size="sm">{product.category}</Badge>
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {formatPrice(product.price, 'KES')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'text-sm font-medium',
                        product.totalInventory === 0
                          ? 'text-destructive'
                          : product.totalInventory <= 5
                          ? 'text-amber-600'
                          : 'text-foreground'
                      )}>
                        {product.totalInventory}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={product.isPublished ? 'success' : 'secondary'} size="sm">
                        {product.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(product)}
                          className="p-2 rounded-lg text-muted hover:text-foreground
                                     hover:bg-accent transition-colors"
                          title={product.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {product.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="p-2 rounded-lg text-muted hover:text-foreground
                                     hover:bg-accent transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product._id)}
                          className="p-2 rounded-lg text-muted hover:text-destructive
                                     hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-background rounded-2xl border border-border
                              w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-border
                                sticky top-0 bg-background z-10">
                  <h2 className="font-display text-lg font-semibold">
                    {editProduct ? 'Edit Product' : 'Add Product'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="p-2 rounded-xl text-muted hover:text-foreground
                               hover:bg-accent transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Silk Evening Gown"
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background
                                 text-sm placeholder:text-muted focus:outline-none focus:ring-2
                                 focus:ring-ring"
                    />
                  </div>

                  {/* Brand + Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted">
                        Brand <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.brand}
                        onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                        placeholder="e.g. Gucci"
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background
                                   text-sm placeholder:text-muted focus:outline-none focus:ring-2
                                   focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted">
                        Category <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background
                                   text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price + Compare Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted">
                        Price (KES) <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        placeholder="e.g. 5000"
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background
                                   text-sm placeholder:text-muted focus:outline-none focus:ring-2
                                   focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted">
                        Compare Price (KES)
                      </label>
                      <input
                        type="number"
                        value={form.comparePrice}
                        onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                        placeholder="e.g. 7000 (optional)"
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background
                                   text-sm placeholder:text-muted focus:outline-none focus:ring-2
                                   focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">
                      Description <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Product description..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background
                                 text-sm placeholder:text-muted focus:outline-none focus:ring-2
                                 focus:ring-ring resize-none"
                    />
                  </div>

                  {/* Sizes + Inventory */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted">
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
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                              selected
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-background text-muted border-border hover:border-foreground/40'
                            )}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>

                    {form.sizes.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {form.sizes.map((s) => (
                          <div key={s.size} className="flex items-center gap-2 p-2 rounded-xl
                                                        border border-border bg-surface">
                            <span className="text-xs font-medium w-12">{s.size}</span>
                            <input
                              type="number"
                              min={0}
                              value={s.inventory}
                              onChange={(e) =>
                                updateInventory(s.size, parseInt(e.target.value) || 0)
                              }
                              className="flex-1 h-7 px-2 rounded-lg border border-input
                                         bg-background text-xs focus:outline-none focus:ring-1
                                         focus:ring-ring"
                            />
                            <span className="text-xs text-muted">pcs</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">Images</label>

                    {form.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {form.images.map((url, idx) => (
                          <div key={idx} className="relative group w-16 h-16">
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover rounded-xl border border-border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive
                                         text-white rounded-full flex items-center justify-center
                                         opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className={cn(
                      'flex items-center gap-2 w-fit cursor-pointer px-3 py-2',
                      'rounded-xl border border-dashed border-border text-xs',
                      'text-muted hover:border-foreground/40 hover:text-foreground transition-colors',
                      isUploading && 'opacity-60 cursor-not-allowed pointer-events-none'
                    )}>
                      <Upload size={13} />
                      {isUploading ? 'Uploading...' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadImage}
                        disabled={isUploading}
                      />
                    </label>

                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Or paste image URL..."
                        className="flex-1 h-9 px-3 rounded-xl border border-input bg-background
                                   text-xs placeholder:text-muted focus:outline-none focus:ring-2
                                   focus:ring-ring"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddImageUrl()
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 h-9 rounded-xl bg-surface border border-border
                                   text-xs font-medium hover:border-foreground/40 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Published toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                      className={cn(
                        'relative w-10 h-6 rounded-full transition-colors duration-200',
                        form.isPublished ? 'bg-foreground' : 'bg-border'
                      )}
                    >
                      <span className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-background transition-all duration-200',
                        form.isPublished ? 'left-5' : 'left-1'
                      )} />
                    </button>
                    <span className="text-sm text-muted">
                      {form.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border
                                sticky bottom-0 bg-background">
                  <Button variant="outline" size="md" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    onClick={handleSave}
                  >
                    {editProduct ? 'Save Changes' : 'Create Product'}
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