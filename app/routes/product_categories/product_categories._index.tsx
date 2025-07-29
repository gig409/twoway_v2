import type { Route } from "./+types/product_categories._index";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender, getFilteredRowModel, type FilterFn, getPaginationRowModel, getSortedRowModel, type SortingState, type SortingFn} from '@tanstack/react-table';
import { useMemo, useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/link";
import prisma from '~/lib/prisma';
import type { JsonValue } from "@prisma/client/runtime/library";
import {Strong, Text} from "~/components/ui/text";

type ProductCategory = {
  product_category_id: string;
  product_category_name: string;
  product_category_attributes: JsonValue;
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
    { title: "Product Categories Dashboard" },
    { name: "description", content: "Manage your product categories here." },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  try {
    const product_categories = await prisma.productCategory.findMany();
    
    return { product_categories };
  } catch (error) {
    console.error('Failed to create PrismaClient:', error)
    throw new Error('Failed to get companies');
  }
}

export default function CompaniesIndex({ loaderData }: Route.ComponentProps) {
  const { product_categories } = loaderData;
  const [customFilter, setCustomFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const columnHelper = createColumnHelper<ProductCategory>();

  const columns = useMemo(() => [
    columnHelper.accessor("product_category_name", {
      header: () => <Strong>Product Category Name</Strong>,
      cell: (info) => <Text>{info.getValue()}</Text>,
    }),
    columnHelper.accessor("product_category_attributes", {
      header: () => <Strong>Attributes</Strong>,
      cell: (info) => {
        let result:String = "";
        const value = info.getValue() as String;
        for (const key in value) {
          result += `${key}: ${value[key]}\n`;
        }
        return (
          <Text className="whitespace-pre-wrap break-words">
            {result}
          </Text>
        );
      }
    }),
    columnHelper.accessor("product_category_id", {
      header: () => <Strong>Actions</Strong>,
      cell: (info) => (
        <Link href={`/dashboard/product_categories/${info.getValue()}/edit`} className="text-blue-500 hover:underline">
          Edit
        </Link>
      ),
    })
  ], []);

  const table = useReactTable({
    data: product_categories,
    columns,
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

  return (
    <>
      <Table>
        <TableHead>
          {table.getHeaderGroups().map(headerGroup => (
              (headerGroup.headers.map(header => (
                  <TableHeader onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHeader>
              )))
          ))}
          <TableHeader></TableHeader>
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
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