
import type { Channel, ChannelMemberResponse } from 'stream-chat'

// ─── Individual user shape returned by Stream ────────────────────────────────

export interface StreamUserPreview {
  id:        string
  name?:     string
  username?: string
  image?:    string
}

// ─── Per-emoji reaction group on a message ────────────────────────────────────

export interface StreamReactionGroup {
  /** Total number of users who reacted with this emoji */
  count:      number
  /** Whether the currently authenticated user has used this emoji */
  myReaction: boolean
}

// ─── The normalised message shape the UI consumes ────────────────────────────

export interface StreamMessage {
  id:            string
  text:          string
  user:          StreamUserPreview
  created_at:    string
  /** True while the message is waiting for server confirmation */
  isOptimistic?: boolean
  /** True once a participant other than the sender has read this message */
  readByOther:   boolean
  /** Keys are emoji strings e.g. "❤️", values are counts + own-reaction flag */
  reactions:     Record<string, StreamReactionGroup>
}

// ─── One row in the conversation sidebar ─────────────────────────────────────

export interface ConversationPreview {
  /** Stream channel id */
  channelId:   string
  /** Raw Channel reference — needed for watch(), sendMessage(), keystroke() etc. */
  channel:     Channel
  otherId:     string
  otherName:   string
  otherAvatar: string
  lastText:    string
  /** ISO string of the last message's created_at */
  lastAt:      string
  unreadCount: number
  isTyping:    boolean
}

// ─── Payload that arrives on typing.start / typing.stop events ───────────────

export interface TypingEventPayload {
  user?: { id: string }
}

// ─── Shape sent to Stream's upsertUser (server SDK) ──────────────────────────

export interface StreamUserUpsert {
  id:       string
  name:     string
  username: string
  image:    string
}

// ─── Shape of the JSON body returned by POST /api/chat/token ─────────────────

export interface ChatTokenResponse {
  token: string
}

// ─── Re-export for convenience ───────────────────────────────────────────────

export type { ChannelMemberResponse }