import type { Route } from "./+types/companies._index";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender, getFilteredRowModel, type FilterFn, getPaginationRowModel, getSortedRowModel, type SortingState, type SortingFn} from '@tanstack/react-table';
import { useMemo, useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/link";

type Company = {
  company_id: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_country: string;
};

// type Company = {
//   id: number;
//   name: string;
//   email: string;
//   phone: string;
//   address: string;
//   country: string;
// };

const customFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  const cellValue = row.getValue(columnId);
  if (typeof cellValue === 'string') {
    return cellValue.toLowerCase().includes(filterValue.toLowerCase());
  }
  if (typeof cellValue === 'number') {
    return cellValue.toString().includes(filterValue.toString());
  }
  return false
}

const customSortingFn: SortingFn<any> = (rowA, rowB, columnId) => {
  const valueA = rowA.getValue(columnId);
  const valueB = rowB.getValue(columnId);

  if (typeof valueA === 'string' && typeof valueB === 'string') {
    return valueA.localeCompare(valueB);
  }
  if (typeof valueA === 'number' && typeof valueB === 'number') {
    return valueA - valueB;
  }
  return 0;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Companies Dashboard" },
    { name: "description", content: "Manage your companies here." },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  try {
    console.log("Loading companies...");
    const { getDb } = await import('../../lib/db.server');
    console.log("Creating database connection...");
    const db = await getDb();

    console.log("Fetching companies from the database...");

    const companies = await db.company.findMany();

    console.log("Companies fetched successfully:", companies);
    
    return { companies };
  } catch (error) {
    console.error('Failed to create PrismaClient:', error)
    throw new Error('Failed to get companies');
  }
}

export default function CompaniesIndex({ loaderData }: Route.ComponentProps) {
  const { companies } = loaderData;
  const [customFilter, setCustomFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  

  // const companies: Company[] = useMemo(() => [
  //   { name: "Tech Innovations", location: "San Francisco", employees: 500 },
  //   { name: "Green Solutions", location: "New York", employees: 300 },
  //   { name: "HealthTech Corp", location: "Austin", employees: 200 },
  //   { name: "EduTech", location: "Boston", employees: 150 },
  //   { name: "FinTech Solutions", location: "Chicago", employees: 400 },
  //   { name: "Retail Innovations", location: "Los Angeles", employees: 600 },
  //   { name: "Travel Ventures", location: "Miami", employees: 250 },
  //   { name: "FoodTech", location: "Seattle", employees: 350 },
  //   { name: "Logistics Leaders", location: "Denver", employees: 450 },
  //   { name: "Real Estate Experts", location: "Phoenix", employees: 700 },
  //   { name: "Entertainment Hub", location: "Las Vegas", employees: 800 },
  //   { name: "Marketing Masters", location: "Atlanta", employees: 550 },
  //   { name: "Consulting Pros", location: "Washington D.C.", employees: 650 },
  //   { name: "Cybersecurity Solutions", location: "San Diego", employees: 750 },
  //   { name: "AI Innovations", location: "Portland", employees: 850 },
  //   { name: "Blockchain Technologies", location: "Dallas", employees: 950 },
  //   { name: "E-commerce Giants", location: "Houston", employees: 1050 },
  //   { name: "Social Media Networks", location: "Philadelphia", employees: 1150 },
  //   { name: "Cloud Computing Services", location: "Charlotte", employees: 1250 },
  //   { name: "Mobile App Developers", location: "San Jose", employees: 1350 },
  //   { name: "Data Analytics Firms", location: "Indianapolis", employees: 1450 },
  //   { name: "Gaming Studios", location: "Columbus", employees: 1550 },
  //   { name: "Virtual Reality Companies", location: "Fort Worth", employees: 1650 },
  //   { name: "Augmented Reality Solutions", location: "Charlotte", employees: 1750 },
  //   { name: "Robotics Innovators", location: "Detroit", employees: 1850 },
  //   { name: "Quantum Computing Labs", location: "El Paso", employees: 1950 },
  //   { name: "Space Exploration Firms", location: "Seattle", employees: 2050 },
  // ], []);

  const columnHelper = createColumnHelper<Company>();

  const columns = useMemo(() => [
    columnHelper.accessor("company_name", {
      header: () => "Company Name",
      cell: (info) => (info.getValue() as string).toUpperCase(),
    }),
    columnHelper.accessor("company_email", {
      header: () => "Email",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("company_phone", {
      header: () => "Phone",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("company_address", {
      header: () => "Address",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("company_country", {
      header: () => "Country",
      cell: (info) => info.getValue(),
    }),
  ], []);

  const table = useReactTable({
    data: companies,
    columns,
    // filterFns: {
    //   fuzzy: customFilterFn,
    // },
    globalFilterFn: customFilterFn,
    sortingFns: {
      custom: customSortingFn,
    },
    state: {
      globalFilter: customFilter,
      pagination,
      sorting
    },
    onGlobalFilterChange: setCustomFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // console.log(table.getRowModel().rows);

  return (
    <>
      <Table>
        <TableHead>
          {/* <TableHeader>Name</TableHeader>
          <TableHeader>Location</TableHeader>
          <TableHeader>Employees</TableHeader> */}
          {table.getHeaderGroups().map(headerGroup => (
              (headerGroup.headers.map(header => (
                  <TableHeader onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHeader>
              )))
          ))}
          <TableHeader></TableHeader>
        </TableHead>
        <TableBody>
          {/* {companies.map((company) => (
            <TableRow key={company.name}>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.location}</TableCell>
              <TableCell>{company.employees}</TableCell>
            </TableRow>
          ))} */}
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
              <TableCell><Link href="/CompanyForm">Edit</Link></TableCell>
              {/* <TableCell>{row.getValue("name")}</TableCell>
              <TableCell>{row.getValue("location")}</TableCell>
              <TableCell>{row.getValue("employees")}</TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()} >{"<<"}</Button>
      <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} >{"<"}</Button>
      <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} >{">"}</Button>
      <Button onClick={() => table.lastPage()} disabled={!table.getCanNextPage()} >{">>"}</Button>
      <Input type='text' placeholder='Search...' value={customFilter} onChange={(e) => setCustomFilter(e.target.value)} />
    </>
  );
}