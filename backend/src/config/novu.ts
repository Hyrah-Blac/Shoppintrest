import { Novu } from '@novu/node'

if (!process.env.NOVU_SECRET_KEY) {
  throw new Error('Missing NOVU_SECRET_KEY environment variable')
}

export const novu = new Novu(process.env.NOVU_SECRET_KEY)

// ─── Workflow identifiers ─────────────────────────────────────────────────────
export const NOVU_WORKFLOWS = {
  follow:          'new-follower',
  save:            'pin-saved',
  order_update:    'order-updated',
  message:         'new-message',
  review:          'new-review',
  collection_save: 'collection-saved',
} as const

export type NotificationType = keyof typeof NOVU_WORKFLOWS

// ─── Subscriber sync ──────────────────────────────────────────────────────────
export interface SubscriberIdentity {
  userId:      string
  displayName: string
  email?:      string
  avatarUrl?:  string
}

/**
 * Upsert a Novu subscriber from Clerk user data.
 * Call on sign-in and whenever user profile changes.
 */
export async function syncSubscriber({
  userId,
  displayName,
  email,
  avatarUrl,
}: SubscriberIdentity): Promise<void> {
  const [firstName, ...rest] = displayName.trim().split(' ')
  await novu.subscribers.identify(userId, {
    firstName,
    lastName:  rest.join(' ') || undefined,
    avatar:    avatarUrl,
    email,
  })
}

// ─── Notification trigger payload ─────────────────────────────────────────────
export interface NotificationTriggerPayload {
  recipientId:  string
  type:         NotificationType
  senderName:   string
  senderAvatar: string
  message:      string
  link:         string
  createdAt:    string   // ISO string
  notifId:      string   // MongoDB _id — for deduplication
}

/**
 * Trigger a Novu workflow after the MongoDB record is created.
 * The MongoDB record remains the source of truth; Novu handles delivery.
 */
export async function triggerNotification({
  recipientId,
  type,
  senderName,
  senderAvatar,
  message,
  link,
  createdAt,
  notifId,
}: NotificationTriggerPayload): Promise<void> {
  const workflowId = NOVU_WORKFLOWS[type]
  if (!workflowId) {
    console.warn(`[Novu] Unknown notification type: ${type}`)
    return
  }

  await novu.trigger(workflowId, {
    to: { subscriberId: recipientId },
    payload: {
      senderName,
      senderAvatar,
      message,
      link,
      createdAt,
      notifId,   // used on the frontend to deduplicate against MongoDB feed
    },
  })
}