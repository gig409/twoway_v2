import { parseWithZod } from '@conform-to/zod/v4'
import { redirect } from 'react-router'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../quotations/+types/quotations.new'
import QuotationForm, { getQuotationFormSchema } from './quotationsForm'
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

export async function loader() {
	try {
		const companies = await prisma.company.findMany({
			select: {
				company_id: true,
				company_name: true,
			},
		})
		const employees = await prisma.employee.findMany({
			select: {
				employee_id: true,
				employee_name: true,
				company_id: true,
			},
		})
		const products = await prisma.product.findMany({
			select: {
				product_id: true,
				product_name: true,
				product_attributes: true,
			},
		})

		const productCategories = await prisma.productCategory.findMany({
			select: {
				product_category_id: true,
				product_category_name: true,
			},
		})

		return { companies, employees, products, productCategories }
	} catch (error) {
		console.error('Error loading data:', error)
		throw new Response('Failed to load data', { status: 500 })
	}
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	// Get existing products for validation (including product_id)
	const existingProducts = await prisma.product.findMany({
		select: {
			product_id: true,
			product_name: true,
			product_attributes: true,
		},
	})

	const schemaWithValidations = getQuotationFormSchema(existingProducts)

	const submission = parseWithZod(formData, {
		schema: schemaWithValidations,
	})

	if (submission.status !== 'success') {
		return submission.reply()
	}

	const {
		quotation_request_ref,
		quotation_request_date,
		quotation_request_vessel,
		company_id,
		employee_id,
		quotation_request_line_items,
	} = submission.value

	try {
		// Use a transaction to handle both new product creation and quotation creation
		await prisma.$transaction(async (tx) => {
			const quotationRequestId = crypto.randomUUID()

			// Create the quotation request first
			await tx.quotation_Request.create({
				data: {
					quotation_request_id: quotationRequestId,
					quotation_request_ref,
					quotation_request_date: new Date(quotation_request_date),
					quotation_request_vessel,
					company_id,
					employee_id,
					user_id: employee_id, // Using employee_id as user_id for now
				},
			})

			// Process each line item
			for (const item of quotation_request_line_items) {
				let productId = item.product_id

				// If it's a new product, create it first
				if (item.product_id === 'new') {
					const newProduct = await tx.product.create({
						data: {
							product_id: crypto.randomUUID(),
							product_name: item.new_product_name || '',
							product_ref_number: 1, // Default ref number - you may want to implement auto-increment
							product_description: item.new_product_description || null,
							product_category_id: item.new_product_category_id || '', // Required field
							product_attributes:
								item.attributes && item.attributes.length > 0
									? Object.fromEntries(
											item.attributes.map(
												(attr: { key: string; value: string }) => [
													attr.key,
													attr.value,
												],
											),
										)
									: undefined,
						},
					})
					productId = newProduct.product_id
				}

				// Create the line item
				await tx.quotation_Request_Line_Item.create({
					data: {
						quotation_request_line_item_id: crypto.randomUUID(),
						quotation_request_line_item_quantity:
							item.quotation_request_line_item_quantity,
						quotation_request_line_items_attributes:
							item.attributes && item.attributes.length > 0
								? Object.fromEntries(
										item.attributes.map(
											(attr: { key: string; value: string }) => [
												attr.key,
												attr.value,
											],
										),
									)
								: undefined,
						quotation_request_id: quotationRequestId,
						product_id: productId,
					},
				})
			}
		})

		return redirect(
			'/dashboard/quotations?success=Quotation Request created successfully!',
		)
	} catch (error) {
		console.error('Error creating quotation:', error)
		return submission.reply({
			formErrors: ['Failed to create quotation. Please try again.'],
		})
	}
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
