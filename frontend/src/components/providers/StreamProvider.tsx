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

        if (cancelled) return

        const sc = await connectStreamUser({
          id:       currentUser!._id,
          name:     currentUser!.displayName,
          username: currentUser!.username,
          image:    currentUser!.avatar ?? '',
          token,
        })

        if (cancelled) return

        // FIX — confirm connectUser fully resolved before telling the app
        // the client is ready. sc.userID is only set after connectUser
        // completes, so this is the most reliable signal available.
        if (sc.userID) {
          setClient(sc)
          setIsReady(true)
        } else {
          console.error('[StreamProvider] connectUser resolved but userID is missing')
        }
      } catch (err) {
        console.error('[StreamProvider] connection error:', err)
      }
    }

    init()

    return () => {
      cancelled = true
      disconnectStreamUser()
      setClient(null)
      setIsReady(false)
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