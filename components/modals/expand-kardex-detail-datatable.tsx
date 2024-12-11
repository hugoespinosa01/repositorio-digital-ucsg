import React from 'react'
import { Button } from '../ui/button';
import { Credenza, CredenzaBody, CredenzaContent, CredenzaFooter, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';
import Datatable from '../dataTable/Datatable';
import { GetColumns } from '../dataTable/Columns';
import { useMemo } from 'react';

interface ExpandKardexDetailProps {
    openModal: boolean;
    setOpenModal: (open: boolean) => void;
}


export default function ExpandKardexDetail({openModal, setOpenModal} : ExpandKardexDetailProps) {
    const columns = useMemo(() => GetColumns(), []);

    return (
        <div className='flex'>
            <Credenza open={openModal} onOpenChange={setOpenModal}>
                <CredenzaContent className=''>
                    <CredenzaHeader>
                        <CredenzaTitle>
                            Detalle
                        </CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaDescription>
                        <div className="text-center sm:text-start">
                            Detalle de materias aprobadas
                        </div>
                    </CredenzaDescription>
                    <CredenzaBody>
                        <div className='flex w-100vh justify-center'>
                            <Datatable
                                data={[]}
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
