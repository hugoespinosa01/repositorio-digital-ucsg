import { Row } from "@tanstack/react-table";
import { KardexDetalle } from "@/types/kardexDetalle";
import { Column, Table } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { Check, CircleCheck, CircleX, Edit, Trash, X } from "lucide-react";
import { Fragment } from "react";

interface Props {
    row: Row<KardexDetalle>;
    table: Table<KardexDetalle>;
}

export const DeleteCell = ({ row, table }: Props) => {
    const meta = table.options.meta

    const acceptDelete = async () => {
        try {
            const res = await fetch(`/api/materias/${row.original.Id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                console.error('Error deleting row');
            }
        }  catch (err) {
            console.error('Error deleting row');
        }
    }

    return  (
        <Button
            onClick={acceptDelete}
            variant={'ghost'}
            name="edit"
            size={'sm'}
        >
            <Trash size={15} />
        </Button>
    )
}