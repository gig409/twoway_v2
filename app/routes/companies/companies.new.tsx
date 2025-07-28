import type { Route } from "./+types/companies.new";
import { redirect } from "react-router";
import { parseWithZod } from '@conform-to/zod/v4'; // Or, if you use zod/v4 or zod/v4-mini, import `@conform-to/zod/v4`.
import prisma from '~/lib/prisma';
import CompanyForm, {FormSchema} from "./companyForm";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Company Form" },
        { name: "description", content: "Add/Edit company information" },
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

    // const { street_address, country, notes } = submission.value;
    // console.log("Form submission values:", { street_address, country, notes });
    const { company_name, company_email, company_phone, company_add1, company_add2, country, company_city, company_post_code, company_type } = submission.value;

    try {
        await prisma.company.create({
            data: {
                company_id: crypto.randomUUID(),
                company_name,
                company_email,
                company_phone: company_phone.toString(),
                company_address: company_add1 + (company_add2 ? `, ${company_add2}` : "") + `, ${company_city},  ${company_post_code}`,
                company_country: country,
                company_type: parseInt(company_type, 10),
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

export default function CompanyNew({actionData}: Route.ComponentProps) {
  return (
    <div>
        <CompanyForm isEditing={false} actionData={actionData}></CompanyForm>
    </div>
  );
}

