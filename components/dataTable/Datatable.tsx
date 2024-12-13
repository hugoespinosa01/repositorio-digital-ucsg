import React, { Dispatch } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  TableMeta,
} from "@tanstack/react-table";
import { Expand, Frown, Sheet } from "lucide-react";
import { KardexDetalle } from "@/types/kardexDetalle";

declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    editedRows: Record<string, any>;
    setEditedRows: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    updateData: (rowIndex: number, columnId: string, value: string) => void;
    revertData: (rowIndex: number, revert: boolean) => void;
  }
}

interface CustomTableMeta<TData> extends TableMeta<TData> {
  editedRows: Record<string, any>;
  setEditedRows: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  updateData: (rowIndex: number, columnId: string, value: string) => void;
}

interface DatatableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setData: Dispatch<React.SetStateAction<KardexDetalle[]>>;
  title: string;
  description: string;
  onClickExpand?: () => void;
  showIcon?: boolean;
}

export default function Datatable<TData extends any, TValue>({
  title,
  description,
  columns,
  data,
  onClickExpand,
  showIcon,
  setData,
}: DatatableProps<TData, TValue>) {
  const PAGE_SIZE = 5;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [editedRows, setEditedRows] = React.useState({});
  const [originalData, setOriginalData] = React.useState<TData[]>([...data]);
  const updateData = async (rowIndex: number, columnId: string, value: string) => {
    console.log(rowIndex, columnId, value);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: PAGE_SIZE,
      },
    },
    meta: {
      editedRows,
      setEditedRows,
      revertData: (rowIndex: number, revert: boolean) => {
        if (revert) {
          setData((old: KardexDetalle[]) => 
            old.map((row, index) => 
              index === rowIndex ? originalData[rowIndex] as KardexDetalle : row
            ))
        } else {
          setOriginalData((old: TData[]) => 
            old.map((row, index) => (index === rowIndex ? data[rowIndex] : row))
          );
        }
      },
      updateData: (rowIndex: number, columnId: string, value: string) => {
        updateData(rowIndex, columnId, value);
      }
    }
  });

  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = data?.length / PAGE_SIZE;

  return (
    <Card >
      <CardHeader>
        <CardTitle>
          <div className="flex justify-between items-end">
            {title}
            {showIcon && <Button
              variant={'ghost'}
              onClick={onClickExpand}
            >
              <Expand className="w-4 h-4" />
            </Button>}
          </div>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="justify-center">
                      <Frown className="w-8 h-8" />
                      Sin resultados
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex items-center justify-end space-x-2 py-1">
                    <div className="flex-1 text-sm text-muted-foreground ">
                      Mostrando{" "}
                      <strong>
                        {" "}
                        {currentPage == 0
                          ? 1
                          : currentPage * PAGE_SIZE + 1} a{" "}
                        {currentPage == totalPages - 1
                          ? data?.length
                          : (currentPage + 1) * PAGE_SIZE}{" "}
                      </strong>{" "}
                      de <strong>{data?.length}</strong> ítems
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

