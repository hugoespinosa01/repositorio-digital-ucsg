import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaClose,
} from "@/components/custom-modal";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";

interface CreateFolderModalProps {
    openModal: boolean;
    setOpenModal: (open: boolean) => void;
    handleAccept: () => void;
    setFieldValue: Dispatch<SetStateAction<string | number | undefined>>
}

export default function EditKardexFieldModal({ openModal, setOpenModal, handleAccept, setFieldValue}: CreateFolderModalProps) {
    return (
        <Credenza open={openModal} onOpenChange={setOpenModal}>
            <CredenzaContent>
                <CredenzaHeader>
                    <CredenzaTitle>
                        Confirmación
                    </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody>
                ¿Estás seguro de que deseas actualizar la siguiente información?
                </CredenzaBody>
                <CredenzaFooter>
                    <Button variant="default" onClick={handleAccept}>Aceptar</Button>
                    <CredenzaClose asChild>
                        <Button
                            variant="secondary" 
                            onClick={() => {
                            setOpenModal(false);
                            setFieldValue(prevState => prevState);
                        }}>Cancelar</Button>
                    </CredenzaClose>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    )
}
