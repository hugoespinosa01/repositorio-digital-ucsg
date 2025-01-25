import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';
import { Prisma } from '@prisma/client';


interface Params {
    params: { id: string };
}

export async function DELETE(request: Request, { params }: Params) {
    try {

        //Corregir esto
        const materiaId = params.id;

        const deletedMateria = await prisma.documentoDetalleKardex.update({
            where: {
                Id: Number(materiaId),
            },
            data: {
                Estado: 0,
            },
        });

        if (!deletedMateria) {
            return NextResponse.json({message: "Error al eliminar materia"}, { status: 404 });
        }

        const result = {
            message: 'Materia eliminada con éxito',
            status: 200,
            data: deletedMateria,
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error eliminando documento:', error);
        const errResponse = {
            error: 'Error deleting file',
            status: 500,
            message: error,
        }
        return NextResponse.json(errResponse);
    }
}

export async function PUT(request: Request, {params}: Params) {
    try {
        const { id } = params;

        const body = await request.json();

        const data = await prisma.documentoDetalleKardex.update({
            where: {
                Id: Number(id),
            },
            data: {
                ...body,
            },
        });

        if (!data) {
            return NextResponse.json({message: "Error al actualizar materia"}, { status: 404 });
        }

        const result = {
            message: 'Materia actualizada con éxito',
            status: 200,
            data: data,
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error actualizando documento:', error);
        const errResponse = {
            error: 'Error updating file',
            status: 500,
            message: error,
        }
        return NextResponse.json(errResponse);
    }
}