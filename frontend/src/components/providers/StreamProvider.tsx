'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { StreamChat } from 'stream-chat'
import { useUserStore } from '@/store/useUserStore'
import { connectStreamUser, disconnectStreamUser } from '@/lib/stream-client'
import { apiClient } from '@/lib/api'

// ─── Context ─────────────────────────────────────────────────────────────────

interface StreamContextValue {
  client:  StreamChat | null
  isReady: boolean
}

const StreamContext = createContext<StreamContextValue>({
  client:  null,
  isReady: false,
})

// ─── Provider ────────────────────────────────────────────────────────────────

export function StreamProvider({ children }: { children: ReactNode }) {
  const currentUser = useUserStore((s) => s.user)

  const [client,  setClient]  = useState<StreamChat | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!currentUser?._id) return

    let cancelled = false

    async function init() {
      try {
        const { data: body } = await apiClient.chat.getToken()
        const token: string = body.data.token

        // Bail before connecting if this effect instance was already
        // cancelled (e.g. Strict Mode unmount, or the user changed again
        // before the token request resolved).
        if (cancelled) return

        const sc = await connectStreamUser({
          id:       currentUser!._id,
          name:     currentUser!.displayName,
          username: currentUser!.username,
          image:    currentUser!.avatar ?? '',
          token,
        })

        // Bail AFTER connectUser resolves too — if cleanup ran while we
        // were awaiting connectUser, immediately disconnect again rather
        // than exposing a "ready" client that's about to be torn down.
        // connectStreamUser/disconnectStreamUser share a serialized queue,
        // so this disconnect correctly waits its turn.
        if (cancelled) {
          disconnectStreamUser().catch(() => {})
          return
        }

        if (sc.userID) {
          setClient(sc)
          setIsReady(true)
        } else {
          console.error('[StreamProvider] connectUser resolved but userID is missing')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[StreamProvider] connection error:', err)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      setClient(null)
      setIsReady(false)
      // Fire-and-forget — connectStreamUser/disconnectStreamUser internally
      // serialize against any in-flight connect, so this is always safe to
      // call even mid-connection.
      disconnectStreamUser().catch(() => {})
    }
  }, [currentUser?._id])

  return (
    <StreamContext.Provider value={{ client, isReady }}>
      {children}
    </StreamContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useStreamContext() {
  return useContext(StreamContext)
}