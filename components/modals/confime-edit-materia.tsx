import React, { Dispatch, useContext } from 'react'
import { Button } from '../ui/button';
import { Credenza, CredenzaBody, CredenzaContent, CredenzaFooter, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react'; // Replace with the correct path or library
import { useRouter } from 'next/navigation';
import { FolderContext } from '@/context/folder-context';
import { KardexDetalle } from '@/types/kardexDetalle';

export default function ConfirmEditMateria({
    openModal,
    setOpenModal,
    handleUpdateNota,
    editedData,
    setEditedData,
    setEditingRow,
    fetchAndSetData

}: {
    openModal: boolean,
    setOpenModal: (open: boolean) => void,
    handleUpdateNota: (materiaId: number, editedData: KardexDetalle) => void,
    editedData: KardexDetalle | null,
    setEditedData: Dispatch<React.SetStateAction<KardexDetalle | null>>,
    setEditingRow: Dispatch<React.SetStateAction<number | null>>,
    fetchAndSetData: () => void
}) {

    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const saveEditing = async () => {
        try {
            setIsSubmitting(true);
            if (editedData) {
                await handleUpdateNota(editedData.Id, editedData);
                fetchAndSetData();
                toast({
                    title: "Materia actualizada",
                    description: "Los cambios fueron guardados.",
                });

            }
        } catch (err) {
            console.error('Error updating row');
            toast({
                title: "Error",
                description: "Ocurrió un error al actualizar la materia.",
                variant: "destructive",
            });
        } finally {
            setOpenModal(false);
            setIsSubmitting(false);
            setEditedData(null);
            setEditingRow(null);
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
                        ¿Estás seguro de que deseas editar la siguiente información?
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
                                    onClick={saveEditing}
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
