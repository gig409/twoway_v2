import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
} from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Heading } from '../../components/ui/heading'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../quotations/+types/quotations._index'
import { Button } from '~/components/ui/button'
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
		{ title: 'Quotations Table' },
		{ name: 'description', content: 'View all quotations' },
	]
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const successMessage = url.searchParams.get('success')

	try {
		const quotations = await prisma.quotation_Request.findMany({
			select: {
				quotation_request_id: true,
				quotation_request_ref: true,
				quotation_request_date: true,
				quotation_request_vessel: true,
				createdAt: true,
				company: {
					select: {
						company_id: true,
						company_name: true,
					},
				},
				employee: {
					select: {
						employee_id: true,
						employee_name: true,
					},
				},
				quotation_request_line_items: {
					select: {
						product: {
							select: {
								product_id: true,
								product_name: true,
							},
						},
						supplier_quotations: {
							select: {
								supplier_quotation_id: true,
								company: {
									select: {
										company_id: true,
										company_name: true,
									},
								},
							},
						},
						quotation_request_line_item_id: true,
						quotation_request_line_item_quantity: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		return { quotations, successMessage }
	} catch (error) {
		console.error(error)
		return { quotations: [], successMessage }
	}
}

export default function QuotationsIndex({ loaderData }: Route.ComponentProps) {
	// Use the loader data to access employees and success message
	const { quotations, successMessage } = loaderData
	const navigate = useNavigate()
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [globalFilter, setGlobalFilter] = useState('')
	const [toastMessage, setToastMessage] = useState<string | null>(null)
	// Add state for expanded rows
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

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

	// Add this new column to your existing columns array

	const columns: ColumnDef<(typeof quotations)[number]>[] = useMemo(
		() => [
			{
				header: 'Ref.',
				accessorKey: 'quotation_request_ref',
				cell: ({ getValue }) => (getValue() as string) || 'N/A',
				enableSorting: true,
			},
			{
				header: 'Date',
				accessorKey: 'quotation_request_date',
				cell: ({ getValue }) => {
					const date = getValue() as Date
					return new Date(date).toLocaleDateString()
				},
				enableSorting: true,
			},
			{
				header: 'Vessel',
				accessorKey: 'quotation_request_vessel',
				cell: ({ getValue }) => (getValue() as string) || 'N/A',
				enableSorting: true,
			},
			{
				accessorKey: 'company.company_name',
				header: 'Company',
				cell: ({ getValue }) => (getValue() as string) || 'N/A',
				enableSorting: true,
			},
			{
				header: 'Employee',
				accessorKey: 'employee.employee_name',
				cell: ({ getValue }) => (getValue() as string) || 'N/A',
				enableSorting: true,
			},
			// Modify the table to show expandable rows
			{
				header: 'Line Items',
				accessorKey: 'quotation_request_line_items',
				cell: ({ row }) => {
					const lineItems = row.original.quotation_request_line_items
					const isExpanded = expandedRows.has(row.original.quotation_request_id)

					return (
						<div>
							<Button
								onClick={() => {
									const newExpanded = new Set(expandedRows)
									if (isExpanded) {
										newExpanded.delete(row.original.quotation_request_id)
									} else {
										newExpanded.add(row.original.quotation_request_id)
									}
									setExpandedRows(newExpanded)
								}}
								outline
								className="text-xs"
							>
								{lineItems.length} items {isExpanded ? '−' : '+'}
							</Button>

							{isExpanded && (
								<div className="mt-2 max-w-md">
									<Table dense>
										<TableHead>
											<TableRow>
												<TableHeader className="text-xs">Product</TableHeader>
												<TableHeader className="text-xs">Qty</TableHeader>
												<TableHeader className="text-xs">Suppliers</TableHeader>
											</TableRow>
										</TableHead>
										<TableBody>
											{lineItems.map((item) => (
												<TableRow key={item.quotation_request_line_item_id}>
													<TableCell className="p-1 text-xs">
														{item.product.product_name}
													</TableCell>
													<TableCell className="p-1 text-xs">
														{item.quotation_request_line_item_quantity}
													</TableCell>
													<TableCell className="p-1 text-xs">
														{item.supplier_quotations.length > 0 ? (
															<div className="space-y-1">
																{item.supplier_quotations.map((sq) => (
																	<div
																		key={sq.supplier_quotation_id}
																		className="rounded bg-gray-100 px-1 text-xs"
																	>
																		{sq.company.company_name}
																	</div>
																))}
															</div>
														) : (
															<Text className="text-xs text-gray-400">
																No suppliers
															</Text>
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</div>
					)
				},
				enableSorting: false,
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
							href={`/dashboard/quotations/${row.original.quotation_request_id}/edit`}
							outline
						>
							Edit
						</Button>
						<Button
							onClick={() =>
								console.log('Delete:', row.original.quotation_request_id)
							}
							outline
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[expandedRows],
	)

	const table = useReactTable({
		data: quotations,
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
					<Heading>Quotation Requests</Heading>
					<Text>
						Manage and view all quotation requests with their details and
						statuses
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
								Showing {table.getRowModel().rows.length} of {quotations.length}{' '}
								quotations
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
