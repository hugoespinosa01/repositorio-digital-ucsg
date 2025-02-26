import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { Pinecone } from "@pinecone-database/pinecone";

// Crea un cliente de Pinecone
const getPineconeClient = () => {
    return new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
    });
};


interface Params {
    params: { id: string };
}

export async function DELETE(request: Request, { params }: Params) {
    try {

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

        // 3. Inserción a Pinecone
        const client = await getPineconeClient();
        const pineconeIndex = await client.index(process.env.PINECONE_INDEX || "documentos-ucsg");

        // Establezco un namespace para el índice (este va a aglomerar a todos los documentos)
        const namespace = pineconeIndex.namespace(process.env.PINECONE_NAMESPACE || "documentos-ucsg");

        if (deletedFile.RefArchivo) {
            await namespace.deleteOne(deletedFile.RefArchivo);
        }

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
                IdDocumentoKardex: kardex.Id,
                Estado: 1
            },
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
                NotaGraduacionSeminario: kardex?.NotaGraduacionSeminario,
                PromMateriasAprobadas: kardex?.PromMateriasAprobadas,
                PromGraduacion: kardex?.PromGraduacion,
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

export async function PATCH(request: Request, { params }: Params) {
    try {

        const session = await getServerSession(auth);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.IdCarpetaPadre) {
            return NextResponse.json({ error: 'Carpeta destino requerida' }, { status: 400 });
        }

        if (typeof body.IdCarpetaPadre !== 'number') {
            return NextResponse.json({ error: 'El id de la carpeta destino debe ser un número' }, { status: 400 });
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

        const updatedDocumento = await prisma.documento.update({
            where: {
                Id: Number(params.id)
            },
            data: {
                IdCarpeta: body.IdCarpetaPadre,
            }
        });

        const response = {
            message: 'Carpeta movida',
            status: 200,
            data: updatedDocumento,
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
