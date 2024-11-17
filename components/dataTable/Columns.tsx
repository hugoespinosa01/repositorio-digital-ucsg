import { ColumnDef } from "@tanstack/react-table"; // Replace "package-name" with the actual package name that provides the ColumnDef type.
import { KardexDetalle } from "@/types/kardexDetalle";
import DataTableColumnnHeader from "@/components/dataTable/DataTableColumnHeader";

export function GetColumns(): ColumnDef<KardexDetalle>[] {
 
  return [
    {
      accessorKey: "Ciclo",
      header: "Ciclo",
    },
    {
      accessorKey: "Materia",
      header: "Materia",
    },
    {
      accessorKey: "Periodo",
      header: ({column}) => <DataTableColumnnHeader column={column} title="Periodo"/>,
    },
    {
      accessorKey: "Calificacion",
      header: ({column}) => <DataTableColumnnHeader column={column} title="Calificacion"/>
    },
    {
      accessorKey: "NoMatricula",
      header: ({column}) => <DataTableColumnnHeader column={column} title="No Matricula"/>,
    }
  ];
}
