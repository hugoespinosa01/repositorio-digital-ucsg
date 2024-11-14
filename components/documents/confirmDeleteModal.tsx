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
import { AuthContext } from '@/context/auth-context';

interface ConfirmDeleteModalProps {
    openModal: boolean;
    setOpenModal: (open: boolean) => void;
    currentPage: number;
    pageSize: number;
    idFolder: number;
}

export default function ConfirmDeleteModal({ openModal, setOpenModal, currentPage, idFolder, pageSize }: ConfirmDeleteModalProps) {

    const { deleteFolder } = useContext(FolderContext);
    const { keycloak} = useContext(AuthContext);

    const handleAccept = () => {
        setOpenModal(false);
        if (keycloak?.token) {
            deleteFolder(idFolder, currentPage, pageSize, keycloak.token);
        }
    }

    return (
        <Credenza open={openModal} onOpenChange={setOpenModal}>
            <CredenzaContent>
                <CredenzaHeader>
                    <CredenzaTitle>
                        Confirmación
                    </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaDescription>
                    <div className="text-center sm:text-start">
                        Eliminar carpeta
                    </div>
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
