import { StreamChat, ChannelData } from 'stream-chat'

let instance: StreamChat | null = null

export function getStreamServer(): StreamChat {
  if (!instance) {
    instance = StreamChat.getInstance(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    )
  }
  return instance
}

export async function createSupportChannel(
  userId: string,
  category: string,
  orderId?: string
) {
  const server   = getStreamServer()
  const memberId = String(userId)

  // Ensure the user exists in Stream before adding as a channel member
  await server.upsertUser({ id: memberId })

  const channelId = `support_${memberId}_${Date.now()}`
  // 'support' is not a built-in Stream channel type — use 'messaging'
  // (or create a custom 'support' channel type via the dashboard/API first)
  const channel   = server.channel('messaging', channelId, {
    members:       [memberId],
    created_by_id: memberId,
    category,
    priority: 'normal',
    data: {
      ticketStatus: 'open',
      orderId:      orderId ?? null,
      createdAt:    new Date().toISOString(),
    },
  } as unknown as ChannelData)
  await channel.create()
  return channelId
}

export async function assignAgentToChannel(channelId: string, agentId: string) {
  const server  = getStreamServer()
  const channel = server.channel('messaging', channelId)
  await channel.addMembers([agentId])
  await channel.updatePartial({ set: { agentId } as any })
}

export async function closeSupportChannel(channelId: string) {
  const server  = getStreamServer()
  const channel = server.channel('messaging', channelId)
  await channel.updatePartial({ set: { ticketStatus: 'closed' } as any })
}

export async function getSupportToken(userId: string): Promise<string> {
  const server   = getStreamServer()
  const memberId = String(userId)

  // Ensure the user exists in Stream before issuing a token for them
  await server.upsertUser({ id: memberId })

  return server.createToken(memberId)
}