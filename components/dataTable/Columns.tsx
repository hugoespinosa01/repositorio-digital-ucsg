import { ColumnDef } from "@tanstack/react-table"; // Replace "package-name" with the actual package name that provides the ColumnDef type.
import { KardexDetalle } from "@/types/kardexDetalle";
import DataTableColumnnHeader from "@/components/dataTable/DataTableColumnHeader";
import DataTableRowActions from "./DataTableRowActions";
import { TableCell } from '@/components/dataTable/TableCell'

interface Props {
  onEdit: (row: KardexDetalle) => void;
  onDelete: (row: KardexDetalle) => void;
}

export function GetColumns({ onEdit, onDelete }: Props): ColumnDef<KardexDetalle>[] {

  return [
    {
      accessorKey: "Ciclo",
      header: "Ciclo",
      cell: TableCell,
      meta: {
        type: 'text'
      }
    },
    {
      accessorKey: "Materia",
      header: "Materia",
    },
    {
      accessorKey: "Periodo",
      header: ({ column }) => <DataTableColumnnHeader column={column} title="Periodo" />,
    },
    {
      accessorKey: "Calificacion",
      header: ({ column }) => <DataTableColumnnHeader column={column} title="Calificacion" />
    },
    {
      accessorKey: "NoMatricula",
      header: ({ column }) => <DataTableColumnnHeader column={column} title="No Matricula" />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions row={row} onEdit={onEdit} onDelete={onDelete} />
      )
    }
  ];
}
