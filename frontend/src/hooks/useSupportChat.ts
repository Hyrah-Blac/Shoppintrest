import { useEffect, useState, useCallback, useRef } from 'react'
import { StreamChat, Channel, FormatMessageResponse, Event } from 'stream-chat'

export interface ChannelPreview {
  streamChannelId: string
  userId?:         string
  displayName?:    string
  email?:          string
  avatar?:         string
  lastMessage?:    string
  lastMessageAt?:  string
  unreadCount:     number
}

export function useSupportChat(client: StreamChat | null, isReady: boolean) {
  // ── Inbox-level previews (used by the admin list) ─────────────────────────
  const [previews,       setPreviews]       = useState<ChannelPreview[]>([])
  // ── Active conversation ───────────────────────────────────────────────────
  const [activeChannel,  setActiveChannel]  = useState<Channel | null>(null)
  const [messages,       setMessages]       = useState<FormatMessageResponse[]>([])
  const [isLoading,      setIsLoading]      = useState(false)
  const [isTyping,       setIsTyping]       = useState(false)
  const [readBy,         setReadBy]         = useState<Record<string, string>>({})

  const activeChannelRef = useRef<Channel | null>(null)
  const cleanupFnsRef    = useRef<(() => void)[]>([])

  // ── Build a preview object from a channel ────────────────────────────────
  const previewFromChannel = useCallback((ch: Channel): ChannelPreview => {
    const last    = ch.lastMessage()
    // The channel id is `support_{userId}`, so we can strip the prefix
    const members = Object.values(ch.state.members)
    // find the non-admin member (the customer)
    const customer = members.find(m => m.user?.id && !m.user?.role?.includes('admin'))
                  ?? members[0]

    return {
      streamChannelId: ch.id!,
      userId:          customer?.user?.id,
      displayName:     (customer?.user?.name as string) ?? (customer?.user?.username as string),
      email:           (customer?.user?.email as string),
      avatar:          (customer?.user?.image as string),
      lastMessage:     last?.text,
      lastMessageAt:   last?.created_at?.toString(),
      unreadCount:     ch.countUnread(),
    }
  }, [])

  const sortPreviews = useCallback((list: ChannelPreview[]) =>
    [...list].sort((a, b) => {
      if ((a.unreadCount > 0) !== (b.unreadCount > 0))
        return a.unreadCount > 0 ? -1 : 1
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return bt - at
    }),
  [])

  // ── Load all channels the user is a member of ────────────────────────────
  useEffect(() => {
    if (!client || !isReady) return
    let cancelled = false

    const load = async () => {
      const channels = await client.queryChannels(
        { type: 'messaging', members: { $in: [client.userID!] } },
        { last_message_at: -1 },
        { watch: true, state: true, presence: true }
      )
      if (cancelled) return
      setPreviews(sortPreviews(channels.map(previewFromChannel)))
    }

    load()

    const update = (event: Event) => {
      const channelId = event.channel_id ?? event.channel?.id
      if (!channelId) return
      const ch = client.channel('messaging', channelId)
      setPreviews(prev => {
        const idx     = prev.findIndex(p => p.streamChannelId === channelId)
        const updated = previewFromChannel(ch)
        const next    = idx === -1 ? [...prev, updated] : prev.map((p, i) => i === idx ? { ...p, ...updated } : p)
        return sortPreviews(next)
      })
    }

    const subs = [
      client.on('message.new',               update),
      client.on('notification.message_new',  update),
      client.on('channel.updated',           update),
    ]

    return () => {
      cancelled = true
      subs.forEach(s => s.unsubscribe())
    }
  }, [client, isReady, previewFromChannel, sortPreviews])

  // ── Open a specific channel ───────────────────────────────────────────────
  const openChannel = useCallback(async (channelId: string) => {
    if (!client) return

    cleanupFnsRef.current.forEach(fn => fn())
    cleanupFnsRef.current = []

    const prev = activeChannelRef.current
    if (prev && prev.id !== channelId) prev.stopWatching().catch(() => {})

    setIsLoading(true)
    setIsTyping(false)
    setMessages([])

    try {
      const channel = client.channel('messaging', channelId)
      await channel.watch()

      // Ensure the current user is a member (important for admins)
      if (!channel.state.members[client.userID!]) {
        await channel.addMembers([client.userID!])
      }

      activeChannelRef.current = channel
      setActiveChannel(channel)
      setMessages([...channel.state.messages])

      // Read state
      const rb: Record<string, string> = {}
      Object.entries(channel.state.read || {}).forEach(([uid, r]) => {
        if (uid !== client.userID && r.last_read)
          rb[uid] = new Date(r.last_read).toISOString()
      })
      setReadBy(rb)

      channel.markRead().catch(() => {})

      const onNew = (e: Event) => {
        const msg = e.message as FormatMessageResponse | undefined
        if (!msg) return
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        channel.markRead().catch(() => {})
      }
      const onTypingStart = (e: Event) => { if (e.user?.id !== client.userID) setIsTyping(true) }
      const onTypingStop  = (e: Event) => { if (e.user?.id !== client.userID) setIsTyping(false) }
      const onRead        = (e: Event) => {
        if (!e.user?.id || e.user.id === client.userID) return
        setReadBy(prev => ({ ...prev, [e.user!.id]: (e.created_at as string) ?? new Date().toISOString() }))
      }

      const subs = [
        channel.on('message.new',  onNew),
        channel.on('typing.start', onTypingStart),
        channel.on('typing.stop',  onTypingStop),
        channel.on('message.read', onRead),
      ]
      cleanupFnsRef.current = subs.map(s => () => s.unsubscribe())
    } finally {
      setIsLoading(false)
    }
  }, [client])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    cleanupFnsRef.current.forEach(fn => fn())
    activeChannelRef.current?.stopWatching().catch(() => {})
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const ch = activeChannelRef.current
    if (!ch || !text.trim()) return
    await ch.sendMessage({ text: text.trim() })
  }, [])

  const loadOlderMessages = useCallback(async () => {
    const ch = activeChannelRef.current
    if (!ch || !messages[0]) return
    const { messages: older } = await ch.query({
      messages: { limit: 25, id_lt: messages[0].id },
    })
    setMessages(prev => {
      const ids = new Set(prev.map(m => m.id))
      return [...(older as FormatMessageResponse[]).filter(m => !ids.has(m.id)), ...prev]
    })
  }, [messages])

  const sendTyping = useCallback(() => {
    activeChannelRef.current?.keystroke().catch(() => {})
  }, [])

  return {
    previews,
    activeChannel,
    messages,
    isLoading,
    isTyping,
    readBy,
    openChannel,
    sendMessage,
    loadOlderMessages,
    sendTyping,
  }
}