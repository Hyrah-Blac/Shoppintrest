import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:        string
  error?:        string
  hint?:         string
  leftElement?:  React.ReactNode
  rightElement?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftElement, rightElement, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">

        {label && (
          <label
            className="block text-sm font-medium"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftElement && (
            <div
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'hsl(var(--muted))' }}
            >
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full h-11 px-4 text-sm outline-none',
              'transition-[border-color,box-shadow] duration-[var(--duration-hover)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftElement  && 'pl-10',
              rightElement && 'pr-10',
              className
            )}
            style={{
              background:   'hsl(var(--background))',
              color:        'hsl(var(--foreground))',
              border:       `1.5px solid hsl(var(${error ? '--destructive' : '--input'}))`,
              borderRadius: 'var(--radius)',
              fontFamily:   "'DM Sans', sans-serif",
              fontWeight:   300,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'hsl(var(--destructive) / 0.7)'
                : 'hsl(var(--accent) / 0.6)'
              e.currentTarget.style.boxShadow   = error
                ? '0 0 0 3px hsl(var(--destructive) / 0.10)'
                : '0 0 0 3px hsl(var(--accent) / 0.12)'
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'hsl(var(--destructive))'
                : 'hsl(var(--input))'
              e.currentTarget.style.boxShadow = 'none'
              props.onBlur?.(e)
            }}
            {...props}
          />

          {rightElement && (
            <div
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'hsl(var(--muted))' }}
            >
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p
            className="text-xs"
            style={{ color: 'hsl(var(--destructive))' }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 300 }}
          >
            {hint}
          </p>
        )}

      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }