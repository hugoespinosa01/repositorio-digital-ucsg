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

interface CreateFolderModalProps {
    openModal: boolean;
    editMode: boolean;
    setOpenModal: (open: boolean) => void;
    folder? : Folder | null;
}

export default function CreateFolderModal({ openModal, editMode, setOpenModal, folder  }: CreateFolderModalProps) {
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
                <CredenzaDescription>
                    <div className="text-center sm:text-start">
                        {
                            editMode ? "Ingresa el nuevo nombre de la carpeta." : "Ingresa el nombre de la carpeta que deseas crear."
                        }
                    </div>
                </CredenzaDescription>
                <CredenzaBody>
                    <CreateFolderForm setOpenModal={setOpenModal} editMode={editMode} folder={folder}/>
                </CredenzaBody>
            </CredenzaContent>
        </Credenza>
    )}
