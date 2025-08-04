import { faker } from '@faker-js/faker'
import { PrismaClient } from '../generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
	// Clear all tables (order matters due to foreign keys)
	await prisma.order_Line_Item.deleteMany()
	await prisma.supplier_Invoice.deleteMany()
	await prisma.client_Invoice.deleteMany()
	await prisma.commercial_Invoice.deleteMany()
	await prisma.order.deleteMany()
	await prisma.supplier_Quotation.deleteMany()
	await prisma.quotation_Request_Line_Item.deleteMany()
	await prisma.quotation_Request.deleteMany()
	await prisma.product.deleteMany()
	await prisma.productCategory.deleteMany()
	await prisma.user.deleteMany()
	await prisma.employee.deleteMany()
	await prisma.company.deleteMany()

	// Seed Companies
	const companies = []
	for (let i = 0; i < 3; i++) {
		companies.push(
			await prisma.company.create({
				data: {
					company_id: faker.string.uuid(),
					company_name: faker.company.name(),
					company_email: faker.internet.email(),
					company_phone: faker.phone.number(),
					company_address: faker.location.streetAddress(),
					company_country: faker.location.country(),
					company_type: faker.number.int({ min: 1, max: 3 }),
				},
			}),
		)
	}

	// Seed Product Categories
	const categories = []
	for (let i = 0; i < 3; i++) {
		categories.push(
			await prisma.productCategory.create({
				data: {
					product_category_id: faker.string.uuid(),
					product_category_name: faker.commerce.department(),

				},
			}),
		)
	}

	// Seed Products
	const products: any[] = []
	for (let i = 0; i < 10; i++) {
		const category = faker.helpers.arrayElement(categories)
		products.push(
			await prisma.product.create({
				data: {
					product_id: faker.string.uuid(),
					product_name: faker.commerce.productName(),
					product_ref_number: faker.number.int({ min: 1000, max: 9999 }),
					product_description: faker.commerce.productDescription(),
					product_attributes: { size: faker.commerce.productMaterial() },
					product_category_id: category.product_category_id,
				},
			}),
		)
	}

	// Seed Employees and Users
	const employees = []
	const users = []
	for (const company of companies) {
		for (let i = 0; i < 5; i++) {
			const employee = await prisma.employee.create({
				data: {
					employee_id: faker.string.uuid(),
					employee_name: faker.person.fullName(),
					employee_mobile: faker.phone.number(),
					employee_email: faker.internet.email(),
					employee_position: faker.person.jobTitle(),
					position: faker.person.jobType(),
					company_id: company.company_id,
				},
			})
			employees.push(employee)

			const user = await prisma.user.create({
				data: {
					employee_id: employee.employee_id,
					username: faker.internet.username(),
					password: faker.internet.password(),
				},
			})
			users.push(user)
		}
	}

	const quotationRequests = []
	for (let i = 0; i < 5; i++) {
		const employee = faker.helpers.arrayElement(employees)
		const user = faker.helpers.arrayElement(users)
		const quotationRequest = await prisma.quotation_Request.create({
			data: {
				quotation_request_id: faker.string.uuid(),
				quotation_request_ref: faker.string.alphanumeric(8),
				quotation_request_date: faker.date.recent(),
				quotation_request_vessel: faker.word.words(2),
				employee_id: employee.employee_id,
				company_id: employee.company_id,
				user_id: user.employee_id,

				// Add more fields if your schema requires them
				quotation_request_line_items: {
					create: Array.from({ length: 3 }).map(() => ({
						quotation_request_line_item_id: faker.string.uuid(),
						product_id: faker.helpers.arrayElement(products).product_id,
						quotation_request_line_item_quantity: faker.number.int({
							min: 1,
							max: 10,
						}),
					})),
				},
			},
			include: { quotation_request_line_items: true },
		})
		quotationRequests.push(quotationRequest)
	}

	// Seed Supplier Quotations
	const supplierQuotations = []
	for (let i = 0; i < 5; i++) {
		const company = faker.helpers.arrayElement(companies) // Pick a random company
		const quotationRequest = faker.helpers.arrayElement(quotationRequests)
		const lineItem = faker.helpers.arrayElement(
			quotationRequest.quotation_request_line_items,
		)
		const supplierQuotation = await prisma.supplier_Quotation.create({
			data: {
				supplier_quotation_id: faker.string.uuid(),
				supplier_quotation_supplier_date: faker.date.recent(),
				supplier_quotation_supplier_price: Number(faker.commerce.price()),
				supplier_quotation_lead_time: faker.date.soon(),
				supplier_quotation_client_date: faker.date.recent(),
				supplier_quotation_client_price: Number(faker.commerce.price()),
				supplier_quotation_accepted: faker.datatype.boolean(),
				supplier_quotation_status: Number('1'), // Example status
				quotation_request_line_item_id: lineItem.quotation_request_line_item_id,
				company_id: company.company_id, // Attach company
			},
		})
		supplierQuotations.push(supplierQuotation)
	}

	// Seed Orders
	const orders = []
	// Use only the first 3 quotation requests to avoid duplicate order IDs
	const quotationRequestsForOrders = quotationRequests.slice(0, 3)

	for (let i = 0; i < 3; i++) {
		const quotationRequest = quotationRequestsForOrders[i]
		const order = await prisma.order.create({
			data: {
				order_id: quotationRequest.quotation_request_id, // Order ID must match quotation request ID
				order_client_ref: faker.string.alphanumeric(8),
				order_supplier_ref: faker.string.alphanumeric(8),
				order_address: faker.location.streetAddress(),
				order_country: faker.location.country(),
				order_status: faker.number.int({ min: 0, max: 4 }), // 0: Pending, 1: Confirmed, 2: Shipped, 3: Delivered, 4: Cancelled
				order_supplier_purchase_order_date: faker.date.recent(),
				order_client_purchase_order_date: faker.date.recent(),
				order_client_payment_status: faker.number.int({ min: 0, max: 2 }), // 0: Unpaid, 1: Paid, 2: Partially Paid
				order_supplier_payment_status: faker.number.int({ min: 0, max: 2 }), // 0: Unpaid, 1: Paid, 2: Partially Paid
				order_vessel: faker.word.words(2),
				order_date: faker.date.recent(),
			},
		})
		orders.push(order)
	}

	// Seed Order Line Items
	const orderLineItems = []
	// Use only the first 5 supplier quotations to avoid duplicate supplier_quotation_id
	const supplierQuotationsForOrderItems = supplierQuotations.slice(0, 5)

	for (let i = 0; i < 5; i++) {
		const order = faker.helpers.arrayElement(orders)
		const supplierQuotation = supplierQuotationsForOrderItems[i]

		const orderLineItem = await prisma.order_Line_Item.create({
			data: {
				order_line_item_id: faker.string.uuid(),
				order_line_item_quantity: faker.number.int({ min: 1, max: 10 }),
				order_line_item_price: Number(faker.commerce.price()),
				order_line_item_values: { notes: faker.lorem.sentence() },
				supplier_quotation_id: supplierQuotation.supplier_quotation_id,
				order_id: order.order_id,
			},
		})
		orderLineItems.push(orderLineItem)
	}
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
