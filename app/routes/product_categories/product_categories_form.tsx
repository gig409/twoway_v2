import { Form, useFormAction, useNavigation } from 'react-router'
import { Input } from '~/components/ui/input'
import {
	Description,
	ErrorMessage,
	Field,
	FieldGroup,
	Fieldset,
	Label,
	Legend,
} from '~/components/ui/fieldset'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import {
	getInputProps,
	useForm,
	getFormProps,
	type SubmissionResult,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { z } from 'zod/v4' // Or, zod/v4 or zod/v4-mini
import { GeneralErrorBoundary } from '~/components/error-boundary'
import type { JsonValue } from '@prisma/client/runtime/library'

// Spinner component
function Spinner({
	className = 'animate-spin -ml-1 mr-3 h-5 w-5 text-white',
}: {
	className?: string
}) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle
				className="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="4"
			></circle>
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	)
}

type ProductCategory = {
	product_category_id: string
	product_category_name: string
	product_category_attributes: JsonValue
}

interface ProductCategoryFormProps {
	isEditing: boolean
	actionData?: SubmissionResult<string[]>
	product_category?: ProductCategory
}

export const FormSchema = z.object({
	product_category_name: z
		.string({ error: 'Product category name is required' })
		.min(2, 'Must be min 2 chars')
		.max(100, 'Must be max 100 chars'),
	product_category_attributes: z
		.array(
			z.object({
				key: z.string({ error: 'Key is required' }),
				value: z.string({ error: 'Value is required' }),
			}),
		)
		.optional(),
})

export default function ProductCategoryForm({
	isEditing,
	actionData,
	product_category,
}: ProductCategoryFormProps) {
	const navigation = useNavigation()
	const formAction = useFormAction()
	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'
	const attributes = product_category?.product_category_attributes || {}
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
			isEditing && product_category
				? {
						product_category_name: product_category.product_category_name,
						product_category_attributes: defualtAttributes,
					}
				: {
						product_category_name: '',
						product_category_attributes: [{ key: '', value: '' }],
					},
	})

	const attrubutesList = fields.product_category_attributes.getFieldList()

	console.log('Form submission errors:', actionData)
	console.log('Fields:', fields)

	return (
		<div className="overflow-hidden rounded-lg bg-white shadow-sm">
			<div className="px-4 py-5 sm:p-6">
				<Form method="POST" {...getFormProps(form)}>
					<Fieldset>
						<FieldGroup>
							<Field className="text-left">
								<Label htmlFor={fields.product_category_name.id}>
									Product Category Name
								</Label>
								<Input
									{...getInputProps(fields.product_category_name, {
										type: 'text',
									})}
									invalid={!!fields.product_category_name.errors}
									placeholder="Enter product category name"
								/>
								{fields.product_category_name.errors && (
									<ErrorMessage>
										{fields.product_category_name.errors}
									</ErrorMessage>
								)}
							</Field>
							<FieldGroup>
								<Field className="text-left">
									<Label htmlFor={fields.product_category_attributes.id}>
										Product Category Attributes
									</Label>
									<Description>Optional attributes.</Description>
									{attrubutesList.map((field, index) => {
										const attributeFields = field.getFieldset()
										return (
											<Fieldset key={field.key}>
												<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
													<Field>
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
													<Field>
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
												</div>
												<Button
													type="button"
													onClick={() =>
														form.remove({
															name: fields.product_category_attributes.name,
															index,
														})
													}
													disabled={attrubutesList.length === 0}
												>
													Remove Attribute
												</Button>
											</Fieldset>
										)
									})}
									{fields.product_category_attributes.errors && (
										<ErrorMessage>
											{fields.product_category_attributes.errors}
										</ErrorMessage>
									)}
								</Field>
							</FieldGroup>
							<Button
								type="button"
								onClick={() =>
									form.insert({ name: fields.product_category_attributes.name })
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
