import { parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { redirect } from 'react-router'
import { GeneralErrorBoundary } from '../../components/error-boundary'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../employees/+types/employees.$employeeId.edit'
import EmployeeForm, { schema } from './employeeForm'
import prisma from '~/lib/prisma'

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Edit Employee' },
        { name: 'description', content: 'Edit employee information' },
    ]
}

export async function loader({ params }: Route.LoaderArgs) {
    const { employeeId } = params

    try {
        const employee = await prisma.employee.findUnique({
            where: { employee_id: employeeId },            
        })

        if (!employee) {
            throw new Response('Employee not found', { status: 404 })
        }

        const companies = await prisma.company.findMany({
			select: {
				company_id: true,
				company_name: true,
			},
        })

        if (!companies) {
            throw new Response('Companies not found', { status: 404 })
        }

        return { employee, companies }
    } catch (error) {
        throw new Response('Failed to load employee', { status: 500 })
    }
}

export async function action({ request, params }: Route.ActionArgs) {
	const { employeeId } = params
	const formData = await request.formData()

	const submission = parseWithZod(formData, {
		schema: schema,
	})

	if (submission.status !== 'success') {
		console.log('errors:', submission)
		return submission.reply()
	}

	// const { street_address, country, notes } = submission.value;
	// console.log("Form submission values:", { street_address, country, notes });
	const {
		employee_firstname,
        employee_lastname,
        employee_mobile,
        employee_email,
        employee_position,
        position,
        company_id,
	} = submission.value

	try {
		await prisma.employee.update({
			where: {
				employee_id: employeeId,
			},
			data: {
				// company_id: crypto.randomUUID(),
				employee_name: `${employee_firstname} ${employee_lastname}`.trim(),
                employee_mobile,
                employee_email,
                employee_position,
                position,
                company_id,
			},
		})

		return redirect(
			'/dashboard/employees?success=Employee updated successfully!',
		)
	} catch (error) {
		console.error('Failed to update employee:', error)
		return submission.reply({
			formErrors: ['Failed to update employee. Please try again.'],
		})
	}
}

export default function EmployeeEdit({
    loaderData,
    actionData,
}: Route.ComponentProps) {
    return (
        <div>
            <EmployeeForm
                isEditing={true}
                actionData={actionData}
                loaderData={{ companies: loaderData.companies }}
                employee={loaderData.employee}
            ></EmployeeForm>
        </div>
    )
}

export function ErrorBoundary() {
    return <GeneralErrorBoundary />
}

