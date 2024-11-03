import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import sql from 'mssql';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try{
        const files = await prisma.documento.findMany({
            where: {
                Estado: 1
            }
        });
    }catch (err) {
        console.error('Error fetching files:', err);
        const errResponse = {
            error: 'Error fetching files',
            status: 500,
            message: err,
        }
        return NextResponse.json(errResponse);
    }

}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.Nombre) {
            return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
        }

        if (typeof body.Nombre !== 'string') {
            return NextResponse.json({ error: 'El nombre debe ser texto' }, { status: 400 });
        }

        const newDocumento = await prisma.documento.create({
            data: {
                NombreArchivo: body.Nombre,
                IdCarpeta: body.IdCarpeta,
                FechaCarga: new Date(),
                Estado: body.Estado || 1,
            }
        });
        
        const result = {
            message: 'Documento creado',
            status: 200,
            data: newDocumento,
        }
        return NextResponse.json(result);

    }catch(err){
        console.error('Error creating document:', err);
        const errResponse = {
            error: 'Error creating document',
            status: 500,
            message: err,
        }
        return NextResponse.json(errResponse);
    }
}