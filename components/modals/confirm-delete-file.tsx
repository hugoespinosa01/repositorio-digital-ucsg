import React from 'react'
import { Button } from '../ui/button';
import { Credenza, CredenzaBody, CredenzaContent, CredenzaFooter, CredenzaHeader, CredenzaTitle, CredenzaClose } from '../custom-modal';

export default function ConfirmDeleteFile({
    openModal,
    setOpenModal,
    handleAccept
}: {
    openModal: boolean,
    setOpenModal: (open: boolean) => void,
    handleAccept: () => void
}) {
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
                    <Button variant="default" onClick={handleAccept}>Aceptar</Button>
                    <CredenzaClose asChild>
                        <Button variant="secondary" onClick={() => setOpenModal(false)}>Cancelar</Button>
                    </CredenzaClose>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    </div>
  )
}
