'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 font-medium
   transition-all focus-visible:outline-none disabled:pointer-events-none
   disabled:opacity-40 select-none`,
  {
    variants: {
      variant: {
        /* Pinterest red — primary CTA */
        primary:
          `bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
           rounded-[var(--radius-pill)] shadow-[var(--shadow-red)]
           hover:bg-[hsl(var(--accent-hover))] hover:shadow-[var(--shadow-red-hover)]
           active:scale-[0.97]
           duration-[var(--duration-hover)]`,

        /* Dark filled */
        secondary:
          `bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]
           border border-[hsl(var(--border))]
           rounded-[var(--radius-pill)]
           hover:bg-[hsl(var(--background-secondary))]
           active:scale-[0.98]
           duration-[var(--duration-hover)]`,

        /* Ghost */
        ghost:
          `text-[hsl(var(--foreground))] rounded-[var(--radius-pill)]
           hover:bg-[hsl(var(--background-secondary))]
           active:scale-[0.98]
           duration-[var(--duration-hover)]`,

        /* Outline */
        outline:
          `border-[1.5px] border-[hsl(var(--border))] text-[hsl(var(--foreground))]
           rounded-[var(--radius-pill)]
           hover:border-[hsl(var(--foreground))]
           hover:bg-[hsl(var(--foreground)/0.04)]
           active:scale-[0.98]
           duration-[var(--duration-hover)]`,

        /* Destructive */
        destructive:
          `bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]
           rounded-[var(--radius-pill)]
           hover:opacity-85 active:scale-[0.97]
           duration-[var(--duration-hover)]`,

        /* Text link */
        link:
          `text-[hsl(var(--foreground))] underline-offset-4
           hover:underline p-0 h-auto rounded-none
           duration-[var(--duration-hover)]`,
      },
      size: {
        sm:      'h-8  px-3   text-xs  gap-1.5',
        md:      'h-10 px-4   text-sm',
        lg:      'h-12 px-6   text-sm',
        xl:      'h-14 px-8   text-base',
        icon:    'h-10 w-10   rounded-full',
        'icon-sm':'h-8 w-8    rounded-full',
        'icon-lg':'h-12 w-12  rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size:    'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading
          ? <Loader2 size={15} className="animate-spin" />
          : leftIcon
        }
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button, buttonVariants }