import { parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { redirect } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../product_categories/+types/product_categories.$categoryId.edit'
import ProductCategoryForm, { FormSchema } from './product_categories_form'
import prisma from '~/lib/prisma'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Edit Product Category' },
		{ name: 'description', content: 'Add/Edit product category information' },
	]
}

export async function loader({ params }: Route.LoaderArgs) {
	const { categoryId } = params

	try {
		const product_category = await prisma.productCategory.findUnique({
			where: { product_category_id: categoryId },
		})

		if (!product_category) {
			throw new Response('Product category not found', { status: 404 })
		}

		return { product_category }
	} catch (error) {
		throw new Response('Failed to load product category', { status: 500 })
	}
}

export async function action({ request, params }: Route.ActionArgs) {
	const { categoryId } = params
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
	const { product_category_name, product_category_attributes } =
		submission.value

	const JsonAttributes: Record<string, string> = {}
	if (
		product_category_attributes &&
		Array.isArray(product_category_attributes)
	) {
		product_category_attributes.forEach(({ key, value }) => {
			if (key?.trim() && value?.trim()) {
				JsonAttributes[key.trim()] = value.trim()
			}
		})
	}

	try {
		await prisma.productCategory.update({
			where: {
				product_category_id: categoryId,
			},
			data: {
				// product_category_id: crypto.randomUUID(),
				product_category_name,
				product_category_attributes: JsonAttributes,
			},
		})

		return redirect('/dashboard/product_categories')
	} catch (error) {
		console.error('Failed to create product category:', error)
		return submission.reply({
			formErrors: ['Failed to create product category. Please try again.'],
		})
	}
}

export default function CategoryEdit({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return (
		<div>
			<ProductCategoryForm
				isEditing={true}
				actionData={actionData}
				product_category={loaderData.product_category}
			></ProductCategoryForm>
		</div>
	)
}
