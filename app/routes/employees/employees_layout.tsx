import { PlusIcon } from '@heroicons/react/16/solid'
import { Outlet, Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Navbar, NavbarSection, NavbarItem } from '~/components/ui/navbar'

export function meta() {
	return [
		{ title: 'Employee Management' },
		{ name: 'description', content: 'Manage your employees here.' },
	]
}

export default function EmployeesLayout() {
	return (
		<div className="space-y-6">
			{/* Employees Navigation Bar */}
			<div className="border-b border-zinc-950/10 pb-4 dark:border-white/10">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">
							Employees
						</h1>
						<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
							Manage your employee database
						</p>
					</div>

					{/* Navigation and Actions */}
					<div className="flex items-center gap-4">
						<Navbar className="rounded-lg border border-zinc-950/10 bg-white dark:border-white/10 dark:bg-zinc-900">
							<NavbarSection>
								<NavbarItem href="/employees" current={true}>
									All Employees
								</NavbarItem>
								<NavbarItem href="/employees/new">Add Employee</NavbarItem>
							</NavbarSection>
						</Navbar>

						<Link to="/employees/new">
							<Button type="button" className="gap-2">
								<PlusIcon className="size-4" />
								Add Employee
							</Button>
						</Link>
					</div>
				</div>
			</div>

			{/* Page Content */}
			<div>
				<Outlet />
			</div>
		</div>
	)
}
