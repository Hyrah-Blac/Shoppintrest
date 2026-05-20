'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Search, MoreHorizontal, Phone,
  Image as ImageIcon, Smile, ArrowLeft,
  CheckCheck, Circle,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { io, Socket } from 'socket.io-client'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { formatRelativeTime, cn } from '@/lib/utils'

const REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥']

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const { isSignedIn } = useAuth()
  const currentUser = useUserStore((s) => s.user)

  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingConvos, setIsLoadingConvos] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [showMobileList, setShowMobileList] = useState(true)
  const [reactionTarget, setReactionTarget] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Socket setup
  useEffect(() => {
    if (!currentUser) return

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.emit('user:online', currentUser._id)

    socket.on('message:new', (message: any) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev
        return [...prev, message]
      })
      setConversations((prev) =>
        prev.map((c) =>
          c._id === message.conversation
            ? { ...c, lastMessage: message, updatedAt: new Date() }
            : c
        ).sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      )
    })

    socket.on('typing:start', ({ userId }: { userId: string }) => {
      if (userId !== currentUser._id) {
        setTypingUsers((prev) => new Set([...prev, userId]))
      }
    })

    socket.on('typing:stop', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [currentUser])

  // Join conversation room
  useEffect(() => {
    if (!activeConversation || !socketRef.current) return
    socketRef.current.emit('conversation:join', activeConversation._id)
    return () => {
      socketRef.current?.emit('conversation:leave', activeConversation._id)
    }
  }, [activeConversation])

  // Fetch conversations
  useEffect(() => {
    if (!isSignedIn) return
    apiClient.messages.getConversations()
      .then(({ data }) => setConversations(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoadingConvos(false))
  }, [isSignedIn])

  // Handle ?user= param
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && isSignedIn) {
      apiClient.messages.getOrCreate(userId)
        .then(({ data }) => {
          const convo = data.data
          setActiveConversation(convo)
          setShowMobileList(false)
          setConversations((prev) => {
            if (prev.find((c) => c._id === convo._id)) return prev
            return [convo, ...prev]
          })
        })
        .catch(() => {})
    }
  }, [searchParams, isSignedIn])

  // Fetch messages
  useEffect(() => {
    if (!activeConversation) return
    setIsLoadingMessages(true)
    apiClient.messages.getMessages(activeConversation._id)
      .then(({ data }) => setMessages(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoadingMessages(false))
  }, [activeConversation])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectConversation = (convo: any) => {
    setActiveConversation(convo)
    setShowMobileList(false)
    setMessages([])
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content || !activeConversation || isSending) return

    setNewMessage('')
    setIsSending(true)

    // Optimistic UI
    const optimistic = {
      _id: `temp-${Date.now()}`,
      conversation: activeConversation._id,
      sender: currentUser,
      content,
      isRead: false,
      reactions: [],
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const { data } = await apiClient.messages.send(
        activeConversation._id,
        { content }
      )
      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimistic._id ? data.data : m
        )
      )
      socketRef.current?.emit('message:send', {
        conversationId: activeConversation._id,
        message: data.data,
      })
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
      toast.error('Message failed to send')
      setNewMessage(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleTyping = () => {
    if (!activeConversation || !currentUser) return
    socketRef.current?.emit('typing:start', {
      conversationId: activeConversation._id,
      userId: currentUser._id,
    })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', {
        conversationId: activeConversation._id,
        userId: currentUser._id,
      })
    }, 2000)
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await apiClient.messages.react(messageId, emoji)
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id !== messageId) return m
          const existing = m.reactions.findIndex(
            (r: any) => r.user === currentUser?._id
          )
          const reactions = [...m.reactions]
          if (existing > -1) reactions[existing] = { user: currentUser?._id, emoji }
          else reactions.push({ user: currentUser?._id, emoji })
          return { ...m, reactions }
        })
      )
    } catch { /* silent */ }
    setReactionTarget(null)
  }

  const getOtherParticipant = (convo: any) => {
    return convo.participants?.find(
      (p: any) => p._id !== currentUser?._id
    )
  }

  const filteredConvos = conversations.filter((c) => {
    const other = getOtherParticipant(c)
    if (!searchQuery) return true
    return (
      other?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      other?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="flex h-[calc(100vh-72px)] bg-background overflow-hidden">
      {/* ── Conversation List ── */}
      <div
        className={cn(
          `w-full md:w-80 lg:w-96 border-r border-border flex flex-col
           bg-surface shrink-0`,
          !showMobileList && 'hidden md:flex'
        )}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-border">
          <h1 className="font-display text-xl font-semibold tracking-tight mb-4">
            Messages
          </h1>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-input
                         bg-background text-sm placeholder:text-muted
                         focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConvos ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="skeleton w-11 h-11 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-28 rounded" />
                    <div className="skeleton h-3 w-40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="py-16 text-center px-6">
              <p className="text-2xl mb-3">💬</p>
              <p className="text-sm font-medium text-foreground mb-1">
                No conversations
              </p>
              <p className="text-xs text-muted">
                Visit a profile to start messaging
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredConvos.map((convo) => {
                const other = getOtherParticipant(convo)
                const isActive = activeConversation?._id === convo._id
                const isUnread =
                  convo.lastMessage &&
                  !convo.lastMessage.isRead &&
                  convo.lastMessage.sender !== currentUser?._id

                return (
                  <button
                    key={convo._id}
                    onClick={() => handleSelectConversation(convo)}
                    className={cn(
                      `w-full flex items-center gap-3 px-4 py-3.5 text-left
                       transition-all duration-200`,
                      isActive
                        ? 'bg-accent'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={other?.avatar}
                        name={other?.displayName}
                        size="md"
                      />
                      {typingUsers.has(other?._id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3
                                         bg-green-500 rounded-full border-2
                                         border-background" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          'text-sm truncate',
                          isUnread
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-foreground'
                        )}>
                          {other?.displayName}
                        </p>
                        <p className="text-2xs text-muted shrink-0">
                          {convo.lastMessage
                            ? formatRelativeTime(convo.lastMessage.createdAt)
                            : ''}
                        </p>
                      </div>
                      <p className={cn(
                        'text-xs truncate mt-0.5',
                        isUnread ? 'text-foreground' : 'text-muted'
                      )}>
                        {typingUsers.has(other?._id) ? (
                          <span className="text-green-500 italic">typing...</span>
                        ) : (
                          convo.lastMessage?.content || 'Start a conversation'
                        )}
                      </p>
                    </div>

                    {isUnread && (
                      <div className="w-2 h-2 rounded-full bg-foreground shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0',
          showMobileList && 'hidden md:flex'
        )}
      >
        {!activeConversation ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-4xl mb-4">✦</p>
              <p className="font-display text-xl font-semibold mb-2">
                Select a conversation
              </p>
              <p className="text-sm text-muted">
                Choose from your messages or visit a profile to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 px-5 py-4 border-b
                            border-border bg-background shrink-0">
              <button
                onClick={() => setShowMobileList(true)}
                className="md:hidden p-2 rounded-xl hover:bg-accent
                           text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft size={18} />
              </button>

              {(() => {
                const other = getOtherParticipant(activeConversation)
                return (
                  <>
                    <Avatar
                      src={other?.avatar}
                      name={other?.displayName}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {other?.displayName}
                      </p>
                      <p className="text-xs text-muted">
                        {typingUsers.has(other?._id)
                          ? 'typing...'
                          : `@${other?.username}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-2.5 rounded-xl hover:bg-accent text-muted
                                   hover:text-foreground transition-colors"
                      >
                        <Phone size={16} />
                      </button>
                      <button
                        className="p-2.5 rounded-xl hover:bg-accent text-muted
                                   hover:text-foreground transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-1">
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex gap-2',
                        i % 3 === 0 ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {i % 3 !== 0 && (
                        <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                      )}
                      <div
                        className={cn(
                          'skeleton h-10 rounded-2xl',
                          i % 3 === 0 ? 'w-48' : 'w-56'
                        )}
                      />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl mb-2">👋</p>
                    <p className="text-sm text-muted">
                      Say hello to start the conversation
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, i) => {
                    const isOwn =
                      message.sender?._id === currentUser?._id ||
                      message.sender === currentUser?._id
                    const prevMsg = messages[i - 1]
                    const isSameAuthor =
                      prevMsg &&
                      (prevMsg.sender?._id || prevMsg.sender) ===
                        (message.sender?._id || message.sender)
                    const showAvatar = !isOwn && !isSameAuthor

                    return (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'flex gap-2 group',
                          isOwn ? 'justify-end' : 'justify-start',
                          !isSameAuthor && 'mt-4'
                        )}
                      >
                        {/* Other user avatar */}
                        {!isOwn && (
                          <div className="w-8 shrink-0 self-end">
                            {showAvatar && (
                              <Avatar
                                src={message.sender?.avatar}
                                name={message.sender?.displayName}
                                size="xs"
                              />
                            )}
                          </div>
                        )}

                        <div
                          className={cn(
                            'relative max-w-[70%]',
                            isOwn ? 'items-end' : 'items-start',
                            'flex flex-col'
                          )}
                        >
                          {/* Message bubble */}
                          <div
                            className={cn(
                              `relative px-4 py-2.5 rounded-2xl text-sm
                               leading-relaxed cursor-pointer select-text`,
                              isOwn
                                ? `bg-foreground text-background
                                   rounded-br-md`
                                : `bg-surface border border-border
                                   text-foreground rounded-bl-md`
                            )}
                            onDoubleClick={() =>
                              setReactionTarget(
                                reactionTarget === message._id
                                  ? null
                                  : message._id
                              )
                            }
                          >
                            {message.content}

                            {/* Reaction picker */}
                            <AnimatePresence>
                              {reactionTarget === message._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, y: 8 }}
                                  transition={{ duration: 0.15 }}
                                  className={cn(
                                    `absolute -top-11 flex gap-1 bg-background
                                     border border-border rounded-2xl px-2 py-1.5
                                     shadow-xl z-20`,
                                    isOwn ? 'right-0' : 'left-0'
                                  )}
                                >
                                  {REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() =>
                                        handleReact(message._id, emoji)
                                      }
                                      className="text-base hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Reactions */}
                          {message.reactions?.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {Object.entries(
                                message.reactions.reduce(
                                  (acc: any, r: any) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                    return acc
                                  },
                                  {}
                                )
                              ).map(([emoji, count]: any) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleReact(message._id, emoji)
                                  }
                                  className="flex items-center gap-1 text-xs
                                             bg-surface border border-border
                                             rounded-full px-2 py-0.5
                                             hover:bg-accent transition-colors"
                                >
                                  {emoji}
                                  {count > 1 && (
                                    <span className="text-muted">{count}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Timestamp + read */}
                          <div
                            className={cn(
                              'flex items-center gap-1 mt-1',
                              isOwn ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <span className="text-2xs text-muted opacity-0
                                             group-hover:opacity-100 transition-opacity">
                              {formatRelativeTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              <CheckCheck
                                size={10}
                                className={cn(
                                  'opacity-0 group-hover:opacity-100 transition-opacity',
                                  message.isRead
                                    ? 'text-blue-500'
                                    : 'text-muted'
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {typingUsers.size > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="flex gap-2 items-end"
                      >
                        <div className="w-8 shrink-0" />
                        <div className="px-4 py-3 bg-surface border border-border
                                        rounded-2xl rounded-bl-md">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-muted"
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            <div className="px-5 py-4 border-t border-border bg-background shrink-0">
              <div className="flex items-end gap-3">
                <button
                  className="p-2.5 rounded-xl text-muted hover:text-foreground
                             hover:bg-accent transition-colors shrink-0"
                >
                  <ImageIcon size={18} />
                </button>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Write a message..."
                    className="w-full h-11 px-4 pr-10 rounded-2xl border border-input
                               bg-surface text-sm placeholder:text-muted
                               focus:outline-none focus:ring-2 focus:ring-ring
                               transition-colors resize-none"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-muted hover:text-foreground transition-colors"
                  >
                    <Smile size={16} />
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className={cn(
                    `w-11 h-11 rounded-2xl flex items-center justify-center
                     shrink-0 transition-all duration-200`,
                    newMessage.trim()
                      ? 'bg-foreground text-background hover:opacity-80'
                      : 'bg-surface text-muted cursor-not-allowed'
                  )}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}