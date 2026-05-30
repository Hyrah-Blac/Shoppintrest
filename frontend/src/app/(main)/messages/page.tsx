// PATH: src/app/(main)/messages/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Search, MoreHorizontal, Phone,
  Smile, ArrowLeft, CheckCheck, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useUserStore } from '@/store/useUserStore'
import { useMessageStore } from '@/store/useMessageStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'
import { useStreamContext } from '@/components/providers/StreamProvider'
import { useStreamChat } from '@/hooks/useStreamChat'
import type { ConversationPreview, StreamMessage } from '@/hooks/useStreamChat'

const REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥']

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: [
      '😀','😁','😂','🤣','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
      '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','😐','😑',
      '😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆',
      '🖕','👇','☝️','👋','🤚','🖐️','✋','🖖','👏','🙌','🤲','🤝','🙏',
      '✍️','💪','🦾','🦿',
    ],
  },
  {
    label: 'Hearts & fun',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞',
      '💓','💗','💖','💘','💝','🔥','✨','⭐','🌟','💫','⚡','🎉','🎊',
      '🥳','🎈','🎁','🎀',
    ],
  },
  {
    label: 'Objects',
    emojis: [
      '🎵','🎶','🎸','🎹','🎺','🎻','🥁','🎤','🎧','📱','💻','⌨️','🖥️',
      '📷','📸','📹','🎥','📺','📻','💡','🔦','🕯️','🪔','🔑','🗝️','🔒',
      '🔓','📬','📦','🛍️',
    ],
  },
]

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const currentUser  = useUserStore((s) => s.user)
  const resetUnread  = useMessageStore((s) => s.resetUnread)

  const { client, isReady } = useStreamContext()
  const {
    conversations,
    activeChannel,
    messages,
    typingUsers,
    isLoadingConvos,
    isLoadingMessages,
    isSending,
    openChannel,
    openOrCreateConversation,
    sendMessage,
    onKeystroke,
    reactToMessage,
  } = useStreamChat(client, isReady)

  const [newMessage,      setNewMessage]      = useState('')
  const [showMobileList,  setShowMobileList]  = useState(true)
  const [reactionTarget,  setReactionTarget]  = useState<string | null>(null)
  const [searchQuery,     setSearchQuery]     = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const inputRef        = useRef<HTMLInputElement>(null)
  const emojiPickerRef  = useRef<HTMLDivElement>(null)

  // Reset message badge when user opens the messages page
  useEffect(() => { resetUnread() }, [])

  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && isReady) {
      openOrCreateConversation(userId).then((ch) => {
        if (ch) setShowMobileList(false)
      })
    }
  }, [searchParams, isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!showEmojiPicker) return
    const handler = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmojiPicker])

  const handleSelectConversation = (convo: ConversationPreview) => {
    openChannel(convo.channel)
    setShowMobileList(false)
    setShowEmojiPicker(false)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  const handleSend = async () => {
    const text = newMessage.trim()
    if (!text || isSending) return
    setNewMessage('')
    setShowEmojiPicker(false)
    try {
      await sendMessage(text)
    } catch {
      toast.error('Message failed to send')
      setNewMessage(text)
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await reactToMessage(messageId, emoji)
    } catch { /* silent */ }
    setReactionTarget(null)
  }

  const handleEmojiInsert = (emoji: string) => {
    const input = inputRef.current
    if (!input) {
      setNewMessage((prev) => prev + emoji)
      return
    }
    const start  = input.selectionStart ?? newMessage.length
    const end    = input.selectionEnd   ?? newMessage.length
    const next   = newMessage.slice(0, start) + emoji + newMessage.slice(end)
    setNewMessage(next)
    requestAnimationFrame(() => {
      input.focus()
      const cursor = start + emoji.length
      input.setSelectionRange(cursor, cursor)
    })
  }

  const activeChannelId = activeChannel?.id ?? null

  const activePreview: ConversationPreview | undefined = activeChannelId
    ? conversations.find((c) => c.channelId === activeChannelId)
    : undefined

  const filteredConvos = conversations.filter((c) => {
    if (!searchQuery) return true
    return c.otherName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: 'calc(100vh - 72px)', background: 'hsl(var(--background))' }}
    >

      {/* ════════════════════ Sidebar ════════════════════ */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-r',
          !showMobileList && 'hidden md:flex'
        )}
        style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}
      >
        <div className="px-5 pt-6 pb-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h1
            className="font-display font-bold tracking-[-0.03em] leading-[1.1] mb-4"
            style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
          >
            Messages
          </h1>
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

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoadingConvos ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="skeleton w-11 h-11 shrink-0"
                    style={{ borderRadius: 'var(--radius-sm)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-28"
                      style={{ borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton h-3 w-40"
                      style={{ borderRadius: 'var(--radius-sm)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="py-16 text-center px-6">
              <p className="text-2xl mb-3">💬</p>
              <p className="text-sm font-medium mb-1"
                style={{ color: 'hsl(var(--foreground))' }}>
                No conversations
              </p>
              <p className="text-xs"
                style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                Visit a profile to start messaging
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredConvos.map((convo) => (
                <ConversationRow
                  key={convo.channelId}
                  convo={convo}
                  isActive={activeChannelId === convo.channelId}
                  onSelect={handleSelectConversation}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════ Chat area ════════════════════ */}
      <div className={cn('flex-1 flex flex-col min-w-0', showMobileList && 'hidden md:flex')}>

        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-4xl mb-4">✦</p>
              <h2
                className="font-display font-bold tracking-[-0.03em] mb-2"
                style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
              >
                Select a conversation
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                Choose from your messages or visit a profile to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div
              className="flex items-center gap-4 px-5 py-4 border-b shrink-0"
              style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
            >
              <button
                onClick={() => setShowMobileList(true)}
                className="btn-icon md:hidden"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>

              <Avatar
                src={activePreview?.otherAvatar}
                name={activePreview?.otherName ?? ''}
                size="md"
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate"
                  style={{ color: 'hsl(var(--foreground))' }}>
                  {activePreview?.otherName ?? ''}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>
                  {typingUsers.size > 0 ? 'typing…' : ''}
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

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-6 space-y-1">
              {isLoadingMessages ? (
                <LoadingSkeleton />
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl mb-2">👋</p>
                    <p className="text-sm"
                      style={{ color: 'hsl(var(--muted))', fontWeight: 300 }}>
                      Say hello to start the conversation
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, i) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      prevMessage={messages[i - 1] ?? null}
                      myId={currentUser?._id ?? ''}
                      reactionTarget={reactionTarget}
                      onDoubleClick={(id) =>
                        setReactionTarget(reactionTarget === id ? null : id)
                      }
                      onReact={handleReact}
                    />
                  ))}

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
                            borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                          }}
                        >
                          <div className="flex gap-1">
                            {[0, 1, 2].map((dot) => (
                              <motion.div
                                key={dot}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: 'hsl(var(--accent))' }}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15 }}
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
              className="px-5 py-4 border-t shrink-0 relative"
              style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
            >
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    ref={emojiPickerRef}
                    initial={{ opacity: 0, y: 8,  scale: 0.96 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{   opacity: 0, y: 8,  scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-full right-5 mb-2 z-30 w-72"
                    style={{
                      background:   'hsl(var(--background))',
                      border:       '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow:    'var(--shadow-float)',
                      maxHeight:    '264px',
                      overflowY:    'auto',
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2 border-b sticky top-0 z-10"
                      style={{
                        borderColor: 'hsl(var(--border))',
                        background:  'hsl(var(--background))',
                      }}
                    >
                      <span className="text-xs font-medium"
                        style={{ color: 'hsl(var(--muted))' }}>
                        Emoji
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="btn-icon"
                        aria-label="Close emoji picker"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div className="p-2">
                      {EMOJI_GROUPS.map((group) => (
                        <div key={group.label} className="mb-3 last:mb-0">
                          <p
                            className="text-[10px] font-medium uppercase tracking-wider mb-1.5 px-1"
                            style={{ color: 'hsl(var(--muted))' }}
                          >
                            {group.label}
                          </p>
                          <div className="grid grid-cols-8 gap-0.5">
                            {group.emojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiInsert(emoji)}
                                className="flex items-center justify-center rounded
                                           transition-all duration-[var(--duration-fast)]
                                           hover:scale-110"
                                style={{
                                  height:     '34px',
                                  fontSize:   '1.125rem',
                                  lineHeight: 1,
                                  background: 'transparent',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = 'hsl(var(--surface))')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = 'transparent')
                                }
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      onKeystroke()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                      if (e.key === 'Escape') setShowEmojiPicker(false)
                    }}
                    placeholder="Write a message…"
                    className="w-full h-11 px-4 pr-10 text-sm outline-none
                               transition-[border-color,box-shadow] duration-[var(--duration-hover)]"
                    style={{
                      background:   'hsl(var(--surface))',
                      border:       '1.5px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-pill)',
                      color:        'hsl(var(--foreground))',
                      fontFamily:   "'DM Sans', sans-serif",
                      fontWeight:   300,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.6)'
                      e.currentTarget.style.boxShadow   = '0 0 0 3px hsl(var(--accent) / 0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))'
                      e.currentTarget.style.boxShadow   = 'none'
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2
                               transition-colors duration-[var(--duration-hover)]"
                    style={{
                      color:      showEmojiPicker ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
                      background: 'none',
                      border:     'none',
                      cursor:     'pointer',
                      padding:    0,
                      display:    'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (!showEmojiPicker)
                        e.currentTarget.style.color = 'hsl(var(--foreground))'
                    }}
                    onMouseLeave={(e) => {
                      if (!showEmojiPicker)
                        e.currentTarget.style.color = 'hsl(var(--muted))'
                    }}
                    aria-label="Toggle emoji picker"
                    aria-expanded={showEmojiPicker}
                  >
                    <Smile size={16} />
                  </button>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="w-11 h-11 flex items-center justify-center shrink-0
                             transition-all duration-[var(--duration-hover)]"
                  style={{
                    borderRadius: 'var(--radius-pill)',
                    background:  newMessage.trim() ? 'hsl(var(--accent))' : 'hsl(var(--surface))',
                    color:       newMessage.trim() ? 'white' : 'hsl(var(--muted))',
                    boxShadow:   newMessage.trim() ? 'var(--shadow-red)' : 'none',
                    cursor:      newMessage.trim() ? 'pointer' : 'not-allowed',
                    border:      'none',
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

// ─── ConversationRow ──────────────────────────────────────────────────────────

function ConversationRow({
  convo,
  isActive,
  onSelect,
}: {
  convo:    ConversationPreview
  isActive: boolean
  onSelect: (c: ConversationPreview) => void
}) {
  const isUnread = convo.unreadCount > 0

  return (
    <button
      onClick={() => onSelect(convo)}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                 transition-all duration-[var(--duration-hover)]"
      style={{ background: isActive ? 'hsl(var(--accent-muted))' : 'transparent' }}
      onMouseEnter={(e) => {
        if (!isActive)
          e.currentTarget.style.background = 'hsl(var(--background-secondary))'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div className="relative shrink-0">
        <Avatar src={convo.otherAvatar} name={convo.otherName} size="md" />
        {convo.isTyping && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
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
            style={{ color: 'hsl(var(--foreground))', fontWeight: isUnread ? 600 : 500 }}
          >
            {convo.otherName}
          </p>
          <p className="text-[10px] shrink-0" style={{ color: 'hsl(var(--muted))' }}>
            {convo.lastAt ? formatRelativeTime(convo.lastAt) : ''}
          </p>
        </div>
        <p
          className="text-xs truncate mt-0.5"
          style={{
            color:      isUnread ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
            fontWeight: isUnread ? 500 : 300,
          }}
        >
          {convo.isTyping ? (
            <span className="italic" style={{ color: 'hsl(142 60% 40%)' }}>
              typing…
            </span>
          ) : (
            convo.lastText || 'Start a conversation'
          )}
        </p>
      </div>

      {isUnread && (
        <div
          className="w-2 h-2 rounded-full shrink-0 shadow-[var(--shadow-red)]"
          style={{ background: 'hsl(var(--accent))' }}
        />
      )}
    </button>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  prevMessage,
  myId,
  reactionTarget,
  onDoubleClick,
  onReact,
}: {
  message:        StreamMessage
  prevMessage:    StreamMessage | null
  myId:           string
  reactionTarget: string | null
  onDoubleClick:  (id: string) => void
  onReact:        (id: string, emoji: string) => void
}) {
  const isOwn        = message.user.id === myId
  const isSameAuthor = prevMessage?.user.id === message.user.id
  const showAvatar   = !isOwn && !isSameAuthor

  const senderName:   string   = message.user.name  ?? ''
  const senderImage:  string   = message.user.image ?? ''
  const messageText:  string   = message.text
  const timestamp:    string   = message.created_at
  const reactionKeys: string[] = Object.keys(message.reactions)

  return (
    <motion.div
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
          {showAvatar && <Avatar src={senderImage} name={senderName} size="xs" />}
        </div>
      )}

      <div className={cn(
        'relative max-w-[70%] flex flex-col',
        isOwn ? 'items-end' : 'items-start'
      )}>
        <div
          className="relative px-4 py-2.5 text-sm leading-relaxed cursor-pointer select-text"
          style={{
            background: isOwn
              ? message.isOptimistic
                ? 'hsl(var(--foreground) / 0.65)'
                : 'hsl(var(--foreground))'
              : 'hsl(var(--surface))',
            color:        isOwn ? 'hsl(var(--background))' : 'hsl(var(--foreground))',
            border:       isOwn ? 'none' : '1px solid hsl(var(--border))',
            borderRadius: isOwn
              ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
              : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
          }}
          onDoubleClick={() => onDoubleClick(message.id)}
        >
          {messageText}

          <AnimatePresence>
            {reactionTarget === message.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1,   y: 0 }}
                exit={{   opacity: 0, scale: 0.8, y: 8 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'absolute -top-12 z-20 flex gap-1 px-2 py-1.5',
                  isOwn ? 'right-0' : 'left-0'
                )}
                style={{
                  background:   'hsl(var(--background))',
                  border:       '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-pill)',
                  boxShadow:    'var(--shadow-float)',
                }}
              >
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onReact(message.id, emoji)
                    }}
                    className="text-base leading-none transition-transform
                               duration-[var(--duration-fast)] hover:scale-125"
                    style={{
                      background: 'none',
                      border:     'none',
                      cursor:     'pointer',
                      padding:    '2px',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {reactionKeys.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {reactionKeys.map((emoji) => {
              const data = message.reactions[emoji]
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(message.id, emoji)}
                  className="flex items-center gap-1 text-xs px-2 py-0.5
                             transition-all duration-[var(--duration-hover)]"
                  style={{
                    background:   data.myReaction
                      ? 'hsl(var(--accent-muted))'
                      : 'hsl(var(--surface))',
                    border:       '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-pill)',
                    cursor:       'pointer',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--accent-muted))')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = data.myReaction
                      ? 'hsl(var(--accent-muted))'
                      : 'hsl(var(--surface))')
                  }
                >
                  {emoji}
                  {data.count > 1 && (
                    <span style={{ color: 'hsl(var(--muted))' }}>{data.count}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <div className={cn(
          'flex items-center gap-1 mt-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          <span
            className="text-[10px] opacity-0 group-hover:opacity-100
                       transition-opacity duration-[var(--duration-hover)]"
            style={{ color: 'hsl(var(--muted))' }}
          >
            {formatRelativeTime(timestamp)}
          </span>
          {isOwn && (
            <CheckCheck
              size={10}
              className="opacity-0 group-hover:opacity-100
                         transition-opacity duration-[var(--duration-hover)]"
              style={{
                color: message.readByOther
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--muted))',
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── LoadingSkeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn('flex gap-2', i % 3 === 0 ? 'justify-end' : 'justify-start')}
        >
          {i % 3 !== 0 && (
            <div className="skeleton w-8 h-8 shrink-0"
              style={{ borderRadius: 'var(--radius-sm)' }} />
          )}
          <div
            className={cn('skeleton h-10', i % 3 === 0 ? 'w-48' : 'w-56')}
            style={{ borderRadius: 'var(--radius-lg)' }}
          />
        </div>
      ))}
    </div>
  )
}