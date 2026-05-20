import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-background px-6">
      <div className="text-center max-w-md">
        <p className="font-display text-8xl font-semibold tracking-tight
                      text-foreground/10 mb-4">
          404
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<ArrowLeft size={16} />}
            className="rounded-2xl"
          >
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}