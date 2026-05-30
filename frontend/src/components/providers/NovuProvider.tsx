'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useNotificationStore } from '@/store/useNotificationStore'

export function NovuProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser()
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)

  useEffect(() => {
    if (!isSignedIn) return

    // Initial fetch
    fetchNotifications()

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000)

    // Fetch immediately when user returns to the tab
    const onFocus = () => fetchNotifications()
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [isSignedIn, fetchNotifications])

  return <>{children}</>
}