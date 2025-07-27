import type { Route } from "./+types/companies.new";
import { Form } from "react-router";
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

const FormSchema = z.object({
    company_name: z.string({error: "Company name is required"}).min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    company_email: z.email("Must be a valid email").max(100, "Must be max 100 chars"),
    company_phone: z.number("Must be a number").min(1000000000, "Must be min 10 digits").max(999999999999999, "Must be max 15 digits"),
    company_add1: z.string({error: "Street address is required"}).min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    company_add2: z.string().max(100, "Must be max 100 chars").optional(),
    country: z.string().min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    company_city: z.string({error: "City is required"}).min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    company_post_code: z.string({error: "Post code is required"}).min(2, "Must be min 2 chars").max(20, "Must be max 20 chars"),
});

export async function loader({params}: Route.LoaderArgs) {
    return { message: "Hello from the loader!" };
}

export async function action({request}: Route.ActionArgs) {
    const formData = await request.formData();

    console.log("Form submission data:", Object.fromEntries(formData.entries()));

    const submission = parseWithZod(formData, {
        schema: FormSchema
    });

    console.log("Form submission status:", submission.status);

    if (submission.status !== 'success') {
        console.log("errors:", submission);
        return submission.reply();
    }

    // const { street_address, country, notes } = submission.value;
    // console.log("Form submission values:", { street_address, country, notes });
    const { company_name, company_email, company_phone, company_add1, company_add2, country, company_city, company_post_code } = submission.value;
    console.log("Form submission values:", { company_name, company_email, company_phone, company_add1, company_add2, country, company_city, company_post_code });

    return null
};

export default function CompanyNew({loaderData, actionData}: Route.ComponentProps) {
  const { message } = loaderData;

  const [form, fields] = useForm({
    id: "my-form",
    lastResult: actionData,
    constraint: getZodConstraint(FormSchema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FormSchema});
    },
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
                    {/* <Field>
                        <Label htmlFor={fields.street_address.id}>Street address</Label>
                        <Input {...getInputProps(fields.street_address, {type: "text"})} invalid={!!fields.street_address.errors} />
                        {fields.street_address.errors && <ErrorMessage>{fields.street_address.errors}</ErrorMessage>}
                    </Field> */}
                    {/* <Field>
                        <Label>Delivery notes</Label>
                        <Textarea name="notes" />
                        <Description>If you have a tiger, we'd like to know about it.</Description>
                    </Field> */}
                </FieldGroup>
            </Fieldset>
            <Button type="submit" className="mt-4">Submit</Button>
            <Button type="reset" className="mt-4 ml-2">Reset</Button>
        </Form>
      </div>
    </div>
  );
}

