'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Channel,
  StreamChat,
  MessageResponse,
  ChannelFilters,
  ChannelSort,
  ReactionResponse,
} from 'stream-chat'
import { useUserStore } from '@/store/useUserStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamMessage {
  id:            string
  text:          string
  user:          { id: string; name?: string; username?: string; image?: string }
  created_at:    string
  isOptimistic?: boolean
  readByOther:   boolean
  reactions:     Record<string, { count: number; myReaction: boolean }>
}

export interface ConversationPreview {
  channelId:   string
  channel:     Channel
  otherId:     string
  otherName:   string
  otherAvatar: string
  lastText:    string
  lastAt:      string
  unreadCount: number
  isTyping:    boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildReactions(
  rawReactions: ReactionResponse[] | undefined,
  myUserId: string
): Record<string, { count: number; myReaction: boolean }> {
  if (!rawReactions?.length) return {}
  const map: Record<string, { count: number; myReaction: boolean }> = {}
  for (const r of rawReactions) {
    if (!map[r.type]) map[r.type] = { count: 0, myReaction: false }
    map[r.type].count++
    if (r.user_id === myUserId) map[r.type].myReaction = true
  }
  return map
}

function toStreamMessage(
  raw: MessageResponse,
  myUserId: string,
  channel: Channel
): StreamMessage {
  const readByOther = Object.entries(channel.state.read).some(
    ([uid, info]) =>
      uid !== myUserId &&
      info.last_read &&
      new Date(info.last_read) >= new Date(raw.created_at ?? 0)
  )
  return {
    id:          raw.id,
    text:        raw.text ?? '',
    user: {
      id:       raw.user?.id ?? '',
      name:     raw.user?.name,
      username: (raw.user as any)?.username,
      image:    raw.user?.image,
    },
    created_at:  raw.created_at ?? '',
    readByOther,
    reactions:   buildReactions(raw.latest_reactions, myUserId),
  }
}

function channelToPreview(channel: Channel, myId: string): ConversationPreview {
  const members = Object.values(channel.state.members)
  const other   = members.find((m) => m.user_id !== myId)
  const lastMsg = channel.state.messages.at(-1)
  return {
    channelId:   channel.id ?? '',
    channel,
    otherId:     other?.user_id ?? '',
    otherName:   other?.user?.name ?? other?.user_id ?? '',
    otherAvatar: other?.user?.image ?? '',
    lastText:    lastMsg?.text ?? '',
    lastAt:      lastMsg?.created_at ?? channel.data?.created_at ?? '',
    unreadCount: channel.countUnread(),
    isTyping:    false,
  }
}

function sortByLastMessage(list: ConversationPreview[]): ConversationPreview[] {
  return [...list].sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStreamChat(client: StreamChat | null, isReady: boolean) {
  const currentUser = useUserStore((s) => s.user)
  const myId = currentUser?._id ?? ''

  const [conversations,     setConversations]     = useState<ConversationPreview[]>([])
  const [activeChannel,     setActiveChannelState] = useState<Channel | null>(null)
  const [messages,          setMessages]           = useState<StreamMessage[]>([])
  const [typingUsers,       setTypingUsers]        = useState<Set<string>>(new Set())
  const [isLoadingConvos,   setIsLoadingConvos]    = useState(true)
  const [isLoadingMessages, setIsLoadingMessages]  = useState(false)
  const [isSending,         setIsSending]          = useState(false)

  const typingTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeChannelRef    = useRef<Channel | null>(null)
  const channelUnsubs       = useRef<(() => void)[]>([])

  // ── Load conversation list ─────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    if (!client || !isReady || !myId) return
    setIsLoadingConvos(true)
    try {
      const filters: ChannelFilters = {
        type:    'messaging',
        members: { $in: [myId] },
      }
      const sort: ChannelSort = { last_message_at: -1 }
      const channels = await client.queryChannels(filters, sort, {
        watch:         true,
        state:         true,
        presence:      true,
        message_limit: 1,
      })
      setConversations(channels.map((c) => channelToPreview(c, myId)))
    } finally {
      setIsLoadingConvos(false)
    }
  }, [client, isReady, myId])

  useEffect(() => { loadConversations() }, [loadConversations])

  // ── Global client event — new message in any channel ──────────────────────

