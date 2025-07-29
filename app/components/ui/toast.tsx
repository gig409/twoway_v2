import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useEffect, useState } from 'react'

interface ToastProps {
	message: string
	type: 'success' | 'error' | 'info'
	onClose: () => void
	duration?: number
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(false)
			setTimeout(onClose, 300) // Wait for fade out animation
		}, duration)

		return () => clearTimeout(timer)
	}, [duration, onClose])

	const typeStyles = {
		success:
			'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
		error:
			'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
		info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
	}

	const iconsByType = {
		success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
		error: <XMarkIcon className="h-5 w-5 text-red-500" />,
		info: <CheckCircleIcon className="h-5 w-5 text-blue-500" />,
	}

	return (
		<div
			className={clsx(
				'fixed top-4 right-4 z-50 flex w-full max-w-md items-center rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ease-in-out',
				typeStyles[type],
				isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
			)}
		>
			<div className="flex items-center">
				{iconsByType[type]}
				<span className="ml-3 text-sm font-medium">{message}</span>
			</div>
			<button
				onClick={() => {
					setIsVisible(false)
					setTimeout(onClose, 300)
				}}
				className="ml-auto pl-3"
			>
				<XMarkIcon className="h-4 w-4" />
			</button>
		</div>
	)
}

interface ToastContainerProps {
	toasts: Array<{
		id: string
		message: string
		type: 'success' | 'error' | 'info'
	}>
	onRemoveToast: (id: string) => void
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
	return (
		<div className="fixed top-0 right-0 z-50 space-y-2 p-4">
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					message={toast.message}
					type={toast.type}
					onClose={() => onRemoveToast(toast.id)}
				/>
			))}
		</div>
	)
}
