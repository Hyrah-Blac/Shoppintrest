'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const { data } = await apiClient.products.getAll({ page, limit: 20 })
      setProducts(data.data || [])
      setTotal(data.total || 0)
    } catch { /* silent */ }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [page])

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
      await apiClient.products.update(product._id, {
        isPublished: !product.isPublished,
      })
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id
            ? { ...p, isPublished: !p.isPublished }
            : p
        )
      )
      toast.success(
        product.isPublished ? 'Product unpublished' : 'Product published'
      )
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
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Products
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {total.toLocaleString()} total products
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={15} />}
        >
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-input
                     bg-background text-sm placeholder:text-muted
                     focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-muted text-sm"
                  >
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
                        <div className="w-10 h-10 rounded-xl bg-surface
                                        overflow-hidden shrink-0">
                          {product.images?.[0]?.url && (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate
                                        max-w-[200px]">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="secondary" size="sm">
                        {product.category}
                      </Badge>
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
                      <Badge
                        variant={product.isPublished ? 'success' : 'secondary'}
                        size="sm"
                      >
                        {product.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleTogglePublish(product)}
                          className="p-2 rounded-lg text-muted hover:text-foreground
                                     hover:bg-accent transition-colors"
                          title={product.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {product.isPublished
                            ? <EyeOff size={14} />
                            : <Eye size={14} />}
                        </button>
                        <button
                          className="p-2 rounded-lg text-muted hover:text-foreground
                                     hover:bg-accent transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
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
    </div>
  )
}