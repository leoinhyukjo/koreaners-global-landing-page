import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-bold transition-colors duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/50 aria-invalid:ring-zinc-400 min-w-0 max-w-full [&.break-words]:whitespace-normal [&.break-words]:break-words",
  {
    variants: {
      variant: {
        default: 'bg-white text-black hover:bg-black hover:text-white border-2 border-white',
        destructive:
          'bg-zinc-600 text-white hover:bg-zinc-700 border-2 border-zinc-600',
        outline:
          'border-2 border-white bg-transparent text-white hover:bg-white hover:text-black',
        secondary:
          'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-2 border-zinc-800',
        ghost:
          'bg-transparent text-white hover:bg-zinc-900 border-2 border-transparent',
        link: 'text-white underline-offset-4 hover:underline bg-transparent',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-12 px-8 has-[>svg]:px-4 text-base',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
