import * as React from 'react'
import { cn } from '~/utils/misc.tsx'
import { Button, type ButtonProps } from './button_a.tsx'
import { cva, type VariantProps } from 'class-variance-authority'


const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors outline-none focus-visible:ring-4 focus-within:ring-4 ring-ring ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/80',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/80',
				outline:
					'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-4 py-2',
				wide: 'px-24 py-5',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				pill: 'px-12 py-3 leading-3',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)


export const StatusButton = React.forwardRef<
	HTMLButtonElement,
	ButtonProps & { status: 'pending' | 'success' | 'error' | 'idle' }
>(({ status = 'idle', className, children, ...props }, ref) => {
	const companion = {
		pending: <span className="inline-block animate-spin">🌀</span>,
		success: <span>✅</span>,
		error: <span>❌</span>,
		idle: null,
	}[status]
	return (
		<Button
			ref={ref}
			className={cn('flex justify-center gap-4', className)}
			{...props}
		>
			<div>{children}</div>
			{companion}
		</Button>
	)
})
StatusButton.displayName = 'Button'
