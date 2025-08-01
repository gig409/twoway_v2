import {
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from '@react-router/dev/routes'

export default [
	index('routes/home.tsx'),
	layout('./routes/dashboard/layout.tsx', [
		...prefix('dashboard', [
			// Companies routes
			index('routes/dashboard/dashboard_home.tsx'),

			layout('./routes/companies/companies_layout.tsx', [
				...prefix('companies', [
					index('./routes/companies/companies._index.tsx'),
					route('new', './routes/companies/companies.new.tsx'),
					route(
						':companyId/edit',
						'./routes/companies/companies.$companyId.edit.tsx',
					),
				]),
			]),
			// Employees routes
			layout('./routes/employees/employees_layout.tsx', [
				...prefix('employees', [
					index('./routes/employees/employees._index.tsx'),
					route('new', './routes/employees/employees.new.tsx'),
					route(
						':employeeId/edit',
						'./routes/employees/employees.$employeeId.edit.tsx',
					),
				]),
			]),
			// Product Categories routes
			layout('./routes/product_categories/product_categories_layout.tsx', [
				...prefix('product_categories', [
					index('./routes/product_categories/product_categories._index.tsx'),
					route(
						'new',
						'./routes/product_categories/product_categories.new.tsx',
					),
					route(
						':categoryId/edit',
						'./routes/product_categories/product_categories.$categoryId.edit.tsx',
					),
				]),
			]),
			// Products routes
			layout('./routes/product/product_layout.tsx', [
				...prefix('products', [
					index('./routes/product/product._index.tsx'),
					// route('new', './routes/product/product.new.tsx'),
					// route(
					// 	':productId/edit',
					// 	'./routes/product/product.$productId.edit.tsx',
					// ),
				]),
			]),
		]),
	]),
] satisfies RouteConfig
