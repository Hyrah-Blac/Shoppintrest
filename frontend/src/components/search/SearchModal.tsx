'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiClient } from '@/lib/api'
import { debounce, formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
      setUsers([])
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
    if (!q.trim()) {
      setResults([])
      setUsers([])
      return
    }
    setIsLoading(true)
    try {
      const [productsRes, usersRes] = await Promise.all([
        apiClient.products.search(q),
        apiClient.users.search(q),
      ])
      setResults(productsRes.data.data || [])
      setUsers(usersRes.data.data || [])
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, 300)

  useEffect(() => {
    doSearch(query)
  }, [query])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[61]
                       w-full max-w-2xl mx-4"
          >
            <div className="glass rounded-2xl shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <Search size={18} className="text-muted shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, brands, people..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted
                             text-sm outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-muted hover:text-foreground">
                    <X size={16} />
                  </button>
                )}
                <kbd className="hidden sm:flex items-center text-2xs text-muted
                                border border-border rounded px-1.5 py-0.5">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-sm text-muted">
                    Searching...
                  </div>
                ) : query && results.length === 0 && users.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <div className="p-3">
                    {/* Products */}
                    {results.length > 0 && (
                      <div className="mb-4">
                        <p className="text-2xs font-semibold uppercase tracking-widest
                                      text-muted px-3 py-2">
                          Products
                        </p>
                        <div className="space-y-1">
                          {results.slice(0, 5).map((product) => (
                            <Link
                              key={product._id}
                              href={`/product/${product._id}`}
                              onClick={onClose}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                         hover:bg-accent transition-colors duration-150 group"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden
                                              bg-surface shrink-0">
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
                                <p className="text-sm font-medium text-foreground truncate">
                                  {product.title}
                                </p>
                                <p className="text-xs text-muted">{product.brand}</p>
                              </div>
                              <p className="text-sm font-medium text-foreground shrink-0">
                                {formatPrice(product.price)}
                              </p>
                              <ArrowRight
                                size={14}
                                className="text-muted opacity-0 group-hover:opacity-100
                                           transition-opacity shrink-0"
                              />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users */}
                    {users.length > 0 && (
                      <div>
                        <p className="text-2xs font-semibold uppercase tracking-widest
                                      text-muted px-3 py-2">
                          People
                        </p>
                        <div className="space-y-1">
                          {users.slice(0, 3).map((user) => (
                            <Link
                              key={user._id}
                              href={`/profile/${user.username}`}
                              onClick={onClose}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                         hover:bg-accent transition-colors duration-150"
                            >
                              <div className="w-8 h-8 rounded-full bg-surface overflow-hidden shrink-0">
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
                                <p className="text-sm font-medium text-foreground">
                                  {user.displayName}
                                </p>
                                <p className="text-xs text-muted">@{user.username}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick links when no query */}
                    {!query && (
                      <div className="py-2">
                        <p className="text-2xs font-semibold uppercase tracking-widest
                                      text-muted px-3 py-2">
                          Quick Links
                        </p>
                        {[
                          { href: '/explore', label: 'Browse all products' },
                          { href: '/explore?sort=popular', label: 'Trending now' },
                          { href: '/collections', label: 'View collections' },
                        ].map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                       hover:bg-accent transition-colors duration-150 text-sm text-muted
                                       hover:text-foreground"
                          >
                            <ArrowRight size={14} />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}