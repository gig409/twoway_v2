import { parseWithZod } from '@conform-to/zod/v4'
import { redirect } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../employees/+types/employees.new'
import QuotationForm, { QuotationFormSchema } from './quotationsForm'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Heading } from '~/components/ui/heading'
import { Text } from '~/components/ui/text'
import prisma from '~/lib/prisma'


export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Add New Quotation' },
		{ name: 'description', content: 'Add a new quotation' },
	]
}



export default function QuotationNew({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return (
		<div className="isolate bg-white px-6 py-24 sm:py-16 lg:px-8">
			<div className="mx-auto max-w-2xl text-center">
				<Heading>Create a New Quotation</Heading>
				<Text>Add your quotation details below:</Text>
				<QuotationForm
					isEditing={false}
					actionData={actionData}
					loaderData={loaderData}
				></QuotationForm>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
