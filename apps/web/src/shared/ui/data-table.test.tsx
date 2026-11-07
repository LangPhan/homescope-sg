import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable, createDataTableColumnHelper, type DataTableColumn } from "./data-table";

type ExampleRow = {
  name: string;
  value: number;
};

const columnHelper = createDataTableColumnHelper<ExampleRow>();
const columns: DataTableColumn<ExampleRow>[] = columnHelper.columns([
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("value", {
    header: "Value",
    cell: ({ getValue }) => getValue().toLocaleString("en-SG"),
  }),
]);

describe("DataTable", () => {
  it("renders reusable column definitions and rows", () => {
    render(<DataTable data={[{ name: "Example home", value: 1_250_000 }]} columns={columns}/>);

    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(within(table).getByText("Example home")).toBeInTheDocument();
    expect(within(table).getByText("1,250,000")).toBeInTheDocument();
  });
});
