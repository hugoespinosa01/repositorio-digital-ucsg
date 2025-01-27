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

type Row = {
    Matr1: {
        value: string | undefined;
    };
    Matr2: { 
        value: string | undefined;
    };
    Matr3: {
        value: string | undefined;
    };
};


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

        const classifiedDoc = await classifyDocument(pdfData);

        if (!classifiedDoc) {
            throw new Error('Error classifying document');
        }

        let extractedData = null;

        // Clasifica los documentos según la carrera
        if (classifiedDoc == 'kardex-computacion') {
            extractedData = await extractData(pdfData, 'computacion-1-model') as unknown as ExtractedData;
        } else if (classifiedDoc == 'kardex-civil') {
            // Extraigo los datos del documento (usar modelo modelo_computacion_v1)
            extractedData = await extractData(pdfData, 'modelo_civil_v11') as unknown as ExtractedData;
        }

        if (!extractedData) {
            throw new Error('Error extracting data');
        }

        const { fields } = extractedData;

        // Busco el ID de la carrera
        const carreraArray = await checkCarrera(fields.Carrera.value);

        if (carreraArray.length === 0) {
            throw new Error('El documento no es válido o no se pudo extraer la carrera');
        }

        //Extraigo datos del documento (producto de Azure AI Intelligence)
        const datosExtraidos = {
            alumno: formatData(fields.Alumno.value),
            noIdentificacion: fields.NoIdentificacion.value.replace(/[^0-9]/g, '') ?? '',
            carrera: carreraArray[0].nombre ?? '',
            materiasAprobadas: [] as Materia[]
        }

        // Extraigo las materias aprobadas y las guardo en un array
        
        await populateDetalleMaterias(datosExtraidos, fields);

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
                    in: carreraArray.map(item => item.id)
                },
                Estado: 1,
                IdCarpetaPadre: carpetaRoot?.Id
            }
        });

        if (!carpetaObjetivo) {
            await prisma.carpeta.create({
                data: {
                    IdCarrera: carreraArray[0].id,
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

    } catch (err: any) {
        console.error('Error creating document:', err);
        const errResponse = {
            error: 'Error creating document',
            status: 500,
            message: err.message,
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
                noMatricula: transformData(materia.properties)
            });
        }
    }
}

const formatData = (data: string) => {
    if (data.includes("\n")){
        return data.replace("\n", " ");
    }
    return data;
}

function transformData(data: Row): number {
    if (data?.Matr1?.value?.includes("+") || data?.Matr1?.value?.includes("A")) return 1;
    if (data?.Matr2?.value?.includes("+") || data?.Matr1?.value?.includes("A")) return 2;
    if (data?.Matr3?.value?.includes("+") || data?.Matr1?.value?.includes("A")) return 3;
    else return 0;
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

const classifyDocument = async (file: ArrayBuffer) => {
    try {
        const endpoint = process.env.FORM_CUSTOM_CLASSIFICATION_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_CUSTOM_CLASSIFICATION_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        const poller = await client.beginClassifyDocument('clasificador-modelo-kardex', file)

        const { documents } = await poller.pollUntilDone();

        if (!documents) {
            return NextResponse.json({ error: 'Error extracting data' }, { status: 500 });
        }

        return documents[0].docType;

    } catch (err) {
        console.error('Error classifying data:', err);
        return NextResponse.json({ error: 'Error classifying data', status: 500 });
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