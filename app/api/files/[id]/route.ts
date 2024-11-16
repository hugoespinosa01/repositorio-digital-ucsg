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

        const response = {
            message: 'Documento encontrado',
            status: 200,
            data: file
        }

        if (!file) {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error buscando documentos:', error);
        return NextResponse.json({ error: 'Error buscando documentos' }, { status: 500 });
    }

}