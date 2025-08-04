import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type FilterFn,
	type SortingFn,
	type SortingState,
} from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../companies/+types/companies._index'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
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

type Company = {
	company_id: string
	company_name: string
	company_email: string
	company_phone: string
	company_address: string
	company_country: string
}

const customFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
	const cellValue = row.getValue(columnId)
	if (typeof cellValue === 'string') {
		return cellValue.toLowerCase().includes(filterValue.toLowerCase())
	}
	if (typeof cellValue === 'number') {
		return cellValue.toString().includes(filterValue.toString())
	}
	return false
}

const customSortingFn: SortingFn<any> = (rowA, rowB, columnId) => {
	const valueA = rowA.getValue(columnId)
	const valueB = rowB.getValue(columnId)

	if (typeof valueA === 'string' && typeof valueB === 'string') {
		return valueA.localeCompare(valueB)
	}
	if (typeof valueA === 'number' && typeof valueB === 'number') {
		return valueA - valueB
	}
	return 0
}

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Companies Dashboard' },
		{ name: 'description', content: 'Manage your companies here.' },
	]
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const successMessage = url.searchParams.get('success')

	try {
		const companies = await prisma.company.findMany()

		return { companies, successMessage }
	} catch (error) {
		console.error('Failed to create PrismaClient:', error)
		throw new Error('Failed to get companies')
	}
}

export default function CompaniesIndex({ loaderData }: Route.ComponentProps) {
	const { companies, successMessage } = loaderData
	const navigate = useNavigate()
	const [customFilter, setCustomFilter] = useState('')
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 5,
	})
	const [sorting, setSorting] = useState<SortingState>([])
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

	const columns = useMemo(() => {
		const columnHelper = createColumnHelper<Company>()

		return [
			columnHelper.accessor('company_name', {
				header: () => 'Company Name',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('company_email', {
				header: () => 'Email',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('company_phone', {
				header: () => 'Phone',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('company_address', {
				header: () => 'Address',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('company_country', {
				header: () => 'Country',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('company_id', {
				header: () => 'Actions',
				cell: (info) => (
					<Link
						href={`/dashboard/companies/${info.getValue()}/edit`}
						className="text-blue-500 hover:underline"
					>
						Edit
					</Link>
				),
			}),
		]
	}, [])

	const table = useReactTable({
		data: companies,
		columns,
		globalFilterFn: customFilterFn,
		sortingFns: {
			custom: customSortingFn,
		},
		state: {
			globalFilter: customFilter,
			pagination,
			sorting,
		},
		onGlobalFilterChange: setCustomFilter,
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	return (
		<>
			{/* Search and Filters */}
			<div className="border-b border-gray-200 px-6 py-4">
				<div className="flex flex-col gap-4 sm:flex-row">
					<div className="flex-1">
						<Input
							type="text"
							placeholder="Search all columns..."
							// value={globalFilter ?? ''}
							// onChange={(e) => setGlobalFilter(e.target.value)}
							value={customFilter}
							onChange={(e) => setCustomFilter(e.target.value)}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<Text className="text-sm text-gray-700">
							Showing {table.getRowModel().rows.length} of {companies.length}{' '}
							companies
						</Text>
					</div>
				</div>
			</div>
			<Table striped>
				<TableHead>
					{table.getHeaderGroups().map((headerGroup) =>
						headerGroup.headers.map((header) => (
							<TableHeader
								onClick={header.column.getToggleSortingHandler()}
								key={header.id}
							>
								{flexRender(
									header.column.columnDef.header,
									header.getContext(),
								)}
							</TableHeader>
						)),
					)}
					<TableHeader></TableHeader>
				</TableHead>
				<TableBody>
					{table.getRowModel().rows.map((row) => (
						<TableRow key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
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

			{/* Success Toast */}
			{toastMessage && (
				<Toast
					message={toastMessage}
					type="success"
					onClose={() => setToastMessage(null)}
				/>
			)}
		</>
	)
}
