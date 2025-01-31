import React, { useContext } from 'react'
import { Button } from '../ui/button';
import { Credenza, CredenzaBody, CredenzaContent, CredenzaFooter, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react'; // Replace with the correct path or library
import { useRouter } from 'next/navigation';
import { FolderContext } from '@/context/folder-context';

export default function ConfirmDeleteMateria({
    openModal,
    setOpenModal,
    materiaId,
    persistSamePage,
    parentId,
}: {
    openModal: boolean,
    setOpenModal: (open: boolean) => void,
    materiaId: number | undefined,
    persistSamePage?: boolean,
    parentId?: string | null | undefined,
}) {

    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleAcceptDelete = async () => {
        try {
            const res = await fetch(`/api/materias/${materiaId}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const data = await res.json();
                console.error('Error deleting row');
                toast({
                    title: "Error",
                    description: data.message,
                    variant: "destructive",
                });
            }
            toast({
                title: "Confirmación",
                description: "La información ha sido eliminada exitosamente",
                variant: "default",
            });

        } catch (err) {
            console.error('Error deleting row');
        } finally {
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
