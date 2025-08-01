import { parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { redirect } from 'react-router'
import { GeneralErrorBoundary } from '../../components/error-boundary'
// eslint-disable-next-line import/consistent-type-specifier-style
import prisma from '~/lib/prisma'
import type { Route } from '../companies/+types/companies.$companyId.edit'
import CompanyForm, { FormSchema } from './companyForm'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Edit Company' },
		{ name: 'description', content: 'Add/Edit company information' },
	]
}

export async function loader({ params }: Route.LoaderArgs) {
	const { companyId } = params

	try {
		const company = await prisma.company.findUnique({
			where: { company_id: companyId },
		})

		if (!company) {
			throw new Response('Company not found', { status: 404 })
		}

		return { company }
	} catch (error) {
		throw new Response('Failed to load company', { status: 500 })
	}
}

export async function action({ request, params }: Route.ActionArgs) {
	const { companyId } = params
	const formData = await request.formData()

	const submission = parseWithZod(formData, {
		schema: FormSchema,
	})

	if (submission.status !== 'success') {
		console.log('errors:', submission)
		return submission.reply()
	}

	// const { street_address, country, notes } = submission.value;
	// console.log("Form submission values:", { street_address, country, notes });
	const {
		company_name,
		company_email,
		company_phone,
		company_add1,
		company_add2,
		country,
		company_city,
		company_post_code,
		company_type,
	} = submission.value

	try {
		await prisma.company.update({
			where: {
				company_id: companyId,
			},
			data: {
				// company_id: crypto.randomUUID(),
				company_name,
				company_email,
				company_phone: company_phone.toString(),
				company_address:
					company_add1 +
					(company_add2 ? `, ${company_add2}` : '') +
					`, ${company_city},  ${company_post_code}`,
				company_country: country,
				company_type: parseInt(company_type, 10),
			},
		})

		return redirect(
			'/dashboard/companies?success=Company updated successfully!',
		)
	} catch (error) {
		console.error('Failed to create company:', error)
		return submission.reply({
			formErrors: ['Failed to create company. Please try again.'],
		})
	}
}

export default function CompanyEdit({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return (
		<div>
			<CompanyForm
				isEditing={true}
				actionData={actionData}
				company={loaderData.company}
			></CompanyForm>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
