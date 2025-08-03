import {
	getInputProps,
	useForm,
	getFormProps,
	type SubmissionResult,
	getSelectProps,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { type Prisma } from '@prisma/client'
import { useMemo } from 'react'
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

// Form validation constants
const MAX_LINE_ITEMS = 50
const MAX_LINE_ITEMS_FOR_VALIDATION = 10 // For performance reasons, validate only first 10 items
const MAX_ATTRIBUTES_PER_ITEM = 20
const MAX_QUANTITY = 10000
const MIN_QUANTITY = 1
const MAX_ATTRIBUTE_KEY_LENGTH = 100
const MAX_ATTRIBUTE_VALUE_LENGTH = 500
const MAX_REFERENCE_LENGTH = 50
const MIN_VESSEL_NAME_LENGTH = 2
const MAX_VESSEL_NAME_LENGTH = 100

type QuotationSelect = Prisma.Quotation_RequestGetPayload<{
	select: {
		quotation_request_id: true
		quotation_request_ref: true
		quotation_request_date: true
		quotation_request_vessel: true
		company: {
			select: {
				company_id: true
				company_name: true
				company_type: true // Include type for filtering
			}
		}
		employee: {
			select: {
				employee_id: true
				employee_name: true
				company_id: true // Include company_id for filtering
			}
		}
		quotation_request_line_items: {
			select: {
				product: {
					select: {
						product_id: true
						product_name: true
						product_description: true
						product_ref_number: true
						product_attributes: true
						product_category_id: true
					}
				}

				quotation_request_line_item_id: true
				quotation_request_line_item_quantity: true
			}
		}
	}
}>

interface QuotationFormProps {
	isEditing: boolean
	actionData?: SubmissionResult<string[]>
	quotation?: QuotationSelect
	loaderData?: {
		companies: { company_id: string; company_name: string }[]
		employees: {
			employee_id: string
			employee_name: string | null
			company_id: string
		}[]
		products: {
			product_id: string
			product_name: string
			product_attributes: any
		}[]
		productCategories: {
			product_category_id: string
			product_category_name: string
			product_category_attributes: any
		}[]
	}
}

// Add this Zod schema after your type definitions and before the component

export const QuotationFormSchema = z.object({
	// Basic quotation fields
	quotation_request_ref: z
		.string({ error: 'Reference is required' })
		.min(1, 'Reference must not be empty')
		.max(MAX_REFERENCE_LENGTH, 'Reference must be max 50 characters'),

	quotation_request_date: z
		.string({ error: 'Date is required' })
		.refine((date) => !isNaN(Date.parse(date)), {
			message: 'Please enter a valid date',
		}),

	quotation_request_vessel: z
		.string({ error: 'Vessel name is required' })
		.min(MIN_VESSEL_NAME_LENGTH, 'Vessel name must be at least 2 characters')
		.max(MAX_VESSEL_NAME_LENGTH, 'Vessel name must be max 100 characters'),

	// Company selection (dropdown)
	company_id: z
		.string({ error: 'Please select a company' })
		.uuid('Invalid company selection'),

	// Employee selection (dropdown, filtered by company)
	employee_id: z
		.string({ error: 'Please select an employee' })
		.uuid('Invalid employee selection'),

	// Line items (array of products with quantities)
	quotation_request_line_items: z
		.array(
			z.object({
				// For existing line items (when editing)
				quotation_request_line_item_id: z.string().uuid().optional(),

				// Product selection (can be existing product ID or "new")
				product_id: z
					.string({ error: 'Please select a product' })
					.min(1, 'Product selection is required'),

				// New product fields (only used when product_id === "new")
				new_product_category_id: z.string().optional(),
				new_product_name: z.string().optional(),
				new_product_ref: z.string().optional(),
				new_product_description: z.string().optional(),

				// Quantity
				quotation_request_line_item_quantity: z
					.number({ error: 'Quantity is required' })
					.int('Quantity must be a whole number')
					.min(MIN_QUANTITY, 'Quantity must be at least 1')
					.max(MAX_QUANTITY, 'Quantity cannot exceed 10,000'),

				// Dynamic attributes (key-value pairs)
				attributes: z
					.array(
						z.object({
							key: z
								.string({ error: 'Attribute key is required' })
								.min(1, 'Attribute key cannot be empty')
								.max(MAX_ATTRIBUTE_KEY_LENGTH, 'Attribute key too long'),
							value: z
								.string({ error: 'Attribute value is required' })
								.min(1, 'Attribute value cannot be empty')
								.max(MAX_ATTRIBUTE_VALUE_LENGTH, 'Attribute value too long'),
							_isProductAttribute: z.string().optional(), // Flag for read-only keys (string 'true'/'false')
						}),
					)
					.optional()
					.default([]), // Optional: Mark for deletion (when editing)
				_action: z.enum(['keep', 'delete']).optional(),
			}),
		)
		.min(1, 'At least one line item is required')
		.max(MAX_LINE_ITEMS, 'Cannot exceed 50 line items'),
})

// Create a function to get the schema with runtime validations
export const getQuotationFormSchema = (
	existingProducts?: {
		product_id: string
		product_name: string
		product_attributes?: any
	}[],
) => {
	let schemaWithValidation = QuotationFormSchema

	// Add validation for new product names against database
	if (existingProducts) {
		const existingProductNames = new Set(
			existingProducts.map((p) => p.product_name.toLowerCase().trim()),
		)

		// Apply validation for multiple line items (up to a reasonable limit)
		for (let i = 0; i < MAX_LINE_ITEMS_FOR_VALIDATION; i++) {
			// Validate new_product_name is required when product_id === 'new'
			schemaWithValidation = schemaWithValidation.refine(
				(data) => {
					const lineItem = data.quotation_request_line_items[i]
					if (!lineItem || lineItem.product_id !== 'new') {
						return true // Not a new product, validation passes
					}

					// For new products, product name is required
					return (
						lineItem.new_product_name &&
						lineItem.new_product_name.trim().length > 0
					)
				},
				{
					message: 'Product name is required when creating a new product',
					path: ['quotation_request_line_items', i, 'new_product_name'],
				},
			)

			// Validate new_product_category_id is required when product_id === 'new'
			schemaWithValidation = schemaWithValidation.refine(
				(data) => {
					const lineItem = data.quotation_request_line_items[i]
					if (!lineItem || lineItem.product_id !== 'new') {
						return true // Not a new product, validation passes
					}

					// For new products, category is required
					return (
						lineItem.new_product_category_id &&
						lineItem.new_product_category_id.trim().length > 0
					)
				},
				{
					message: 'Product category is required when creating a new product',
					path: ['quotation_request_line_items', i, 'new_product_category_id'],
				},
			)

			// Optional: Validate new_product_ref has minimum length if provided
			schemaWithValidation = schemaWithValidation.refine(
				(data) => {
					const lineItem = data.quotation_request_line_items[i]
					if (
						!lineItem ||
						lineItem.product_id !== 'new' ||
						!lineItem.new_product_ref
					) {
						return true // Not applicable
					}

					// If product ref is provided, it should meet minimum requirements
					return lineItem.new_product_ref.trim().length >= 2
				},
				{
					message:
						'Product reference must be at least 2 characters if provided',
					path: ['quotation_request_line_items', i, 'new_product_ref'],
				},
			)

			schemaWithValidation = schemaWithValidation.refine(
				(data) => {
					// Check if this line item index exists and is a new product
					if (
						data.quotation_request_line_items[i] &&
						data.quotation_request_line_items[i].product_id === 'new' &&
						data.quotation_request_line_items[i].new_product_name
					) {
						const newProductName = data.quotation_request_line_items[i]
							.new_product_name!.toLowerCase()
							.trim()
						return !existingProductNames.has(newProductName)
					}
					return true
				},
				{
					message: 'A product with this name already exists in the database',
					path: ['quotation_request_line_items', i, 'new_product_name'],
				},
			)
		}
	}

	// Add validation to prevent duplicate product names within the same form (new products)
	for (let i = 0; i < MAX_LINE_ITEMS_FOR_VALIDATION; i++) {
		schemaWithValidation = schemaWithValidation.refine(
			(data) => {
				const currentLineItem = data.quotation_request_line_items[i]
				if (
					!currentLineItem ||
					currentLineItem.product_id !== 'new' ||
					!currentLineItem.new_product_name
				) {
					return true
				}

				const currentProductName = currentLineItem.new_product_name
					.toLowerCase()
					.trim()

				// Check against all other line items in the form
				for (let j = 0; j < data.quotation_request_line_items.length; j++) {
					if (i === j) continue // Skip self comparison

					const otherLineItem = data.quotation_request_line_items[j]
					if (!otherLineItem) continue

					let otherProductName: string | null = null

					// Check against other new products
					if (
						otherLineItem.product_id === 'new' &&
						otherLineItem.new_product_name
					) {
						otherProductName = otherLineItem.new_product_name
							.toLowerCase()
							.trim()
					}
					// Check against existing products
					else if (
						otherLineItem.product_id &&
						otherLineItem.product_id !== 'new' &&
						existingProducts
					) {
						const existingProduct = existingProducts.find(
							(p) => p.product_id === otherLineItem.product_id,
						)
						if (existingProduct) {
							otherProductName = existingProduct.product_name
								.toLowerCase()
								.trim()
						}
					}

					if (otherProductName && currentProductName === otherProductName) {
						return false // Duplicate found within the form
					}
				}

				return true
			},
			{
				message:
					'Product names must be unique within the same quotation. This product name is already used in another line item.',
				path: ['quotation_request_line_items', i, 'new_product_name'],
			},
		)
	}

	// Add validation to prevent duplicate product names within the same form (existing products)
	for (let i = 0; i < MAX_LINE_ITEMS_FOR_VALIDATION; i++) {
		schemaWithValidation = schemaWithValidation.refine(
			(data) => {
				const currentLineItem = data.quotation_request_line_items[i]
				if (
					!currentLineItem ||
					currentLineItem.product_id === 'new' ||
					!currentLineItem.product_id ||
					!existingProducts
				) {
					return true
				}

				const currentProduct = existingProducts.find(
					(p) => p.product_id === currentLineItem.product_id,
				)
				if (!currentProduct) return true

				const currentProductName = currentProduct.product_name
					.toLowerCase()
					.trim()

				// Check against all other line items in the form
				for (let j = 0; j < data.quotation_request_line_items.length; j++) {
					if (i === j) continue // Skip self comparison

					const otherLineItem = data.quotation_request_line_items[j]
					if (!otherLineItem) continue

					let otherProductName: string | null = null

					// Check against new products
					if (
						otherLineItem.product_id === 'new' &&
						otherLineItem.new_product_name
					) {
						otherProductName = otherLineItem.new_product_name
							.toLowerCase()
							.trim()
					}
					// Check against other existing products
					else if (
						otherLineItem.product_id &&
						otherLineItem.product_id !== 'new'
					) {
						const existingProduct = existingProducts.find(
							(p) => p.product_id === otherLineItem.product_id,
						)
						if (existingProduct) {
							otherProductName = existingProduct.product_name
								.toLowerCase()
								.trim()
						}
					}

					if (otherProductName && currentProductName === otherProductName) {
						return false // Duplicate found within the form
					}
				}

				return true
			},
			{
				message:
					'Product names must be unique within the same quotation. This product name is already used in another line item.',
				path: ['quotation_request_line_items', i, 'product_id'],
			},
		)
	}

	// Add duplicate attribute key validation for each line item
	for (
		let lineItemIndex = 0;
		lineItemIndex < MAX_LINE_ITEMS_FOR_VALIDATION;
		lineItemIndex++
	) {
		// For each line item, check for duplicate attribute keys
		for (let attrIndex = 0; attrIndex < MAX_ATTRIBUTES_PER_ITEM; attrIndex++) {
			schemaWithValidation = schemaWithValidation.refine(
				(data) => {
					const lineItem = data.quotation_request_line_items[lineItemIndex]
					if (
						!lineItem ||
						!lineItem.attributes ||
						lineItem.attributes.length <= attrIndex
					) {
						return true
					}

					const currentAttr = lineItem.attributes[attrIndex]
					if (
						!currentAttr ||
						!currentAttr.key ||
						currentAttr.key.trim() === ''
					) {
						return true
					}

					const currentKey = currentAttr.key.toLowerCase().trim()

					// Check if this key appears elsewhere in the same product's attributes
					const duplicateFound = lineItem.attributes.some((attr, index) => {
						if (index === attrIndex || !attr || !attr.key) return false
						return attr.key.toLowerCase().trim() === currentKey
					})

					return !duplicateFound
				},
				{
					message:
						'Duplicate attribute key - each key must be unique within this product',
					path: [
						'quotation_request_line_items',
						lineItemIndex,
						'attributes',
						attrIndex,
						'key',
					],
				},
			)
		}
	}

	return schemaWithValidation
}

// Type inference from the schema
export type QuotationFormData = z.infer<typeof QuotationFormSchema>

// Update your component to use the schema
export default function QuotationForm({
	isEditing: _isEditing,
	actionData,
	loaderData,
	quotation,
}: QuotationFormProps) {
	const navigation = useNavigation()
	const formAction = useFormAction()
	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	const [form, fields] = useForm({
		id: 'quotation-form', // Fixed ID
		lastResult: actionData,
		constraint: getZodConstraint(QuotationFormSchema), // Use the base schema for constraints
		onValidate({ formData }) {
			// Use the enhanced schema with runtime validations
			const schemaWithValidations = getQuotationFormSchema(loaderData?.products)
			return parseWithZod(formData, { schema: schemaWithValidations })
		},
		shouldRevalidate: 'onBlur',
		// Default values for editing
		defaultValue: quotation
			? {
					quotation_request_ref: quotation.quotation_request_ref,
					quotation_request_date: quotation.quotation_request_date
						.toISOString()
						.split('T')[0], // Format for date input
					quotation_request_vessel: quotation.quotation_request_vessel,
					company_id: quotation.company.company_id,
					employee_id: quotation.employee.employee_id,
					quotation_request_line_items:
						quotation.quotation_request_line_items.map((item) => ({
							quotation_request_line_item_id:
								item.quotation_request_line_item_id,
							product_id: item.product.product_id,
							quotation_request_line_item_quantity:
								item.quotation_request_line_item_quantity,
							// Map through existing product attributes instead of empty array
							attributes:
								item.product.product_attributes &&
								typeof item.product.product_attributes === 'object' &&
								item.product.product_attributes !== null
									? Object.entries(item.product.product_attributes).map(
											([key, value]) => ({
												key: key,
												value: String(value || ''),
												_isProductAttribute: 'true', // Mark as product attributes
											}),
										)
									: [], // Fallback to empty array if no attributes
							_action: 'keep' as const,
						})),
				}
			: {
					quotation_request_line_items: [
						{
							product_id: '',
							quotation_request_line_item_quantity: 1,
							attributes: [],
							new_product_category_id: '',
							new_product_name: '',
							new_product_ref: '',
							new_product_description: '',
						},
					],
				},
	})

	// Get current company selection for employee filtering
	const selectedCompanyId = fields.company_id.value

	// Filter employees based on selected company
	const filteredEmployees = useMemo(() => {
		if (!selectedCompanyId || !loaderData?.employees) {
			return []
		}
		return loaderData.employees.filter(
			(employee) => employee.company_id === selectedCompanyId,
		)
	}, [selectedCompanyId, loaderData?.employees])

	// Extract field lists for line items
	const lineItemsList = fields.quotation_request_line_items.getFieldList()

	return (
		<Form method="post" {...getFormProps(form)} className="space-y-6">
			<Fieldset>
				<FieldGroup>
					{/* Basic quotation fields */}
					<Field className="text-left">
						<Label htmlFor={fields.quotation_request_ref.id}>Reference</Label>
						<Input
							{...getInputProps(fields.quotation_request_ref, { type: 'text' })}
							placeholder="QR-2024-001"
						/>
						{fields.quotation_request_ref.errors && (
							<ErrorMessage>{fields.quotation_request_ref.errors}</ErrorMessage>
						)}
					</Field>

					<Field className="text-left">
						<Label htmlFor={fields.quotation_request_date.id}>Date</Label>
						<Input
							{...getInputProps(fields.quotation_request_date, {
								type: 'date',
							})}
						/>
						{fields.quotation_request_date.errors && (
							<ErrorMessage>
								{fields.quotation_request_date.errors}
							</ErrorMessage>
						)}
					</Field>

					<Field className="text-left">
						<Label htmlFor={fields.quotation_request_vessel.id}>Vessel</Label>
						<Input
							{...getInputProps(fields.quotation_request_vessel, {
								type: 'text',
							})}
							placeholder="MV Example Vessel"
						/>
						{fields.quotation_request_vessel.errors && (
							<ErrorMessage>
								{fields.quotation_request_vessel.errors}
							</ErrorMessage>
						)}
					</Field>

					<Field className="text-left">
						<Label htmlFor={fields.company_id.id}>Company</Label>
						<Select
							{...getSelectProps(fields.company_id)}
							onChange={(_e) => {
								// Reset employee field when company changes
								form.update({
									name: fields.employee_id.name,
									value: '',
								})
							}}
						>
							<option value="">Select a company</option>
							{loaderData?.companies.map((company) => (
								<option key={company.company_id} value={company.company_id}>
									{company.company_name}
								</option>
							))}
						</Select>
						{fields.company_id.errors && (
							<ErrorMessage>{fields.company_id.errors}</ErrorMessage>
						)}
					</Field>

					<Field className="text-left">
						<Label htmlFor={fields.employee_id.id}>Employee</Label>
						<Select {...getSelectProps(fields.employee_id)}>
							<option value="">Select an employee</option>
							{filteredEmployees.map((employee) => (
								<option key={employee.employee_id} value={employee.employee_id}>
									{employee.employee_name || 'Unnamed Employee'}
								</option>
							))}
						</Select>
						{fields.employee_id.errors && (
							<ErrorMessage>{fields.employee_id.errors}</ErrorMessage>
						)}
					</Field>
				</FieldGroup>
			</Fieldset>

			{/* Line Items Section */}
			<Fieldset>
				<legend className="text-base leading-6 font-semibold text-gray-900">
					Line Items
				</legend>
				{/* Enhanced error display */}
				{(fields.quotation_request_line_items.errors ||
					form.errors?.length) && (
					<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg
									className="h-5 w-5 text-red-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<div className="ml-3">
								<h3 className="text-sm font-medium text-red-800">
									Validation Error
								</h3>
								<div className="mt-1 text-sm text-red-700">
									{fields.quotation_request_line_items.errors && (
										<p>{fields.quotation_request_line_items.errors}</p>
									)}
									{form.errors?.map((error, index) => (
										<p key={index}>{error}</p>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
				{lineItemsList.map((lineItemField, index) => {
					const lineItemFields = lineItemField.getFieldset()
					const attributesList = lineItemFields.attributes.getFieldList()

					return (
						<FieldGroup
							key={lineItemField.key}
							className="mt-6 rounded-lg border-2 border-gray-200 p-4"
						>
							<div className="mb-4 flex items-center justify-between">
								<h3 className="text-lg font-medium">Product {index + 1}</h3>
								<Button
									type="button"
									outline
									onClick={() => {
										form.remove({
											name: fields.quotation_request_line_items.name,
											index,
										})
									}}
									disabled={lineItemsList.length === 1}
								>
									Remove Item
								</Button>
							</div>

							{/* Product Selection */}
							<Field className="text-left">
								<Label htmlFor={lineItemFields.product_id.id}>Product</Label>
								<Select
									{...getSelectProps(lineItemFields.product_id)}
									onChange={(e) => {
										const value = e.target.value

										// Clear existing attributes
										const currentAttributesCount = attributesList.length
										for (let i = currentAttributesCount - 1; i >= 0; i--) {
											form.remove({
												name: lineItemFields.attributes.name,
												index: i,
											})
										}

										if (value === 'new') {
											// Reset new product fields when selecting "New Product"
											form.update({
												name: lineItemFields.new_product_category_id.name,
												value: '',
											})
											form.update({
												name: lineItemFields.new_product_name.name,
												value: '',
											})
											form.update({
												name: lineItemFields.new_product_ref.name,
												value: '',
											})
											form.update({
												name: lineItemFields.new_product_description.name,
												value: '',
											})
										} else if (value) {
											// Existing product selected
											const selectedProduct = loaderData?.products.find(
												(product) => product.product_id === value,
											)

											if (selectedProduct) {
												// Add product attributes (if they exist)
												if (
													selectedProduct.product_attributes &&
													typeof selectedProduct.product_attributes ===
														'object' &&
													selectedProduct.product_attributes !== null
												) {
													Object.entries(
														selectedProduct.product_attributes,
													).forEach(([key, value]) => {
														form.insert({
															name: lineItemFields.attributes.name,
															defaultValue: {
																key: key,
																value: String(value || ''),
																_isProductAttribute: 'true', // Product attributes are read-only keys
															},
														})
													})
												}
											}
										}
									}}
								>
									<option value="">Select a product</option>
									<option value="new">New Product</option>
									{loaderData?.products.map((product) => (
										<option key={product.product_id} value={product.product_id}>
											{product.product_name}
										</option>
									))}
								</Select>
								{lineItemFields.product_id.errors && (
									<ErrorMessage>
										{lineItemFields.product_id.errors}
									</ErrorMessage>
								)}
							</Field>

							{/* New Product Fields - only show when "New Product" is selected */}
							{lineItemFields.product_id.value === 'new' && (
								<>
									<Field className="text-left">
										<Label htmlFor={lineItemFields.new_product_category_id.id}>
											Product Category
										</Label>
										<Select
											{...getSelectProps(
												lineItemFields.new_product_category_id,
											)}
										>
											<option value="">Select a category</option>
											{loaderData?.productCategories.map((category) => (
												<option
													key={category.product_category_id}
													value={category.product_category_id}
												>
													{category.product_category_name}
												</option>
											))}
										</Select>
										{lineItemFields.new_product_category_id.errors && (
											<ErrorMessage>
												{lineItemFields.new_product_category_id.errors}
											</ErrorMessage>
										)}
									</Field>

									<Field className="text-left">
										<Label htmlFor={lineItemFields.new_product_name.id}>
											Product Name
										</Label>
										<Input
											{...getInputProps(lineItemFields.new_product_name, {
												type: 'text',
											})}
											placeholder="Enter new product name"
										/>
										{lineItemFields.new_product_name.errors && (
											<ErrorMessage>
												{lineItemFields.new_product_name.errors}
											</ErrorMessage>
										)}
									</Field>

									<Field className="text-left">
										<Label htmlFor={lineItemFields.new_product_ref.id}>
											Product Reference
										</Label>
										<Input
											{...getInputProps(lineItemFields.new_product_ref, {
												type: 'text',
											})}
											placeholder="Enter product reference number"
										/>
										{lineItemFields.new_product_ref.errors && (
											<ErrorMessage>
												{lineItemFields.new_product_ref.errors}
											</ErrorMessage>
										)}
									</Field>

									<Field className="text-left">
										<Label htmlFor={lineItemFields.new_product_description.id}>
											Product Description
										</Label>
										<Input
											{...getInputProps(
												lineItemFields.new_product_description,
												{ type: 'text' },
											)}
											placeholder="Enter product description"
										/>
									</Field>
								</>
							)}

							{/* Quantity */}
							<Field className="text-left">
								<Label
									htmlFor={
										lineItemFields.quotation_request_line_item_quantity.id
									}
								>
									Quantity
								</Label>
								<Input
									{...getInputProps(
										lineItemFields.quotation_request_line_item_quantity,
										{ type: 'number' },
									)}
									min={MIN_QUANTITY.toString()}
									max={MAX_QUANTITY.toString()}
								/>
								{lineItemFields.quotation_request_line_item_quantity.errors && (
									<ErrorMessage>
										{lineItemFields.quotation_request_line_item_quantity.errors}
									</ErrorMessage>
								)}
							</Field>

							{/* Attributes Section */}
							<div className="mt-4">
								<div className="mb-2 flex items-center justify-between">
									<Label className="text-sm font-medium">
										Product Attributes
									</Label>
									{/* Always allow adding attributes */}
									<Button
										type="button"
										outline
										onClick={() => {
											form.insert({
												name: lineItemFields.attributes.name,
												defaultValue: {
													key: '',
													value: '',
													_isProductAttribute: 'false', // Use string 'false' for user-added attributes
												},
											})
										}}
									>
										Add Attribute
									</Button>
								</div>

								{attributesList.length === 0 && (
									<p className="text-sm text-gray-500 italic">
										No attributes added
									</p>
								)}

								{attributesList.map((attributeField, attrIndex) => {
									const attributeFields = attributeField.getFieldset()
									// Form field values are strings, so check for string 'true'
									const isProductAttribute =
										attributeFields._isProductAttribute.value === 'true'

									return (
										<div
											key={attributeField.key}
											className="mb-2 flex items-start gap-2"
										>
											<Field className="flex-1">
												<Label
													htmlFor={attributeFields.key.id}
													className="sr-only"
												>
													Attribute Key
												</Label>
												<Input
													{...getInputProps(attributeFields.key, {
														type: 'text',
													})}
													placeholder={
														isProductAttribute
															? 'Product attribute'
															: 'Attribute name'
													}
													readOnly={isProductAttribute}
													className={isProductAttribute ? 'bg-gray-50' : ''}
													title={
														isProductAttribute
															? 'This is a product attribute (read-only)'
															: 'Custom attribute (editable)'
													}
												/>
												{attributeFields.key.errors && (
													<ErrorMessage className="text-xs">
														{attributeFields.key.errors}
													</ErrorMessage>
												)}
											</Field>

											<Field className="flex-1">
												<Label
													htmlFor={attributeFields.value.id}
													className="sr-only"
												>
													Attribute Value
												</Label>
												<Input
													{...getInputProps(attributeFields.value, {
														type: 'text',
													})}
													placeholder="Attribute value"
												/>
												{attributeFields.value.errors && (
													<ErrorMessage className="text-xs">
														{attributeFields.value.errors}
													</ErrorMessage>
												)}
											</Field>

											{/* Always show Remove button for all attributes */}
											<div className="pt-3">
												<Button
													type="button"
													outline
													onClick={() => {
														form.remove({
															name: lineItemFields.attributes.name,
															index: attrIndex,
														})
													}}
												>
													Remove
												</Button>
											</div>

											{/* Hidden field for _isProductAttribute flag */}
											<input
												{...getInputProps(attributeFields._isProductAttribute, {
													type: 'hidden',
												})}
											/>
										</div>
									)
								})}
							</div>

							{/* Hidden fields for editing */}
							{lineItemFields.quotation_request_line_item_id.value && (
								<input
									{...getInputProps(
										lineItemFields.quotation_request_line_item_id,
										{ type: 'hidden' },
									)}
								/>
							)}
							<input
								{...getInputProps(lineItemFields._action, { type: 'hidden' })}
							/>
						</FieldGroup>
					)
				})}

				{/* Add New Line Item Button */}
				<div className="mt-4">
					<Button
						type="button"
						outline
						onClick={() => {
							form.insert({
								name: fields.quotation_request_line_items.name,
								defaultValue: {
									product_id: '',
									quotation_request_line_item_quantity: 1,
									attributes: [],
									new_product_category_id: '',
									new_product_name: '',
									new_product_ref: '',
									new_product_description: '',
									_action: 'keep',
								},
							})
						}}
					>
						Add Line Item
					</Button>
				</div>
			</Fieldset>

			{/* Form submission */}
			<div className="flex gap-4">
				<Button type="submit" disabled={isPending}>
					{isPending && <Spinner />}
					{isPending ? 'Saving...' : _isEditing ? 'Edit Quotation' : 'Create Quotation'}
				</Button>

				<Button type="button" outline>
					Cancel
				</Button>
			</div>

			{/* Display form-level errors */}
			{form.errors && (
				<div className="text-red-600">
					{form.errors.map((error) => (
						<p key={error}>{error}</p>
					))}
				</div>
			)}
		</Form>
	)
}
