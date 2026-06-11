import { useEffect, useState, useCallback, useRef } from 'react'
import { StreamChat, Channel, FormatMessageResponse, Event } from 'stream-chat'
import { SupportTicketPreview } from '@/types/support'

export interface SupportChannelPreview extends SupportTicketPreview {
  unreadCount: number
  lastMessageUserId?: string
}

export function useSupportChat(client: StreamChat | null, isReady: boolean) {
  const [tickets, setTickets] = useState<SupportChannelPreview[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<FormatMessageResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [readBy, setReadBy] = useState<Record<string, string>>({}) // userId -> last_read ISO

  const activeChannelRef = useRef<Channel | null>(null)
  const cleanupFnsRef = useRef<(() => void)[]>([])

  const upsertPreviewFromChannel = useCallback((ch: Channel): SupportChannelPreview => {
    const last = ch.lastMessage()
    return {
      ticketId: (ch.data?.ticketId as string) ?? ch.id!,
      streamChannelId: ch.id!,
      category: (ch.data?.category as any) ?? 'other',
      status: (ch.data?.ticketStatus as any) ?? 'open',
      lastMessage: last?.text,
      lastMessageAt: last?.created_at?.toString(),
      lastMessageUserId: last?.user?.id,
      unreadCount: ch.countUnread(),
    }
  }, [])

  const sortPreviews = useCallback((list: SupportChannelPreview[]) => {
    return [...list].sort((a, b) => {
      if (a.unreadCount > 0 !== b.unreadCount > 0) {
        return a.unreadCount > 0 ? -1 : 1
      }
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return bt - at
    })
  }, [])

  // ── Load all support channels ────────────────────────────────────────────
  useEffect(() => {
    if (!client || !isReady) return
    let cancelled = false

    const loadTickets = async () => {
      const channels = await client.queryChannels(
        { type: 'messaging', members: { $in: [client.userID!] } },
        { last_message_at: -1 },
        { watch: true, state: true, presence: true }
      )
      if (cancelled) return
      const previews = channels.map(upsertPreviewFromChannel)
      setTickets(sortPreviews(previews))
    }

    loadTickets()

    // ── Global listeners for inbox-level updates ──────────────────────────
    const updatePreview = (event: Event) => {
      const channelId = event.channel_id ?? event.channel?.id
      if (!channelId) return
      const ch = client.channel('messaging', channelId)

      setTickets(prev => {
        const idx = prev.findIndex(t => t.streamChannelId === channelId)
        const updated = upsertPreviewFromChannel(ch)
        let next: SupportChannelPreview[]
        if (idx === -1) {
          next = [...prev, updated]
        } else {
          next = [...prev]
          next[idx] = { ...next[idx], ...updated }
        }
        return sortPreviews(next)
      })
    }

    const onNewMessage = (event: Event) => updatePreview(event)
    const onNotificationNewMessage = (event: Event) => updatePreview(event)
    const onChannelUpdated = (event: Event) => updatePreview(event)

    const subs = [
      client.on('message.new', onNewMessage),
      client.on('notification.message_new', onNotificationNewMessage),
      client.on('channel.updated', onChannelUpdated),
    ]

    return () => {
      cancelled = true
      subs.forEach(s => s.unsubscribe())
    }
  }, [client, isReady, upsertPreviewFromChannel, sortPreviews])

  // ── Open a specific ticket's channel ─────────────────────────────────────
  const openTicket = useCallback(async (channelId: string) => {
    if (!client) return

    // Clean up previous channel's listeners + stop watching
    cleanupFnsRef.current.forEach(fn => fn())
    cleanupFnsRef.current = []

    const prevChannel = activeChannelRef.current
    if (prevChannel && prevChannel.id !== channelId) {
      prevChannel.stopWatching().catch(() => {})
    }

    setIsLoading(true)
    setIsTyping(false)
    try {
      const channel = client.channel('messaging', channelId)
      await channel.watch()

      activeChannelRef.current = channel
      setActiveChannel(channel)
      setMessages([...channel.state.messages])

      // Initialize read state from channel
      const initialReadBy: Record<string, string> = {}
      Object.entries(channel.state.read || {}).forEach(([userId, r]) => {
        if (userId !== client.userID && r.last_read) {
          initialReadBy[userId] = new Date(r.last_read).toISOString()
        }
      })
      setReadBy(initialReadBy)

      // Mark this channel as read by current user
      channel.markRead().catch(() => {})

      // ── message.new (dedup by id) ──────────────────────────────────────
      const onMessageNew = (event: Event) => {
        const msg = event.message as FormatMessageResponse | undefined
        if (!msg) return
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Mark as read immediately if user is viewing this channel
        channel.markRead().catch(() => {})
      }

      // ── typing events ────────────────────────────────────────────────────
      const onTypingStart = (event: Event) => {
        if (event.user?.id !== client.userID) setIsTyping(true)
      }
      const onTypingStop = (event: Event) => {
        if (event.user?.id !== client.userID) setIsTyping(false)
      }

      // ── read state events ────────────────────────────────────────────────
      const onMessageRead = (event: Event) => {
        if (!event.user?.id || event.user.id === client.userID) return
        setReadBy(prev => ({
          ...prev,
          [event.user!.id]: (event.created_at as string) ?? new Date().toISOString(),
        }))
      }

      const subs = [
        channel.on('message.new', onMessageNew),
        channel.on('typing.start', onTypingStart),
        channel.on('typing.stop', onTypingStop),
        channel.on('message.read', onMessageRead),
      ]
      cleanupFnsRef.current = subs.map(s => () => s.unsubscribe())
    } finally {
      setIsLoading(false)
    }
  }, [client])

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanupFnsRef.current.forEach(fn => fn())
      cleanupFnsRef.current = []
      activeChannelRef.current?.stopWatching().catch(() => {})
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const channel = activeChannelRef.current
    if (!channel || !text.trim()) return
    await channel.sendMessage({ text: text.trim() })
  }, [])

  const loadOlderMessages = useCallback(async () => {
    const channel = activeChannelRef.current
    if (!channel) return
    const oldest = messages[0]
    if (!oldest) return
    const { messages: older } = await channel.query({
      messages: { limit: 25, id_lt: oldest.id },
    })
    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id))
      const filtered = (older as FormatMessageResponse[]).filter(m => !existingIds.has(m.id))
      return [...filtered, ...prev]
    })
  }, [messages])

  // ── Typing keystroke trigger (call from composer onChange) ────────────────
  const sendTyping = useCallback(() => {
    activeChannelRef.current?.keystroke().catch(() => {})
  }, [])

  return {
    tickets,
    activeChannel,
    messages,
    isLoading,
    isTyping,
    readBy,
    openTicket,
    sendMessage,
    loadOlderMessages,
    sendTyping,
  }
}