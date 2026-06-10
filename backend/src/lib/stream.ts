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
  const server    = getStreamServer()
  const channelId = `support_${userId}_${Date.now()}`
  const channel   = server.channel('support', channelId, {
    members:  [userId],
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
  const channel = server.channel('support', channelId)
  await channel.addMembers([agentId])
  await channel.updatePartial({ set: { agentId } as any })
}

export async function closeSupportChannel(channelId: string) {
  const server  = getStreamServer()
  const channel = server.channel('support', channelId)
  await channel.updatePartial({ set: { ticketStatus: 'closed' } as any })
}

export async function getSupportToken(userId: string): Promise<string> {
  const server = getStreamServer()
  return server.createToken(userId)
}