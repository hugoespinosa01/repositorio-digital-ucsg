import { Row } from "@tanstack/react-table";
import { KardexDetalle } from "@/types/kardexDetalle";
import { Table } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { Check, Edit, X } from "lucide-react";

interface Props {
    row: Row<KardexDetalle>;
    table: Table<KardexDetalle>;
}

export const EditCell = ({ row, table }: Props) => {
    const meta = table.options.meta

    const setEditedRows = (e: React.MouseEvent<HTMLButtonElement>) => {
        const elName = e.currentTarget.name;
        
        meta?.setEditedRows((old) => ({
            ...old,
            [row.id]: !old[row.id],
        }));
        if (elName !== "edit") {
            meta?.revertData(row.index, e.currentTarget.name === 'cancel');
        }
    }

    return meta?.editedRows[row.id] ? (
        <div className="flex items-center space-x-1">
            <Button
                onClick={setEditedRows}
                name="cancel"
                variant={'ghost'}
                size={'sm'}
            >
                <X
                    size={15}
                    color="red"
                />
            </Button>

            <Button
                onClick={setEditedRows}
                name="done"
                variant={'ghost'}
                size={'sm'}

            >
                <Check
                    size={15}
                    color="green"
                />
            </Button>
        </div>
    ) : (
        <Button
            onClick={setEditedRows}
            variant={'ghost'}
            name="edit"
            size={'sm'}
        >
            <Edit size={15} color="#325286" />
        </Button>
    )
}