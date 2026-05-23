'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Search, MoreHorizontal, Phone,
  Image as ImageIcon, Smile, ArrowLeft, CheckCheck,
} from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { io, Socket } from 'socket.io-client'
import { apiClient } from '@/lib/api'
import { useUserStore } from '@/store/useUserStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'

const REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥']

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const { isSignedIn } = useAuth()
  const currentUser    = useUserStore((s) => s.user)

  const [conversations,      setConversations]      = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages,           setMessages]           = useState<any[]>([])
  const [newMessage,         setNewMessage]         = useState('')
  const [isLoadingConvos,    setIsLoadingConvos]    = useState(true)
  const [isLoadingMessages,  setIsLoadingMessages]  = useState(false)
  const [isSending,          setIsSending]          = useState(false)
  const [typingUsers,        setTypingUsers]        = useState<Set<string>>(new Set())
  const [showMobileList,     setShowMobileList]     = useState(true)
  const [reactionTarget,     setReactionTarget]     = useState<string | null>(null)
  const [searchQuery,        setSearchQuery]        = useState('')

  const socketRef      = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  /* Socket setup */
  useEffect(() => {
    if (!currentUser) return
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
      { transports: ['websocket'] }
    )
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
      if (userId !== currentUser._id)
        setTypingUsers((prev) => new Set([...prev, userId]))
    })
    socket.on('typing:stop', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => { const n = new Set(prev); n.delete(userId); return n })
    })

    return () => { socket.disconnect() }
  }, [currentUser])

  useEffect(() => {
    if (!activeConversation || !socketRef.current) return
    socketRef.current.emit('conversation:join', activeConversation._id)
    return () => {
      socketRef.current?.emit('conversation:leave', activeConversation._id)
    }
  }, [activeConversation])

  useEffect(() => {
    if (!isSignedIn) return
    apiClient.messages.getConversations()
      .then(({ data }) => setConversations(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoadingConvos(false))
  }, [isSignedIn])

  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && isSignedIn) {
      apiClient.messages.getOrCreate(userId)
        .then(({ data }) => {
          const convo = data.data
          setActiveConversation(convo)
          setShowMobileList(false)
          setConversations((prev) =>
            prev.find((c) => c._id === convo._id) ? prev : [convo, ...prev]
          )
        })
        .catch(() => {})
    }
  }, [searchParams, isSignedIn])

  useEffect(() => {
    if (!activeConversation) return
    setIsLoadingMessages(true)
    apiClient.messages.getMessages(activeConversation._id)
      .then(({ data }) => setMessages(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoadingMessages(false))
  }, [activeConversation])

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

    const optimistic = {
      _id:          `temp-${Date.now()}`,
      conversation: activeConversation._id,
      sender:       currentUser,
      content,
      isRead:       false,
      reactions:    [],
      createdAt:    new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const { data } = await apiClient.messages.send(
        activeConversation._id, { content }
      )
      setMessages((prev) =>
        prev.map((m) => m._id === optimistic._id ? data.data : m)
      )
      socketRef.current?.emit('message:send', {
        conversationId: activeConversation._id,
        message:        data.data,
      })
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
      toast.error('Message failed to send')
      setNewMessage(content)
    } finally { setIsSending(false) }
  }

  const handleTyping = () => {
    if (!activeConversation || !currentUser) return
    socketRef.current?.emit('typing:start', {
      conversationId: activeConversation._id,
      userId:         currentUser._id,
    })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', {
        conversationId: activeConversation._id,
        userId:         currentUser._id,
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

  const getOtherParticipant = (convo: any) =>
    convo.participants?.find((p: any) => p._id !== currentUser?._id)

  const filteredConvos = conversations.filter((c) => {
    const other = getOtherParticipant(c)
    if (!searchQuery) return true
    return (
      other?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      other?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div
      className="flex overflow-hidden"
      style={{
        height:     'calc(100vh - 72px)',
        background: 'hsl(var(--background))',
      }}
    >

      {/* ══════════════════════════════════════════════════
          Conversation list sidebar
      ══════════════════════════════════════════════════ */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-r',
          !showMobileList && 'hidden md:flex'
        )}
        style={{
          background:  'hsl(var(--surface))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {/* Sidebar header */}
        <div
          className="px-5 pt-6 pb-4 border-b"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <h1
            className="font-display font-bold tracking-[-0.03em] leading-[1.1] mb-4"
            style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
          >
            Messages
          </h1>

          {/* Search */}
          <div className="search-input-wrapper">
            <Search size={14} style={{ color: 'hsl(var(--muted))' }} />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoadingConvos ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div
                    className="skeleton w-11 h-11 shrink-0"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="skeleton h-3.5 w-28"
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                    <div
                      className="skeleton h-3 w-40"
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="py-16 text-center px-6">
              <p className="text-2xl mb-3">💬</p>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                No conversations
              </p>
              <p
                className="text-xs"
                style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
              >
                Visit a profile to start messaging
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredConvos.map((convo) => {
                const other    = getOtherParticipant(convo)
                const isActive = activeConversation?._id === convo._id
                const isUnread =
                  convo.lastMessage &&
                  !convo.lastMessage.isRead &&
                  convo.lastMessage.sender !== currentUser?._id

                return (
                  <button
                    key={convo._id}
                    onClick={() => handleSelectConversation(convo)}
                    className="w-full flex items-center gap-3 px-4 py-3.5
                               text-left transition-all duration-[var(--duration-hover)]"
                    style={{
                      background: isActive
                        ? 'hsl(var(--accent-muted))'
                        : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.background =
                          'hsl(var(--background-secondary))'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={other?.avatar}
                        name={other?.displayName}
                        size="md"
                      />
                      {typingUsers.has(other?._id) && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3
                                     rounded-full border-2"
                          style={{
                            background:  'hsl(142 60% 40%)',
                            borderColor: 'hsl(var(--surface))',
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-sm truncate"
                          style={{
                            color:      'hsl(var(--foreground))',
                            fontWeight: isUnread ? 600 : 500,
                          }}
                        >
                          {other?.displayName}
                        </p>
                        <p
                          className="text-[10px] shrink-0"
                          style={{ color: 'hsl(var(--muted))' }}
                        >
                          {convo.lastMessage
                            ? formatRelativeTime(convo.lastMessage.createdAt)
                            : ''}
                        </p>
                      </div>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{
                          color:      isUnread
                            ? 'hsl(var(--foreground))'
                            : 'hsl(var(--muted))',
                          fontWeight: isUnread ? 500 : 300,
                        }}
                      >
                        {typingUsers.has(other?._id) ? (
                          <span
                            className="italic"
                            style={{ color: 'hsl(142 60% 40%)' }}
                          >
                            typing…
                          </span>
                        ) : (
                          convo.lastMessage?.content || 'Start a conversation'
                        )}
                      </p>
                    </div>

                    {/* Unread dot — Pinterest red */}
                    {isUnread && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0
                                   shadow-[var(--shadow-red)]"
                        style={{ background: 'hsl(var(--accent))' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Chat area
      ══════════════════════════════════════════════════ */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0',
          showMobileList && 'hidden md:flex'
        )}
      >
        {!activeConversation ? (

          /* Empty / no selection */
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-4xl mb-4">✦</p>
              <h2
                className="font-display font-bold tracking-[-0.03em] mb-2"
                style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
              >
                Select a conversation
              </h2>
              <p
                className="text-sm"
                style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
              >
                Choose from your messages or visit a profile to start chatting
              </p>
            </div>
          </div>

        ) : (
          <>
            {/* ── Chat header ── */}
            {(() => {
              const other = getOtherParticipant(activeConversation)
              return (
                <div
                  className="flex items-center gap-4 px-5 py-4 border-b shrink-0"
                  style={{
                    background:  'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                >
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="btn-icon md:hidden"
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <Avatar
                    src={other?.avatar}
                    name={other?.displayName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {other?.displayName}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'hsl(var(--muted))' }}
                    >
                      {typingUsers.has(other?._id)
                        ? 'typing…'
                        : `@${other?.username}`}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button className="btn-icon" aria-label="Call">
                      <Phone size={16} />
                    </button>
                    <button className="btn-icon" aria-label="More">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-6 space-y-1">
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
                        <div
                          className="skeleton w-8 h-8 shrink-0"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                        />
                      )}
                      <div
                        className={cn(
                          'skeleton h-10',
                          i % 3 === 0 ? 'w-48' : 'w-56'
                        )}
                        style={{ borderRadius: 'var(--radius-lg)' }}
                      />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl mb-2">👋</p>
                    <p
                      className="text-sm"
                      style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}
                    >
                      Say hello to start the conversation
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, i) => {
                    const isOwn =
                      message.sender?._id === currentUser?._id ||
                      message.sender   === currentUser?._id
                    const prevMsg      = messages[i - 1]
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
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          'flex gap-2 group',
                          isOwn ? 'justify-end' : 'justify-start',
                          !isSameAuthor && 'mt-4'
                        )}
                      >
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
                            'relative max-w-[70%] flex flex-col',
                            isOwn ? 'items-end' : 'items-start'
                          )}
                        >
                          {/* Bubble */}
                          <div
                            className="relative px-4 py-2.5 text-sm
                                       leading-relaxed cursor-pointer select-text"
                            style={{
                              background: isOwn
                                ? 'hsl(var(--foreground))'
                                : 'hsl(var(--surface))',
                              color: isOwn
                                ? 'hsl(var(--background))'
                                : 'hsl(var(--foreground))',
                              border: isOwn
                                ? 'none'
                                : '1px solid hsl(var(--border))',
                              borderRadius: isOwn
                                ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                                : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                            }}
                            onDoubleClick={() =>
                              setReactionTarget(
                                reactionTarget === message._id ? null : message._id
                              )
                            }
                          >
                            {message.content}

                            {/* Reaction picker */}
                            <AnimatePresence>
                              {reactionTarget === message._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                                  animate={{ opacity: 1, scale: 1,   y: 0 }}
                                  exit={{   opacity: 0, scale: 0.8, y: 8 }}
                                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                  className={cn(
                                    'absolute -top-12 z-20 flex gap-1 px-2 py-1.5',
                                    'shadow-[var(--shadow-float)]',
                                    isOwn ? 'right-0' : 'left-0'
                                  )}
                                  style={{
                                    background:   'hsl(var(--background))',
                                    border:       '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius-pill)',
                                  }}
                                >
                                  {REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReact(message._id, emoji)}
                                      className="text-base transition-transform
                                                 duration-[var(--duration-fast)]
                                                 hover:scale-125"
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
                                message.reactions.reduce((acc: any, r: any) => {
                                  acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                  return acc
                                }, {})
                              ).map(([emoji, count]: any) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(message._id, emoji)}
                                  className="flex items-center gap-1 text-xs
                                             px-2 py-0.5 transition-all
                                             duration-[var(--duration-hover)]"
                                  style={{
                                    background:   'hsl(var(--surface))',
                                    border:       '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius-pill)',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      'hsl(var(--accent-muted))')}
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      'hsl(var(--surface))')}
                                >
                                  {emoji}
                                  {count > 1 && (
                                    <span style={{ color: 'hsl(var(--muted))' }}>
                                      {count}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Timestamp + read status */}
                          <div
                            className={cn(
                              'flex items-center gap-1 mt-1',
                              isOwn ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <span
                              className="text-[10px] opacity-0
                                         group-hover:opacity-100
                                         transition-opacity duration-[var(--duration-hover)]"
                              style={{ color: 'hsl(var(--muted))' }}
                            >
                              {formatRelativeTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              <CheckCheck
                                size={10}
                                className="opacity-0 group-hover:opacity-100
                                           transition-opacity duration-[var(--duration-hover)]"
                                style={{
                                  color: message.isRead
                                    ? 'hsl(var(--accent))'
                                    : 'hsl(var(--muted))',
                                }}
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
                        exit={{   opacity: 0, y: 8 }}
                        className="flex gap-2 items-end"
                      >
                        <div className="w-8 shrink-0" />
                        <div
                          className="px-4 py-3"
                          style={{
                            background:   'hsl(var(--surface))',
                            border:       '1px solid hsl(var(--border))',
                            borderRadius:
                              'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                          }}
                        >
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: 'hsl(var(--accent))' }}
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat:   Infinity,
                                  delay:    i * 0.15,
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

            {/* ── Input bar ── */}
            <div
              className="px-5 py-4 border-t shrink-0"
              style={{
                background:  'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <div className="flex items-end gap-3">
                <button
                  className="btn-icon shrink-0"
                  aria-label="Attach image"
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
                    placeholder="Write a message…"
                    className="w-full h-11 px-4 pr-10 text-sm outline-none
                               transition-[border-color,box-shadow]
                               duration-[var(--duration-hover)]"
                    style={{
                      background:   'hsl(var(--surface))',
                      border:       '1.5px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-pill)',
                      color:        'hsl(var(--foreground))',
                      fontFamily:   "'DM Sans', sans-serif",
                      fontWeight:   300,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor =
                        'hsl(var(--accent) / 0.6)'
                      e.currentTarget.style.boxShadow =
                        '0 0 0 3px hsl(var(--accent) / 0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))'
                      e.currentTarget.style.boxShadow   = 'none'
                    }}
                  />
                  <button
                    className="absolute right-3.5 top-1/2 -translate-y-1/2
                               transition-colors duration-[var(--duration-hover)]"
                    style={{ color: 'hsl(var(--muted))' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'hsl(var(--muted))')}
                    aria-label="Emoji"
                  >
                    <Smile size={16} />
                  </button>
                </div>

                {/* Send button — Pinterest red when active */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="w-11 h-11 flex items-center justify-center shrink-0
                             transition-all duration-[var(--duration-hover)]"
                  style={{
                    borderRadius: 'var(--radius-pill)',
                    background: newMessage.trim()
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--surface))',
                    color: newMessage.trim()
                      ? 'white'
                      : 'hsl(var(--muted))',
                    boxShadow: newMessage.trim()
                      ? 'var(--shadow-red)'
                      : 'none',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                  }}
                  aria-label="Send"
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