import { parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { redirect } from 'react-router'
import { GeneralErrorBoundary } from '../../components/error-boundary'
// eslint-disable-next-line import/consistent-type-specifier-style
import type { Route } from '../quotations/+types/quotations.$quotationId.edit'
import QuotationForm, { getQuotationFormSchema } from './quotationsForm'
import { Heading } from '~/components/ui/heading'
import { Text } from '~/components/ui/text'
import prisma from '~/lib/prisma'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Edit Quotation' },
		{ name: 'description', content: 'Edit quotation information' },
	]
}

export async function loader({ params }: Route.LoaderArgs) {
	const { quotationId } = params

	try {
		const quotation = await prisma.quotation_Request.findUnique({
			where: { quotation_request_id: quotationId },
			select: {
				quotation_request_id: true,
				quotation_request_ref: true,
				quotation_request_date: true,
				quotation_request_vessel: true,
				company: {
					select: {
						company_id: true,
						company_name: true,
						company_type: true, // Include type for filtering
					},
				},
				employee: {
					select: {
						employee_id: true,
						employee_name: true,
						company_id: true, // Include company_id for filtering
					},
				},
				quotation_request_line_items: {
					select: {
						product: {
							select: {
								product_id: true,
								product_name: true,
								product_description: true,
								product_ref_number: true,
								product_attributes: true,
								product_category_id: true,
							},
						},
						quotation_request_line_item_id: true,
						quotation_request_line_item_quantity: true,
					},
				},
			},
		})

		if (!quotation) {
			throw new Response('Quotation not found', { status: 404 })
		}

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

		const product_categories = await prisma.productCategory.findMany({
			select: {
				product_category_id: true,
				product_category_name: true,
				product_category_attributes: true,
			},
		})

		const products = await prisma.product.findMany({
			select: {
				product_id: true,
				product_name: true,
				product_attributes: true,
			},
		})

		return {
			quotation,
			companies,
			employees,
			products,
			productCategories: product_categories,
		}
	} catch {
		throw new Response('Failed to load quotation', { status: 500 })
	}
}

export async function action({ request, params }: Route.ActionArgs) {
	const { quotationId } = params
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
		// Use a transaction to handle both new product creation and quotation update
		await prisma.$transaction(async (tx) => {
			// Update the main quotation fields
			await tx.quotation_Request.update({
				where: { quotation_request_id: quotationId },
				data: {
					quotation_request_ref,
					quotation_request_date: new Date(quotation_request_date),
					quotation_request_vessel,
					company_id,
					employee_id,
				},
			})

			// Delete existing line items
			await tx.quotation_Request_Line_Item.deleteMany({
				where: { quotation_request_id: quotationId },
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
							product_ref_number: (() => {
								if (!item.new_product_ref) return 0
								const parsed = parseInt(item.new_product_ref, 10)
								return isNaN(parsed) ? 0 : parsed
							})(), //TODO migration ot convert product ref to string
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
						quotation_request_id: quotationId,
						product_id: productId,
					},
				})
			}
		})

		return redirect(
			'/dashboard/quotations?success=Quotation updated successfully!',
		)
	} catch (error) {
		console.error('Failed to update quotation:', error)
		return submission.reply({
			formErrors: ['Failed to update quotation. Please try again.'],
		})
	}
}

export default function QuotationsEdit({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return (
		<div className="isolate bg-white px-6 py-24 sm:py-16 lg:px-8">
			<div className="mx-auto max-w-2xl text-center">
				<Heading>Edit Quotation</Heading>
				<Text>Update your quotation details below:</Text>
				<QuotationForm
					isEditing={true}
					loaderData={loaderData}
					actionData={actionData}
					quotation={loaderData.quotation}
				/>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
