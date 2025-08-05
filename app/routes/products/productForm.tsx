import {
	getInputProps,
	useForm,
	getFormProps,
	type SubmissionResult,
	getSelectProps,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
// eslint-disable-next-line import/consistent-type-specifier-style
import type { JsonValue } from '@prisma/client/runtime/library'
import { Form, useFormAction, useNavigation } from 'react-router'
import { z } from 'zod/v4' // Or, zod/v4 or zod/v4-mini
import { Select } from '../../components/ui/select'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Spinner } from '~/components/icons/icons'
import { Button } from '~/components/ui/button'
import {
	Description,
	ErrorMessage,
	Field,
	FieldGroup,
	Fieldset,
	Label,
} from '~/components/ui/fieldset'
import { Input } from '~/components/ui/input'

type Product = {
	product_id: string
	product_name: string
	product_ref_number: number
	product_description: string | null
	product_attributes: JsonValue
	product_category_id: string
}

interface ProductFormProps {
	isEditing: boolean
	actionData?: SubmissionResult<string[]>
	loaderData: {
		product_categories: {
			product_category_id: string
			product_category_name: string
		}[]
	}
	product?: Product
}

const MAX_ATTRIBUTES_PER_PRODUCT = 20

export const FormSchema = z.object({
	product_id: z.string().optional(),
	product_name: z
		.string({ error: 'Product name is required' })
		.min(2, 'Must be min 2 chars')
		.max(100, 'Must be max 100 chars'),
	product_ref_number: z
		.number({ error: 'Product reference number is required' })
		.positive('Must be a positive number'),
	product_description: z.string().max(500, 'Must be max 500 chars').optional(),
	product_attributes: z
		.array(
			z.object({
				key: z.string({ error: 'Key is required' }),
				value: z.string({ error: 'Value is required' }),
			}),
		)
		.optional(),
	product_category_id: z.string({ error: 'Product category ID is required' }),
})

export const getProductFormSchema = (
	existingProducts?: {
		product_id: string
		product_name: string
		product_attributes?: any
	}[],
	currentProductName?: string,
) => {
	let validationSchema = FormSchema

	if (existingProducts) {
		const productNames = new Set(
			existingProducts.map((product) =>
				product.product_name.toLocaleLowerCase().trim(),
			),
		)

		validationSchema = validationSchema.refine(
			(data) => {
				const repeatProduct = existingProducts.find(
					() =>
						productNames.has(data.product_name.toLocaleLowerCase().trim()) &&
						// Ensure we don't match the current product if editing
						data.product_name !== currentProductName,
				)
				if (!repeatProduct) return true
			},
			{
				message:
					'Product names must be unique. This product name is already used in another product.',
				path: ['product_name'],
			},
		)
	}

	for (let i = 0; i < MAX_ATTRIBUTES_PER_PRODUCT; i++) {
		validationSchema = validationSchema.refine(
			(data) => {
				if (!data.product_attributes || data.product_attributes.length <= 1) {
					return true
				}

				if (!data.product_attributes[i]) {
					return true
				}

				const currentAttributeKey = data.product_attributes[i].key
					.toLowerCase()
					.trim()

				const duplicateKeys = data.product_attributes.some((attr, index) => {
					if (index === i || !attr || !attr.key) return false
					return attr.key.toLowerCase().trim() === currentAttributeKey
				})
				return !duplicateKeys
			},
			{
				message: 'Attribute keys must be unique.',
				path: ['product_attributes', i, 'key'],
			},
		)
	}

	return validationSchema
}

