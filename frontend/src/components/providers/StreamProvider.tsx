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

        if (!cancelled) {
          setClient(sc)
          setIsReady(true)
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