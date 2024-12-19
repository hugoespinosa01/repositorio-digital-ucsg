import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { prisma } from '@/lib/prisma';
import { Documento } from '@/types/file';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { ExtractedData } from '@/types/extractedData';
import { initiateBootrstrapping } from '@/lib/pinecone';
import { writeFileSync } from 'fs';
import path from 'path';
import fs from 'fs/promises';

dotenv.config();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

interface Materia {
    ciclo: string;
    materia: string;
    periodo: string;
    calificacion: string
    noMatricula: string;
}



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
        
        // Guardo en una carpeta temporal
        await handleFiles(pdfData, '/tmp', file.name);

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

        const extractedData = await extractData(pdfData) as unknown as ExtractedData;

        if (!extractedData) {
            throw new Error('Error extracting data');
        }

        // Subo a la base de conocimeintos (usar modelo prebuilt-layout)
        await initiateBootrstrapping(process.env.PINECONE_INDEX as string);

        //Extraigo datos del documento (producto de Azure AI Intelligence)
        const datosExtraidos = {
            alumno: extractedData.Alumno.value ?? '',
            noIdentificacion: extractedData.NoIdentificacion.value ?? '',
            carrera: extractedData.Carrera.value ?? '',
            materiasAprobadas: [] as Materia[]
        }
        // Verifica que "detalle-materias" y sus valores existan antes de iterar
        if (extractedData["detalle-materias"]?.values) {
            for (const materia of extractedData["detalle-materias"].values) {
                // Validación y mapeo seguro
                datosExtraidos.materiasAprobadas.push({
                    ciclo: materia.properties?.Nivel?.value ?? "", // Asegúrate de que "Nivel" exista
                    materia: materia.properties?.Materia?.value ?? "",
                    periodo: materia.properties?.periodo?.value ?? "",
                    calificacion: materia.properties?.Calificacion?.value ?? "",
                    noMatricula: materia.properties?.noMatricula?.value ?? ""
                });
            }
        }

        const carrera = checkCarrera(datosExtraidos.carrera);

        const ruta = `/ucsg/${carrera}/`
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

        if (!newDocumento) {
            return NextResponse.json({ error: 'Error creando documento' }, { status: 500 });
        }

        // Creo el tipo de documento kardex
        const tipoDocKardex = await prisma.tipoDocumentoKardex.create({
            data: {
                IdDocumento: newDocumento.Id,
                Alumno: datosExtraidos.alumno,
                NoIdentificacion: datosExtraidos.noIdentificacion,
                Estado: 1,
                Carrera: datosExtraidos.carrera
            }
        });

        if (!tipoDocKardex) {
            return NextResponse.json({ error: 'Error creando tipo de documento kardex' }, { status: 500 });
        }

        // Creo los detalles del kardex
        for (let materia of datosExtraidos.materiasAprobadas) {
            await prisma.documentoDetalleKardex.create({
                data: {
                    Ciclo: materia.ciclo,
                    Materia: materia.materia,
                    Periodo: materia.periodo,
                    Calificacion: materia.calificacion,
                    NoMatricula: Number(materia.noMatricula),
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

const handleFiles = async (file: ArrayBuffer, relativePath: string, filename: string) => {
    if (!relativePath) {
        return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }
    
    const absolutePath = path.join(process.cwd(), relativePath);
    const pathExists = await validatePathExists(absolutePath);

    if (!pathExists) {
        console.log('El directorio no existía, pero ha sido creado.');
    }

    try {
        const filePath = path.join(absolutePath, filename);
        await fs.writeFile(filePath, new Uint8Array(file));
        console.log('File written successfully');
    } catch (err) {
        console.error('Error handling files:', err);
        return NextResponse.json({ error: 'Error handling files', status: 500 });
    }

}

const validatePathExists = async (absolutePath: string): Promise<boolean> => {
    try {
        await fs.access(absolutePath);
        return true;
    } catch (error) {
        await fs.mkdir(path.join(process.cwd(), "/tmp"), { recursive: true });
        return false;
    }
};

const extractData = async (file: ArrayBuffer) => {
    try {
        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        const modelId = process.env.FORM_RECOGNIZER_CUSTOM_MODEL_ID || "<custom model ID>";

        const poller = await client.beginAnalyzeDocument(
            modelId,
            file
        );

        const { documents } = await poller.pollUntilDone();

        console.log("Extracted data:", documents);


        if (!documents) {
            return NextResponse.json({ error: 'Error extracting data' }, { status: 500 });
        }

        return documents[0].fields;

    } catch (err) {
        console.error('Error extracting data:', err);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
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

const checkCarrera = (carrera: string) => {
    if (carrera.toLowerCase().includes('sistemas')) {
        return 'Ingeniería en Computación';
    } else if (carrera.toLowerCase().includes('civil')) {
        return 'Ingeniería Civil';
    }
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