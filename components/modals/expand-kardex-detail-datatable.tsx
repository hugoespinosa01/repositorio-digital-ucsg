import React, { Dispatch } from 'react'
import { Credenza, CredenzaBody, CredenzaContent, CredenzaFooter, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';
import { GetColumns } from '../dataTable/Columns';
import { useMemo } from 'react';
import { KardexDetalle } from '@/types/kardexDetalle';
import MateriasDataTable from '../advanced-datatable';

interface ExpandKardexDetailProps {
    fileId: string | null | undefined;
    canCreateMateria: boolean;
    canUpdateMateria: boolean;
    canDeleteMateria: boolean;
    openModal: boolean;
    setOpenModal: (open: boolean) => void;
    data: any;
    onEdit: (row: any) => void;
    onDelete: (row: any) => void;
    setData: Dispatch<React.SetStateAction<KardexDetalle[]>>;
}

export default function ExpandKardexDetail({ openModal, setOpenModal, data, onEdit, onDelete, setData, fileId, canCreateMateria, canDeleteMateria, canUpdateMateria }: ExpandKardexDetailProps) {
    const columns = useMemo(() => GetColumns({ onEdit, onDelete }), []);

    return (
        <div className='flex'>
            <Credenza open={openModal} onOpenChange={setOpenModal}>
                <CredenzaContent className='max-w-fit'>
                    <CredenzaHeader>
                        <CredenzaTitle>
                            Detalle
                        </CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaDescription className="text-center sm:text-start">
                        Detalle de materias aprobadas de acuerdo con los datos extraídos de la cartilla de notas.
                    </CredenzaDescription>
                    <CredenzaBody className='flex justify-center items-center w-full'>
                        <MateriasDataTable
                            hideExpandButton={true}
                            fileId={fileId}
                            canCreateMateria={canCreateMateria}
                            canUpdateMateria={canUpdateMateria}
                            canDeleteMateria={canDeleteMateria}
                        />
                    </CredenzaBody>
                </CredenzaContent>
            </Credenza>
        </div>
    )
}
