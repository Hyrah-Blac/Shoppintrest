'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiClient } from '@/lib/api'
import { debounce, formatPrice, cn } from '@/lib/utils'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<any[]>([])
  const [users,     setUsers]     = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery(''); setResults([]); setUsers([])
    }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isOpen) onClose()
      }
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const doSearch = debounce(async (q: string) => {
    if (!q.trim()) { setResults([]); setUsers([]); return }
    setIsLoading(true)
    try {
      const [productsRes, usersRes] = await Promise.all([
        apiClient.products.search(q),
        apiClient.users.search(q),
      ])
      setResults(productsRes.data.data || [])
      setUsers(usersRes.data.data   || [])
    } catch { /* silent */ }
    finally { setIsLoading(false) }
  }, 300)

  useEffect(() => { doSearch(query) }, [query])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{   opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] backdrop-blur-sm"
            style={{ background: 'hsl(var(--foreground) / 0.18)' }}
            onClick={onClose}
          />

          {/* ── Modal ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={{   opacity: 0, scale: 0.96, y: -10  }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[61]
                       w-full max-w-2xl px-4"
          >
            <div
              className="glass-modal rounded-[var(--radius-2xl)] overflow-hidden"
              style={{ boxShadow: 'var(--shadow-float)' }}
            >

              {/* ── Search input ── */}
              <div
                className="flex items-center gap-3 px-5 py-4 border-b"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <Search
                  size={18}
                  className="shrink-0"
                  style={{ color: 'hsl(var(--muted))' }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, brands, people…"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{
                    color:      'hsl(var(--foreground))',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 300,
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="btn-icon w-7 h-7"
                    aria-label="Clear"
                  >
                    <X size={15} />
                  </button>
                )}
                <kbd
                  className="hidden sm:flex items-center text-[10px] px-1.5 py-0.5
                             rounded border"
                  style={{
                    color:       'hsl(var(--muted))',
                    borderColor: 'hsl(var(--border))',
                    fontFamily:  "'DM Sans', sans-serif",
                  }}
                >
                  ESC
                </kbd>
              </div>

              {/* ── Results ── */}
              <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                {isLoading ? (
                  /* Loading skeletons */
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <div
                          className="skeleton w-10 h-10 shrink-0"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                        />
                        <div className="flex-1 space-y-1.5">
                          <div
                            className="skeleton h-3.5 w-40"
                            style={{ borderRadius: 'var(--radius-sm)' }}
                          />
                          <div
                            className="skeleton h-3 w-24"
                            style={{ borderRadius: 'var(--radius-sm)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : query && results.length === 0 && users.length === 0 ? (
                  <div
                    className="p-10 text-center text-sm"
                    style={{ color: 'hsl(var(--muted))' }}
                  >
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <div className="p-3">

                    {/* Products */}
                    {results.length > 0 && (
                      <div className="mb-4">
                        <p className="eyebrow px-3 py-2">Products</p>
                        <div className="space-y-0.5">
                          {results.slice(0, 5).map((product) => (
                            <Link
                              key={product._id}
                              href={`/product/${product._id}`}
                              onClick={onClose}
                              className="group flex items-center gap-3 px-3 py-2.5
                                         rounded-[var(--radius)] transition-all
                                         duration-[var(--duration-hover)]"
                              style={{ color: 'inherit' }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  'hsl(var(--accent-muted))')}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = 'transparent')}
                            >
                              <div
                                className="w-10 h-10 rounded-[var(--radius-sm)]
                                           overflow-hidden shrink-0"
                                style={{ background: 'hsl(var(--surface))' }}
                              >
                                {product.images?.[0]?.url && (
                                  <Image
                                    src={product.images[0].url}
                                    alt={product.title}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium truncate"
                                  style={{ color: 'hsl(var(--foreground))' }}
                                >
                                  {product.title}
                                </p>
                                <p className="eyebrow mt-0.5">
                                  {product.brand}
                                </p>
                              </div>
                              <p
                                className="price shrink-0"
                              >
                                {formatPrice(product.price)}
                              </p>
                              <ArrowRight
                                size={14}
                                className="shrink-0 opacity-0 group-hover:opacity-100
                                           transition-opacity duration-[var(--duration-hover)]
                                           group-hover:translate-x-0.5 transition-transform"
                                style={{ color: 'hsl(var(--accent))' }}
                              />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* People */}
                    {users.length > 0 && (
                      <div className="mb-2">
                        <p className="eyebrow px-3 py-2">People</p>
                        <div className="space-y-0.5">
                          {users.slice(0, 3).map((user) => (
                            <Link
                              key={user._id}
                              href={`/profile/${user.username}`}
                              onClick={onClose}
                              className="flex items-center gap-3 px-3 py-2.5
                                         rounded-[var(--radius)] transition-all
                                         duration-[var(--duration-hover)]"
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  'hsl(var(--accent-muted))')}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = 'transparent')}
                            >
                              <div
                                className="w-8 h-8 rounded-full overflow-hidden shrink-0"
                                style={{ background: 'hsl(var(--surface))' }}
                              >
                                {user.avatar && (
                                  <Image
                                    src={user.avatar}
                                    alt={user.displayName}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: 'hsl(var(--foreground))' }}
                                >
                                  {user.displayName}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: 'hsl(var(--muted))' }}
                                >
                                  @{user.username}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick links — shown when no query */}
                    {!query && (
                      <div className="py-1">
                        <p className="eyebrow px-3 py-2">Quick Links</p>
                        {[
                          { href: '/explore',              label: 'Browse all products' },
                          { href: '/explore?sort=popular', label: 'Trending now'        },
                          { href: '/collections',          label: 'View collections'    },
                        ].map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className="group flex items-center gap-3 px-3 py-2.5 text-sm
                                       rounded-[var(--radius)] transition-all
                                       duration-[var(--duration-hover)]"
                            style={{ color: 'hsl(var(--muted))' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'hsl(var(--accent-muted))'
                              e.currentTarget.style.color      = 'hsl(var(--foreground))'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color      = 'hsl(var(--muted))'
                            }}
                          >
                            <ArrowRight
                              size={14}
                              className="transition-transform duration-[var(--duration-hover)]
                                         group-hover:translate-x-0.5"
                              style={{ color: 'hsl(var(--accent))' }}
                            />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* ── Footer hint ── */}
              {(results.length > 0 || users.length > 0) && query && (
                <div
                  className="px-5 py-3 border-t flex items-center justify-between"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <span
                    className="text-xs"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {results.length + users.length} results
                  </span>
                  <Link
                    href={`/explore?q=${encodeURIComponent(query)}`}
                    onClick={onClose}
                    className="group flex items-center gap-1.5 text-xs font-medium
                               transition-colors duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--accent))' }}
                  >
                    View all results
                    <ArrowRight
                      size={12}
                      className="transition-transform duration-[var(--duration-hover)]
                                 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}