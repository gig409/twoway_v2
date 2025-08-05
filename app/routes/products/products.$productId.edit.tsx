import { parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { redirect } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../products/+types/products.$productId.edit'
import ProductForm, { getProductFormSchema } from './productForm'
import prisma from '~/lib/prisma'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Edit Product' },
		{ name: 'description', content: 'Add/Edit product information' },
	]
}

export async function loader({ params }: Route.LoaderArgs) {
	const { productId } = params

	try {
		const product = await prisma.product.findUnique({
			where: { product_id: productId },
		})

		if (!product) {
			throw new Response('Product not found', { status: 404 })
		}

		const product_categories = await prisma.productCategory.findMany({
			select: {
				product_category_id: true,
				product_category_name: true,
			},
		})

		return { product, product_categories }
	} catch (error) {
		throw new Response(`Failed to load product ${error}`, { status: 500 })
	}
}

export async function action({ request, params }: Route.ActionArgs) {
	const { productId } = params
	const formData = await request.formData()

	const existingProducts = await prisma.product.findMany({
		select: {
			product_id: true,
			product_name: true,
			product_attributes: true,
		},
	})

	const currentProductName = await prisma.product.findUnique({
		where: { product_id: productId },
		select: { product_name: true },
	})

	const submission = parseWithZod(formData, {
		schema: getProductFormSchema(
			existingProducts,
			currentProductName?.product_name,
		),
	})

	if (submission.status !== 'success') {
		console.log('errors:', submission)
		return submission.reply()
	}

	// const { street_address, country, notes } = submission.value;
	// console.log("Form submission values:", { street_address, country, notes });
	const {
		product_name,
		product_description,
		product_attributes,
		product_category_id,
	} = submission.value

	const JsonAttributes: Record<string, string> = {}
	if (product_attributes && Array.isArray(product_attributes)) {
		product_attributes.forEach(({ key, value }) => {
			if (key?.trim() && value?.trim()) {
				JsonAttributes[key.trim()] = value.trim()
			}
		})
	}

	try {
		await prisma.product.update({
			where: {
				product_id: productId,
			},
			data: {
				product_name,
				product_description,
				product_attributes: JsonAttributes,
				product_category_id,
			},
		})

		return redirect('/dashboard/products?success=Product updated successfully!')
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
			<ProductForm
				isEditing={true}
				actionData={actionData}
				loaderData={loaderData}
				product={loaderData.product}
			></ProductForm>
		</div>
	)
}
