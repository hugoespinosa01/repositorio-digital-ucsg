import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface Params {
    params: { id: string };
}

export async function DELETE(request: Request, { params }: Params) {
    try {

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

        const body = await request.json();

        if (!body.Nombre) {
            return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
        }

        if (typeof body.Nombre !== 'string') {
            return NextResponse.json({ error: 'El nombre debe ser texto' }, { status: 400 });
        }

        const updatedCarpeta = await prisma.carpeta.update({
            where: {
                Id: Number(params.id)
            },
            data: {
                Nombre: body.Nombre,
                FechaActualizacion: new Date()
            }
        });

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
        const body = await request.json();

        if (!body.IdCarpetaPadre) {
            return NextResponse.json({ error: 'Carpeta destino requerida' }, { status: 400 });
        }

        if (typeof body.IdCarpetaPadre !== 'number') {
            return NextResponse.json({ error: 'El id de la carpeta destino debe ser un número' }, { status: 400 });
        }

        const carpeta = await prisma.carpeta.findFirst({
            where: {
                IdCarpetaPadre: body.IdCarpetaPadre,
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

