import { prisma } from '@/lib/prisma';

export const checkCarrera = async (carrera: string) => {
    let carreraId = [];
    let sistemasArray = ['sistemas', 'computación', 'computacion', 'computadoras', 'computacion', 'informática'];
    if (sistemasArray.some(x => carrera.toLowerCase().includes(x))) {
        // Busco el Id de la carrera correspondiente
        const _carreraId = await prisma.carrera.findFirst({
            where: {
                Nombre: "Ingeniería en Computación",
            }
        })
        if (!_carreraId) {
            throw new Error('Carrera no encontrada');
        }
        carreraId.push(_carreraId.Id);
    }
    if (carrera.toLowerCase().includes('civil')) {
        // Busco el Id de la carrera correspondiente
        const _carreraId = await prisma.carrera.findFirst({
            where: {
                Nombre: "Ingeniería Civil",
            }
        });
        if (!_carreraId) {
            throw new Error('Carrera no encontrada');
        }
        carreraId.push(_carreraId.Id);
    }
    return carreraId;
}