import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaDescription,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/custom-modal";
import MoveFolderForm from "./moveFolderForm";

interface MoveFolderModalProps {
    openModal: boolean;
    setOpenModal: (open: boolean) => void;
    idFolder: number;
    currentPage: number;
    parentId?: string | null | undefined ;
}

export default function MoveFolderModal({ openModal, setOpenModal, idFolder, currentPage, parentId}: MoveFolderModalProps) {

    return (
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
                    <MoveFolderForm idFolder={idFolder} setOpenModal={setOpenModal} currentPage={currentPage}  parentId={Number(parentId)}  />
                </CredenzaBody>
            </CredenzaContent>
        </Credenza>
    )
}
