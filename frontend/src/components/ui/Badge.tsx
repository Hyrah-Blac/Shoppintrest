import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  `inline-flex items-center justify-center font-semibold
   rounded-[9999px] transition-colors whitespace-nowrap`,
  {
    variants: {
      variant: {
        /* Pinterest red — primary */
        default:
          `bg-[hsl(var(--accent))] text-white
           shadow-[var(--shadow-red)]`,

        /* Subtle surface */
        secondary:
          `bg-[hsl(var(--background-secondary))] text-[hsl(var(--muted))]
           border border-[hsl(var(--border))]`,

        /* Outline only */
        outline:
          `border border-[hsl(var(--border))] text-[hsl(var(--foreground))]`,

        /* Muted fill */
        muted:
          `bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))]`,

        /* Semantic — success */
        success:
          `bg-[hsl(142_60%_94%)] text-[hsl(142_60%_30%)]
           dark:bg-[hsl(142_40%_12%)] dark:text-[hsl(142_60%_55%)]`,

        /* Semantic — warning */
        warning:
          `bg-[hsl(38_92%_93%)] text-[hsl(38_80%_35%)]
           dark:bg-[hsl(38_50%_12%)] dark:text-[hsl(38_92%_60%)]`,

        /* Semantic — destructive */
        destructive:
          `bg-[hsl(0_72%_94%)] text-[hsl(0_72%_40%)]
           dark:bg-[hsl(0_40%_12%)] dark:text-[hsl(0_72%_65%)]`,
      },
      size: {
        sm: 'px-2   py-0.5 text-[10px] leading-none',
        md: 'px-2.5 py-1   text-[11px]',
        lg: 'px-3   py-1   text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'md',
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}