import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
	type ColumnFiltersState,
} from '@tanstack/react-table'
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../employees/+types/employees._index'
import { Button } from '~/components/ui/button'
import { Heading } from '~/components/ui/heading'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import { Text } from '~/components/ui/text'
import { Toast } from '~/components/ui/toast'
import prisma from '~/lib/prisma'

export function meta() {
	return [
		{ title: 'Employees Table' },
		{ name: 'description', content: 'View all employees' },
	]
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const successMessage = url.searchParams.get('success')

	try {
		const employees = await prisma.employee.findMany({
			select: {
				employee_id: true,
				employee_name: true,
				employee_mobile: true,
				employee_email: true,
				employee_position: true,
				position: true,
				company_id: true,
				createdAt: true,
				company: {
					select: {
						company_name: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		})
		return { employees, successMessage }
	} catch (error) {
		console.error('Database error:', error)
		throw new Error('Failed to get employees')
	}
}

export default function EmployeesIndex({ loaderData }: Route.ComponentProps) {
	// Use the loader data to access employees and success message
	const { employees, successMessage } = loaderData
	const navigate = useNavigate()
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [globalFilter, setGlobalFilter] = useState('')
	const [toastMessage, setToastMessage] = useState<string | null>(null)

	// Show toast if there's a success message
	useEffect(() => {
		if (successMessage && !toastMessage) {
			setToastMessage(successMessage)
			// Clean up URL immediately since we've captured the message
			const url = new URL(window.location.href)
			url.searchParams.delete('success')
			void navigate(url.pathname + url.search, { replace: true })
		}
	}, [successMessage, toastMessage, navigate])

	// Extract unique employees from the data for the filter dropdown
	const uniquePositions = Array.from(
		new Set(
			employees.map((employee) => employee.employee_position).filter(Boolean),
		),
	).sort() as string[]

	const columns: ColumnDef<(typeof employees)[number]>[] = useMemo(
		() => [
			{
				header: 'Employee Name',
				accessorKey: 'employee_name',
				cell: ({ getValue }) => (getValue() as string) || 'N/A',
				enableSorting: true,
			},
			{
				header: 'Email',
				accessorKey: 'employee_email',
			},
			{
				header: 'Mobile',
				accessorKey: 'employee_mobile',
			},
			{
				accessorKey: 'employee_position',
				header: ({ column }) => (
					<div className="flex flex-col gap-1">
						<Text>Employee Position</Text>
						<select
							value={(column.getFilterValue() ?? '') as string}
							onChange={(e) =>
								column.setFilterValue(e.target.value || undefined)
							}
							className="rounded border border-gray-300 px-1 py-0.5 text-xs"
						>
							<option value="">All Positions</option>
							{uniquePositions.map((position) => (
								<option key={position} value={position}>
									{position}
								</option>
							))}
						</select>
					</div>
				),
				cell: ({ getValue }) => (getValue() as string) || 'N/A',
				enableSorting: true,
			},
			{
				header: 'Position',
				accessorKey: 'position',
				cell: ({ getValue }) => (getValue() as string) || 'N/A',
				enableSorting: true,
			},
			{
				header: 'Company Name',
				accessorKey: 'company.company_name',
				cell: ({ getValue }) => (getValue() as string) || 'N/A',
				enableSorting: true,
			},
			{
				accessorKey: 'createdAt',
				header: 'Created',
				cell: ({ getValue }) => {
					const date = getValue() as Date
					return new Date(date).toLocaleDateString()
				},
				enableSorting: true,
			},
			{
				id: 'actions',
				header: 'Actions',
				cell: ({ row }) => (
					<div className="flex space-x-2">
            <Button
              href={`/dashboard/employees/${row.original.employee_id}/edit`}							
							outline
						>
							Edit
						</Button>
						<Button
							onClick={() => console.log('Delete:', row.original.employee_id)}
							outline
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[uniquePositions],
	)

	const table = useReactTable({
		data: employees,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	})

	return (
		<div className="mx-auto max-w-7xl p-6">
			<div className="rounded-lg bg-white shadow-lg">
				{/* Header */}
				<div className="border-b border-gray-200 px-6 py-4">
					<Heading>Employees</Heading>
					<Text>
						Manage and view all employee profiles with their preferences and
						task counts
					</Text>
				</div>

				{/* Search and Filters */}
				<div className="border-b border-gray-200 px-6 py-4">
					<div className="flex flex-col gap-4 sm:flex-row">
						<div className="flex-1">
							<Input
								type="text"
								placeholder="Search all columns..."
								value={globalFilter ?? ''}
								onChange={(e) => setGlobalFilter(e.target.value)}
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Text className="text-sm text-gray-700">
								Showing {table.getRowModel().rows.length} of {employees.length}{' '}
								employees
							</Text>
						</div>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-hidden">
					<Table striped>
						<TableHead>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHeader
											key={header.id}
											className={
												header.column.getCanSort()
													? 'cursor-pointer select-none'
													: ''
											}
											onClick={header.column.getToggleSortingHandler()}
										>
											<div className="flex items-center space-x-1">
												<Text>
													{header.isPlaceholder
														? null
														: flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
												</Text>
												{header.column.getCanSort() && (
													<span className="text-gray-400">
														{{
															asc: ' ↑',
															desc: ' ↓',
														}[header.column.getIsSorted() as string] ?? ' ↕'}
													</span>
												)}
											</div>
										</TableHeader>
									))}
								</TableRow>
							))}
						</TableHead>
						<TableBody>
							{table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				<div className="border-t border-gray-200 px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-shrink-0 items-center space-x-2">
							<Text className="text-sm whitespace-nowrap text-gray-700">
								Page {table.getState().pagination.pageIndex + 1} of{' '}
								{table.getPageCount()}
							</Text>
							<Select
								value={table.getState().pagination.pageSize}
								onChange={(e) => table.setPageSize(Number(e.target.value))}
							>
								{[5, 10, 20, 50].map((pageSize) => (
									<option key={pageSize} value={pageSize}>
										Show {pageSize}
									</option>
								))}
							</Select>
						</div>
						<div className="flex space-x-2">
							<Button
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								First
							</Button>
							<Button
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							<Button
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
							</Button>
							<Button
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								Last
							</Button>
						</div>
					</div>
				</div>
			</div>
			{/* Success Toast */}
			{toastMessage && (
				<Toast
					message={toastMessage}
					type="success"
					onClose={() => setToastMessage(null)}
				/>
			)}
		</div>
	)
}
