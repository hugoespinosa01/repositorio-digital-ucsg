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
import { KardexDetalle } from '@/types/kardexDetalle';
import { File } from 'buffer';
import { PDFDocument } from 'pdf-lib';


dotenv.config();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

interface DocumentField {
    value: any;
    confidence: number;
}

interface ExtractedDataFields {
    fields: {
        [field: string]: DocumentField;
    };
}

interface ColumnMapping {
    materiaIndex?: number;
    matriculasIndexes?: number[];
    cicloRow?: number;
    periodoRow?: number;
    calificacionIndexes?: number[];
    periodoColumnIndex?: number;
    supletorioColumnIndex?: number;
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

        if (!formData) {
            return NextResponse.json({ error: 'No form data' }, { status: 400 });
        }

        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Procesar el PDF
        const pdfData = await file.arrayBuffer();

        //Subo al blob storage
        const blobName = await uploadToBlobStorage(pdfData);

        // Clasificar el documento
        let classifiedDoc = null;
        try {
            classifiedDoc = await classifyDocument(pdfData);
            console.log('Document classification result:', classifiedDoc);
        } catch (error) {
            console.error('Error during document classification:', error);
            throw new Error('Unable to classify document');
        }

        // Validar clasificación    
        if (typeof classifiedDoc !== 'string' || !['kardex-computacion', 'kardex-civil'].includes(classifiedDoc)) {
            console.error('Invalid document classification:', classifiedDoc);
            throw new Error('Invalid document classification');
        }

        let extractedData = null;

        // Clasifica los documentos según la carrera
        if (classifiedDoc == 'kardex-computacion') {
            try {
                extractedData = await extractData(pdfData, 'computacion-1-model');
                console.log('Extracted data for computacion:', extractedData);
            } catch (error) {
                console.error('Error extracting computacion data:', error);
                throw new Error('Error extracting data for extractedData');
            }
        } else if (classifiedDoc == 'kardex-civil') {
            try {
                extractedData = await extractData(pdfData, 'modelo_civil_v11');
                console.log('Extracted data for civil:', extractedData);
            } catch (error) {
                console.error('Error extracting civil data:', error);
                throw new Error('Error extracting data for extractedData');
            }
        } else {
            throw new Error('Invalid document classification');
        }

        if (!extractedData) {
            throw new Error('Invalid extracted data structure');
        }


        const { fields } = extractedData as ExtractedDataFields;

