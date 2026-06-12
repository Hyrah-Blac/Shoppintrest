import { StreamChat } from 'stream-chat'
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

export async function getOrCreateSupportChannel(userId: string): Promise<string> {
  const server   = getStreamServer()
  const memberId = String(userId)

  await server.upsertUser({ id: memberId })

  const admins   = await User.find({ role: 'admin' }).select('_id').lean()
  const adminIds = admins.map(a => String(a._id))

  if (adminIds.length > 0) {
    await server.upsertUsers(adminIds.map(id => ({ id })))
  }

  const members   = Array.from(new Set([memberId, ...adminIds]))
  const channelId = `support_${memberId}`

  const channel = server.channel('messaging', channelId, {
    members,
    created_by_id: memberId,
    // This custom field lets useSupportChat query only support channels
    // without relying on fragile $autocomplete ID prefix matching.
    support: true,
  } as any)

  await channel.create()

  return channelId
}

export async function getSupportToken(userId: string): Promise<string> {
  const server   = getStreamServer()
  const memberId = String(userId)

  await server.upsertUser({ id: memberId })

  return server.createToken(memberId)
}