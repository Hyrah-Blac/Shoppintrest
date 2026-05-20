import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

const pixelMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const px = pixelMap[size]

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden bg-surface border border-border shrink-0',
        'flex items-center justify-center font-medium text-muted',
        sizeMap[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name || 'Avatar'}
          width={px}
          height={px}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{name ? getInitials(name) : '?'}</span>
      )}
    </div>
  )
}