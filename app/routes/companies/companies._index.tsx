import type { Route } from "./+types/companies._index";
import type { PrismaClient } from "../../../generated/prisma/client";
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
    const { getDb } = await import('../../lib/db.server');
    const db:PrismaClient = await getDb();

    const companies = await db.company.findMany();
    
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