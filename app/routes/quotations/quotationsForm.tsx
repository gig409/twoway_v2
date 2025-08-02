import {
	getInputProps,
	useForm,
	getFormProps,
	type SubmissionResult,
	getSelectProps,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4' // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { type Prisma } from '@prisma/client'
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
	loaderData?: { companies: { company_id: string; company_name: string }[] }
}

// Add this Zod schema after your type definitions and before the component

export const QuotationFormSchema = z.object({
    // Basic quotation fields
    quotation_request_ref: z
        .string({ error: 'Reference is required' })
        .min(1, 'Reference must not be empty')
        .max(50, 'Reference must be max 50 characters'),
    
    quotation_request_date: z
        .string({ error: 'Date is required' })
        .refine((date) => !isNaN(Date.parse(date)), {
            message: 'Please enter a valid date',
        }),
    
    quotation_request_vessel: z
        .string({ error: 'Vessel name is required' })
        .min(2, 'Vessel name must be at least 2 characters')
        .max(100, 'Vessel name must be max 100 characters'),
    
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
                
                // Product selection
                product_id: z
                    .string({ error: 'Please select a product' })
                    .uuid('Invalid product selection'),
                
                // Quantity
                quotation_request_line_item_quantity: z
                    .number({ error: 'Quantity is required' })
                    .int('Quantity must be a whole number')
                    .min(1, 'Quantity must be at least 1')
                    .max(10000, 'Quantity cannot exceed 10,000'),
                
                // Optional: Mark for deletion (when editing)
                _action: z.enum(['keep', 'delete']).optional(),
            })
        )
        .min(1, 'At least one line item is required')
        .max(50, 'Cannot exceed 50 line items'),
})

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
        constraint: getZodConstraint(QuotationFormSchema), // Use the new schema
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: QuotationFormSchema })
        },
        shouldRevalidate: 'onBlur',
        // Default values for editing
        defaultValue: quotation ? {
            quotation_request_ref: quotation.quotation_request_ref,
            quotation_request_date: quotation.quotation_request_date.toISOString().split('T')[0], // Format for date input
            quotation_request_vessel: quotation.quotation_request_vessel,
            company_id: quotation.company.company_id,
            employee_id: quotation.employee.employee_id,
            quotation_request_line_items: quotation.quotation_request_line_items.map(item => ({
                quotation_request_line_item_id: item.quotation_request_line_item_id,
                product_id: item.product.product_id,
                quotation_request_line_item_quantity: item.quotation_request_line_item_quantity,
                _action: 'keep' as const,
            }))
        } : {
            quotation_request_line_items: [{
                product_id: '',
                quotation_request_line_item_quantity: 1,
            }]
        }
    })

    // Extract field lists for line items
    const lineItemsList = fields.quotation_request_line_items.getFieldList()

    return (
        <Form method="post" {...getFormProps(form)} className="space-y-6">
            <Fieldset>
                <FieldGroup>
                    {/* Basic quotation fields */}
                    <Field>
                        <Label htmlFor={fields.quotation_request_ref.id}>
                            Reference
                        </Label>
                        <Input
                            {...getInputProps(fields.quotation_request_ref, { type: 'text' })}
                            placeholder="QR-2024-001"
                        />
                        {fields.quotation_request_ref.errors && (
                            <ErrorMessage>
                                {fields.quotation_request_ref.errors}
                            </ErrorMessage>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor={fields.quotation_request_date.id}>
                            Date
                        </Label>
                        <Input
                            {...getInputProps(fields.quotation_request_date, { type: 'date' })}
                        />
                        {fields.quotation_request_date.errors && (
                            <ErrorMessage>
                                {fields.quotation_request_date.errors}
                            </ErrorMessage>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor={fields.quotation_request_vessel.id}>
                            Vessel
                        </Label>
                        <Input
                            {...getInputProps(fields.quotation_request_vessel, { type: 'text' })}
                            placeholder="MV Example Vessel"
                        />
                        {fields.quotation_request_vessel.errors && (
                            <ErrorMessage>
                                {fields.quotation_request_vessel.errors}
                            </ErrorMessage>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor={fields.company_id.id}>
                            Company
                        </Label>
                        <Select {...getSelectProps(fields.company_id)}>
                            <option value="">Select a company</option>
                            {loaderData?.companies.map((company) => (
                                <option key={company.company_id} value={company.company_id}>
                                    {company.company_name}
                                </option>
                            ))}
                        </Select>
                        {fields.company_id.errors && (
                            <ErrorMessage>
                                {fields.company_id.errors}
                            </ErrorMessage>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor={fields.employee_id.id}>
                            Employee
                        </Label>
                        <Select {...getSelectProps(fields.employee_id)}>
                            <option value="">Select an employee</option>
                            {/* You'll need to add employee options based on selected company */}
                        </Select>
                        {fields.employee_id.errors && (
                            <ErrorMessage>
                                {fields.employee_id.errors}
                            </ErrorMessage>
                        )}
                    </Field>
                </FieldGroup>
            </Fieldset>

            {/* Line Items Section */}
            <Fieldset>
                <legend className="text-base font-semibold leading-6 text-gray-900">
                    Line Items
                </legend>
                
                {lineItemsList.map((lineItemField, index) => {
                    const lineItemFields = lineItemField.getFieldset()
                    return (
                        <FieldGroup key={lineItemField.key} className="border-t pt-4 mt-4">
                            <Field>
                                <Label htmlFor={lineItemFields.product_id.id}>
                                    Product {index + 1}
                                </Label>
                                <Select {...getSelectProps(lineItemFields.product_id)}>
                                    <option value="">Select a product</option>
                                    {/* You'll need to add product options */}
                                </Select>
                                {lineItemFields.product_id.errors && (
                                    <ErrorMessage>
                                        {lineItemFields.product_id.errors}
                                    </ErrorMessage>
                                )}
                            </Field>

                            <Field>
                                <Label htmlFor={lineItemFields.quotation_request_line_item_quantity.id}>
                                    Quantity
                                </Label>
                                <Input
                                    {...getInputProps(lineItemFields.quotation_request_line_item_quantity, { type: 'number' })}
                                    min="1"
                                    max="10000"
                                />
                                {lineItemFields.quotation_request_line_item_quantity.errors && (
                                    <ErrorMessage>
                                        {lineItemFields.quotation_request_line_item_quantity.errors}
                                    </ErrorMessage>
                                )}
                            </Field>

                            {/* Hidden fields for editing */}
                            {lineItemFields.quotation_request_line_item_id.value && (
                                <input
                                    {...getInputProps(lineItemFields.quotation_request_line_item_id, { type: 'hidden' })}
                                />
                            )}
                            <input
                                {...getInputProps(lineItemFields._action, { type: 'hidden' })}
                                value="keep"
                            />
                        </FieldGroup>
                    )
                })}

                {/* Add/Remove line item buttons would go here */}
            </Fieldset>

            {/* Form submission */}
            <div className="flex gap-4">
                <Button type="submit" disabled={isPending}>
                    {isPending && <Spinner />}
                    {isPending ? 'Saving...' : 'Save Quotation'}
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