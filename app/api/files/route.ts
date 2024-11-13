import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { prisma } from '@/lib/prisma';
import { Documento } from '@/types/file';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

export async function GET(request: Request) {
    try {
        const files = await prisma.documento.findMany({
            where: {
                Estado: 1
            }
        });
        if (!files) {
            return NextResponse.json({ error: 'Error fetching files' }, { status: 500 });
        }

        const result = {
            message: 'Documentos encontrados con éxito',
            status: 200,
            data: files,
        }

        return NextResponse.json(result);

    } catch (err) {
        console.error('Error fetching files:', err);
        const errResponse = {
            error: 'Error fetching files',
            status: 500,
            message: err,
        }
        return NextResponse.json(errResponse);
    }

}

export async function POST(request: NextRequest) {
    try {

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Procesar el PDF
        const pdfData = await file.arrayBuffer();

        //Subo al blob storage
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `${uuidv4()}.pdf`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
        const blobResponse = await blockBlobClient.uploadData(pdfData, {
          blobHTTPHeaders: { blobContentType: 'application/pdf' }
        });
        
        if (!blobResponse) {
            return NextResponse.json({ error: 'Error uploading to blob storage' }, { status: 500 });
        }

        //Extraigo datos del documento (producto de Azure AI Intelligence)
        const datosExtraidos = {
            alumno: "Alejandro Martínez",
            noIdentificacion: "0926661265",
            materiasAprobadas: [
                {
                    ciclo: "2021-1",
                    materia: "Matemáticas",
                    periodo: "Ordinario",
                    calificacion: 10,
                    noMatricula: 1,
                },
                {
                    ciclo: "2021-1",
                    materia: "Física",
                    periodo: "Ordinario",
                    calificacion: 9,
                    noMatricula: 2,
                },
                {
                    ciclo: "2021-1",
                    materia: "Química",
                    periodo: "Ordinario",
                    calificacion: 8,
                    noMatricula: 3,
                }
            ]
        }

        const ruta = '/ucsg/Computación/'
        const idCarpeta = 26;
        const extension = file.name.substring(file.name.lastIndexOf('.') + 1);

        // Creo el documento (archivo)
        const newDocumento = await prisma.documento.create({
            data: {
                IdCarpeta: idCarpeta,
                NombreArchivo: datosExtraidos.alumno + ' - ' + datosExtraidos.noIdentificacion,
                Ruta: ruta,
                FechaCarga: new Date(),
                Estado: 1,
                Tamano: file.size,
                Extension: extension,
                Tipo: "Archivo",
                RefArchivo: blobName
            }
        });

        // Creo el tipo de documento kardex
        const tipoDocKardex = await prisma.tipoDocumentoKardex.create({
            data: {
                IdDocumento: newDocumento.Id,
                Alumno: datosExtraidos.alumno,
                NoIdentificacion: datosExtraidos.noIdentificacion,
                Estado: 1
            }
        });

        // Creo los detalles del kardex
        for (let materia of datosExtraidos.materiasAprobadas) {
            await prisma.documentoDetalleKardex.create({
                data: {
                    Ciclo: materia.ciclo,
                    Materia: materia.materia,
                    Periodo: materia.periodo,
                    Calificacion: materia.calificacion,
                    NoMatricula: materia.noMatricula,
                    Estado: 1,
                    IdDocumentoKardex: tipoDocKardex.Id
                }
            })
        }

        const result = {
            message: 'Documento creado',
            status: 200,
            data: newDocumento,
        }
        return NextResponse.json(result);

    } catch (err) {
        console.error('Error creating document:', err);
        const errResponse = {
            error: 'Error creating document',
            status: 500,
            message: err,
        }
        return NextResponse.json(errResponse);
    }
}

const uploadToBlobStorage = async (file: Documento) => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Check if the container exists
    const containerExists = await containerClient.exists();
    
    if (!containerExists) {
      console.error(`Container '${containerName}' does not exist`);
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    const documents = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();
      
      documents.push({
        id: blob.name,
        title: properties.metadata?.title || 'Sin título',
        description: properties.metadata?.description || 'Sin descripción',
        uploadDate: properties.createdOn,
      });
    }

    return documents;
}

const validateDocument = async (documento: Documento) => {

    if (!documento.NombreArchivo || documento.NombreArchivo === '') {
        return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    if (typeof documento.NombreArchivo !== 'string') {
        return NextResponse.json({ error: 'El nombre debe ser texto' }, { status: 400 });
    }

    if (!documento.IdCarpeta) {
        return NextResponse.json({ error: 'IdCarpeta requerido' }, { status: 400 });
    }

    if (typeof documento.IdCarpeta !== 'number') {
        return NextResponse.json({ error: 'IdCarpeta debe ser un número' }, { status: 400 });
    }

    if (!documento.Ruta) {
        return NextResponse.json({ error: 'Ruta requerida' }, { status: 400 });
    }

    if (typeof documento.Ruta !== 'string') {
        return NextResponse.json({ error: 'Ruta debe ser texto' }, { status: 400 });
    }

    if (!documento.RefArchivo) {
        return NextResponse.json({ error: 'RefArchivo requerido' }, { status: 400 });
    }

    if (typeof documento.RefArchivo !== 'string') {
        return NextResponse.json({ error: 'RefArchivo debe ser texto' }, { status: 400 });
    }

    if (!documento.Tamano) {
        return NextResponse.json({ error: 'Tamano requerido' }, { status: 400 });
    }

    if (typeof documento.Tamano !== 'number') {
        return NextResponse.json({ error: 'Tamano debe ser un número' }, { status: 400 });
    }

    if (!documento.Extension) {
        return NextResponse.json({ error: 'Extension requerida' }, { status: 400 });
    }

    if (typeof documento.Extension !== 'string') {
        return NextResponse.json({ error: 'Extension debe ser texto' }, { status: 400 });
    }

    return true;
}