import { Row } from "@tanstack/react-table";
import { KardexDetalle } from "@/types/kardexDetalle";
import { Column, Table } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { Check, CircleCheck, CircleX, Edit, Tangent, Trash, X } from "lucide-react";
import { Fragment } from "react";
import { useToast } from "../ui/use-toast";
import ConfirmDeleteMateria from "../modals/confime-delete-materia";
import React from 'react';


interface Props {
    row: Row<KardexDetalle>;
    table: Table<KardexDetalle>;
}

export const DeleteCell = ({ row, table }: Props) => {
    const meta = table.options.meta
    const { toast } = useToast();
    const [openModal, setOpenModal] = React.useState(false);

    return !meta?.editedRows[row.id] && (
        <>
            <Button
                onClick={() => setOpenModal(true)}
                variant={'ghost'}
                name="edit"
                size={'sm'}
            >
                <Trash size={15} color="#c84141" />
            </Button>

            <ConfirmDeleteMateria
                openModal={openModal}
                setOpenModal={setOpenModal}
                materiaId={row.original.Id}
                persistSamePage={true}
            />
        </>
    )
}