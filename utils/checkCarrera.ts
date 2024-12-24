import { prisma } from '@/lib/prisma';

export const checkCarrera = async (carrera: string) => {
    let carreraId = null;
    if (carrera.toLowerCase().includes('sistemas')) {
        // Busco el Id de la carrera correspondiente
        carreraId = await prisma.carrera.findFirst({
            where: {
                Nombre: "Ingeniería en Computación",
            }
        })
    } else if (carrera.toLowerCase().includes('civil')) {
        // Busco el Id de la carrera correspondiente
        carreraId = await prisma.carrera.findFirst({
            where: {
                Nombre: "Ingeniería Civi",
            }
        })
    }
    return carreraId?.Id;
}