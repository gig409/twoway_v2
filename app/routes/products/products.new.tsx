import { parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { redirect } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../products/+types/products.new'
import ProductForm, { FormSchema } from './productForm'
import { Heading } from '~/components/ui/heading'
import { Text } from '~/components/ui/text'
import prisma from '~/lib/prisma'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Add New Product' },
		{ name: 'description', content: 'Add/Edit product' },
	]
}

export async function loader({}: Route.LoaderArgs) {
	try {
		const product_categories = await prisma.productCategory.findMany({
			select: {
				product_category_id: true,
				product_category_name: true,
				product_category_attributes: true,
			},
		})

		return { product_categories }
	} catch (error) {
		console.error('Database error:', error)
		throw new Error('Failed to load product categories')
	}
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

	const {
		product_name,
		product_ref_number,
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
		await prisma.product.create({
			data: {
				product_id: crypto.randomUUID(),
				product_name,
				product_ref_number,
				product_description: product_description,
				product_attributes: JsonAttributes,
				product_category_id: product_category_id,
			},
		})

		return redirect('/dashboard/products?success=Product created successfully!')
	} catch (error) {
		console.error('Failed to create product:', error)
		return submission.reply({
			formErrors: ['Failed to create product. Please try again.'],
		})
	}
}

export default function ProductNew({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	return (
		<div className="isolate bg-white px-6 py-24 sm:py-16 lg:px-8">
			<div className="mx-auto max-w-2xl text-center">
				<Heading>Product details</Heading>
				<Text>Enter relevant details of product.</Text>
				<ProductForm
					isEditing={false}
					actionData={actionData}
					loaderData={loaderData}
				></ProductForm>
			</div>
		</div>
	)
}
