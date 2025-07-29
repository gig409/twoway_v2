import type { Route } from "./+types/companies.new";
import { Form, useFormAction, useNavigation } from "react-router";
import { Input } from "~/components/ui/input";
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from "~/components/ui/fieldset";
import { Select } from "~/components/ui/select";
import { Text } from "~/components/ui/text";
import { Button } from "@headlessui/react";
import { getInputProps, useForm, getFormProps } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'; // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { z } from 'zod/v4'; // Or, zod/v4 or zod/v4-mini

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Company Form" },
        { name: "description", content: "Add/Edit company information" },
    ];
}

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

type Company = {
  company_id: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_country: string;
  company_type: number;
};

interface CompanyFormProps {
  isEditing: boolean;
  actionData?: any;
  company?: Company;
}

export const FormSchema = z.object({
    company_name: z.string({error: "Company name is required"}).min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    company_email: z.email("Must be a valid email").max(100, "Must be max 100 chars"),
    company_phone: z.string({error: "Phone number is required"}).min(10, "Must be min 10 digits").max(20, "Must be max 15 digits").regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Please enter a valid mobile number'),
    company_add1: z.string({error: "Street address is required"}).min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    company_add2: z.string().max(100, "Must be max 100 chars").optional(),
    country: z.string().min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    company_city: z.string({error: "City is required"}).min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    company_post_code: z.string({error: "Post code is required"}).min(2, "Must be min 2 chars").max(20, "Must be max 20 chars"),
    company_type: z.string(),
});

export default function CompanyForm({ isEditing, actionData, company }: CompanyFormProps) {
        const navigation = useNavigation()
	const formAction = useFormAction()
	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

  const address = company ? company.company_address.split(",") : [];
  if (address.length == 3) {

  }

  const [form, fields] = useForm({
    id: "my-form",
    lastResult: actionData,
    constraint: getZodConstraint(FormSchema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FormSchema});
    },
    defaultValue: company ? {
        company_name: company.company_name,
        company_email: company.company_email,
        company_phone: company.company_phone,
        company_add1: address[0],
        company_add2: address.length > 3 ? address[1].trim() : "",
        country: company.company_country,
        company_city: address.length > 3 ? address[2].trim() : address[1].trim(),
        company_post_code: address.length > 3 ? address[3].trim() : address[2].trim(),
        company_type: company.company_type.toString(),
    } : undefined,
  });

  console.log("Form submission errors:", actionData);
  console.log("Fields:", fields);

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="px-4 py-5 sm:p-6">
            <Form method="POST" {...getFormProps(form)}>
            {/* ... */}
            <Fieldset>
                <Legend>Company details</Legend>
                <Text>Enter relevant details of company.</Text>
                <FieldGroup>
                    <Field>
                        <Label htmlFor={fields.company_name.id}>Company Name</Label>
                        <Input {...getInputProps(fields.company_name, {type: 'text'})} invalid={!!fields.company_name.errors} placeholder="Enter company name" />
                        {fields.company_name.errors && <ErrorMessage>{fields.company_name.errors}</ErrorMessage>}
                    </Field>
                    <Field>
                        <Label htmlFor={fields.company_email.id}>Company Email</Label>
                        <Input {...getInputProps(fields.company_email, {type: 'email'})} invalid={!!fields.company_email.errors} placeholder="Enter company email" />
                        {fields.company_email.errors && <ErrorMessage>{fields.company_email.errors}</ErrorMessage>}
                    </Field>
                    <Field>
                        <Label>Company Phone</Label>
                        <Input {...getInputProps(fields.company_phone, {type: 'tel'})} invalid={!!fields.company_phone.errors} placeholder="Enter company phone number" />
                        {fields.company_phone.errors && <ErrorMessage>{fields.company_phone.errors}</ErrorMessage>}
                    </Field>
                    <Field>
                        <Label>Company Street Address 1</Label>
                        <Input {...getInputProps(fields.company_add1, {type: 'text'})} invalid={!!fields.company_add1.errors} placeholder="Enter company street address" />
                        {fields.company_add1.errors && <ErrorMessage>{fields.company_add1.errors}</ErrorMessage>}
                    </Field>
                    <Field>
                        <Label>Company Street Address 2</Label>
                        <Input {...getInputProps(fields.company_add2, {type: 'text'})} invalid={!!fields.company_add2.errors} placeholder="Enter company street address" />
                        {fields.company_add2.errors && <ErrorMessage>{fields.company_add2.errors}</ErrorMessage>}
                        <Description>Optional additional address line.</Description>
                    </Field>
                    <Field>
                        <Label>Company City</Label>
                        <Input {...getInputProps(fields.company_city, {type: 'text'})} invalid={!!fields.company_city.errors} placeholder="Enter company city" />
                        {fields.company_city.errors && <ErrorMessage>{fields.company_city.errors}</ErrorMessage>}
                    </Field>
                    <Field>
                        <Label>Company Post Code</Label>
                        <Input {...getInputProps(fields.company_post_code, {type: 'text'})} invalid={!!fields.company_post_code.errors} placeholder="Enter company post code" />
                        {fields.company_post_code.errors && <ErrorMessage>{fields.company_post_code.errors}</ErrorMessage>}
                    </Field>
                    <Field>
                        <Label>Country</Label>
                        <Select name={fields.country.name} defaultValue={fields.country.initialValue} invalid={!!fields.country.errors}>
                        <option>Canada</option>
                        <option>Mexico</option>
                        <option>United States</option>
                        </Select>
                        {fields.country.errors && <ErrorMessage>{fields.country.errors}</ErrorMessage>}
                        <Description>We currently only ship to North America.</Description>
                    </Field>
                    <Field>
                        <Label>Company Type</Label>
                        <Select name={fields.company_type.name} defaultValue={fields.company_type.initialValue} invalid={!!fields.company_type.errors}>
                        <option value='1'>TwoWay</option>
                        <option value='2'>Supplier</option>
                        <option value='3'>Client</option>
                        </Select>
                        {fields.company_type.errors && <ErrorMessage>{fields.company_type.errors}</ErrorMessage>}
                    </Field>
                </FieldGroup>
            </Fieldset>

                  <div className="mt-10 flex gap-4">
            <Button type="submit" disabled={isPending} color="indigo">
                {isPending ? (
                    <>
                        <Spinner />
                        Creating...
                    </>
                ) : (
                    'Submit'
                )}
            </Button>

            <Button type="reset">Reset</Button>
        </div>
            
        </Form>
      </div>
    </div>
  );
}

