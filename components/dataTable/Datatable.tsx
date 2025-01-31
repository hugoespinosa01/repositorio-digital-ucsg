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
import { Expand, Frown, Plus, PlusIcon, Sheet } from "lucide-react";
import { KardexDetalle } from "@/types/kardexDetalle";
import { useToast } from "../ui/use-toast";
import { useEffect } from "react";

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

export default function Datatable<TData extends KardexDetalle, TValue>({
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
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: PAGE_SIZE }); // Estado para paginación

  // Primero, necesitamos mantener un estado para los cambios pendientes
  const [pendingChanges, setPendingChanges] = React.useState<Record<number, Partial<KardexDetalle>>>({});

  const { toast } = useToast();

  const updateDataInDatabase = async (rowIndex: number, changes: Partial<KardexDetalle>) => {
    try {

      // Obtener el ID del registro a actualizar
      const materiaId = (data[rowIndex] as KardexDetalle).Id;

      const response = await fetch(`/api/materias/${materiaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });

      if (!response.ok) {
        const dataError = await response.json();
        toast({
          title: "Error",
          description: dataError.message,
          variant: "destructive",
        });
        throw new Error(dataError.message);
      }

      // Si la actualización fue exitosa
      const updatedData = await response.json();

      // Actualizar el estado local con la respuesta del servidor
      setData((old: KardexDetalle[]) =>
        old.map((row) =>
          row.Id === materiaId ? { ...row, ...updatedData } : row
        )
      );

      // Actualizar datos originales
      setOriginalData((old: TData[]) =>
        old.map((row) =>
          row.Id === materiaId ? { ...row, ...updatedData } : row
        )
      );

      toast({
        title: "Confirmación",
        description: "La información ha sido actualizada exitosamente",
        variant: "default",
      })

      return true; // Indicar que la actualización fue exitosa

    } catch (err) {
      toast({
        title: "Error",
        description: "Hubo un error al intentar actualizar la información",
        variant: "destructive",
      });
      // Propagar el error para manejarlo en el componente padre
      throw err;
    }
  };

  // Función para revertir cambios
  const revertChanges = (rowIndex: number) => {


    // Restaurar los datos originales para esta fila
    setData(old =>
      old.map((row, index) =>
        index === rowIndex ? { ...originalData[rowIndex] } : row
      )
    );

    // Limpiar cambios pendientes
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[rowIndex];
      return newChanges;
    });

    // Preservar la página actual (aunque no debería cambiar con esta solución)
    setPagination((prev) => ({ ...prev }));
  };


  // Función auxiliar para manejar el guardado de cambios
  const handleSaveChanges = async (rowIndex: number) => {
    try {
      if (pendingChanges[rowIndex]) {
        await updateDataInDatabase(rowIndex, pendingChanges[rowIndex]);

        // Limpiar los cambios pendientes después de una actualización exitosa
        setPendingChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[rowIndex];
          return newChanges;
        });

        // Desactivar modo de edición
        setEditedRows(prev => ({
          ...prev,
          [rowIndex]: false
        }));
      }
    } catch (error) {
      // Revertir cambios en caso de error
      revertChanges(rowIndex);
    }
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
      pagination: pagination,
    },
    meta: {
      editedRows,
      setEditedRows,
      revertData: (rowIndex: number, revert: boolean) => {
        if (revert) {
          revertChanges(rowIndex);
        } else {
          handleSaveChanges(rowIndex);
        }
      },
      updateData: (rowIndex: number, columnId: string, value: string) => {

        // Actualizar vista local
        setData(old =>
          old.map((row, index) =>
            index === rowIndex
              ? { ...row, [columnId]: value }
              : row
          )
        );
      },
    }
  });

  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = data?.length / PAGE_SIZE;

  return (
    <Card>
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
            <Button
              size={'sm'}
              className="gap-2"
            >
              <PlusIcon size={15} />
              Nueva materia
            </Button>
          </div>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}>
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

