import { StreamChat } from 'stream-chat'

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!

let client: StreamChat | null = null

// All connect/disconnect calls are funneled through this single promise
// chain. Whichever call arrives second always waits for the first to fully
// settle before it starts — this is what prevents React Strict Mode's
// mount→unmount→remount cycle (or any other overlapping calls) from
// interleaving a connectUser() and disconnectUser() and corrupting the
// client's token state.
let queue: Promise<unknown> = Promise.resolve()

export function getStreamClient(): StreamChat {
  if (!client) {
    client = StreamChat.getInstance(apiKey)
  }
  return client
}

export function connectStreamUser(params: {
  id:       string
  name:     string
  username: string
  image:    string
  token:    string
}): Promise<StreamChat> {
  const run = queue
    .catch(() => {}) // a prior failure shouldn't block this call from running
    .then(async () => {
      const sc = getStreamClient()

      // Already connected as the correct user — nothing to do.
      if (sc.userID === params.id) return sc

      // Connected as a DIFFERENT user (e.g. singleton was reused across
      // accounts) — disconnect first, then reconnect as the correct user.
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
    })

  queue = run
  return run
}

export function disconnectStreamUser(): Promise<void> {
  const run = queue
    .catch(() => {})
    .then(async () => {
      if (client?.userID) {
        await client.disconnectUser()
      }
    })

  queue = run
  return run
}