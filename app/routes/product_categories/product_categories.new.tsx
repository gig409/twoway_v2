import { parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { redirect } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../product_categories/+types/product_categories.new'
import ProductCategoryForm, { FormSchema } from './product_categories_form'
import { Heading } from '~/components/ui/heading'
import { Text } from '~/components/ui/text'
import prisma from '~/lib/prisma'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Add New Product Category' },
		{ name: 'description', content: 'Add/Edit product categories' },
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
		console.log('errors:', submission)
		return submission.reply()
	}

	const { product_category_name } = submission.value

	try {
		await prisma.productCategory.create({
			data: {
				product_category_id: crypto.randomUUID(),
				product_category_name,
			},
		})

		return redirect(
			'/dashboard/product_categories?success=Product category created successfully!',
		)
	} catch (error) {
		console.error('Failed to create product category:', error)
		return submission.reply({
			formErrors: ['Failed to create product category. Please try again.'],
		})
	}
}

export default function ProductCategoryNew({
	actionData,
}: Route.ComponentProps) {
	return (
		<div className="isolate bg-white px-6 py-24 sm:py-16 lg:px-8">
			<div className="mx-auto max-w-2xl text-center">
				<Heading>Product Category details</Heading>
				<Text>Enter relevant details of product category.</Text>
				<ProductCategoryForm
					isEditing={false}
					actionData={actionData}
				></ProductCategoryForm>
			</div>
		</div>
	)
}
