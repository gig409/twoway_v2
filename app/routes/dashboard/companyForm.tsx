import type { Route } from "./+types/companyForm";
import { Form } from "react-router";
import { Input } from "~/components/ui/input";
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from "~/components/ui/fieldset";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
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
  street_address: z.preprocess((val) => (val === '' || val === undefined ? undefined : val), z.string().min(2, "Must be min 2 chars").max(100, "Must be max 100 chars")),
  country: z.string("Must be a string").min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
  notes: z.string("Must be a string").max(500, "Must be max 500 chars").optional(),
});

const ServerSchema = z.object({
  street_address: z.string("Must be a string").min(10, "Must be min 10 chars").max(100, "Must be max 100 chars"),
  country: z.string("Must be a string").min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
  notes: z.string("Must be a string").max(500, "Must be max 500 chars").optional(),
});

export async function loader({params}: Route.LoaderArgs) {
  return { message: "Hello from the loader!" };
}

export async function action({request}: Route.ActionArgs) {
  const formData = await request.formData();

  console.log("Form submission data:", Object.fromEntries(formData.entries()));

  const submission = parseWithZod(formData, {
    schema: ServerSchema
  });

  console.log("Form submission status:", submission.status);

  if (submission.status !== 'success') {
    console.log("errors:", submission);
    return submission.reply();
  }

  const { street_address, country, notes } = submission.value;
  console.log("Form submission values:", { street_address, country, notes });

  return null
};

export default function CompanyForm({loaderData, actionData}: Route.ComponentProps) {
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
                <Label htmlFor={fields.street_address.id}>Street address</Label>
                <Input {...getInputProps(fields.street_address, {type: "text"})} invalid={!!fields.street_address.errors} />
                {fields.street_address.errors && <ErrorMessage>{fields.street_address.errors}</ErrorMessage>}
              </Field>
              <Field>
                <Label>Country</Label>
                <Select name="country">
                  <option>Canada</option>
                  <option>Mexico</option>
                  <option>United States</option>
                </Select>
                <Description>We currently only ship to North America.</Description>
              </Field>
              <Field>
                <Label>Delivery notes</Label>
                <Textarea name="notes" />
                <Description>If you have a tiger, we'd like to know about it.</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
          <Button type="submit" className="mt-4">Submit</Button>
          <Button type="reset" className="mt-4 ml-2">Reset</Button>
        </Form>
      </div>
    </div>
  );
}

