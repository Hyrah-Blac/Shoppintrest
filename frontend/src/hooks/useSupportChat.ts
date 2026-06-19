import { useEffect, useState, useCallback, useRef } from 'react'
import { StreamChat, Channel, LocalMessage, Event } from 'stream-chat'

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
  const [previews,  setPreviews]  = useState<ChannelPreview[]>([])
  const [messages,  setMessages]  = useState<LocalMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping,  setIsTyping]  = useState(false)
  const [readBy,    setReadBy]    = useState<Record<string, string>>({})

  const activeChannelRef = useRef<Channel | null>(null)
  const cleanupFnsRef    = useRef<(() => void)[]>([])
  const activeCidRef     = useRef<string | null>(null)

  const previewFromChannel = useCallback((ch: Channel): ChannelPreview => {
    const last     = ch.lastMessage()
    const members  = Object.values(ch.state.members)
    const customer = members.find(m => m.user?.id && !(m.user as any)?.role?.includes('admin'))
                  ?? members[0]
    return {
      streamChannelId: ch.id!,
      userId:          customer?.user?.id,
      displayName:     (customer?.user?.name as string) ?? (customer?.user as any)?.username,
      email:           (customer?.user as any)?.email,
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
    if (!client || !isReady || !client.userID) return
    let cancelled = false

    ;(async () => {
      try {
        const channels = await client.queryChannels(
          {
            type:    'messaging',
            members: { $in: [client.userID!] },
            support: { $eq: true },
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
    if (!client || !client.userID) return

    const cid = `messaging:${channelId}`

    // Tear down any previously attached listeners — always, even if the
    // "same" channelId is being re-opened, since a stale client/channel
    // instance may have left dead listeners registered.
    cleanupFnsRef.current.forEach(fn => fn())
    cleanupFnsRef.current = []

    const prev = activeChannelRef.current
    if (prev && prev.cid !== cid) prev.stopWatching().catch(() => {})

    const channel = client.channel('messaging', channelId)
    activeChannelRef.current = channel
    activeCidRef.current     = cid

    setIsLoading(true)
    setIsTyping(false)
    setMessages([])
    setReadBy({})

    try {
      // watch() starts the live event subscription on this channel.
      await channel.watch({ state: true, presence: true })

      // Bail if a newer openChannel call has since taken over.
      if (activeCidRef.current !== cid) return

      // ── Attach listeners IMMEDIATELY after watch() resolves ──────────────
      // Closes the race where a message.new event could arrive in the gap
      // between watch() resolving and listeners being attached (which would
      // previously happen only after a separate channel.query() call).
      const onNew = (e: Event) => {
        const msg = e.message as LocalMessage | undefined
        if (!msg) return
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        channel.markRead().catch(() => {})
      }

      const onUpdated = (e: Event) => {
        const msg = e.message as LocalMessage | undefined
        if (!msg) return
        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
      }

      const onDeleted = (e: Event) => {
        const msg = e.message as LocalMessage | undefined
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
        channel.on('message.deleted', onDeleted),
        channel.on('typing.start',    onTypingStart),
        channel.on('typing.stop',     onTypingStop),
        channel.on('message.read',    onRead),
      ]
      cleanupFnsRef.current = subs.map(s => () => s.unsubscribe())

      // ── Now fetch the initial page of messages ───────────────────────────
      // Any message.new events that arrive while this is in flight are
      // already caught by onNew above, and de-duped against freshMessages
      // by the `prev.some(m => m.id === msg.id)` check.
      const { messages: freshMessages } = await channel.query({
        messages: { limit: 50 },
      })

      if (activeCidRef.current !== cid) return

      setMessages(prevMsgs => {
        const incomingIds = new Set((freshMessages as LocalMessage[]).map(m => m.id))
        // Keep any messages that arrived live (via onNew) but aren't in the
        // fetched page yet (e.g. sent in the gap before query resolved).
        const liveExtras = prevMsgs.filter(m => !incomingIds.has(m.id))
        return [...(freshMessages as LocalMessage[]), ...liveExtras]
      })

      const rb: Record<string, string> = {}
      Object.entries(channel.state.read || {}).forEach(([uid, r]) => {
        if (uid !== client.userID && r.last_read)
          rb[uid] = new Date(r.last_read).toISOString()
      })
      setReadBy(rb)

      channel.markRead().catch(() => {})

    } catch (err) {
      console.error('[useSupportChat] openChannel error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [client])

  useEffect(() => () => {
    cleanupFnsRef.current.forEach(fn => fn())
    activeChannelRef.current?.stopWatching().catch(() => {})
    activeCidRef.current = null
  }, [])

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const ch = activeChannelRef.current
    if (!ch || !text.trim()) return

    const tempId  = `temp_${Date.now()}`
    const tempMsg: LocalMessage = {
      id:              tempId,
      text:            text.trim(),
      type:            'regular',
      created_at:      new Date(),
      updated_at:      new Date(),
      user:            { id: ch.getClient().userID! } as any,
      attachments:     [],
      mentioned_users: [],
      reaction_counts: {},
      reaction_scores: {},
      reply_count:     0,
      status:          'sending',
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const { message } = await ch.sendMessage({ text: text.trim() })
      setMessages(prev =>
        prev.map(m => m.id === tempId ? message as unknown as LocalMessage : m)
      )
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      throw err
    }
  }, [])

  // ── Load older (pagination) ───────────────────────────────────────────────
  const loadOlderMessages = useCallback(async () => {
    const ch = activeChannelRef.current
    if (!ch) return

    let oldestId: string | undefined
    setMessages(prev => {
      oldestId = prev[0]?.id
      return prev
    })
    if (!oldestId) return

    try {
      const { messages: older } = await ch.query({
        messages: { limit: 25, id_lt: oldestId },
      })
      setMessages(cur => {
        const ids      = new Set(cur.map(m => m.id))
        const filtered = (older as unknown as LocalMessage[]).filter(m => !ids.has(m.id))
        return [...filtered, ...cur]
      })
    } catch {
      // no-op
    }
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