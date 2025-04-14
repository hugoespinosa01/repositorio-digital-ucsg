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

interface Document {
    $schema: string;
    labels: DocumentLabel[];
    document: any[];
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
    let jsonData = await getBlobJsonData('docs-prueba', documento) as Document;

    if (!jsonData) {
        return NextResponse.json({ error: 'Error al obtener el JSON' }, { status: 500 });
    }

    //Actualizar los campos del JSON con los valores de la base de datos
    if (documento.TipoDocumentoKardex && documento.TipoDocumentoKardex.length > 0) {
        const tipoDocumento = documento.TipoDocumentoKardex[0] as Record<string, any>;
        for (const key in tipoDocumento) {
            if (key !== 'DocumentoDetalleKardex') {
                const labelItemIndex = jsonData.labels.findIndex((item: DocumentLabel) => item.label === key);
                if (labelItemIndex !== -1) {
                    const labelItem = jsonData.labels[labelItemIndex];
                    if (labelItem.value && labelItem.value.length > 0) {
                        for (const value of labelItem.value) {
                            value.text = tipoDocumento[key] as string;
                        }
                    }
                }
            }
        }
    }

    //Subir JSON actualizado a Azure Blob Storage

    //Actualizar el status del documento
    await prisma.documento.update({
        where: { Id: fileId },
        data: {
            StatusValidacion: 'validado',
        },
    });

    //Crear modelo en Azure Document Intelligence


    return NextResponse.json({ 
            message: "Documento validado con éxito",
            modelId: "modelId", // Reemplazar con el ID del modelo creado
            jsonData: jsonData, // Devolver el JSON actualizado
    }, { status: 200 });

   } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
   }

}