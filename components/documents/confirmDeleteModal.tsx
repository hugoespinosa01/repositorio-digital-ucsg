import React, { useContext } from 'react'
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/custom-modal";
import { Button } from '../ui/button';
import { FolderContext } from '@/context/folder-context';

interface ConfirmDeleteModalProps {
    openModal: boolean;
    setOpenModal: (open: boolean) => void;
    currentPage: number;
    pageSize: number;
    idFolder: number;
    parentId?: string | null | undefined;
}

export default function ConfirmDeleteModal({ openModal, setOpenModal, currentPage, idFolder, pageSize, parentId }: ConfirmDeleteModalProps) {

    const { deleteFolder } = useContext(FolderContext);

    const handleAccept = () => {
        setOpenModal(false);
        deleteFolder(idFolder, currentPage, pageSize, Number(parentId));
    }

    return (
        <Credenza open={openModal} onOpenChange={setOpenModal}>
            <CredenzaContent>
                <CredenzaHeader>
                    <CredenzaTitle>
                        Confirmación
                    </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaDescription className="text-center sm:text-start">
                    Eliminar carpeta
                </CredenzaDescription>
                <CredenzaBody>
                    ¿Estás seguro de que deseas eliminar esta carpeta?
                </CredenzaBody>
                <CredenzaFooter>
                    <Button variant="default" onClick={handleAccept}>Aceptar</Button>
                    <CredenzaClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </CredenzaClose>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>)
}
