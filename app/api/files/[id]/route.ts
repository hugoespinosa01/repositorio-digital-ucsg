import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
    params: { id: string };
}

export async function DELETE(request: Request, { params }: Params) {
    try {

        //Corregir esto
        const documentId = params.id;

        const tipoDocKardex = await prisma.tipoDocumentoKardex.findFirst({
            where: {
                IdDocumento: Number(documentId),
                Estado: 1
            }
        });

        if (!tipoDocKardex) {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }

        const deletedFileDetails = await prisma.documentoDetalleKardex.updateMany({
            where: {
                IdDocumentoKardex: tipoDocKardex.Id,
            },
            data: {
                Estado: 0,
            },
        });

        if (!deletedFileDetails) {
            return NextResponse.json({ error: 'Error eliminando detalles de documento' }, { status: 500 });
        }

        const deletedTipoDocKardex = await prisma.tipoDocumentoKardex.update({
            where: {
                Id: tipoDocKardex.Id,
            },
            data: {
                Estado: 0,
            },
        });

        if (!deletedTipoDocKardex) {
            return NextResponse.json({ error: 'Error eliminando tipo de documento' }, { status: 500 });
        }

        const deletedFile = await prisma.documento.update({
            where: {
                Id: Number(documentId),
            },
            data: {
                Estado: 0,
            },
        });
        const result = {
            message: 'Documento eliminado con éxito',
            status: 200,
            data: deletedFile,
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
                NotaGraduacionSeminario: kardex?.NotaGraduacionSeminario
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

        if (!body) {
            return NextResponse.json({ error: 'Error actualizando documento' }, { status: 500 });
        }

        const tipoDocumentoKardex = await prisma.tipoDocumentoKardex.findFirst({
            where: {
                IdDocumento: Number(documentId),
                Estado: 1
            }
        });

        if (!tipoDocumentoKardex) {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }

        if (body.Alumno || body.Carrera || body.NoIdentificacion || body.NotaGraduacionSeminario) {
            const updatingTipoKardex = await prisma.tipoDocumentoKardex.updateMany({
                where: {
                    IdDocumento: Number(documentId),
                    Estado: 1
                },
                data: body
            });

            if (!updatingTipoKardex) {
                return NextResponse.json({ error: 'Error actualizando tipo de documento' }, { status: 500 });
            }

        }

        if (body.DetalleMaterias) {
            const updatingDetalleKardex = await prisma.documentoDetalleKardex.updateMany({
                where: {
                    IdDocumentoKardex: Number(tipoDocumentoKardex.Id),
                },
                data: body
            });

            if (!updatingDetalleKardex) {
                return NextResponse.json({ error: 'Error actualizando detalles de documento' }, { status: 500 });
            }
        }

        
        const result = {
            message: 'Documento actualizado con éxito',
            status: 200,
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('Error actualizando documento:', error);
        return NextResponse.json({ error: 'Error actualizando documento' }, { status: 500 });
    }
}