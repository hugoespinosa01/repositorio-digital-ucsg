import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
    params: { id: string };
}

export async function DELETE(request: Request, { params }: Params) {
    try {

        //Corregir esto
        const documentId = params.id;

        const deletedFileDetails = await prisma.documentoDetalleKardex.updateMany({
            where: {
                IdDocumentoKardex: Number(documentId),
            },
            data: {
                Estado: 0,
            },
        });

        if (!deletedFileDetails) {
            return NextResponse.json({ error: 'Error eliminando detalles de documento' }, { status: 500 });
        }

        const deletedTypeFile = await prisma.tipoDocumentoKardex.updateMany({
            where: {
                IdDocumento: Number(documentId),
            },
            data: {
                Estado: 0,
            },
        })

        if (!deletedTypeFile) {
            return NextResponse.json({ error: 'Error eliminando tipo de documento' }, { status: 500 });
        }

        const deletedFile = await prisma.carpeta.update({
            where: {
                Id: Number(documentId),
            },
            data: {
                Estado: 0,
            },
        });
        const result = {
            message: 'Carpeta eliminada con éxito',
            status: 200,
            data: deletedFile,
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error eliminando documento:', error);
        const errResponse = {
            error: 'Error deleting folder',
            status: 500,
            message: error,
        }
        return NextResponse.json(errResponse);
    }
}

export async function GET(request: Request, { params }: Params) {
    try {

        const file = await prisma.documento.findFirst({
            where: {
                Id: Number(params.id),
                Estado: 1
            }
        });

        if (!file) {
            throw new Error('Documento no encontrado');
        }

        const kardex = await prisma.tipoDocumentoKardex.findFirst({
            where: {
                IdDocumento: file.Id,
                Estado: 1
            }
        });

        

        if (!kardex) {
            throw new Error('Documento kardex no encontrado');
        }

        const kardexDetalle = await prisma.documentoDetalleKardex.findMany({
            where: {
                IdDocumentoKardex: kardex?.Id,
                Estado: 1
            }
        });

        if (!kardexDetalle) {
            throw new Error('Detalles de documento kardex no encontrados');
        }

        const response = {
            message: 'Documento encontrado',
            status: 200,
            data: {
                NombreArchivo: file?.NombreArchivo,
                Ruta: file?.Ruta,
                FechaCarga: file?.FechaCarga,
                RefArchivo: file?.RefArchivo,
                Alumno: kardex?.Alumno,
                Carrera: kardex?.Carrera,
                NoIdentificacion: kardex?.NoIdentificacion,
                DetalleMaterias: kardexDetalle,
            }
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error buscando documentos:', error);
        return NextResponse.json({ error: 'Error buscando documentos' }, { status: 500 });
    }

}

export async function PUT(request: Request, { params }: Params) {
    try {

        const documentId = params.id;
        const body = await request.json();

        const updatedFile = await prisma.documento.update({
            where: {
                Id: Number(documentId),
            },
            data: {
                NombreArchivo: body.NombreArchivo,
                Ruta: body.Ruta,
                FechaCarga: body.FechaCarga,
                RefArchivo: body.RefArchivo,
            },
        });

        if (!updatedFile) {
            return NextResponse.json({ error: 'Error actualizando documento' }, { status: 500 });
        }

        const updatedKardex = await prisma.tipoDocumentoKardex.update({
            where: {
                Id: Number(documentId),
            },
            data: {
                Alumno: body.Alumno,
                Carrera: body.Carrera,
                NoIdentificacion: body.NoIdentificacion,
            },
        });

        if (!updatedKardex) {
            return NextResponse.json({ error: 'Error actualizando documento kardex' }, { status: 500 });
        }

        const updatedKardexDetail = await prisma.documentoDetalleKardex.updateMany({
            where: {
                IdDocumentoKardex: updatedKardex.Id,
            },
            data: {
                Estado: 1,
            },
        });

        if (!updatedKardexDetail) {
            return NextResponse.json({ error: 'Error actualizando detalles de documento kardex' }, { status: 500 });
        }

        const newKardexDetail = await prisma.documentoDetalleKardex.createMany({
            data: body.DetalleMaterias.map((detalle: any) => ({
                IdDocumentoKardex: updatedKardex.Id,
                IdMateria: detalle.IdMateria,
                Calificacion: detalle.Calificacion,
                Estado: 1,
            })),
        });

        if (!newKardexDetail) {
            return NextResponse.json({ error: 'Error creando detalles de documento kardex' }, { status: 500 });
        }

        const result = {
            message: 'Documento actualizado con éxito',
            status: 200,
            data: updatedFile,
        }
        return NextResponse.json(result);

    } catch (error) {
        console.error('Error actualizando documento:', error);
        return NextResponse.json({ error: 'Error actualizando documento' }, { status: 500 });
    }
}