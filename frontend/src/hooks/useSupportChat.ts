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
  const [previews,      setPreviews]      = useState<ChannelPreview[]>([])
  const [messages,      setMessages]      = useState<FormatMessageResponse[]>([])
  const [isLoading,     setIsLoading]     = useState(false)
  const [isTyping,      setIsTyping]      = useState(false)
  const [readBy,        setReadBy]        = useState<Record<string, string>>({})

  const activeChannelRef = useRef<Channel | null>(null)
  const cleanupFnsRef    = useRef<(() => void)[]>([])

  // ── Build preview from a channel ─────────────────────────────────────────
  const previewFromChannel = useCallback((ch: Channel): ChannelPreview => {
    const last    = ch.lastMessage()
    const members = Object.values(ch.state.members)
    // For admin: find the non-admin customer. For customer: find themselves.
    const customer = members.find(m => m.user?.id && !(m.user as any)?.role?.includes('admin'))
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
    })
  , [])

  // ── Load all support channels for this user ───────────────────────────────
  useEffect(() => {
    if (!client || !isReady) return
    let cancelled = false

    ;(async () => {
      try {
        // Query all messaging channels this user is a member of
        // For admins this returns all support channels; for users, just theirs
        const channels = await client.queryChannels(
          {
            type:    'messaging',
            members: { $in: [client.userID!] },
            // Only support channels (id starts with "support_")
            id: { $autocomplete: 'support_' },
          },
          { last_message_at: -1 },
          { watch: true, state: true, presence: true, limit: 30 }
        )
        if (cancelled) return
        setPreviews(sortPreviews(channels.map(previewFromChannel)))
      } catch (err) {
        console.error('[useSupportChat] queryChannels error:', err)
      }
    })()

    // Global listeners to keep the preview list live
    const updatePreview = (event: Event) => {
      const channelId = event.channel_id ?? (event as any).channel?.id
      if (!channelId) return
      const ch = client.channel('messaging', channelId)
      setPreviews(prev => {
        const idx     = prev.findIndex(p => p.streamChannelId === channelId)
        const updated = previewFromChannel(ch)
        const next    = idx === -1
          ? [...prev, updated]
          : prev.map((p, i) => i === idx ? { ...p, ...updated } : p)
        return sortPreviews(next)
      })
    }

    const subs = [
      client.on('message.new',              updatePreview),
      client.on('notification.message_new', updatePreview),
      client.on('channel.updated',          updatePreview),
    ]

    return () => {
      cancelled = true
      subs.forEach(s => s.unsubscribe())
    }
  }, [client, isReady, previewFromChannel, sortPreviews])

  // ── Open a specific channel and attach listeners ──────────────────────────
  const openChannel = useCallback(async (channelId: string) => {
    if (!client) return

    // Tear down previous listeners
    cleanupFnsRef.current.forEach(fn => fn())
    cleanupFnsRef.current = []

    const prev = activeChannelRef.current
    if (prev && prev.id !== channelId) prev.stopWatching().catch(() => {})

    setIsLoading(true)
    setIsTyping(false)
    setMessages([])
    setReadBy({})

    try {
      const channel = client.channel('messaging', channelId)
      await channel.watch({ state: true, presence: true })

      // Admins may not be members yet — add them so they can receive events
      if (!channel.state.members[client.userID!]) {
        await channel.addMembers([client.userID!])
      }

      activeChannelRef.current = channel

      // Seed messages from local state (already populated by watch())
      setMessages([...channel.state.messages])

      // Seed read state
      const rb: Record<string, string> = {}
      Object.entries(channel.state.read || {}).forEach(([uid, r]) => {
        if (uid !== client.userID && r.last_read)
          rb[uid] = new Date(r.last_read).toISOString()
      })
      setReadBy(rb)

      channel.markRead().catch(() => {})

      // ── message.new — append + dedup ───────────────────────────────────
      const onNew = (e: Event) => {
        const msg = e.message as FormatMessageResponse | undefined
        if (!msg) return
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        channel.markRead().catch(() => {})
      }

      // ── message.updated — replace in list ──────────────────────────────
      const onUpdated = (e: Event) => {
        const msg = e.message as FormatMessageResponse | undefined
        if (!msg) return
        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
      }

      const onTypingStart = (e: Event) => {
        if (e.user?.id !== client.userID) setIsTyping(true)
      }
      const onTypingStop = (e: Event) => {
        if (e.user?.id !== client.userID) setIsTyping(false)
      }
      const onRead = (e: Event) => {
        if (!e.user?.id || e.user.id === client.userID) return
        setReadBy(prev => ({
          ...prev,
          [e.user!.id]: (e.created_at as string) ?? new Date().toISOString(),
        }))
      }

      const subs = [
        channel.on('message.new',     onNew),
        channel.on('message.updated', onUpdated),
        channel.on('typing.start',    onTypingStart),
        channel.on('typing.stop',     onTypingStop),
        channel.on('message.read',    onRead),
      ]
      cleanupFnsRef.current = subs.map(s => () => s.unsubscribe())

    } catch (err) {
      console.error('[useSupportChat] openChannel error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [client])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    cleanupFnsRef.current.forEach(fn => fn())
    activeChannelRef.current?.stopWatching().catch(() => {})
  }, [])

  // ── Send — optimistic append so the message shows instantly ──────────────
  const sendMessage = useCallback(async (text: string) => {
    const ch = activeChannelRef.current
    if (!ch || !text.trim()) return

    // Optimistic message so UI updates immediately
    const tempId  = `temp_${Date.now()}`
    const tempMsg: FormatMessageResponse = {
      id:         tempId,
      text:       text.trim(),
      type:       'regular',
      created_at: new Date().toISOString() as any,
      updated_at: new Date().toISOString() as any,
      user:       { id: ch.getClient().userID! } as any,
      attachments: [],
      mentioned_users: [],
      reaction_counts: {},
      reaction_scores: {},
      reply_count:     0,
      status:          'sending',
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const { message } = await ch.sendMessage({ text: text.trim() })
      // Replace temp with the real message from Stream
      setMessages(prev =>
        prev.map(m => m.id === tempId ? (message as unknown as FormatMessageResponse) : m)
      )
    } catch (err) {
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId))
      throw err
    }
  }, [])

  const loadOlderMessages = useCallback(async () => {
    const ch = activeChannelRef.current
    if (!ch) return
    setMessages(prev => {
      const oldest = prev[0]
      if (!oldest) return prev
      ch.query({ messages: { limit: 25, id_lt: oldest.id } })
        .then(({ messages: older }) => {
          setMessages(cur => {
            const ids = new Set(cur.map(m => m.id))
            const filtered = (older as FormatMessageResponse[]).filter(m => !ids.has(m.id))
            return [...filtered, ...cur]
          })
        })
        .catch(() => {})
      return prev
    })
  }, [])

  const sendTyping = useCallback(() => {
    activeChannelRef.current?.keystroke().catch(() => {})
  }, [])

  return {
    previews,
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