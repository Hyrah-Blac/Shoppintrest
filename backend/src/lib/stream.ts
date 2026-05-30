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