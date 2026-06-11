import { StreamChat, ChannelData } from 'stream-chat'
import User from '../models/User'

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

  await server.upsertUser({ id: memberId })

  const admins   = await User.find({ role: 'admin' }).select('_id').lean()
  const adminIds = admins.map(a => String(a._id))

  if (adminIds.length > 0) {
    await server.upsertUsers(adminIds.map(id => ({ id })))
  }

  const members = Array.from(new Set([memberId, ...adminIds]))

  const channelId = `support_${memberId}_${Date.now()}`
  const channel   = server.channel('messaging', channelId, {
    members,
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

  // Automated welcome message after channel creation
  await channel.sendMessage({
    text:    'Hi! Thanks for contacting support.\n\nWe\'ve received your request and will get back to you as soon as possible.\n\nYou can continue replying here at any time.',
    user_id: 'system',
    type:    'system',
  } as any)

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

  await server.upsertUser({ id: memberId })

  return server.createToken(memberId)
}