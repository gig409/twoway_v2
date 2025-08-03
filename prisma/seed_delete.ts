import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllData() {
	console.log('🗑️  Starting to delete all data...')

	try {
		// Delete in reverse order of dependencies to avoid foreign key constraint errors

		// 1. Delete Client_Invoice (depends on Order)
		const deletedClientInvoices = await prisma.client_Invoice.deleteMany({})
		console.log(`✅ Deleted ${deletedClientInvoices.count} client invoices`)

		// 2. Delete Commercial_Invoice (depends on Order)
		const deletedCommercialInvoices =
			await prisma.commercial_Invoice.deleteMany({})
		console.log(
			`✅ Deleted ${deletedCommercialInvoices.count} commercial invoices`,
		)

		// 3. Delete Order_Line_Item (depends on Order and Supplier_Quotation)
		const deletedOrderLineItems = await prisma.order_Line_Item.deleteMany({})
		console.log(`✅ Deleted ${deletedOrderLineItems.count} order line items`)

		// 4. Delete Supplier_Invoice (referenced by Order_Line_Item)
		const deletedSupplierInvoices = await prisma.supplier_Invoice.deleteMany({})
		console.log(`✅ Deleted ${deletedSupplierInvoices.count} supplier invoices`)

		// 5. Delete Supplier_Quotation (depends on Company and Quotation_Request_Line_Item)
		const deletedSupplierQuotations =
			await prisma.supplier_Quotation.deleteMany({})
		console.log(
			`✅ Deleted ${deletedSupplierQuotations.count} supplier quotations`,
		)

		// 6. Delete Order (depends on Quotation_Request)
		const deletedOrders = await prisma.order.deleteMany({})
		console.log(`✅ Deleted ${deletedOrders.count} orders`)

		// 7. Delete Quotation_Request_Line_Item (depends on Quotation_Request and Product)
		const deletedLineItems =
			await prisma.quotation_Request_Line_Item.deleteMany({})
		console.log(
			`✅ Deleted ${deletedLineItems.count} quotation request line items`,
		)

		// 8. Delete Quotation_Request (depends on Employee)
		const deletedQuotationRequests = await prisma.quotation_Request.deleteMany(
			{},
		)
		console.log(
			`✅ Deleted ${deletedQuotationRequests.count} quotation requests`,
		)

		// 9. Delete Product (independent table)
		const deletedProducts = await prisma.product.deleteMany({})
		console.log(`✅ Deleted ${deletedProducts.count} products`)

		// 10. Delete User (depends on Employee)
		const deletedUsers = await prisma.user.deleteMany({})
		console.log(`✅ Deleted ${deletedUsers.count} users`)

		// 11. Delete Employee (depends on Position and Company)
		const deletedEmployees = await prisma.employee.deleteMany({})
		console.log(`✅ Deleted ${deletedEmployees.count} employees`)

		// 12. Delete ProductCategory (independent table)
		const deletedProductCategories = await prisma.productCategory.deleteMany({})
		console.log(
			`✅ Deleted ${deletedProductCategories.count} product categories`,
		)

		// 13. Delete Company (independent table)
		const deletedCompanies = await prisma.company.deleteMany({})
		console.log(`✅ Deleted ${deletedCompanies.count} companies`)

		console.log('🎉 All data deleted successfully!')
	} catch (error) {
		console.error('❌ Error deleting data:', error)
		throw error
	} finally {
		await prisma.$disconnect()
	}
}

// Run the delete function
deleteAllData().catch((error) => {
	console.error('❌ Failed to delete data:', error)
	process.exit(1)
})
