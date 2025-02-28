import { NextRequest, NextResponse } from 'next/server';
import { BlobDeleteOptions, BlobDeleteResponse, BlobServiceClient, BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { prisma } from '@/lib/prisma';
import { Documento } from '@/types/file';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
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

// Definición completa de la interfaz ColumnMapping
interface ColumnMapping {
    materiaIndex?: number[];
    matriculas?: {
        tipo: 'simple' | 'agrupada';
        indices: number[];
        headerIndex?: number;
    }[];
    calificacionIndexes?: number[];
    supletorioColumnIndex?: number;
    periodoColumnIndex?: number; // Agregamos esta propiedad que faltaba
    cicloRow?: number;
    periodoRow?: number;
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
            await deleteBlob(blobName);
            console.error('Error during document classification:', error);
            throw new Error('Unable to classify document');
        }

        // Validar clasificación    
        if (typeof classifiedDoc !== 'string' || !['kardex-computacion', 'kardex-civil'].includes(classifiedDoc)) {
            await deleteBlob(blobName);
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
                await deleteBlob(blobName);
                console.error('Error extracting computacion data:', error);
                throw new Error('Error extracting data for extractedData');
            }
        } else if (classifiedDoc == 'kardex-civil') {
            try {
                extractedData = await extractData(pdfData, 'modelo_civil_v11');
                console.log('Extracted data for civil:', extractedData);
            } catch (error) {
                await deleteBlob(blobName);
                console.error('Error extracting civil data:', error);
                throw new Error('Error extracting data for extractedData');
            }
        } else {
            await deleteBlob(blobName);
            throw new Error('Invalid document classification');
        }

        if (!extractedData) {
            await deleteBlob(blobName);
            throw new Error('Invalid extracted data structure');
        }


        const { fields } = extractedData as ExtractedDataFields;

        // Validar campos específicos necesarios
        const requiredFields = ['Alumno', 'NoIdentificacion', 'Carrera'];
        for (const field of requiredFields) {
            if (!fields[field] || !fields[field].value) {
                await deleteBlob(blobName);
                throw new Error(`Missing required field: ${field}`);
            }
        }

        let cedula = fields.NoIdentificacion.value.replace(/[^0-9]/g, '') ?? ''

        const documentoYaSubido = await prisma.tipoDocumentoKardex.findFirst({
            where: {
                NoIdentificacion: cedula,
                Estado: 1
            }
        });

        if (documentoYaSubido) {
            await deleteBlob(blobName);
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
            noIdentificacion: cedula,
            carrera: carreraArray[0].nombre ?? '',
            materiasAprobadas: [] as Materia[]
        }

        // Extraigo las materias aprobadas y las guardo en un array

        //await populateDetalleMaterias(datosExtraidos, fields);

        //Busco la carpeta root
        let carpetaRoot = await prisma.carpeta.findFirst({
            where: {
                IdCarpetaPadre: null,
                Estado: 1
            }
        });

        if (!carpetaRoot) {
            carpetaRoot = await prisma.carpeta.create({
                data: {
                    FechaCreacion: new Date,
                    IdCarpetaPadre: null,
                    Nombre: 'ucsg',
                    Tipo: 'Carpeta',
                    Ruta: '/',
                    Estado: 1
                }
            });
        }

        // Busco el Id de la carpeta de la carrera correspondiente
        let carpetaObjetivo = await prisma.carpeta.findFirst({
            where: {
                IdCarrera: {
                    in: carreraArray.map(item => item.id)
                },
                Estado: 1,
                IdCarpetaPadre: carpetaRoot?.Id
            }
        });

        if (!carpetaObjetivo) {
            carpetaObjetivo = await prisma.carpeta.create({
                data: {
                    FechaCreacion: new Date,
                    IdCarrera: carreraArray[0].id,
                    IdCarpetaPadre: carpetaRoot?.Id,
                    Nombre: datosExtraidos.carrera,
                    Estado: 1,
                    Tipo: 'Carpeta',
                    Ruta: `/${carpetaRoot.Nombre}/${datosExtraidos.carrera}`
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


const parseData = (tables: any): KardexDetalle[] => {
    if (!Array.isArray(tables)) {
      console.error("No se encontraron tablas", tables);
      return [];
    }
  
    const rows: KardexDetalle[] = [];
    let cicloGlobal = ""; // Variable para propagar el ciclo entre tablas
    
    // Iterar en cada tabla extraída del OCR
    tables.forEach((table: any) => {
      if (!table.cells || !Array.isArray(table.cells)) {
        console.error("No hay celdas en la tabla", table);
        return;
      }
      
      const mapping = findTableStructure(table.cells);
      if (!mapping) {
        console.log("No se encontró estructura en la tabla");
        return;
      }
      
      // Construir rowMap: estructura que organiza las celdas por fila y columna
      const rowMap: { [key: number]: { [key: number]: string } } = {};
      
      table.cells.forEach((cell: any) => {
        const { rowIndex, columnIndex, content } = cell;
        
        if (!rowMap[rowIndex]) {
          rowMap[rowIndex] = {};
        }
        
        rowMap[rowIndex][columnIndex] = content;
      });
      
      // Encontrar índices de filas que corresponden a encabezados
      const headerRows = new Set<number>();
      
      table.cells.forEach((cell: any) => {
        const content = cell.content?.toString().trim().toUpperCase() || "";
        if (content.includes("ASIGNATURA") || 
            content.includes("MATERIAS") ||
            content.includes("MATRICULA")) {
          headerRows.add(cell.rowIndex);
        }
        
        // Agregar también filas con subencabezados (1,2,3)
        if (/^[123]$/.test(content)) {
          headerRows.add(cell.rowIndex);
        }
      });
      
      let cicloPropagado = cicloGlobal;
      
      // Procesar cada fila que no sea encabezado
      Object.keys(rowMap)
        .map(key => parseInt(key, 10))
        .filter(rowIndex => !headerRows.has(rowIndex)) // Filtrar filas de encabezado
        .forEach(rowIndex => {
          const row = rowMap[rowIndex];
          
          // Detectar si la fila tiene un ciclo/nivel
          const newNivel = extractNivelOCicloFromRow(row);
          if (newNivel) {
            cicloPropagado = newNivel;
          }
          
          // Procesar cada índice de materia encontrado
          mapping.materiaIndex?.forEach(materiaIdx => {
            const materia = row[materiaIdx]?.trim() || "";
            
            // Omitir filas sin contenido en la columna de materia
            if (!materia) return;
            
            // Detectar el número de matrícula
            const noMatricula = determineMatricula(row, mapping.matriculas);
            
            // Extraer calificación
            const calificacion = findCalificacionFromRow(row, mapping.calificacionIndexes || []);
            
            // Extraer periodo (si está disponible)
            const periodo = mapping.periodoColumnIndex ? 
              row[mapping.periodoColumnIndex]?.trim() || "" : 
              "";
            
            // Solo agregar a los resultados si hay materia y matrícula
            if (materia.length > 0 && noMatricula) {
              const kardexDetalle: KardexDetalle = {
                Id: rows.length + 1, // ID secuencial
                Ciclo: cicloPropagado || "",
                Materia: materia,
                Periodo: periodo,
                Calificacion: Number(calificacion),
                NoMatricula: noMatricula,
                IdDocumentoKardex: 0, // Se asignará posteriormente
                Estado: 1
              };
              
              rows.push(kardexDetalle);
            }
          });
        });
      
      // Actualizar el ciclo global para la siguiente tabla
      cicloGlobal = cicloPropagado;
    });
    
    return rows;
  };



// Función para encontrar las calificaciones en una fila con base en la palabra clave "PROMED" o "FINAL"
const findCalificacionFromRow = (row: any, calificacionIndexes: number[]): number | null => {
    for (const index of calificacionIndexes) {
        const content = row[index]?.trim().toUpperCase() || "";
        return Number(content.replace(/[^\d.]/g, "")); // Limpia el texto y lo convierte a número
    }
    return null; // No se encontró calificación
};


const findTableStructure = (cells: any[]): ColumnMapping | null => {
    if (!Array.isArray(cells)) {
        console.error('Cells is not an array:', cells);
        return null;
    }

    const mapping: ColumnMapping = {
        materiaIndex: [],
        matriculas: [],
        calificacionIndexes: []
    };

    // Primero identificamos todas las filas que contienen encabezados
    const headerRows = cells
        .filter(cell => {
            const content = cell.content?.toString().trim().toUpperCase() || "";
            return content.includes("ASIGNATURA") || 
                   content.includes("MATERIAS") ||
                   content.includes("MATRICULA");
        })
        .map(cell => cell.rowIndex);

    const uniqueHeaderRows = [...new Set(headerRows)].sort((a, b) => a - b);

    // Para cada fila de encabezado, analizamos su estructura
    uniqueHeaderRows.forEach(headerRow => {
        const headerCells = cells.filter(cell => cell.rowIndex === headerRow);
        const nextRowCells = cells.filter(cell => cell.rowIndex === headerRow + 1);

        // Analizar la estructura de esta sección
        let hasSubheaders = false;
        let matriculaHeader: any = null;

        // Buscar el encabezado MATRÍCULA
        headerCells.forEach(cell => {
            const content = cell.content?.toString().trim().toUpperCase() || "";
            
            if (content.includes("ASIGNATURA") || content.includes("MATERIAS")) {
                mapping.materiaIndex?.push(cell.columnIndex);
            }
            
            if (content.includes("MATRICULA")) {
                matriculaHeader = cell;
            }

            if (content.includes("PROMED") || content.includes("FINAL")) {
                mapping.calificacionIndexes?.push(cell.columnIndex);
            }

            if (content.includes("SUPLET")) {
                mapping.supletorioColumnIndex = cell.columnIndex;
            }
        });

        // Verificar si hay subencabezados (1,2,3) en la siguiente fila
        if (matriculaHeader) {
            const subheaders = nextRowCells
                .filter(cell => /^[123]$/.test(cell.content?.toString().trim()))
                .sort((a, b) => a.columnIndex - b.columnIndex);

            if (subheaders.length === 3) {
                // Caso con subencabezados
                mapping.matriculas?.push({
                    tipo: 'agrupada',
                    indices: subheaders.map(cell => cell.columnIndex),
                    headerIndex: matriculaHeader.columnIndex
                });
            } else {
                // Caso simple
                mapping.matriculas?.push({
                    tipo: 'simple',
                    indices: [matriculaHeader.columnIndex]
                });
            }
        }
    });

    return mapping;
};


const determineMatricula = (row: any, matriculas: ColumnMapping['matriculas']): number => {
    if (!matriculas) return 0;

    for (const matricula of matriculas) {
        if (matricula.tipo === 'simple') {
            // Para el caso simple, buscamos "+" o "A" en la columna de matrícula
            const content = row[matricula.indices[0]]?.toString().trim().toUpperCase() || "";
            if (content === "+" || content === "A") return 1;
        } else {
            // Para el caso agrupado, buscamos en las columnas 1,2,3
            for (let i = 0; i < matricula.indices.length; i++) {
                const content = row[matricula.indices[i]]?.toString().trim().toUpperCase() || "";
                if (content === "+" || content === "A") return i + 1;
            }
        }
    }
    return 0;
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

        // Cargar el PDF
        const pdfDoc = await PDFDocument.load(file);
        const pageCount = pdfDoc.getPageCount();

        // Clasificar si es malla curricular
        console.log('Clasificando documento...');
        const resultClassification = await classifyMallaCurricular(file);

        if (!resultClassification) {
            throw new Error('Error classifying malla curricular');
        }

        let pdfToAnalyze;

        // Validar clasificación
        if (resultClassification == 'malla-curricular') {
            console.log('Documento clasificado como malla curricular, excluyendo primera página...');

            // Crear nuevo PDF sin la primera página
            const newPdfDoc = await PDFDocument.create();
            const pagesToCopy = Array.from({ length: pageCount - 1 }, (_, i) => i + 1);
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy);
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            const newPdfBytes = await newPdfDoc.save();
            pdfToAnalyze = new Uint8Array(newPdfBytes).buffer;
        } else {
            console.log('Documento no es malla curricular, procesando todas las páginas...');
            // Usar el documento original completo
            pdfToAnalyze = file;
        }

        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        if (!endpoint || !credential) {
            throw new Error('Form Recognizer credentials not configured');
        }

        const modelId = model;

        console.log('Starting document analysis...');
        const poller = await client.beginAnalyzeDocument(modelId, pdfToAnalyze);
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

// Clasificar malla curricular
// Esto porque en el modelo pre entrenado, coge la primera hoja (malla curricular) como una tabla
// Y eso afecta al pre procesamiento de los datos
const classifyMallaCurricular = async (file: ArrayBuffer): Promise<string | null> => {
    try {
        console.log('Classifying malla...');
        const endpoint = process.env.FORM_CUSTOM_CLASSIFICATION_ENDPOINT;
        const apiKey = process.env.FORM_CUSTOM_CLASSIFICATION_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Form Recognizer credentials not configured');
        }

        const credential = new AzureKeyCredential(apiKey);
        const client = new DocumentAnalysisClient(endpoint, credential);

        console.log('Beginning document classification...');

        const poller = await client.beginClassifyDocument('malla-curricular-classifier', file);

        console.log('Waiting for classification to complete...');
        const result = await poller.pollUntilDone();

        if (!result.documents || result.documents.length === 0) {
            return null;
        }

        console.log('Classification completed successfully', result.documents[0].docType);

        const docType = result.documents[0].docType;

        // Validar explícitamente el tipo de documento
        const validTypes = ['malla-curricular', 'no-malla'];

        if (!validTypes.includes(docType)) {
            return null;
        }

        return docType;
    } catch (err) {
        console.error('Error clasificando los documentos dentro de la funcion classifyMallaCurricular:', err);
        throw err;
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

const deleteBlob = async (ref: string): Promise<void> => {
    try {

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Create blob client from container client
        const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(ref);

        // include: Delete the base blob and all of its snapshots
        // only: Delete only the blob's snapshots and not the blob itself
        const options: BlobDeleteOptions = {
            deleteSnapshots: 'include'
        };

        const blobDeleteResponse: BlobDeleteResponse = await blockBlobClient.delete(options);

        if (!blobDeleteResponse) {
            throw new Error('Error deleting blob');
        }

        console.log('Blob eliminado con éxito', ref);
    } catch (err) {
        console.error('Error deleting blob:', err);
        throw new Error('Error deleting blob');
    }
}