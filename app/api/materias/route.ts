import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const id = await request.json()

        const data = await prisma.documentoDetalleKardex.findMany({
            where: {
                IdDocumentoKardex: Number(id),
            },
        });

        if (!data) {
            return NextResponse.json({message: "Error al obtener materias"}, { status: 404 });
        }

        const result = {
            message: 'Materias obtenidas con éxito',
            status: 200,
            data: data,
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error obteniendo materias:', error);
        const errResponse = {
            error: 'Error getting file',
            status: 500,
            message: error,
        }
        return NextResponse.json(errResponse);
    }
}