  useEffect(() => {
    if (!client || !isReady) return

    const unsub = client.on('message.new', (event) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.channelId === event.channel_id)
        if (idx === -1) { loadConversations(); return prev }
        const updated = [...prev]
        updated[idx] = {
          ...updated[idx],
          lastText:    event.message?.text ?? '',
          lastAt:      event.message?.created_at ?? '',
          unreadCount:
            event.channel_id !== activeChannelRef.current?.id
              ? updated[idx].unreadCount + 1
              : 0,
        }
        return sortByLastMessage(updated)
      })
    }).unsubscribe

    return () => unsub()
  }, [client, isReady, loadConversations])

  // ── Open a channel and wire up its listeners ───────────────────────────────

  const cleanupChannelListeners = () => {
    channelUnsubs.current.forEach((fn) => fn())
    channelUnsubs.current = []
  }

  const openChannel = useCallback(
    async (channel: Channel) => {
      cleanupChannelListeners()
      setIsLoadingMessages(true)
      setMessages([])
      setTypingUsers(new Set())

      await channel.watch()
      await channel.markRead()
      activeChannelRef.current = channel
      setActiveChannelState(channel)
      setMessages(channel.state.messages.map((m) => toStreamMessage(m, myId, channel)))
      setIsLoadingMessages(false)

      const unsubs = [
        channel.on('message.new', (e) => {
          const msg = toStreamMessage(e.message, myId, channel)
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          channel.markRead()
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.channelId === channel.id)
            if (idx === -1) return prev
            const updated = [...prev]
            updated[idx] = { ...updated[idx], lastText: msg.text, lastAt: msg.created_at, unreadCount: 0 }
            return sortByLastMessage(updated)
          })
        }).unsubscribe,

        channel.on('reaction.new',     (e) => e.message && setMessages((prev) => prev.map((m) => m.id === e.message!.id ? toStreamMessage(e.message!, myId, channel) : m))).unsubscribe,
        channel.on('reaction.updated', (e) => e.message && setMessages((prev) => prev.map((m) => m.id === e.message!.id ? toStreamMessage(e.message!, myId, channel) : m))).unsubscribe,
        channel.on('reaction.deleted', (e) => e.message && setMessages((prev) => prev.map((m) => m.id === e.message!.id ? toStreamMessage(e.message!, myId, channel) : m))).unsubscribe,

        channel.on('typing.start', (e) => {
          if (e.user?.id === myId) return
          setTypingUsers((prev) => new Set([...prev, e.user?.id ?? '']))
        }).unsubscribe,

        channel.on('typing.stop', (e) => {
          setTypingUsers((prev) => { const n = new Set(prev); n.delete(e.user?.id ?? ''); return n })
        }).unsubscribe,

        channel.on('message.read', () => {
          setMessages((prev) =>
            prev.map((m) => {
              const raw = channel.state.messages.find((r) => r.id === m.id)
              return raw ? toStreamMessage(raw, myId, channel) : m
            })
          )
        }).unsubscribe,
      ]

      channelUnsubs.current = unsubs
    },
    [myId]
  )

  useEffect(() => () => cleanupChannelListeners(), [])

  // ── Get or create a 1-to-1 conversation ───────────────────────────────────

  const openOrCreateConversation = useCallback(
    async (otherUserId: string): Promise<Channel | null> => {
      if (!client || !isReady || !myId) return null
      const channel = client.channel('messaging', { members: [myId, otherUserId] })
      await openChannel(channel)
      setConversations((prev) => {
        if (prev.find((c) => c.channelId === channel.id)) return prev
        return sortByLastMessage([channelToPreview(channel, myId), ...prev])
      })
      return channel
    },
    [client, isReady, myId, openChannel]
  )

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeChannel || !text.trim() || isSending) return
      setIsSending(true)

      const optimisticId = `optimistic-${Date.now()}`
      const optimistic: StreamMessage = {
        id:            optimisticId,
        text,
        user:          { id: myId, name: currentUser?.displayName, image: currentUser?.avatar },
        created_at:    new Date().toISOString(),
        isOptimistic:  true,
        readByOther:   false,
        reactions:     {},
      }
      setMessages((prev) => [...prev, optimistic])

      try {
        const res = await activeChannel.sendMessage({ text })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? toStreamMessage(res.message, myId, activeChannel) : m
          )
        )
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        throw new Error('Message failed to send')
      } finally {
        setIsSending(false)
      }
    },
    [activeChannel, isSending, myId, currentUser]
  )

  // ── Typing ─────────────────────────────────────────────────────────────────

  const onKeystroke = useCallback(() => {
    if (!activeChannel) return
    activeChannel.keystroke()
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => activeChannel.stopTyping(), 2000)
  }, [activeChannel])

  // ── React to message ───────────────────────────────────────────────────────

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      if (!activeChannel) return
      const msg = messages.find((m) => m.id === messageId)
      if (msg?.reactions[emoji]?.myReaction) {
        await activeChannel.deleteReaction(messageId, emoji)
      } else {
        await activeChannel.sendReaction(messageId, { type: emoji })
      }
    },
    [activeChannel, messages]
  )

  // ── Load older messages (pagination) ──────────────────────────────────────

  const loadOlderMessages = useCallback(async () => {
    if (!activeChannel || isLoadingMessages) return
    setIsLoadingMessages(true)
    try {
      const oldest = activeChannel.state.messages[0]
      if (!oldest) return
      await activeChannel.query({ messages: { limit: 30, id_lt: oldest.id } })
      setMessages(
        activeChannel.state.messages.map((m) => toStreamMessage(m, myId, activeChannel))
      )
    } finally {
      setIsLoadingMessages(false)
    }
  }, [activeChannel, isLoadingMessages, myId])

  return {
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
    loadOlderMessages,
  }
}