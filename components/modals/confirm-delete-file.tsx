import React, { useContext } from 'react'
import { Button } from '../ui/button';
import { Credenza, CredenzaBody, CredenzaContent, CredenzaFooter, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react'; // Replace with the correct path or library
import { useRouter } from 'next/navigation';
import { FolderContext } from '@/context/folder-context';

export default function ConfirmDeleteFile({
    openModal,
    setOpenModal,
    fileId,
    persistSamePage,
    parentId,
    currentPage,
    pageSize,
}: {
    openModal: boolean,
    setOpenModal: (open: boolean) => void,
    fileId: number | undefined,
    persistSamePage?: boolean,
    parentId?: string | null | undefined,
    currentPage: number,
    pageSize: number
}) {

    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const {fetchFolders, fetchChildren} = useContext(FolderContext);


    const handleAcceptDelete = async () => {
        try {
            setIsSubmitting(true);

            const response = await fetch(`/api/files/${Number(fileId)}`, {
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

            if (parentId) {
                fetchChildren(parentId, currentPage, pageSize)
            }

            if (!persistSamePage) {
                router.back();
                return;
            }

            router.refresh();

        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al eliminar la información",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setOpenModal(false);
        }
    }


    return (
        <div>
            <Credenza open={openModal} onOpenChange={setOpenModal}>
                <CredenzaContent>
                    <CredenzaHeader>
                        <CredenzaTitle>
                            Confirmación
                        </CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaBody>
                        ¿Estás seguro de que deseas eliminar la siguiente información?
                    </CredenzaBody>
                    <CredenzaFooter>
                        {
                            isSubmitting ? (
                                <Button disabled className="w-full sm:w-auto min-w-[120px]">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cargando...
                                </Button>) : (
                                <Button
                                    variant="default"
                                    onClick={handleAcceptDelete}
                                >
                                    Aceptar
                                </Button>
                            )
                        }

                        <CredenzaClose asChild>
                            <Button variant="secondary" onClick={() => setOpenModal(false)}>Cancelar</Button>
                        </CredenzaClose>
                    </CredenzaFooter>
                </CredenzaContent>
            </Credenza>
        </div>
    )
}
