import { useEffect, useState, useCallback } from 'react'
import { StreamChat, Channel, FormatMessageResponse } from 'stream-chat'
import { SupportTicketPreview } from '@/types/support'

export function useSupportChat(client: StreamChat | null, isReady: boolean) {
  const [tickets,        setTickets]        = useState<SupportTicketPreview[]>([])
  const [activeChannel,  setActiveChannel]  = useState<Channel | null>(null)
  const [messages,       setMessages]       = useState<FormatMessageResponse[]>([])
  const [isLoading,      setIsLoading]      = useState(false)

  // Load all support channels for this user
  useEffect(() => {
    if (!client || !isReady) return

    const loadTickets = async () => {
      const channels = await client.queryChannels(
        { type: 'support', members: { $in: [client.userID!] } },
        { last_message_at: -1 },
        { watch: true, state: true }
      )

      const previews: SupportTicketPreview[] = channels.map(ch => ({
        ticketId:        ch.data?.ticketId as string ?? ch.id!,
        streamChannelId: ch.id!,
        category:        ch.data?.category as any ?? 'other',
        status:          ch.data?.ticketStatus as any ?? 'open',
        lastMessage:     ch.lastMessage()?.text,
        lastMessageAt:   ch.lastMessage()?.created_at?.toString(),
      }))

      setTickets(previews)
    }

    loadTickets()
  }, [client, isReady])

  const openTicket = useCallback(async (channelId: string) => {
    if (!client) return
    setIsLoading(true)
    try {
      const channel = client.channel('support', channelId)
      await channel.watch()
      const state = channel.state.messages
      setActiveChannel(channel)
      setMessages([...state])
    } finally {
      setIsLoading(false)
    }
  }, [client])

  const sendMessage = useCallback(async (text: string) => {
    if (!activeChannel || !text.trim()) return
    await activeChannel.sendMessage({ text: text.trim() })
  }, [activeChannel])

  const loadOlderMessages = useCallback(async () => {
    if (!activeChannel) return
    const oldest = messages[0]?.created_at
    if (!oldest) return
    const { messages: older } = await activeChannel.query({
      messages: { limit: 25, id_lt: messages[0].id },
    })
    setMessages(prev => [...(older as FormatMessageResponse[]), ...prev])
  }, [activeChannel, messages])

  // Listen for new messages on active channel
  useEffect(() => {
    if (!activeChannel) return
    const unsub = activeChannel.on('message.new', event => {
      if (event.message)
        setMessages(prev => [...prev, event.message as FormatMessageResponse])
    })
    return () => unsub.unsubscribe()
  }, [activeChannel])

  return {
    tickets,
    activeChannel,
    messages,
    isLoading,
    openTicket,
    sendMessage,
    loadOlderMessages,
  }
}