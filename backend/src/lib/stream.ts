import { StreamChat } from 'stream-chat'

let instance: StreamChat | null = null

/**
 * Returns a lazy singleton of the server-side StreamChat client.
 * Safe to import from multiple files — only one connection is ever created.
 *
 * Reads from .env:
 *   STREAM_API_KEY
 *   STREAM_API_SECRET
 */
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
    members:      [userId],
    ticketStatus: 'open',
    category,
    orderId:      orderId ?? null,
    priority:     'normal',
    createdAt:    new Date().toISOString(),
  })
  await channel.create()
  return channelId
}

export async function assignAgentToChannel(channelId: string, agentId: string) {
  const server  = getStreamServer()
  const channel = server.channel('support', channelId)
  await channel.addMembers([agentId])
  await channel.updatePartial({ set: { agentId } })
}

export async function closeSupportChannel(channelId: string) {
  const server  = getStreamServer()
  const channel = server.channel('support', channelId)
  await channel.updatePartial({ set: { ticketStatus: 'closed' } })
}

export async function getSupportToken(userId: string): Promise<string> {
  const server = getStreamServer()
  return server.createToken(userId)
}