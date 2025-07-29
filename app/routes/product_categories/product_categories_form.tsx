// import type { Route } from "./+types/companies.new";
import { Form } from "react-router";
import { Input } from "~/components/ui/input";
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from "~/components/ui/fieldset";
import { Select } from "~/components/ui/select";
import { Text } from "~/components/ui/text";
import { Button } from "@headlessui/react";
import { getInputProps, useForm, getFormProps } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'; // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import { z } from 'zod/v4'; // Or, zod/v4 or zod/v4-mini

// export function meta({}: Route.MetaArgs) {
//     return [
//         { title: "Company Form" },
//         { name: "description", content: "Add/Edit company information" },
//     ];
// }

type ProductCategory = {
    category_id: string;
    category_name: string;
    category_attributes: JSON;
};

interface ProductCategoryFormProps {
  isEditing: boolean;
  actionData?: any;
  product_category?: ProductCategory;
}

export const FormSchema = z.object({
    product_category_name: z.string({error: "Product category name is required"}).min(2, "Must be min 2 chars").max(100, "Must be max 100 chars"),
    product_category_attributes: z.string().min(2, "Must be min 2 chars").max(500, "Must be max 500 chars").optional(),
});

export default function ProductCategoryForm({ isEditing, actionData, product_category }: ProductCategoryFormProps) {
  let keys:String = ""
  let values:String = ""
  const attributes = product_category?.category_attributes || {};

  for (const key in attributes) {
    keys += `${key}, `
    values += `${attributes}, `
  }

  const [form, fields] = useForm({
    id: "my-form",
    lastResult: actionData,
    constraint: getZodConstraint(FormSchema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FormSchema});
    },
    defaultValue: product_category ? {
        product_category_name: product_category.category_name,
        product_category_attributes: JSON.stringify(product_category.category_attributes),
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
                <Legend>Product Category details</Legend>
                <Text>Enter relevant details of product category.</Text>
                <FieldGroup>
                    <Field>
                        <Label htmlFor={fields.product_category_name.id}>Product Category Name</Label>
                        <Input {...getInputProps(fields.product_category_name, {type: 'text'})} invalid={!!fields.product_category_name.errors} placeholder="Enter product category name" />
                        {fields.product_category_name.errors && <ErrorMessage>{fields.product_category_name.errors}</ErrorMessage>}
                    </Field>
                    <Field>
                        <Label htmlFor={fields.product_category_attributes.id}>Product Category Attributes</Label>
                        <Description>Optional attributes.</Description>
                        <Input {...getInputProps(fields.product_category_attributes, {type: 'text'})} invalid={!!fields.product_category_attributes.errors} placeholder="Enter product category attributes" />
                        {fields.product_category_attributes.errors && <ErrorMessage>{fields.product_category_attributes.errors}</ErrorMessage>}
                    </Field>
                </FieldGroup>
            </Fieldset>
            <Button type="submit" className="mt-4">{isEditing ? "Edit" : "Submit"}</Button>
            <Button type="reset" className="mt-4 ml-2">Reset</Button>
        </Form>
      </div>
    </div>
  );
}

