import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
    params: { id: string };
}

export async function DELETE(request: Request, { params }: Params) {
    try {

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

        delete body['isNewRow'];
        delete body['Id'];

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

export async function GET(request: Request, { params }: Params) {
    try {
        const { id } = params

        const data = await prisma.documentoDetalleKardex.findMany({
            where: {
                IdDocumentoKardex: Number(id),
                Estado: 1,
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

export async function POST(request: Request, { params }: Params) {
    try {
        const { id } = params;

        const body = await request.json();

        // Validaciones

        if (!body) {
            return NextResponse.json({message: "Debe enviar un cuerpo"}, { status: 400 });
        }

        if (body.Calificacion > 10 || body.Calificacion < 0) {
            return NextResponse.json({message: "La calificación debe ser mayor a 0 y menor a 10"}, { status: 400 });
        }

        if (body.NoMatricula > 3 || body.NoMatricula < 0) {
            return NextResponse.json({message: "El número de matrícula debe ser mayor a 0 y menor a 3"}, { status: 400 });
        }
        
        //Este campo lo prescindo
        delete body['isNewRow'];
        delete body['Id'];

        //Añado el campo IdDocumentoKardex
        body['IdDocumentoKardex'] = Number(id);

        const data = await prisma.documentoDetalleKardex.create({
            data: {
                ...body,
            },
        });

        if (!data) {
            return NextResponse.json({message: "Error al crear materia"}, { status: 404 });
        }

        const result = {
            message: 'Materia creada con éxito',
            status: 200,
            data: data,
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creando documento:', error);
        const errResponse = {
            error: 'Error creating file',
            status: 500,
            message: error,
        }
        return NextResponse.json(errResponse);
    }
}