import {
	getInputProps,
	useForm,
	getFormProps,
	type SubmissionResult,
	getSelectProps,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { Form, useFormAction, useNavigation } from 'react-router'
import { z } from 'zod/v4' // Or, zod/v4 or zod/v4-mini
import { Spinner } from '~/components/icons/icons'
import { Button } from '~/components/ui/button'
import {
	ErrorMessage,
	Field,
	FieldGroup,
	Fieldset,
	Label,
} from '~/components/ui/fieldset'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'


export const schema = z.object({
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

type Employee = {
	employee_id: string
	employee_name: string | null,
	employee_mobile: string
	employee_email: string
	employee_position: string
	position: string
	company_id: string
}

interface EmployeeFormProps {
	isEditing: boolean
	actionData?: SubmissionResult<string[]>
	employee?: Employee
	loaderData?: { companies: { company_id: string; company_name: string }[] }
}

export default function EmployeeForm({
	isEditing: _isEditing,
	actionData,
	loaderData,
	employee,
}: EmployeeFormProps) {
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

		defaultValue: employee ? {
			employee_firstname: employee.employee_name?.split(' ')[0],
			employee_lastname: employee.employee_name?.split(' ')[1],
			employee_mobile: employee.employee_mobile,
			employee_email: employee.employee_email,
			employee_position: employee.employee_position,
			position: employee.position,
			company_id: employee.company_id,
		} : {
			employee_firstname: '',
			employee_lastname: '',
			employee_mobile: '',
			employee_email: '',
			employee_position: '',
		},
	})
	return (
		<div className="isolate bg-white px-6 py-24 sm:py-16 lg:px-8">
			<div className="mx-auto max-w-2xl text-center">
				<Form method="POST" {...getFormProps(form)}>
					<Fieldset>
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
									{loaderData?.companies.map((company) => (
										<option key={company.company_id} value={company.company_id}>
											{company.company_name}
										</option>
									))}
								</Select>
								{!!fields.company_id.errors && (
									<ErrorMessage>{fields.company_id.errors}</ErrorMessage>
								)}
							</Field>
							<Field className="text-left">
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