export default function ProductForm({
	isEditing,
	actionData,
	loaderData,
	product,
}: ProductFormProps) {
	const navigation = useNavigation()
	const formAction = useFormAction()
	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'
	const attributes = product?.product_attributes || {}
	const defualtAttributes = Object.entries(attributes).map(([key, value]) => ({
		key,
		value,
	}))

	const [form, fields] = useForm({
		id: 'my-form',
		lastResult: actionData,
		constraint: getZodConstraint(FormSchema),
		shouldValidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: FormSchema })
		},
		defaultValue:
			isEditing && product
				? {
						product_name: product.product_name,
						product_ref_number: product.product_ref_number,
						product_description: product.product_description,
						product_attributes: defualtAttributes,
						product_category_id: product.product_category_id,
					}
				: {
						product_name: '',
						product_description: '',
						product_attributes: [{ key: '', value: '' }],
					},
	})

	const attrubutesList = fields.product_attributes.getFieldList()

	return (
		<div className="overflow-hidden rounded-lg bg-white shadow-sm">
			<div className="px-4 py-5 sm:p-6">
				<Form method="POST" {...getFormProps(form)}>
					<Fieldset>
						<FieldGroup>
							<Field className="text-left">
								<Label htmlFor={fields.product_name.id}>Product Name</Label>
								<Input
									{...getInputProps(fields.product_name, {
										type: 'text',
									})}
									invalid={!!fields.product_name.errors}
									placeholder="Enter product name"
								/>
								{fields.product_name.errors && (
									<ErrorMessage>{fields.product_name.errors}</ErrorMessage>
								)}
							</Field>
							<Field className="text-left">
								<Label htmlFor={fields.product_ref_number.id}>
									Product Ref Number
								</Label>
								<Input
									{...getInputProps(fields.product_ref_number, {
										type: 'text',
									})}
									invalid={!!fields.product_ref_number.errors}
									placeholder="Enter product reference number"
								/>
								{fields.product_ref_number.errors && (
									<ErrorMessage>
										{fields.product_ref_number.errors}
									</ErrorMessage>
								)}
							</Field>
							<Field className="text-left">
								<Label htmlFor={fields.product_description.id}>
									Product Description
								</Label>
								<Input
									{...getInputProps(fields.product_description, {
										type: 'text',
									})}
									invalid={!!fields.product_description.errors}
									placeholder="Enter product description"
								/>
								{fields.product_description.errors && (
									<ErrorMessage>
										{fields.product_description.errors}
									</ErrorMessage>
								)}
							</Field>
							<Field className="text-left">
								<Label htmlFor={fields.product_category_id.id}>
									Product Category
								</Label>
								<Select
									{...getSelectProps(fields.product_category_id)}
									invalid={!!fields.product_category_id.errors}
								>
									<option value="">Select a category</option>
									{loaderData.product_categories?.map((category) => (
										<option
											key={category.product_category_id}
											value={category.product_category_id}
										>
											{category.product_category_name}
										</option>
									))}
								</Select>
							</Field>
							<FieldGroup>
								<Field className="text-left">
									<Label htmlFor={fields.product_attributes.id}>
										Product Attributes
									</Label>
									<Description>Optional additional attributes.</Description>
									{attrubutesList.map((field, index) => {
										const attributeFields = field.getFieldset()
										return (
											<Fieldset key={field.key}>
												<div className="mb-2 flex items-start gap-2">
													<Field className="flex-1">
														<Label htmlFor={attributeFields.key.id}>
															Attribute Key
														</Label>
														<Input
															{...getInputProps(attributeFields.key, {
																type: 'text',
															})}
															invalid={!!attributeFields.key.errors}
															placeholder="Enter attribute key"
														/>
														{attributeFields.key.errors && (
															<ErrorMessage>
																{attributeFields.key.errors}
															</ErrorMessage>
														)}
													</Field>
													<Field className="flex-1">
														<Label htmlFor={attributeFields.value.id}>
															Attribute Value
														</Label>
														<Input
															{...getInputProps(attributeFields.value, {
																type: 'text',
															})}
															invalid={!!attributeFields.value.errors}
															placeholder="Enter attribute value"
														/>
														{attributeFields.value.errors && (
															<ErrorMessage>
																{attributeFields.value.errors}
															</ErrorMessage>
														)}
													</Field>
													<div className="pt-9">
														<Button
															type="button"
															onClick={() =>
																form.remove({
																	name: fields.product_attributes.name,
																	index,
																})
															}
															disabled={attrubutesList.length === 0}
														>
															Remove Attribute
														</Button>
													</div>
												</div>
											</Fieldset>
										)
									})}
									{fields.product_attributes.errors && (
										<ErrorMessage>
											{fields.product_attributes.errors}
										</ErrorMessage>
									)}
								</Field>
							</FieldGroup>
							<Button
								type="button"
								onClick={() =>
									form.insert({ name: fields.product_attributes.name })
								}
							>
								Add Attribute
							</Button>
						</FieldGroup>
						{form.errors && (
							<div className="rounded-md bg-red-50 p-4">
								<div className="text-sm text-red-700">
									{form.errors.join(', ')}
								</div>
							</div>
						)}
					</Fieldset>
					<div className="mt-10 flex gap-4">
						<Button type="submit" disabled={isPending} color="indigo">
							{isPending ? (
								<>
									<Spinner />
									Creating...
								</>
							) : isEditing ? (
								'Edit'
							) : (
								'Submit'
							)}
						</Button>

						<Button type="reset">Reset</Button>
					</div>
				</Form>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
