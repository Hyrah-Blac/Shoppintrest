// ─────────────────────────────────────────────────────────────────────────────
// PATH: src/lib/stream-client.ts
//       (drop alongside the existing src/lib/api.ts and src/lib/utils.ts)
// ─────────────────────────────────────────────────────────────────────────────
//
// No local imports needed — only the stream-chat SDK.
//
// Reads from .env.local:
//   NEXT_PUBLIC_STREAM_API_KEY
// ─────────────────────────────────────────────────────────────────────────────

import { StreamChat } from 'stream-chat'

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!

let client: StreamChat | null = null

/**
 * Returns the singleton browser-side StreamChat instance.
 * Safe to call repeatedly — only one instance is ever created.
 */
export function getStreamClient(): StreamChat {
  if (!client) {
    client = StreamChat.getInstance(apiKey)
  }
  return client
}

/**
 * Connects `params.id` as the active Stream user.
 * No-ops if the same user is already connected (avoids duplicate connections).
 */
export async function connectStreamUser(params: {
  id:       string
  name:     string
  username: string
  image:    string
  token:    string
}): Promise<StreamChat> {
  const sc = getStreamClient()

  if (sc.userID === params.id) return sc   // already connected as this user

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

/** Disconnects the current user and resets the singleton. */
export async function disconnectStreamUser(): Promise<void> {
  if (client?.userID) {
    await client.disconnectUser()
  }
}