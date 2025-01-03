import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { prisma } from '@/lib/prisma';
import { Documento } from '@/types/file';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { ExtractedData } from '@/types/extractedData';
import { loadToPinecone } from '@/lib/pinecone';
import { checkCarrera } from '@/utils/checkCarrera';
import { Materia } from '@/types/materia';

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
        const blobName = await uploadToBlobStorage(pdfData);

        // Extraigo los datos del documento (usar modelo modelo_computacion_v1)
        const extractedData = await extractData(pdfData, 'prueba_modelo_civil_v2') as unknown as ExtractedData;

        if (!extractedData) {
            throw new Error('Error extracting data');
        }

        const { fields } = extractedData;

        //Extraigo datos del documento (producto de Azure AI Intelligence)
        const datosExtraidos = {
            alumno: fields.Alumno.value.replace('\n', '') ?? '',
            noIdentificacion: fields.NoIdentificacion.value.replace('-', '') ?? '',
            carrera: fields.Carrera.value.replace('\n', '') ?? '',
            materiasAprobadas: [] as Materia[]
        }

        // Extraigo las materias aprobadas y las guardo en un array
        await populateDetalleMaterias(datosExtraidos, fields);

        // Busco el ID de la carrera
        const carreraId = await checkCarrera(datosExtraidos.carrera);

        //Busco la carpeta root
        const carpetaRoot = await prisma.carpeta.findFirst({
            where: {
                IdCarpetaPadre: null,
                Estado: 1
            }
        });

        // Busco el Id de la carpeta de la carrera correspondiente
        const carpetaObjetivo = await prisma.carpeta.findFirst({
            where: {
                IdCarrera: {
                    in: carreraId
                },
                Estado: 1,
                IdCarpetaPadre: carpetaRoot?.Id
            }
        });

        if (!carpetaObjetivo) {
            await prisma.carpeta.create({
                data: {
                    IdCarrera: carreraId[0],
                    IdCarpetaPadre: carpetaRoot?.Id,
                    Nombre: datosExtraidos.carrera,
                    Estado: 1
                }
            });
        }

        const ruta = `/${carpetaRoot?.Nombre}/${carpetaObjetivo?.Nombre}/`
        const idCarpeta = carpetaObjetivo?.Id;
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
                    Calificacion: Number(materia.calificacion),
                    NoMatricula: Number(materia.noMatricula),
                    Estado: 1,
                    IdDocumentoKardex: tipoDocKardex.Id
                }
            })
        }

        // Subo a la base de conocimientos
        await loadToPinecone(file.name, newDocumento as Documento, datosExtraidos);

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
        return NextResponse.json(errResponse, { status: 500 });
    }
}

const populateDetalleMaterias = async (datosExtraidos: any, fields: any) => {
    // Verifica que "detalle-materias" y sus valores existan antes de iterar
    if (fields["detalle-materias"]?.values) {
        for (const materia of fields["detalle-materias"].values) {
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
}

const extractData = async (file: ArrayBuffer, model: string) => {
    try {
        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        const modelId = model;

        const poller = await client.beginAnalyzeDocument(modelId, file);

        const { documents } = await poller.pollUntilDone();

        if (!documents) {
            return NextResponse.json({ error: 'Error extracting data' }, { status: 500 });
        }

        return {
            fields: documents[0].fields,
        };

    } catch (err) {
        console.error('Error extracting data:', err);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }

}

const uploadToBlobStorage = async (pdfData: ArrayBuffer): Promise<string> => {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `${uuidv4()}.pdf`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
        const blobResponse = await blockBlobClient.uploadData(pdfData, {
            blobHTTPHeaders: { blobContentType: 'application/pdf' }
        });
    
        if (!blobResponse) {
            throw new Error('Error uploading blob');
        }
    
        console.log('Blob subido con éxito');
    
        return blobName as string;
    } catch (err) {
        console.error('Error uploading blob:', err);
        throw new Error('Error uploading blob');
    }
    
}