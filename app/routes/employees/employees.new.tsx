import { parseWithZod } from '@conform-to/zod/v4'
import { redirect } from 'react-router'
import type { Route } from '../employees/+types/employees.new'


import EmployeeForm, {schema} from './employeeForm'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Heading } from '~/components/ui/heading'
import { Text } from '~/components/ui/text'
import prisma from '~/lib/prisma'


export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Add New Employee' },
		{ name: 'description', content: 'Add a new employee' },
	]
}


export async function loader() {
	try {
		const companies = await prisma.company.findMany({
			select: {
				company_id: true,
				company_name: true,
			},
		})

		return { companies }
	} catch (error) {
		console.error('Database error:', error)
		return { companies: [] }
	}
}

export async function action({ request }: Route.ActionArgs) {
	let formData = await request.formData()
	const submission = parseWithZod(formData, { schema })
	if (submission.status !== 'success') {
		return submission.reply()
	}

	const {
		employee_firstname,
		employee_lastname,
		employee_mobile,
		employee_email,
		employee_position,
		position,
		company_id,
	} = submission.value

	const employee_name = `${employee_firstname} ${employee_lastname}`.trim()
	try {
		await prisma.employee.create({
			data: {
				employee_id: crypto.randomUUID(),
				employee_name,
				employee_mobile,
				employee_email,
				employee_position,
				position,
				company_id,
			},
		})
	} catch (error) {
		console.error('Failed to create employee:', error)
		return submission.reply({
			formErrors: ['Failed to create employee. Please try again.'],
		})
	}

	return redirect('/dashboard/employees?success=Employee created successfully!')
}

export default function EmployeeNew({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	
	return (
		 <div className="isolate bg-white px-6 py-24 sm:py-16 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <Heading>Create a New Company</Heading>
                    <Text>Add your company details below:</Text>
                    <EmployeeForm isEditing={false} actionData={actionData} loaderData={loaderData}></EmployeeForm>
                </div>
            </div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
