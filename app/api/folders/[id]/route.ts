import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';
import { checkCarrera } from '@/utils/checkCarrera';
import { searchParentFolders } from '@/utils/searchParentFolders';
import { redis } from '@/lib/redis';

interface Params {
    params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
    try {

        const session = await getServerSession(auth);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const carpeta = await prisma.carpeta.findFirst({
            where: {
                Id: Number(params.id),
                Estado: 1
            }
        });

        const response = {
            message: 'Carpeta encontrada',
            status: 200,
            data: carpeta
        }

        if (!carpeta) {
            return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching document:', error);
        return NextResponse.json({ error: 'Error fetching document' }, { status: 500 });
    }

}

export async function DELETE(request: Request, { params }: Params) {
    try {

        const session = await getServerSession(auth);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const childrenFolders = await prisma.carpeta.findMany({
            where: {
                IdCarpetaPadre: Number(params.id),
                Estado: 1
            }
        })

        const childrenDocuments = await prisma.documento.findMany({
            where: {
                IdCarpeta: Number(params.id),
                Estado: 1
            }
        })

        if (childrenFolders.length > 0 || childrenDocuments.length > 0) {
            return NextResponse.json({ error: 'La carpeta no puede ser eliminada porque contiene documentos o carpetas' }, { status: 400 });
        }

        // Se hace un borrado lógico de la carpeta
        const softDeletedCarpeta = await prisma.carpeta.update({
            where: {
                Id: Number(params.id)
            },
            data: {
                Estado: 0,
                FechaActualizacion: new Date()
            }
        })

        const response = {
            message: 'Carpeta eliminada',
            status: 200,
            data: softDeletedCarpeta
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error deleting document:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ error: 'Carpeta o documento no encontrada' }, { status: 404 });
            }
        }
        return NextResponse.json({ error: 'Error deleting document' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Params) {
    try {

        const session = await getServerSession(auth);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.Nombre) {
            return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
        }

        if (typeof body.Nombre !== 'string') {
            return NextResponse.json({ error: 'El nombre debe ser texto' }, { status: 400 });
        }

        if (body.IdCarpetaPadre && typeof body.IdCarpetaPadre !== 'number') {
            return NextResponse.json({ error: 'El id de la carpeta padre debe ser un número' }, { status: 400 });
        }

        let ruta = "";

        if (body.IdCarpetaPadre) {
            const parentFoldersList = await searchParentFolders(body.IdCarpetaPadre);

            for (const parentFolder of parentFoldersList.sort((a, b) => a.Id - b.Id)) {
                ruta += `/${parentFolder?.Nombre}`;
            }
        }

        ruta += `/${body.Nombre}`;

        //Guardo el nombre antiguo de la carpeta primero
        const carpeta = await prisma.carpeta.findFirst({
            where: {
                Id: Number(params.id),
                Estado: 1
            }
        });

        if (!carpeta) {
            return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
        }

        let oldNombreCarpetaPadre = carpeta?.Nombre;

        const updatedCarpeta = await prisma.carpeta.update({
            where: {
                Id: Number(params.id)
            },
            data: {
                Nombre: body.Nombre,
                FechaActualizacion: new Date(),
                Ruta: ruta,
            }
        });

        //Buscar por carpetas hijas para actualizarlas
        const childrenFolders = await prisma.carpeta.findMany({
            where: {
                IdCarpetaPadre: Number(params.id),
                Estado: 1
            }
        })

        if (!childrenFolders) {
            return NextResponse.json({ error: 'Error al buscar carpetas hijas' }, { status: 500 });
        }

        //Actualizar ruta de carpetas hijas
        if (childrenFolders.length > 0) {
            for (const childFolder of childrenFolders) {
                if (childFolder.Ruta) {
                    let childRuta = childFolder.Ruta;

                    if (oldNombreCarpetaPadre) {
                        childRuta = childRuta.replace(oldNombreCarpetaPadre, body.Nombre);
                    }

                    await prisma.carpeta.update({
                        where: {
                            Id: childFolder.Id
                        },
                        data: {
                            Ruta: childRuta,
                            FechaActualizacion: new Date()
                        }
                    });
                }
            }
        }

        await redis.del(`${params.id}`);

        const response = {
            message: 'Carpeta actualizada',
            status: 200,
            data: updatedCarpeta
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating document:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ error: 'Carpeta o documento no encontrado' }, { status: 404 });
            }
        }
        return NextResponse.json({ error: 'Error updating document' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: Params) {
    try {

        const session = await getServerSession(auth);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();

        if (body.IdCarpetaPadre && typeof body.IdCarpetaPadre !== 'number') {
            return NextResponse.json({ error: 'El id de la carpeta destino debe ser un número' }, { status: 400 });
        }

        if (!body.IdCarpetaPadre) {
            await prisma.carpeta.update({
                where: {
                    Id: Number(params.id)
                },
                data: {
                    IdCarpetaPadre: null,
                    FechaActualizacion: new Date()
                }
            });
            return NextResponse.json({ message: 'Carpeta movida', status: 200 });
        }

        const carpeta = await prisma.carpeta.findFirst({
            where: {
                Id: body.IdCarpetaPadre,
                Estado: 1
            }
        });

        if (!carpeta) {
            return NextResponse.json({ error: 'Carpeta destino no encontrada' }, { status: 404 });
        }

        const updatedCarpeta = await prisma.carpeta.update({
            where: {
                Id: Number(params.id)
            },
            data: {
                IdCarpetaPadre: body.IdCarpetaPadre,
                FechaActualizacion: new Date()
            }
        });

        const response = {
            message: 'Carpeta movida',
            status: 200,
            data: updatedCarpeta,
            targetFolder: body.IdCarpetaPadre
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error actualizando la carpeta:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ error: 'Carpeta o documento no encontrado' }, { status: 404 });
            }
        }
        return NextResponse.json({ error: 'Error actualizando la carpeta:' }, { status: 500 });
    }
}

