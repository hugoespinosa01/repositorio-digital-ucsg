import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBlobJsonData } from '@/lib/azure';

interface Params {
    params: { fileId: string };
}

interface DocumentLabel {
    label: string;
    value: [{
      page: number;
      text: string;
      boundingBoxes: number[][];
    }];
  }

export async function POST(request: NextRequest, { params }: Params) {
   try {
    
    const fileId  = Number(params.fileId);

    if (isNaN(fileId)) {
        return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
    }

    const documento = await prisma.documento.findFirst({
        where: {
            Id: fileId,
            Estado: 1,
        },
        include: {
            TipoDocumentoKardex: {
                include: {
                    DocumentoDetalleKardex: true,
                },
            }
        }
    });

    if (!documento) {
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    //Actualizar JSON con campos de bd
    let jsonData = await getBlobJsonData('docs-prueba', documento);

    if (!jsonData) {
        return NextResponse.json({ error: 'Error al obtener el JSON' }, { status: 500 });
    }

    Object.keys(documento.TipoDocumentoKardex[0]).map((key) => {
        if (key !== 'TipoDocumentoKardex') {
            jsonData.labels.map((item) => item.label == 'Alumno')
        }
    })




    //Subir JSON actualizado a Azure Blob Storage

    //Actualizar el JSON en la base de datos

    //Crear modelo en Azure Document Intelligence


    return NextResponse.json({ fileId }, { status: 200 });

   } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
   }

}