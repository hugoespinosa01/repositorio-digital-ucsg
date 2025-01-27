import { Row } from "@tanstack/react-table";
import { KardexDetalle } from "@/types/kardexDetalle";
import { Column, Table } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { Check, CircleCheck, CircleX, Edit, Tangent, Trash, X } from "lucide-react";
import { Fragment } from "react";
import { useToast } from "../ui/use-toast";


interface Props {
    row: Row<KardexDetalle>;
    table: Table<KardexDetalle>;
}

export const DeleteCell = ({ row, table }: Props) => {
    const meta = table.options.meta
    const { toast } = useToast();

    const acceptDelete = async () => {
        try {
            const res = await fetch(`/api/materias/${row.original.Id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const data = await res.json();
                console.error('Error deleting row');
                toast({
                    title: "Error",
                    description: data.message,
                    variant: "destructive",
                });
            }
            toast({
                title: "Confirmación",
                description: "La información ha sido eliminada exitosamente",
                variant: "default",
            });


        } catch (err) {
            console.error('Error deleting row');
        }
    }

    return (
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