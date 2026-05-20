import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Join Shoppintrest
          </h1>
          <p className="text-sm text-muted mt-2">
            Discover and collect luxury fashion
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}