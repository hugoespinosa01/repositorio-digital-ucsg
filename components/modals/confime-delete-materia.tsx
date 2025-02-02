import React, { useContext } from 'react'
import { Button } from '../ui/button';
import { Credenza, CredenzaBody, CredenzaContent, CredenzaFooter, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react'; // Replace with the correct path or library
import { useRouter } from 'next/navigation';
import { FolderContext } from '@/context/folder-context';
import { KardexDetalle } from '@/types/kardexDetalle';

export default function ConfirmDeleteMateria({
    openModal,
    setOpenModal,
    deleteRow,
    deletedData
}: {
    openModal: boolean,
    setOpenModal: (open: boolean) => void,
    deleteRow: (id: number) => void,
    deletedData: KardexDetalle | null
}) {

    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const deletingMateria = async () => {
        try {
            if (deletedData) {
                setIsSubmitting(true);
                await deleteRow(deletedData.Id);
            }

        } catch (err) {
            toast({
                title: 'Error',
                description: 'Ocurrió un error al eliminar la materia',
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
                                    onClick={deletingMateria}
                                >
                                    Aceptar
                                </Button>
                            )
                        }

                        <CredenzaClose asChild>
                            <Button variant="secondary" disabled={isSubmitting} onClick={() => setOpenModal(false)}>Cancelar</Button>
                        </CredenzaClose>
                    </CredenzaFooter>
                </CredenzaContent>
            </Credenza>
        </div>
    )
}
