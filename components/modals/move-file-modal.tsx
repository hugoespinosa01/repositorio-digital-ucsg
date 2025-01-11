import React from 'react'
import { Button } from '../ui/button';
import { useContext } from 'react';
import { Credenza, CredenzaBody, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import MoveFolderForm from '../documents/moveFolderForm';

export default function MoveFileModal({
    openModal,
    setOpenModal,
    idFile,
    currentPage
}: {
    openModal: boolean,
    setOpenModal: (open: boolean) => void,
    idFile: number | undefined,
    currentPage: number
}) {

    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);


    const handleAcceptDelete = async () => {
        try {
            setOpenModal(false);
            setIsSubmitting(true);

            const response = await fetch(`/api/files/${Number(idFile)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Error al eliminar el archivo: ${response.statusText}`);
            }

            toast({
                title: "Confirmación",
                description: "La información ha sido eliminada exitosamente",
                variant: "default",
            });

            router.refresh();

        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al eliminar la información",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div>
            <Credenza open={openModal} onOpenChange={setOpenModal}>
                <CredenzaContent>
                    <CredenzaHeader>
                        <CredenzaTitle>
                            Mover carpeta
                        </CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaDescription className="text-center sm:text-start">
                        Selecciona el destino de la carpeta
                    </CredenzaDescription>
                    <CredenzaBody>
                        <MoveFolderForm idFile={idFile} setOpenModal={setOpenModal} currentPage={currentPage}/>
                    </CredenzaBody>
                </CredenzaContent>
            </Credenza>
        </div>
    )
}
