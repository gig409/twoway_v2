import type { Route } from './+types/employees.new'

import {
	getFormProps,
	getInputProps,
	getSelectProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { Form, useFormAction, useNavigation, redirect } from 'react-router'
import { z } from 'zod/v4'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Button } from '~/components/ui/button'
import {
	Field,
	FieldGroup,
	Fieldset,
	Label,
	Legend,
	ErrorMessage,
} from '~/components/ui/fieldset'
import { Heading } from '~/components/ui/heading'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Text } from '~/components/ui/text'
import prisma from '~/lib/prisma'

// Spinner component
function Spinner({
	className = 'animate-spin -ml-1 mr-3 h-5 w-5 text-white',
}: {
	className?: string
}) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle
				className="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="4"
			></circle>
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	)
}

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Add New Employee' },
		{ name: 'description', content: 'Add a new employee' },
	]
}

const schema = z.object({
	employee_firstname: z
		.string({ error: 'Employee firstname is required' })
		.min(1, 'Employee firstname must be at least 1 character')
		.max(50, 'Employee firstname must be less than 50 characters'),
	employee_lastname: z
		.string({ error: 'Employee lastname is required' })
		.min(1, 'Employee lastname must be at least 1 character')
		.max(50, 'Employee lastname must be less than 50 characters'),
	employee_mobile: z
		.string({ error: 'Employee mobile is required' })
		.regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Please enter a valid mobile number'),
	employee_email: z
		.email('Please enter a valid email address')
		.max(100, 'Must be max 100 chars'),
	employee_position: z
		.string({ error: 'Employee position is required' })
		.min(1, 'Employee position is required'),
	position: z
		.string({ error: 'Position is required' })
		.min(1, 'Position is required'),
	company_id: z
		.string({ error: 'Company ID is required' })
		.min(1, 'Company ID is required'),
})

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
	const navigation = useNavigation()
	const formAction = useFormAction()
	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	const [form, fields] = useForm({
		id: 'employee-form',
		lastResult: actionData,
		constraint: getZodConstraint(schema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldRevalidate: 'onBlur',

		defaultValue: {
			employee_firstname: '',
			employee_lastname: '',
			employee_mobile: '',
			employee_email: '',
			employee_position: '',
		},
	})
	return (
		<div className="isolate bg-white px-6 py-24 sm:py-32 lg:px-8">
			<div className="mx-auto max-w-2xl text-center">
				<Heading>Create a New Employee</Heading>
				<Text>Add your employee details below:</Text>
				<Form method="POST" {...getFormProps(form)}>
					<Fieldset>
						<Legend>Employee Details</Legend>
						<Text>Enter the relevant details of the employee.</Text>
						<FieldGroup>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Field className="text-left">
									<Label htmlFor={fields.employee_firstname.id}>
										Employee FirstName
									</Label>
									<Input
										{...getInputProps(fields.employee_firstname, {
											type: 'text',
										})}
										autoFocus
										invalid={!!fields.employee_firstname.errors}
										aria-label="First name"
									/>
									{!!fields.employee_firstname.errors && (
										<ErrorMessage>
											{fields.employee_firstname.errors}
										</ErrorMessage>
									)}
								</Field>
								<Field className="text-left">
									<Label htmlFor={fields.employee_lastname.id}>
										Employee LastName
									</Label>
									<Input
										{...getInputProps(fields.employee_lastname, {
											type: 'text',
										})}
										invalid={!!fields.employee_lastname.errors}
										aria-label="Last name"
									/>
									{!!fields.employee_lastname.errors && (
										<ErrorMessage>
											{fields.employee_lastname.errors}
										</ErrorMessage>
									)}
								</Field>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Field className="text-left">
									<Label htmlFor={fields.employee_email.id}>
										Employee Email
									</Label>
									<Input
										{...getInputProps(fields.employee_email, { type: 'email' })}
										invalid={!!fields.employee_email.errors}
										aria-label="Email"
									/>
									{!!fields.employee_email.errors && (
										<ErrorMessage>{fields.employee_email.errors}</ErrorMessage>
									)}
								</Field>
								<Field className="text-left">
									<Label htmlFor={fields.employee_mobile.id}>
										Employee Mobile
									</Label>
									<Input
										{...getInputProps(fields.employee_mobile, { type: 'tel' })}
										invalid={!!fields.employee_mobile.errors}
										aria-label="Mobile"
									/>
									{!!fields.employee_mobile.errors && (
										<ErrorMessage>{fields.employee_mobile.errors}</ErrorMessage>
									)}
								</Field>
							</div>
							<Field className="text-left">
								<Label htmlFor={fields.employee_position.id}>
									Employee Position
								</Label>
								<Input
									{...getInputProps(fields.employee_position, { type: 'text' })}
									invalid={!!fields.employee_position.errors}
									aria-label="Employee Position"
								/>
								{!!fields.employee_position.errors && (
									<ErrorMessage>{fields.employee_position.errors}</ErrorMessage>
								)}
							</Field>
						</FieldGroup>
						<FieldGroup>
							<Field className="text-left">
								<Label htmlFor={fields.company_id.id}>Company</Label>
								<Select
									{...getSelectProps(fields.company_id)}
									defaultValue={fields.company_id.initialValue}
									invalid={!!fields.company_id.errors}
								>
									<option value="">Select a company...</option>
									{loaderData.companies.map((company) => (
										<option key={company.company_id} value={company.company_id}>
											{company.company_name}
										</option>
									))}
								</Select>
								{!!fields.company_id.errors && (
									<ErrorMessage>{fields.company_id.errors}</ErrorMessage>
								)}
							</Field>
							<Field>
								<Label htmlFor={fields.position.id}>Position</Label>
								<Input
									{...getInputProps(fields.position, { type: 'text' })}
									invalid={!!fields.position.errors}
									aria-label="Position"
								/>
								{!!fields.position.errors && (
									<ErrorMessage>{fields.position.errors}</ErrorMessage>
								)}
							</Field>
						</FieldGroup>
					</Fieldset>
					{/* Form-level errors */}
					{form.errors && (
						<div className="rounded-md bg-red-50 p-4">
							<div className="text-sm text-red-700">
								{form.errors.join(', ')}
							</div>
						</div>
					)}

					<div className="mt-10 flex gap-4">
						<Button type="submit" disabled={isPending} color="indigo">
							{isPending ? (
								<>
									<Spinner />
									Creating...
								</>
							) : (
								'Submit'
							)}
						</Button>

						<Button type="reset">Reset</Button>
					</div>
				</Form>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
