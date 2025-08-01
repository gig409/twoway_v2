import { parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { redirect } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../companies/+types/companies.new'
import CompanyForm, { FormSchema } from './companyForm'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Heading } from '~/components/ui/heading'
import { Text } from '~/components/ui/text'
import prisma from '~/lib/prisma'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Add New Company' },
		{ name: 'description', content: 'Add/Edit company information' },
	]
}

export async function loader({}: Route.LoaderArgs) {
	return { message: 'Hello from the loader!' }
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	const submission = parseWithZod(formData, {
		schema: FormSchema,
	})

	if (submission.status !== 'success') {
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
		await prisma.company.create({
			data: {
				company_id: crypto.randomUUID(),
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
			'/dashboard/companies?success=Company created successfully!',
		)
	} catch (error) {
		console.error('Failed to create company:', error)
		return submission.reply({
			formErrors: ['Failed to create company. Please try again.'],
		})
	}
}

export default function CompanyNew({ actionData }: Route.ComponentProps) {
	return (
		<div className="isolate bg-white px-6 py-24 sm:py-16 lg:px-8">
			<div className="mx-auto max-w-2xl text-center">
				<Heading>Create a New Company</Heading>
				<Text>Add your company details below:</Text>
				<CompanyForm isEditing={false} actionData={actionData}></CompanyForm>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
