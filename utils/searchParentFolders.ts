import { prisma } from "@/lib/prisma"

export const searchParentFolders = async (idCarpetaPadre: number) => {
    const parentFoldersList = [];
    
    //Buscar la carpeta padre
    const carpetaPadre = await prisma.carpeta.findFirst({
        where: {
            Id: idCarpetaPadre,
            Estado: 1,
        }
    });

    if (carpetaPadre) {
        parentFoldersList.push(carpetaPadre);
    }

    //Buscar las carpetas padre hasta llegar a la raíz
    while (carpetaPadre?.IdCarpetaPadre) {
        const carpeta = await prisma.carpeta.findFirst({
            where: {
                Id: carpetaPadre.IdCarpetaPadre,
                Estado: 1,
            }
        });
        if (carpeta) {
            parentFoldersList.push(carpeta);
            carpetaPadre.IdCarpetaPadre = carpeta.IdCarpetaPadre;
        } else {
            break;
        }
    }

    return parentFoldersList;
}