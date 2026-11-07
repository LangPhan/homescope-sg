"use client";

import { createColumnHelper, tableFeatures, useTable, type ColumnDef, type RowData } from "@tanstack/react-table";
import { cn } from "@/shared/lib";

type DataTableColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

export const dataTableFeatures = tableFeatures({
  columnMeta: {} as DataTableColumnMeta,
});

export type DataTableColumn<TData extends RowData> = ColumnDef<typeof dataTableFeatures, TData, any>;

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<typeof dataTableFeatures, TData>();
}

type DataTableProps<TData extends RowData> = {
  data: TData[];
  columns: DataTableColumn<TData>[];
  getRowId?: (row: TData, index: number) => string;
  className?: string;
  tableClassName?: string;
};

export function DataTable<TData extends RowData>({ data, columns, getRowId, className, tableClassName }: DataTableProps<TData>) {
  const table = useTable({ features: dataTableFeatures, data, columns, getRowId });

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className={cn("w-full border-collapse text-left text-sm", tableClassName)}>
        <thead className="bg-cream/65 text-[.68rem] tracking-[.12em] text-muted-copy uppercase">
          {table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => <th key={header.id} className={cn("px-4 py-3 font-bold", header.column.columnDef.meta?.headerClassName)}>
              {header.isPlaceholder ? null : <table.FlexRender header={header}/>}
            </th>)}
          </tr>)}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => <tr key={row.id} className="border-t border-line first:border-t-0 hover:bg-[#f8fbf8]">
            {row.getAllCells().map((cell) => <td key={cell.id} className={cn("px-4 py-4", cell.column.columnDef.meta?.cellClassName)}>
              <table.FlexRender cell={cell}/>
            </td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
