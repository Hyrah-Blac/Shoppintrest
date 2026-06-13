import { StreamChat } from 'stream-chat'

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!

let client: StreamChat | null = null

export function getStreamClient(): StreamChat {
  if (!client) {
    client = StreamChat.getInstance(apiKey)
  }
  return client
}

export async function connectStreamUser(params: {
  id:       string
  name:     string
  username: string
  image:    string
  token:    string
}): Promise<StreamChat> {
  const sc = getStreamClient()

  // Already connected as the correct user — nothing to do.
  if (sc.userID === params.id) return sc

  // Connected as a DIFFERENT user (e.g. singleton was reused across accounts).
  // Disconnect first, then reconnect as the correct user.
  if (sc.userID && sc.userID !== params.id) {
    await sc.disconnectUser()
  }

  await sc.connectUser(
    {
      id:       params.id,
      name:     params.name,
      username: params.username,
      image:    params.image,
    },
    params.token
  )

  return sc
}

export async function disconnectStreamUser(): Promise<void> {
  if (client?.userID) {
    await client.disconnectUser()
  }
}