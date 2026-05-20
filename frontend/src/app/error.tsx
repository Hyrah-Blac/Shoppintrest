'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-background px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center
                        justify-center mx-auto mb-6">
          <AlertCircle size={28} className="text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-semibold mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-muted mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>
        <Button
          variant="primary"
          size="lg"
          className="rounded-2xl"
          onClick={reset}
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}