        // Validar campos específicos necesarios
        const requiredFields = ['Alumno', 'NoIdentificacion', 'Carrera'];
        for (const field of requiredFields) {
            if (!fields[field] || !fields[field].value) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        const documentoYaSubido = await prisma.tipoDocumentoKardex.findFirst({
            where: {
                NoIdentificacion: fields.NoIdentificacion.value,
                Estado: 1
            }
        });

        if (documentoYaSubido) {
            throw new Error('El documento ya ha sido subido anteriormente');
        }

        let extractedDetails = await extractDetailData(pdfData, 'prebuilt-document');

        if (!extractedDetails || !Array.isArray(extractedDetails)) {
            console.error('Invalid extracted details:', extractedDetails);
            extractedDetails = [];
        }
        // let processedData = await processDataWithOpenAI(extractedDetails);

        const parsedDetails = parseData(extractedDetails);


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

        //await populateDetalleMaterias(datosExtraidos, fields);

        //Busco la carpeta root
        const carpetaRoot = await prisma.carpeta.findFirst({
            where: {
                IdCarpetaPadre: null,
                Estado: 1
            }
        });

        if (!carpetaRoot) {
            await prisma.carpeta.create({
                data: {
                    FechaCreacion: new Date,
                    IdCarpetaPadre: null,
                    Nombre: 'ucsg',
                    Tipo: 'Carpeta',
                    Ruta: '/ucsg',
                    Estado: 1
                }
            });
        }

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
                    FechaCreacion: new Date,
                    IdCarrera: carreraArray[0].id,
                    IdCarpetaPadre: carpetaRoot?.Id,
                    Nombre: datosExtraidos.carrera,
                    Estado: 1,
                    Tipo: 'Carpeta',
                    Ruta: `/ucsg/${datosExtraidos.carrera}`
                }
            });
        }

        const nombreArchivo = datosExtraidos.alumno + ' - ' + datosExtraidos.noIdentificacion
        const ruta = `/${carpetaRoot?.Nombre}/${carpetaObjetivo?.Nombre}/${nombreArchivo}`;
        const idCarpeta = carpetaObjetivo?.Id;
        const extension = file.name.substring(file.name.lastIndexOf('.') + 1);

        // Creo el documento (archivo)
        const newDocumento = await prisma.documento.create({
            data: {
                IdCarpeta: idCarpeta,
                NombreArchivo: nombreArchivo,
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
        for (let materia of parsedDetails) {
            await prisma.documentoDetalleKardex.create({
                data: {
                    Ciclo: materia.Ciclo,
                    Materia: materia.Materia,
                    Periodo: materia.Periodo,
                    Calificacion: Number(materia.Calificacion) || null,
                    NoMatricula: Number(materia.NoMatricula) || null,
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
            message: err instanceof Error ? err.message : 'Error desconocido, ver más logs',
        }
        return NextResponse.json(errResponse, { status: 500 });
    }
}

const parseData = (tables: any) => {

    if (!Array.isArray(tables)) {
        console.error('No se encontraron celdas en la tabla', tables);
        return [];
    }

    const rows: KardexDetalle[] = [];
    let cicloGlobal = ""; // Este valor será propagado entre tablas
    let ultimoPeriodo = ""; // Para almacenar el último periodo encontrado y propagarlo


    // Iterar a través de todas las tablas en el OCR
    tables.forEach((table: any) => {
        const mapping = findTableStructure(table.cells);
        if (!mapping) return; // Si no encontramos la estructura esperada, saltamos esta tabla

        //Tratamiento para el ciclo
        // const cicloInicial = extractNivelOCiclo(table) || cicloGlobal; // Si la tabla tiene un nivel, lo usamos; si no, mantenemos el anterior
        let cicloPropagado = cicloGlobal;

        const rowMap: { [key: number]: { [key: number]: string } } = {}; // Mapa de filas y columnas
        // Organizar las celdas por fila y columna para cada tabla
        table.cells.forEach((cell: any) => {
            const { rowIndex, columnIndex, content } = cell;
            if (!rowMap[rowIndex]) {
                rowMap[rowIndex] = {};
            }
            // Asignar el contenido de cada celda a su posición (columna)
            rowMap[rowIndex][columnIndex] = content;
        });

        // Procesar cada fila, excepto la de encabezados
        Object.keys(rowMap)
            .filter(key => parseInt(key, 10) > 0) // Excluir encabezados
            .forEach((key) => {
                const rowIndex = parseInt(key, 10);
                const row = rowMap[rowIndex];

                // Si encontramos un nuevo nivel/ciclo, lo actualizamos
                const newNivel = extractNivelOCicloFromRow(row);
                if (newNivel) {
                    cicloPropagado = newNivel;
                }

                // Extraemos datos importantes
                const materia = row[mapping.materiaIndex!]?.trim() || "";
                if (!materia || materia === "ASIGNATURAS") return; // Saltamos filas vacías o encabezados

                // Buscar el periodo
                const periodo = mapping.periodoColumnIndex !== undefined ?
                    row[mapping.periodoColumnIndex]?.trim() || "" :
                    extractPeriodoFromRow(row); // Tu lógica previa para el caso normal
                if (periodo) ultimoPeriodo = periodo; // Actualizamos el último periodo encontrado


                // Determinamos qué matrícula está marcada
                const noMatricula = determineMatricula(row, mapping.matriculasIndexes!);

                // Detectar la columna de calificación con palabras clave "PROMED" o "FINAL"
                const calificacion = findCalificacionFromRow(row, mapping.calificacionIndexes!);

                // Agregamos solo si la materia y la matrícula son válidas
                if (materia && noMatricula) {
                    const kardexDetalle: KardexDetalle = {
                        Id: rowIndex + 1,
                        Ciclo: cicloPropagado || "", // Usamos el ciclo propagado o un valor predeterminado
                        Materia: materia,
                        Periodo: periodo || "", // Si aplica, extraer período
                        Calificacion: Number(calificacion),
                        NoMatricula: noMatricula,
                        IdDocumentoKardex: 0, // Cambiar después al momento de guardar en base de datos
                        Estado: 1 //Predeterminado
                    };
                    rows.push(kardexDetalle);
                }
            });

        // Actualizar el ciclo global al final de esta tabla
        cicloGlobal = cicloPropagado;

    });

    return rows;

}

// Función para encontrar las calificaciones en una fila con base en la palabra clave "PROMED" o "FINAL"
const findCalificacionFromRow = (row: any, calificacionIndexes: number[]): number | null => {
    for (const index of calificacionIndexes) {
        const content = row[index]?.trim().toUpperCase() || "";
        return Number(content.replace(/[^\d.]/g, "")); // Limpia el texto y lo convierte a número
    }
    return null; // No se encontró calificación
};

// Función para encontrar la estructura de la tabla
const findTableStructure = (cells: any[]): ColumnMapping | null => {

    if (!Array.isArray(cells)) {
        console.error('Cells is not an array:', cells);
        return null;
    }



    const mapping: ColumnMapping = {};

    // Buscamos los índices de columnas importantes
    cells.forEach((cell) => {
        const content = cell.content?.toString().trim().toUpperCase() || "";

        // Encontrar columna de ASIGNATURAS
        if (content.includes("ASIGNATURA") || content.includes("MATERIAS")) {
            mapping.materiaIndex = cell.columnIndex;
        }

        // Encontrar columnas de MATRÍCULA
        if (content.includes("MATRICULA") || content.includes("MTR")) {
            if (!mapping.matriculasIndexes) mapping.matriculasIndexes = [];
            mapping.matriculasIndexes.push(cell.columnIndex);
        }

        // Buscar fila que contiene el ciclo (puede estar en la columna de asignaturas)
        if (content.match(/\d{4}-[III]+|NIVEL \d{3}|PRIMER CURSO|SEGUNDO CURSO|TERCER CURSO|CUARTO CURSO|QUINTO CURSO|SEXTO CURSO|SEMESTRE/i)) {
            mapping.cicloRow = cell.rowIndex;
        }

        // Buscar fila que contiene el periodo
        if (content.match(/\d{4}/) || content.includes("AÑO") || content.includes("SEMESTRE")) {
            mapping.periodoRow = cell.rowIndex;
        }

        // Encontrar la columna de AÑO (PERIODO) para la carrera de Computación
        if (content == ("AÑO")) {
            mapping.periodoColumnIndex = cell.columnIndex;
        }

        if (content.includes("SUPLET")) {
            mapping.supletorioColumnIndex = cell.columnIndex;
        }


        // Encontrar columnas de calificación ("PROMED", "FINAL", etc.)
        if (content.includes("PROMED") || content.includes("FINAL")) {
            if (!mapping.calificacionIndexes) mapping.calificacionIndexes = [];
            mapping.calificacionIndexes.push(cell.columnIndex);
        }
    });

    return Object.keys(mapping).length > 0 ? mapping : null;
};

// Función para determinar cuál de las tres matrículas está marcada
const determineMatricula = (row: any, matriculasIndexes: number[]): number => {
    for (let i = 0; i < matriculasIndexes?.length; i++) {
        const content = row[matriculasIndexes[i]]?.toString().trim().toUpperCase() || "";
        if (content === "+" || content === "A") {
            return i + 1; // Retorna 1, 2 o 3 según la matrícula marcada
        }
    }
    return 0; // Si no encuentra ninguna marca
};

// Función para extraer el nivel o ciclo desde una fila específica
const extractNivelOCicloFromRow = (row: any): string | null => {
    const contenidoFila = Object.values(row)
        .join(" ")
        .toUpperCase();
    const match = contenidoFila.match(/NIVEL \d{3}|PRIMER CURSO|SEGUNDO CURSO|TERCER CURSO|CUARTO CURSO|QUINTO CURSO|SEXTO CURSO|TERCER CURSO/i);
    return match ? match[0].trim() : null; // Retorna el nivel encontrado o null
};

const extractPeriodoFromRow = (row: any): string | null => {
    const contenidoFila = Object.values(row).join(" ").toUpperCase();

    // Búsqueda por palabras clave específicas
    const matchAnio = contenidoFila.match(/\b19\d{2}\b/); // Buscar números que empiecen con "19"
    if (matchAnio) return matchAnio[0]; // Si encontramos un año, lo retornamos

    // Búsqueda por palabras clave "AÑO", "FINAL", o "SEMESTRE"
    const matchPalabrasClave = contenidoFila.match(/AÑO|FINAL|SEMESTRE/);
    if (matchPalabrasClave) {
        // En caso de detectar palabras clave, tratamos de encontrar un año cercano
        const anioCercano = contenidoFila.match(/\b19\d{2}\b/);
        if (anioCercano) return anioCercano[0]; // Retornar el año relacionado
        return matchPalabrasClave[0]; // Retornamos la palabra clave en caso de no haber año
    }

    return null; // Si no se encuentra nada, retornamos null
};

const formatData = (data: string) => {
    if (data.includes("\n")) {
        return data.replace("\n", " ").split('-')[0].trim();;
    }

    if (data.includes("-")) {
        return data.split('-')[0].trim();
    }

    return data;
}

const extractData = async (file: ArrayBuffer, model: string) => {
    try {

        // Validar inputs
        if (!file || !(file instanceof ArrayBuffer)) {
            throw new Error('Invalid file data provided');
        }

        if (!model) {
            throw new Error('Model ID is required');
        }

        // Validar credenciales
        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT;
        const apiKey = process.env.FORM_RECOGNIZER_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Form Recognizer credentials not configured');
        }

        console.log('Starting extraction with model:', model);

        const credential = new AzureKeyCredential(apiKey);
        const client = new DocumentAnalysisClient(endpoint, credential);

        console.log('Beginning document analysis...');
        const poller = await client.beginAnalyzeDocument(model, file);
        console.log('Waiting for analysis to complete...');
        const result = await poller.pollUntilDone();

        if (!result || !result.documents || result.documents.length === 0) {
            throw new Error('No documents found in analysis result');
        }

        console.log('Analysis completed successfully');


        // Validar campos
        const firstDocument = result.documents[0];
        if (!firstDocument.fields) {
            throw new Error('No fields found in document');
        }

        return {
            fields: firstDocument.fields,
        };


    } catch (err) {
        console.error('Error extracting data in function extractData:', err);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }
}

const extractDetailData = async (file: ArrayBuffer, model: string) => {
    try {

        // Cargar el PDF y extraer última página
        const pdfDoc = await PDFDocument.load(file);
        const pageCount = pdfDoc.getPageCount();

        // Crear nuevo PDF con solo la última página
        const newPdfDoc = await PDFDocument.create();
        const [lastPage] = await newPdfDoc.copyPages(pdfDoc, [pageCount - 1]);
        newPdfDoc.addPage(lastPage);

        // Convertir a ArrayBuffer
        const lastPagePdfBytes = await newPdfDoc.save();
        const lastPageBuffer = new Uint8Array(lastPagePdfBytes).buffer;

        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        if (!endpoint || !credential) {
            throw new Error('Form Recognizer credentials not configured');
        }


        const modelId = model;

        console.log('Starting document analysis...');
        const poller = await client.beginAnalyzeDocument(modelId, lastPageBuffer);
        console.log('Waiting for analysis to complete...');
        const result = await poller.pollUntilDone();

        // Validate tables exists and is an array
        if (!result.tables || !Array.isArray(result.tables)) {
            console.error('Invalid tables structure:', result.tables);
            return [];
        }

        return result.tables;
    } catch (err) {
        console.error('Error extracting data:', err);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }
}

const classifyDocument = async (file: ArrayBuffer): Promise<string | null> => {
    try {


        console.log('Classifying document...');
        const endpoint = process.env.FORM_CUSTOM_CLASSIFICATION_ENDPOINT;
        const apiKey = process.env.FORM_CUSTOM_CLASSIFICATION_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Form Recognizer credentials not configured');
        }

        const credential = new AzureKeyCredential(apiKey);
        const client = new DocumentAnalysisClient(endpoint, credential);

        console.log('Beginning document classification...');
        const poller = await client.beginClassifyDocument('clasificador-modelo-kardex', file);

        console.log('Waiting for classification to complete...');
        const result = await poller.pollUntilDone();

        if (!result.documents || result.documents.length === 0) {
            return null;
        }

        console.log('Classification completed successfully', result.documents[0].docType);

        const docType = result.documents[0].docType;

        // Validar explícitamente el tipo de documento
        const validTypes = ['kardex-computacion', 'kardex-civil'];
        if (!validTypes.includes(docType)) {
            return null;
        }

        return docType;

    } catch (err) {
        console.error('Error clasificando los documentos dentro de la funcion classifyDocument:', err);
        throw err;
    }
};


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


