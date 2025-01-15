import React, { Dispatch } from 'react'
import { Button } from '../ui/button';
import { Credenza, CredenzaBody, CredenzaContent, CredenzaFooter, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';
import Datatable from '../dataTable/Datatable';
import { GetColumns } from '../dataTable/Columns';
import { useMemo } from 'react';
import { KardexDetalle } from '@/types/kardexDetalle';

interface ExpandKardexDetailProps {
    openModal: boolean;
    setOpenModal: (open: boolean) => void;
    data: any;
    onEdit: (row: any) => void;
    onDelete: (row: any) => void;
    setData: Dispatch<React.SetStateAction<KardexDetalle[]>>;
}

export default function ExpandKardexDetail({ openModal, setOpenModal, data, onEdit, onDelete, setData }: ExpandKardexDetailProps) {
    const columns = useMemo(() => GetColumns({onEdit, onDelete}), []);

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
                            Detalle de materias aprobadas de acuerdo con los datos extraídos
                    </CredenzaDescription>
                    <CredenzaBody className='flex justify-center items-center'>
                        <div>
                            <Datatable
                                data={data}
                                setData={setData}
                                columns={columns}
                                title='Detalle de materias aprobadas'
                                description=''
                                showIcon={false}
                            />
                        </div>
                    </CredenzaBody>
                </CredenzaContent>
            </Credenza>
        </div>
    )
}
