import { ColumnDef } from "@tanstack/react-table"; // Replace "package-name" with the actual package name that provides the ColumnDef type.
import { KardexDetalle } from "@/types/kardexDetalle";
import DataTableColumnnHeader from "@/components/dataTable/DataTableColumnHeader";
import DataTableRowActions from "./DataTableRowActions";
import { TableCell } from '@/components/dataTable/TableCell'
import { DeleteCell } from "./DeleteCell";
import { EditCell } from "./EditCell";

interface Props {
  onEdit: (row: KardexDetalle) => void;
  onDelete: (row: KardexDetalle) => void;
}

export function GetColumns({ onEdit, onDelete }: Props): ColumnDef<KardexDetalle>[] {

  return [
    {
      accessorKey: "Ciclo",
      header: "Ciclo",
      cell: ({getValue, row, column, table})  => TableCell({getValue, row, column, table}),
      meta: {
        type: 'text'
      }
    },
    {
      accessorKey: "Materia",
      header: "Materia",
      cell: TableCell,
      meta: {
        type: 'text'
      }
    },
    {
      accessorKey: "Periodo",
      header: ({ column }) => <DataTableColumnnHeader column={column} title="Periodo" />,
      cell: TableCell,
      meta: {
        type: 'text'
      }
    },
    {
      accessorKey: "Calificacion",
      header: ({ column }) => <DataTableColumnnHeader column={column} title="Calificacion" />,
      cell:TableCell,
      meta: {
        type: 'number'
      }
    },
    {
      accessorKey: "NoMatricula",
      header: ({ column }) => <DataTableColumnnHeader column={column} title="No Matricula" />,
      cell: TableCell,
      meta: {
        type: 'number'
      }
    },
    {
      id: 'edit',
      cell: EditCell
    },
    {
      id: 'delete',
      cell: DeleteCell
    },
    // {
    //   id: 'actions',
    //   cell: ({row}) => DataTableRowActions({row, onEdit, onDelete})
    // }
  ];
}
