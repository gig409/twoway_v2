import type { Route } from "./+types/product_categories.new";
import { redirect } from "react-router";
import { parseWithZod } from '@conform-to/zod/v4'; // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import prisma from '~/lib/prisma';
import ProductCategoryForm, {FormSchema} from "./product_categories_form";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Add New Product Category" },
        { name: "description", content: "Add/Edit product categories" },
    ];
}

export async function loader({params}: Route.LoaderArgs) { 
    return { message: "Hello from the loader!" };
}

export async function action({request}: Route.ActionArgs) {
    const formData = await request.formData();

    const submission = parseWithZod(formData, {
        schema: FormSchema
    });

    if (submission.status !== 'success') {
        console.log("errors:", submission);
        return submission.reply();
    }

    const { product_category_name, product_category_attributes } = submission.value;

    try {
        await prisma.productCategory.create({
            data: {
                product_category_id: crypto.randomUUID(),
                product_category_name,
                product_category_attributes
            }
        });

        return redirect("/dashboard/companies");
    } catch (error) {
        console.error('Failed to create company:', error);
        return submission.reply({
            formErrors: ["Failed to create company. Please try again."],
        });
    }
};

export default function ProductCategoryNew({actionData}: Route.ComponentProps) {
  return (
    <div>
        <ProductCategoryForm isEditing={false} actionData={actionData}></ProductCategoryForm>
    </div>
  );
}

