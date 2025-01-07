import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaDescription,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/custom-modal";
import CreateFolderForm from './createFolderForm';
import { Folder } from '@/types/folder';
import React from "react";

interface CreateFolderModalProps {
    openModal: boolean;
    editMode: boolean;
    setOpenModal: (open: boolean) => void;
    folder?: Folder | null;
    parentId?: string | null | undefined;
    currentPage: number;
}

export default function CreateFolderModal({ openModal, editMode, setOpenModal, folder, parentId, currentPage }: CreateFolderModalProps) {
    return (
        <Credenza open={openModal} onOpenChange={setOpenModal}>
            <CredenzaContent>
                <CredenzaHeader>
                    <CredenzaTitle>
                        {
                            editMode ? "Editar carpeta" : "Crear nueva carpeta"
                        }
                    </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaDescription className="text-center sm:text-start">
                    {
                        editMode ? "Ingresa el nuevo nombre de la carpeta." : "Ingresa el nombre de la carpeta que deseas crear."
                    }
                </CredenzaDescription>
                <CredenzaBody>
                    <CreateFolderForm
                        setOpenModal={setOpenModal}
                        editMode={editMode}
                        folder={folder}
                        parentId={parentId}
                        currentPage={currentPage}
                    />
                </CredenzaBody>
            </CredenzaContent>
        </Credenza>
    )
}
